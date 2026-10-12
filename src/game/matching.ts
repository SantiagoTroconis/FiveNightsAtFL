/**
 * Comparación tolerante entre lo que dijo el estudiante y la frase esperada.
 * Acepta pequeños errores de pronunciación/reconocimiento, palabras extra
 * ("uh, close the door please") y contracciones ("I'm" = "I am"), pero exige
 * las palabras clave que cambian el significado (left/right, on/off, not, números).
 */

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am',
  "you're": 'you are',
  "he's": 'he is',
  "she's": 'she is',
  "it's": 'it is',
  "that's": 'that is',
  "what's": 'what is',
  "where's": 'where is',
  "there's": 'there is',
  "we're": 'we are',
  "they're": 'they are',
  "i've": 'i have',
  "i'll": 'i will',
  "i'd": 'i would',
  "don't": 'do not',
  "doesn't": 'does not',
  "didn't": 'did not',
  "can't": 'cannot',
  "won't": 'will not',
  "isn't": 'is not',
  "aren't": 'are not',
  "let's": 'let us',
};

const FILLERS = new Set(['uh', 'um', 'umm', 'er', 'erm', 'ah', 'hmm', 'please', 'oh']);

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

/** Palabras que no pueden confundirse porque cambian el significado. */
const CRITICAL = new Set([
  'left', 'right', 'on', 'off', 'not', 'yes', 'no',
  'nobody', 'somebody', 'someone', 'anyone', 'anybody',
  ...NUMBER_WORDS,
]);

/** Variantes informales que el reconocedor de voz suele escribir. */
const SYNONYMS: Record<string, string> = {
  yeah: 'yes',
  yep: 'yes',
  yup: 'yes',
  nope: 'no',
  nah: 'no',
  okey: 'okay',
};

/** Palabras gramaticales: pueden faltar o confundirse sin cambiar la intención. */
const FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'to', 'of', 'is', 'am', 'are', 'i', 'you', 'me', 'my', 'it', 'at', 'in',
  'some', 'can', 'him', 'up', 'down', 'now', 'and', 'thank',
]);

function numWord(d: string): string {
  const n = parseInt(d, 10);
  return NUMBER_WORDS[n] ?? d;
}

export function normalize(text: string): string[] {
  let t = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  t = t.replace(/[’‘`´]/g, "'");
  t = t.replace(/(\d{1,2})(?::00)?\s*(a\.?\s?m\.?|p\.?\s?m\.?)(?![a-z])/g, (_m, d: string, ap: string) =>
    ` ${numWord(d)} ${ap.startsWith('a') ? 'am' : 'pm'} `,
  );
  t = t.replace(/\b(\d{1,2})(?::00)?\b/g, (_m, d: string) => ` ${numWord(d)} `);
  t = t.replace(/\ba\.\s?m\.?/g, ' am ').replace(/\bp\.\s?m\.?/g, ' pm ');
  t = t.replace(/o'\s?clock/g, 'oclock');

  const raw = t.split(/[^a-z']+/).filter(Boolean);
  const words: string[] = [];
  for (const w of raw) {
    const exp = CONTRACTIONS[w];
    if (exp) words.push(...exp.split(' '));
    else {
      const clean = w.replace(/'s$/, '').replace(/'/g, '');
      if (clean) words.push(clean);
    }
  }

  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w === 'can' && words[i + 1] === 'not') {
      out.push('cannot');
      i++;
      continue;
    }
    if (w === 'ok') out.push('okay');
    else if (SYNONYMS[w]) out.push(SYNONYMS[w]);
    else if (!FILLERS.has(w)) out.push(w);
  }
  return out;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  let cur = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[b.length];
}

export function charSim(a: string, b: string): number {
  if (a === b) return 1;
  const m = Math.max(a.length, b.length);
  return m === 0 ? 1 : 1 - levenshtein(a, b) / m;
}

/** Distancia de edición a nivel de palabras, con sustituciones "blandas". */
function softWordDistance(target: string[], said: string[]): number {
  const n = target.length;
  const m = said.length;
  // Omitir o añadir una palabra gramatical ("the", "a"...) cuesta poco.
  const gap = (w: string) => (FUNCTION_WORDS.has(w) ? 0.35 : 1);
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) dp[i][0] = dp[i - 1][0] + gap(target[i - 1]);
  for (let j = 1; j <= m; j++) dp[0][j] = dp[0][j - 1] + gap(said[j - 1]);
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const a = target[i - 1];
      const b = said[j - 1];
      let sub = 1;
      if (a === b) sub = 0;
      else if (FUNCTION_WORDS.has(a) && FUNCTION_WORDS.has(b)) sub = 0.35;
      else if (!CRITICAL.has(a)) {
        const s = charSim(a, b);
        if (s >= 0.6) sub = 1 - s;
      }
      dp[i][j] = Math.min(dp[i - 1][j] + gap(a), dp[i][j - 1] + gap(b), dp[i - 1][j - 1] + sub);
    }
  }
  return dp[n][m];
}

function containsSeq(hay: string[], needle: string[]): boolean {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

/** Puntaje 0..1 de qué tan bien `said` contiene a `target`. */
export function scoreTokens(target: string[], said: string[]): number {
  if (!target.length || !said.length) return 0;
  let best: number;
  if (containsSeq(said, target)) best = 1;
  else {
    best = 0;
    const n = target.length;
    if (said.length <= n + 1) {
      best = 1 - softWordDistance(target, said) / Math.max(n, said.length);
    }
    for (let len = Math.max(1, n - 1); len <= n + 1; len++) {
      for (let i = 0; i + len <= said.length; i++) {
        const w = said.slice(i, i + len);
        const s = 1 - softWordDistance(target, w) / Math.max(n, len);
        if (s > best) best = s;
      }
    }
  }
  for (const w of target) {
    if (CRITICAL.has(w)) {
      if (!said.includes(w)) best = Math.min(best, 0.4);
    } else if (!FUNCTION_WORDS.has(w) && !said.some((s) => charSim(s, w) >= 0.5)) {
      // Falta una palabra de contenido ("fan" ≠ "light"): no es la misma orden.
      best = Math.min(best, 0.5);
    }
  }
  return Math.max(0, best);
}

export function score(target: string, said: string): number {
  return scoreTokens(normalize(target), normalize(said));
}

/** Para la retroalimentación visual: qué palabras de la frase se escucharon. */
export function wordHits(display: string, said: string): { w: string; hit: boolean }[] {
  const saidTokens = normalize(said);
  return display
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const toks = normalize(w);
      if (!toks.length) return { w, hit: true };
      const hit = toks.every((t) =>
        saidTokens.some((s) => s === t || (!CRITICAL.has(t) && charSim(s, t) >= 0.72)),
      );
      return { w, hit };
    });
}
