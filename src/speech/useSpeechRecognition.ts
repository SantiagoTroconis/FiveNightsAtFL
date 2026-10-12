import { useCallback, useEffect, useRef, useState } from 'react';
import { isSpeaking, onSpeakingChange } from '../audio/tts';

/**
 * Hook sobre la Web Speech API (SpeechRecognition). Escucha de forma continua,
 * se reinicia solo cuando el navegador corta, y se pausa mientras habla la radio.
 * Funciona en Chrome, Edge y Safari. Firefox no lo soporta: ahí se usa el modo escritura.
 */

export type SpeechStatus = 'idle' | 'listening' | 'paused' | 'unsupported' | 'denied' | 'error';

/* Tipos mínimos: TypeScript no incluye SpeechRecognition en lib.dom. */
interface RecAlternative {
  transcript: string;
}
interface RecResult {
  readonly length: number;
  readonly isFinal: boolean;
  [i: number]: RecAlternative;
}
interface RecEvent {
  results: { readonly length: number; [i: number]: RecResult };
}
interface Recognizer {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult: ((e: RecEvent) => void) | null;
}
type RecognizerCtor = new () => Recognizer;

function getCtor(): RecognizerCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const speechSupported = !!getCtor();

interface Options {
  lang: string;
  active: boolean;
  /** Devuelve true si el resultado se usó (así se limpia el búfer del reconocedor). */
  onResult: (alternatives: string[], isFinal: boolean) => boolean;
}

export function useSpeechRecognition({ lang, active, onResult }: Options) {
  const [status, setStatus] = useState<SpeechStatus>(speechSupported ? 'idle' : 'unsupported');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognizer | null>(null);
  const runningRef = useRef(false);
  const wantRef = useRef(false);
  const ttsRef = useRef(isSpeaking());
  const deniedRef = useRef(false);
  const failRef = useRef(0);
  const restartRef = useRef<number | undefined>(undefined);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  const shouldRun = () => wantRef.current && !ttsRef.current && !deniedRef.current;

  const tryStart = useCallback(() => {
    const rec = recRef.current;
    if (!rec || runningRef.current || !shouldRun()) return;
    try {
      rec.start();
      runningRef.current = true;
    } catch {
      /* ya estaba iniciado */
    }
  }, []);

  const scheduleRestart = useCallback(
    (delay: number) => {
      window.clearTimeout(restartRef.current);
      restartRef.current = window.setTimeout(tryStart, delay);
    },
    [tryStart],
  );

  useEffect(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.onstart = () => {
      runningRef.current = true;
      failRef.current = 0;
      setStatus('listening');
      setError(null);
    };
    rec.onend = () => {
      runningRef.current = false;
      if (shouldRun()) {
        scheduleRestart(failRef.current ? Math.min(5000, 500 * failRef.current) : 120);
      } else if (deniedRef.current) setStatus('denied');
      else if (wantRef.current && ttsRef.current) setStatus('paused');
      else setStatus('idle');
    };
    rec.onerror = (e) => {
      const err = e.error;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        deniedRef.current = true;
        setStatus('denied');
        setError(err);
      } else if (err !== 'no-speech' && err !== 'aborted') {
        failRef.current++;
        setError(err);
        if (err === 'network' || err === 'audio-capture') setStatus('error');
      }
    };
    rec.onresult = (e) => {
      if (ttsRef.current) return;
      const res = e.results[e.results.length - 1];
      if (!res) return;
      const alts: string[] = [];
      for (let i = 0; i < res.length; i++) if (res[i]?.transcript) alts.push(res[i].transcript);
      if (!alts.length) return;
      const used = onResultRef.current(alts, res.isFinal);
      if (used) {
        try {
          rec.abort();
        } catch {
          /* nada */
        }
      }
    };
    recRef.current = rec;
    if (shouldRun()) tryStart();
    return () => {
      rec.onstart = null;
      rec.onend = null;
      rec.onerror = null;
      rec.onresult = null;
      try {
        rec.abort();
      } catch {
        /* nada */
      }
      runningRef.current = false;
      recRef.current = null;
      window.clearTimeout(restartRef.current);
    };
  }, [lang, scheduleRestart, tryStart]);

  useEffect(() => {
    wantRef.current = active;
    if (active) tryStart();
    else {
      window.clearTimeout(restartRef.current);
      try {
        recRef.current?.abort();
      } catch {
        /* nada */
      }
      setStatus((s) => (s === 'unsupported' || s === 'denied' ? s : 'idle'));
    }
  }, [active, tryStart]);

  useEffect(
    () =>
      onSpeakingChange((speaking) => {
        ttsRef.current = speaking;
        if (speaking) {
          window.clearTimeout(restartRef.current);
          if (runningRef.current) {
            try {
              recRef.current?.abort();
            } catch {
              /* nada */
            }
          }
          if (wantRef.current && !deniedRef.current) setStatus('paused');
        } else scheduleRestart(300);
      }),
    [scheduleRestart],
  );

  const retry = useCallback(() => {
    deniedRef.current = false;
    failRef.current = 0;
    setError(null);
    tryStart();
  }, [tryStart]);

  return { status, error, supported: speechSupported, retry };
}
