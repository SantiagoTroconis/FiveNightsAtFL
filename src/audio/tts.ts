/**
 * Voz de la radio y pronunciación modelo (speechSynthesis del navegador).
 * Mientras la voz habla, el reconocimiento de voz se pausa para que el juego
 * no se "escuche a sí mismo" por los parlantes.
 */

type Listener = (speaking: boolean) => void;

export const ttsSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

const listeners = new Set<Listener>();
let pending = 0;
let generation = 0;
let voices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  voices = window.speechSynthesis.getVoices();
}

if (ttsSupported) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (!voices.length) refreshVoices();
  const norm = (l: string) => l.replace('_', '-').toLowerCase();
  const exact = voices.filter((v) => norm(v.lang) === lang.toLowerCase());
  const pool = exact.length ? exact : voices.filter((v) => norm(v.lang).startsWith(lang.slice(0, 2).toLowerCase()));
  return (
    pool.find((v) => /google|natural|neural|online/i.test(v.name)) ??
    pool.find((v) => /samantha|daniel|zira|david|aria|jenny|guy|libby|ryan/i.test(v.name)) ??
    pool[0] ??
    null
  );
}

function setPending(next: number) {
  const was = pending > 0;
  pending = Math.max(0, next);
  const is = pending > 0;
  if (was !== is) listeners.forEach((l) => l(is));
}

export interface SpeakOpts {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
}

export function speak(text: string, { lang = 'en-US', rate = 0.95, pitch = 1, volume = 1, onEnd }: SpeakOpts = {}): void {
  if (!ttsSupported || !text) {
    onEnd?.();
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  u.pitch = pitch;
  u.volume = Math.max(0, Math.min(1, volume));
  const v = pickVoice(lang);
  if (v) u.voice = v;
  const gen = generation;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.clearTimeout(guard);
    if (gen === generation) setPending(pending - 1);
    onEnd?.();
  };
  // Algunos navegadores no disparan onend: nos protegemos con un temporizador.
  const guard = window.setTimeout(finish, 2500 + (text.length * 110) / rate);
  u.onend = finish;
  u.onerror = finish;
  setPending(pending + 1);
  window.speechSynthesis.speak(u);
}

export function cancelSpeech(): void {
  if (!ttsSupported) return;
  generation++;
  window.speechSynthesis.cancel();
  setPending(0);
}

export function isSpeaking(): boolean {
  return pending > 0;
}

export function onSpeakingChange(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
