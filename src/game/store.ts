import { create } from 'zustand';
import { produce } from 'immer';
import { audio, panOf } from '../audio/audio';
import { cancelSpeech, isSpeaking, speak, ttsSupported } from '../audio/tts';
import { speechSupported } from '../speech/useSpeechRecognition';
import {
  DOOR_CLOSED_SECONDS,
  FAST_MODE,
  NIGHTS,
  PICKUP_SECONDS,
  THRESHOLDS,
  UNLOCK_SECONDS,
  nightConfig,
} from './config';
import {
  ACTIONS,
  ACTION_IDS,
  CONTROLS,
  ITEMS,
  ITEM_KINDS,
  SIDE_WORD,
  SPOTS,
  SPOT_IDS,
  actionsForControl,
  doorAction,
  hourLabel,
  phraseFor,
} from './content';
import {
  ACTION_DIALOGUES,
  CHECKS,
  CHECK_ACK,
  DISTRACTORS,
  DOOR_ACK,
  DOOR_DONE,
  DOOR_HINT,
  DOOR_INTERRUPT,
  DOOR_LINE,
  FIND_ACCEPT,
  FIND_ACK,
  FIND_DONE,
  FIND_HINT,
  FIND_LINES,
  HELP_KINDS,
  HELP_PHRASES,
  LIES,
  MAX_HELPS,
  MISHEARD,
  NO_MORE_HELP,
  RESUME_LINE,
  TALKS,
  TOO_LATE,
  actionAccept,
  doorReply,
  sideText,
  timeAnswer,
  type OrderableAction,
} from './dialogues';
import { normalize, scoreTokens, wordHits } from './matching';
import { loadSaved, persist } from './storage';
import type {
  ActionId,
  Bilingual,
  CheckKind,
  ControlId,
  DeathInfo,
  Effects,
  Feedback,
  HelpKind,
  HelpLevel,
  ItemKind,
  Level,
  Monster,
  NightConfig,
  NightStats,
  Order,
  Progress,
  ReplyOption,
  Screen,
  Settings,
  Side,
  Toast,
  WorldItem,
} from './types';

/* ================================================================== */
/*  Estado                                                             */
/* ================================================================== */

export interface GameState {
  screen: Screen;
  settings: Settings;
  progress: Progress;
  micChecked: boolean;
  night: number;

  t: number;
  hour: number;
  battery: number;
  flashlight: boolean;
  doors: Record<Side, number>;
  fanOn: boolean;
  alarmOn: boolean;
  powerFailing: boolean;
  monster: Monster;
  anger: number;

  order: Order | null;
  suspended: Order | null;
  nextOrderIn: number;
  orderSeq: number;
  scriptIdx: number;
  lastOrderKey: string;

  unlocked: Partial<Record<ActionId, number>>;
  cooldowns: Partial<Record<ActionId, number>>;

  items: WorldItem[];
  itemSeq: number;
  inspecting: { uid: number; timeLeft: number } | null;
  inventory: ItemKind[];
  bookCharges: number;

  fx: Effects;
  feedback: (Feedback & { masked?: boolean }) | null;
  heard: string;
  toasts: Toast[];
  toastSeq: number;
  stats: NightStats;
  death: DeathInfo | null;
  lastResult: { stars: number; newBest: boolean; accuracy: number } | null;
  commandsOpen: boolean;
  doorEventDone: boolean;
  ambientIn: number;
  lastMissVoice: number;
  tips: Record<string, boolean>;
}

const saved = loadSaved();

function emptyStats(): NightStats {
  return { score: 0, streak: 0, bestStreak: 0, ordersOk: 0, ordersFail: 0, matches: 0, misses: 0, items: 0, practiced: {} };
}

function freshNight(n: number) {
  return {
    night: n,
    t: 0,
    hour: 0,
    battery: 100,
    flashlight: true,
    doors: { L: 0, R: 0 },
    fanOn: true,
    alarmOn: false,
    powerFailing: false,
    monster: { pos: 0, side: 'L', moveTimer: 12, cooldown: 14, calm: 0, leaving: 0, forced: false } as Monster,
    anger: 0,
    order: null,
    suspended: null,
    nextOrderIn: 3.5,
    orderSeq: 0,
    scriptIdx: 0,
    lastOrderKey: '',
    unlocked: {},
    cooldowns: {},
    items: [] as WorldItem[],
    itemSeq: 0,
    inspecting: null,
    inventory: [] as ItemKind[],
    bookCharges: 0,
    fx: { lightFlash: 0, camera: 0, flicker: 0, shake: 0, staticFx: 0, windowFace: 0, lever: 0 },
    feedback: null,
    heard: '',
    toasts: [] as Toast[],
    stats: emptyStats(),
    death: null,
    lastResult: null,
    commandsOpen: false,
    doorEventDone: false,
    ambientIn: 16,
    lastMissVoice: -99,
    tips: {},
  } satisfies Partial<GameState>;
}

export const useGame = create<GameState>()(() => ({
  screen: 'splash',
  settings: saved.settings,
  progress: saved.progress,
  micChecked: false,
  toastSeq: 0,
  ...freshNight(Math.min(saved.progress.unlocked, NIGHTS.length)),
}));

type D = GameState;

function mutate(fn: (d: D) => void): void {
  useGame.setState(produce<GameState>((d) => fn(d as D)));
}

/* ================================================================== */
/*  Utilidades                                                         */
/* ================================================================== */

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weighted<K extends string>(w: Partial<Record<K, number>>): K {
  const entries = Object.entries(w) as [K, number][];
  const total = entries.reduce((s, [, v]) => s + v, 0);
  let r = Math.random() * total;
  for (const [k, v] of entries) {
    r -= v;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

/** Elige una variante del nivel actual (a veces repasa niveles anteriores). */
function pickLevel<T extends { level: Level }>(list: T[], level: Level): T {
  const avail = list.filter((x) => x.level <= level);
  const pool = avail.length ? avail : list;
  const current = pool.filter((x) => x.level === level);
  return pick(Math.random() < 0.65 && current.length ? current : pool);
}

export function getCfg(n: number): NightConfig {
  const c = nightConfig(n);
  if (!FAST_MODE) return c;
  return { ...c, hourSeconds: 8, forcedDoorAt: c.forcedDoorAt ? c.forcedDoorAt * 0.2 : undefined };
}

function toast(d: D, text: string, kind: Toast['kind'] = 'info', ttl = 3.4) {
  d.toasts.push({ id: ++d.toastSeq, text, kind, ttl });
  if (d.toasts.length > 4) d.toasts.shift();
}

/** Consejos de tutorial: solo en la noche 1 y una vez cada uno. */
function tip(d: D, key: string, text: string) {
  if (d.night !== 1 || d.tips[key]) return;
  d.tips[key] = true;
  toast(d, text, 'tip', 7);
}

function wantTranslation(d: D, base: boolean): boolean {
  const s = d.settings.translations;
  if (s === 'always') return true;
  if (s === 'never') return false;
  return base;
}

/** ¿Mostrar traducciones/ayudas de comandos en este momento? */
export function helpVisible(s: GameState): boolean {
  const c = getCfg(s.night);
  return wantTranslation(s as D, c.translations || s.bookCharges > 0);
}

type VoiceKind = 'radio' | 'slow' | 'urgent';

function radioSay(d: D, text: string, kind: VoiceKind = 'radio') {
  const lang = d.settings.accent;
  const volume = Math.min(1, d.settings.volume + 0.15);
  if (kind === 'slow') speak(text, { lang, rate: 0.68, pitch: 0.85, volume });
  else if (kind === 'urgent') speak(text, { lang, rate: 1.02, pitch: 0.7, volume });
  else speak(text, { lang, rate: 0.93, pitch: 0.8, volume });
}

/** Pronunciación modelo (botón 🔊). */
export function sayModel(text: string): void {
  const s = useGame.getState().settings;
  cancelSpeech();
  speak(text, { lang: s.accent, rate: 0.8, pitch: 1, volume: Math.min(1, s.volume + 0.15) });
}

function record(d: D, phrase: Bilingual, ok: boolean) {
  const key = phrase.en.trim();
  if (!key || key.includes('___') || key.includes('...')) return;
  const prev = d.stats.practiced[key];
  d.stats.practiced[key] = {
    en: key,
    es: phrase.es || prev?.es || '',
    ok: (prev?.ok ?? 0) + (ok ? 1 : 0),
    tries: (prev?.tries ?? 0) + 1,
  };
}

const POS_NAME: Record<number, Bilingual> = {
  0: { en: 'on the stage', es: 'en el escenario' },
  1: { en: 'in the dining room', es: 'en el comedor' },
  2: { en: 'in the hallway', es: 'en el pasillo' },
  3: { en: 'AT THE DOOR', es: 'EN LA PUERTA' },
};

/* ================================================================== */
/*  Objetos                                                            */
/* ================================================================== */

function weightedItem(d: D): ItemKind {
  const w: Partial<Record<ItemKind, number>> = {};
  for (const k of ITEM_KINDS) w[k] = ITEMS[k].weight;
  if (d.battery < 50) w.battery = (w.battery ?? 1) * 2;
  if (d.inventory.includes('mask')) w.mask = 0.3;
  if (d.night >= 3) w.book = (w.book ?? 1) * 1.6;
  return weighted(w);
}

function spawnItem(d: D, kind: ItemKind): number | null {
  const free = SPOT_IDS.filter((s) => !d.items.some((i) => !i.found && i.spot === s));
  if (!free.length) return null;
  const uid = ++d.itemSeq;
  d.items.push({ uid, kind, spot: pick(free), found: false });
  return uid;
}

function collectItem(d: D, uid: number) {
  const it = d.items.find((i) => i.uid === uid);
  if (!it || it.found) return;
  const c = getCfg(d.night);
  it.found = true;
  d.inspecting = null;
  d.stats.items++;
  d.stats.score += 50;
  audio.pickup();
  switch (it.kind) {
    case 'battery':
      d.battery = Math.min(100, d.battery + 40);
      toast(d, '🔋 ¡Pila! +40% de batería', 'good');
      break;
    case 'bell':
      d.inventory.push('bell');
      toast(d, '🔔 Campana guardada. Haz clic en ella (abajo) para usarla.', 'good', 5);
      break;
    case 'mask':
      d.inventory.push('mask');
      toast(d, '🎭 Máscara: te salvará una vez de Freddy.', 'good', 5);
      break;
    case 'book':
      d.bookCharges += 3;
      toast(d, '📖 Libro: ayuda completa en las próximas 3 conversaciones.', 'good', 5);
      break;
    case 'clock':
      d.t = Math.min(d.t + c.hourSeconds / 3, c.hourSeconds * 6 - 1);
      toast(d, '⏰ ¡El tiempo avanza 20 minutos!', 'good');
      break;
  }
  const o = d.order;
  if (o && o.kind === 'find' && o.itemUid === uid && (o.stage === 'find' || o.stage === 'speak')) completeOrder(d);
}

/* ================================================================== */
/*  Conversaciones con la radio                                        */
/* ================================================================== */

type NewOrder = Pick<Order, 'kind' | 'line' | 'replies' | 'help' | 'hint' | 'ack' | 'timeLeft' | 'showTranslation' | 'masked'> &
  Partial<Pick<Order, 'choices' | 'doneLine' | 'action' | 'doorSide' | 'checkKind' | 'checkSide' | 'itemUid'>>;

function baseOrder(d: D, o: NewOrder): Order {
  return {
    ...o,
    id: ++d.orderSeq,
    stage: 'speak',
    timeTotal: o.timeLeft,
    helpsUsed: 0,
    revealed: false,
    resultTimer: 0,
    log: [{ who: 'radio', en: o.line.en, es: o.line.es, question: true }],
  };
}

/** Si la radio no tiene voz, el estudiante necesita tiempo extra para leer. */
function readTime(d: D): number {
  return d.settings.radioVoice && ttsSupported ? 0 : 4;
}

function consumeBook(d: D): boolean {
  if (d.bookCharges <= 0) return false;
  d.bookCharges--;
  return true;
}

function helpLevel(c: NightConfig, book: boolean): HelpLevel {
  return book ? 'full' : c.help;
}

/** En la noche 5 la pregunta solo se escucha (si hay voz disponible). */
function shouldMask(d: D, c: NightConfig, book: boolean): boolean {
  return c.maskRadio && !book && ttsSupported && d.settings.radioVoice;
}

function makeChoices(help: HelpLevel, corrects: string[], distractors: string[]): string[] | undefined {
  if (help !== 'choices') return undefined;
  const extra = shuffle(distractors.filter((x) => !corrects.includes(x))).slice(0, Math.max(1, 3 - corrects.length));
  return shuffle([...corrects, ...extra]);
}

function makeActionOrder(d: D, forced?: ActionId): Order {
  const c = getCfg(d.night);
  const pool = (Object.keys(ACTION_DIALOGUES) as OrderableAction[]).filter(
    (a) => a !== (d.fanOn ? 'fanOn' : 'fanOff') && `action:${a}` !== d.lastOrderKey,
  );
  const action = (forced as OrderableAction | undefined) ?? pick(pool);
  const set = ACTION_DIALOGUES[action];
  const dlg = pickLevel(set.dialogues, c.level);
  const book = consumeBook(d);
  const help = helpLevel(c, book);
  delete d.unlocked[action];
  delete d.cooldowns[action];
  if (action === 'alarmOff') {
    d.alarmOn = true;
    audio.setAlarm(true);
  }
  if (action === 'pullLever') d.powerFailing = true;
  d.lastOrderKey = `action:${action}`;
  return baseOrder(d, {
    kind: 'action',
    action,
    line: dlg.line,
    replies: [{ model: dlg.model, accept: actionAccept(action) }],
    help,
    choices: makeChoices(help, [dlg.model.en], dlg.distractors),
    hint: set.hint,
    ack: dlg.ack,
    doneLine: dlg.done,
    timeLeft: c.orderTime + readTime(d),
    showTranslation: wantTranslation(d, c.translations || book),
    masked: shouldMask(d, c, book),
  });
}

function makeTalkOrder(d: D, forcedId?: string): Order {
  const c = getCfg(d.night);
  const pool = TALKS.filter((q) => q.level <= c.level && `talk:${q.id}` !== d.lastOrderKey);
  const q = (forcedId && TALKS.find((x) => x.id === forcedId)) || pick(pool);
  let model = q.model;
  let accept = q.accept;
  if (q.dynamic === 'time') {
    const ta = timeAnswer(d.hour);
    model = ta.model;
    accept = ta.accept;
  }
  const book = consumeBook(d);
  const help = helpLevel(c, book);
  d.lastOrderKey = `talk:${q.id}`;
  return baseOrder(d, {
    kind: 'talk',
    line: q.line,
    replies: [{ model, accept }],
    help,
    choices: makeChoices(help, [model.en], q.distractors),
    hint: q.hint,
    ack: q.ack,
    timeLeft: c.orderTime + readTime(d),
    showTranslation: wantTranslation(d, c.translations || book),
    masked: shouldMask(d, c, book),
  });
}

function makeCheckOrder(d: D, forced?: { check: CheckKind; side?: Side }): Order {
  const c = getCfg(d.night);
  const kind: CheckKind = forced?.check ?? weighted<CheckKind>({ door: 3, fan: 1, flashlight: 1 });
  const side: Side = forced?.side ?? (Math.random() < 0.5 ? 'L' : 'R');
  const def = CHECKS[kind];
  const l = pickLevel(def.lines, c.level);
  const line = kind === 'door' ? { en: sideText(l.en, side, 'en'), es: sideText(l.es, side, 'es') } : { en: l.en, es: l.es };
  const book = consumeBook(d);
  const help = helpLevel(c, book);
  d.lastOrderKey = `check:${kind}`;
  return baseOrder(d, {
    kind: 'check',
    checkKind: kind,
    checkSide: kind === 'door' ? side : undefined,
    line,
    replies: [def.yes, def.no],
    help,
    choices: makeChoices(help, [def.yes.model.en, def.no.model.en], DISTRACTORS),
    hint: def.hint,
    ack: CHECK_ACK.other,
    timeLeft: c.orderTime + readTime(d),
    showTranslation: wantTranslation(d, c.translations || book),
    masked: shouldMask(d, c, book),
  });
}

function makeFindOrder(d: D, forcedKind?: ItemKind): Order | null {
  const c = getCfg(d.night);
  const kind = forcedKind ?? weightedItem(d);
  const uid = spawnItem(d, kind);
  if (uid == null) return null;
  const it = d.items.find((i) => i.uid === uid)!;
  const spot = SPOTS[it.spot];
  const def = ITEMS[kind];
  const tpl = pick(FIND_LINES);
  const line = {
    en: tpl.en.replace('{item}', def.en).replace('{spot}', spot.en),
    es: tpl.es.replace('{itemEs}', def.esFull).replace('{spotEs}', spot.es).replace('{pron}', def.pron),
  };
  const model = { en: "Sure, I'll look for it.", es: `Claro, ${def.pron} busco.` };
  const book = consumeBook(d);
  const help = helpLevel(c, book);
  d.lastOrderKey = `find:${kind}`;
  return baseOrder(d, {
    kind: 'find',
    itemUid: uid,
    line,
    replies: [{ model, accept: FIND_ACCEPT }],
    help,
    choices: makeChoices(help, [model.en], DISTRACTORS),
    hint: FIND_HINT,
    ack: FIND_ACK,
    doneLine: FIND_DONE,
    timeLeft: c.findTime + readTime(d),
    showTranslation: wantTranslation(d, c.translations || book),
    masked: shouldMask(d, c, book),
  });
}

function makeDoorOrder(d: D, interrupted: boolean): Order {
  const c = getCfg(d.night);
  const book = d.bookCharges > 0;
  const help = helpLevel(c, book);
  const line = interrupted
    ? { en: `${DOOR_INTERRUPT.en} ${DOOR_LINE.en}`, es: `${DOOR_INTERRUPT.es} ${DOOR_LINE.es}` }
    : DOOR_LINE;
  const L = doorReply('L');
  const R = doorReply('R');
  return baseOrder(d, {
    kind: 'door',
    doorSide: d.monster.side,
    line,
    replies: [L, R],
    help,
    choices: makeChoices(help, [L.model.en, R.model.en], DISTRACTORS),
    hint: DOOR_HINT,
    ack: DOOR_ACK,
    doneLine: DOOR_DONE,
    timeLeft: c.doorTime + readTime(d) / 2,
    showTranslation: wantTranslation(d, c.translations || book),
    masked: false,
  });
}

/** La radio dice algo: queda en el historial y se escucha. */
function radioLine(d: D, o: Order, line: Bilingual, opts: { question?: boolean; voice?: VoiceKind | false } = {}) {
  o.log.push({ who: 'radio', en: line.en, es: line.es, question: opts.question });
  if (o.log.length > 8) o.log.splice(0, o.log.length - 8);
  if (opts.voice === false) return;
  if (d.settings.radioVoice || opts.voice) radioSay(d, line.en, opts.voice || (o.kind === 'door' ? 'urgent' : 'radio'));
}

function youLine(o: Order, text: string, ok: boolean) {
  o.log.push({ who: 'you', en: text, ok });
  if (o.log.length > 8) o.log.splice(0, o.log.length - 8);
}

function presentOrder(d: D, o: Order) {
  audio.radioBeep();
  if (d.settings.radioVoice || o.masked) radioSay(d, o.line.en, o.kind === 'door' ? 'urgent' : 'radio');

  if (o.kind === 'talk') tip(d, 'talk', '🎙 Respóndele a la radio en voz alta, en inglés. Tu respuesta aparece en el panel.');
  if (o.kind === 'action') tip(d, 'action', '🎙 Respóndele a la radio. Después, cuando el control brille en verde, haz clic en él.');
  if (o.kind === 'check') tip(d, 'check', '🔦 Mira con la linterna y respóndele la VERDAD a la radio.');
  if (o.kind === 'find') tip(d, 'find', '🎙 Acepta el pedido y luego busca el objeto con la linterna.');
  if (o.kind === 'door') tip(d, 'door', '🚪 ¡Dile por qué puerta viene y presiona el botón de esa puerta!');
}

function newOrder(d: D) {
  const c = getCfg(d.night);
  let o: Order | null = null;
  if (c.script && d.scriptIdx < c.script.length) {
    const s = c.script[d.scriptIdx++];
    if (s.kind === 'talk') o = makeTalkOrder(d, s.id);
    else if (s.kind === 'action') o = makeActionOrder(d, s.action);
    else if (s.kind === 'find') o = makeFindOrder(d, s.item);
    else o = makeCheckOrder(d, { check: s.check, side: s.side });
  }
  if (!o) {
    const k = weighted(c.kinds);
    o = k === 'talk' ? makeTalkOrder(d) : k === 'check' ? makeCheckOrder(d) : k === 'find' ? makeFindOrder(d) : makeActionOrder(d);
    if (!o) o = makeActionOrder(d);
  }
  d.order = o;
  presentOrder(d, o);
}

/** Qué respuesta es la verdad ahora mismo (para preguntas de verdad y la puerta). */
function truthTag(d: D, o: Order): ReplyOption['tag'] | undefined {
  const m = d.monster;
  if (o.kind === 'door') return m.side;
  if (o.kind !== 'check') return undefined;
  switch (o.checkKind) {
    case 'door':
      return m.pos >= 2 && m.side === o.checkSide ? 'yes' : 'no';
    case 'fan':
      return d.fanOn ? 'yes' : 'no';
    case 'flashlight':
      return d.flashlight && d.battery > 0 ? 'yes' : 'no';
  }
  return undefined;
}

/** La respuesta correcta en este momento. */
export function correctReply(s: GameState, o: Order): ReplyOption {
  const truth = truthTag(s as D, o);
  return o.replies.find((r) => !r.tag || r.tag === truth) ?? o.replies[0];
}

function unlockFor(d: D, o: Order, a: ActionId) {
  d.unlocked[a] = Math.max(UNLOCK_SECONDS, o.timeLeft + 1);
  o.pressAction = a;
  o.stage = 'press';
}

/** El estudiante respondió. Devuelve false si lo que dijo no es verdad. */
function handleReply(d: D, o: Order, tag: ReplyOption['tag'], heard: string): boolean {
  youLine(o, heard, true);
  const truth = truthTag(d, o);
  if (tag && truth && tag !== truth) {
    const lie =
      o.kind === 'door' ? LIES.wrongDoor : o.checkKind === 'door' ? (truth === 'yes' ? LIES.doorThere : LIES.doorEmpty) : LIES.other;
    o.log[o.log.length - 1].ok = false;
    radioLine(d, o, lie);
    o.timeLeft = Math.max(1, o.timeLeft - 4);
    audio.miss();
    return false;
  }
  switch (o.kind) {
    case 'action':
      unlockFor(d, o, o.action!);
      radioLine(d, o, o.ack);
      break;
    case 'talk':
      radioLine(d, o, o.ack);
      completeOrder(d);
      break;
    case 'find':
      o.stage = 'find';
      radioLine(d, o, o.ack);
      break;
    case 'door':
      unlockFor(d, o, doorAction(d.monster.side));
      radioLine(d, o, o.ack);
      break;
    case 'check':
      if (o.checkKind === 'door' && truth === 'yes') {
        unlockFor(d, o, doorAction(o.checkSide!));
        o.doneLine = CHECK_ACK.doorDangerDone;
        radioLine(d, o, CHECK_ACK.doorDanger, { voice: 'urgent' });
      } else {
        radioLine(d, o, o.checkKind === 'door' ? CHECK_ACK.doorSafe : CHECK_ACK.other);
        completeOrder(d);
      }
      break;
  }
  audio.unlock();
  return true;
}

/** "Can you repeat that?", "Slower, please", "What does it mean?" */
function handleHelp(d: D, o: Order, kind: HelpKind, heard?: string) {
  if (heard) youLine(o, heard, true);
  if (o.helpsUsed >= MAX_HELPS) {
    radioLine(d, o, NO_MORE_HELP, { voice: 'urgent' });
    return;
  }
  o.helpsUsed++;
  audio.staticBurst(0.2);
  // Antes de responder se repite la pregunta; después, lo último que dijo la radio ("Close it now!").
  const lastRadio = [...o.log].reverse().find((l) => l.who === 'radio' && l.es);
  const line: Bilingual = o.stage === 'speak' || !lastRadio ? o.line : { en: lastRadio.en, es: lastRadio.es! };
  const question = line === o.line;
  if (kind === 'meaning') {
    o.revealed = true;
    o.showTranslation = true;
    o.timeLeft = Math.max(1, o.timeLeft - 3);
    radioLine(d, o, line, { question, voice: false });
    toast(d, '📖 Traducción en la radio (−3 s)', 'info');
  } else {
    radioLine(d, o, line, { question, voice: kind === 'slower' ? 'slow' : o.kind === 'door' ? 'urgent' : 'radio' });
  }
}

function noteFor(o: Order): string {
  if (o.stage === 'press' && o.pressAction) {
    const ctl = CONTROLS[ACTIONS[o.pressAction].control];
    return `Ahora presiona: ${ctl.icon} ${ctl.label.es}`;
  }
  if (o.stage === 'find') return 'Ahora busca el objeto con la linterna 🔦';
  return '¡Bien dicho!';
}

function completeOrder(d: D) {
  const o = d.order;
  if (!o || o.stage === 'done') return;
  const c = getCfg(d.night);
  const st = d.stats;
  const m = d.monster;
  o.stage = 'done';
  o.resultTimer = 2.4;
  st.ordersOk++;
  st.streak++;
  st.bestStreak = Math.max(st.bestStreak, st.streak);
  const mult = 1 + Math.min(1, st.streak * 0.1);
  st.score += Math.round((o.kind === 'door' ? 200 : 100 + o.timeLeft * 5) * mult);
  d.anger = Math.max(0, d.anger - 0.5);
  if (o.pressAction) delete d.unlocked[o.pressAction];
  if (o.doneLine) radioLine(d, o, o.doneLine);
  audio.success();
  if (o.kind !== 'door') {
    if (st.streak % 3 === 0) {
      d.battery = Math.min(100, d.battery + 10);
      if (m.pos > 0 && m.pos < 3) m.pos = (m.pos - 1) as Monster['pos'];
      toast(d, `🔥 ¡Racha de ${st.streak}! +10% batería y Freddy retrocede`, 'good');
    } else if (m.pos > 0 && m.pos < 3 && Math.random() < 0.35) {
      m.pos = (m.pos - 1) as Monster['pos'];
      m.moveTimer = Math.max(m.moveTimer, c.monster.interval);
      toast(d, 'Freddy retrocede...', 'good');
    }
  }
}

function scare(d: D) {
  const opts: string[] = ['flicker', 'static', 'bang'];
  if (!d.settings.reducedScares) opts.push('face', 'face');
  switch (pick(opts)) {
    case 'flicker':
      d.fx.flicker = 1.8;
      audio.flickerBuzz();
      break;
    case 'static':
      d.fx.staticFx = 1;
      audio.staticBurst(1);
      break;
    case 'bang':
      d.fx.shake = 0.8;
      audio.bang(pick([-0.8, 0.8]));
      break;
    case 'face':
      d.fx.windowFace = 0.5;
      d.fx.shake = 0.35;
      audio.stinger();
      break;
  }
}

function failOrder(d: D, soft = false) {
  const o = d.order;
  if (!o) return;
  const answer = correctReply(d, o).model;
  o.stage = 'failed';
  o.resultTimer = 3.4;
  o.failAnswer = answer;
  radioLine(d, o, TOO_LATE, { voice: false });
  d.stats.ordersFail++;
  d.stats.streak = 0;
  if (o.kind !== 'door') record(d, answer, false);
  if (o.pressAction) delete d.unlocked[o.pressAction];
  audio.fail();
  if (o.action === 'alarmOff' && d.alarmOn) {
    d.alarmOn = false;
    audio.setAlarm(false);
  }
  if (o.action === 'pullLever') {
    d.powerFailing = false;
    d.battery = Math.max(0, d.battery - 15);
    toast(d, '⚡ Se fue la energía: −15% de batería', 'bad');
  }
  if (!soft) {
    d.anger += 1;
    toast(d, '✖ No le respondiste a tiempo... Freddy se acerca.', 'bad');
    scare(d);
    advanceMonster(d);
  }
}

function finishOrder(d: D) {
  const c = getCfg(d.night);
  if (d.suspended) {
    const o = d.suspended;
    d.suspended = null;
    d.order = o;
    o.timeLeft += 5;
    audio.radioBeep();
    radioLine(d, o, RESUME_LINE);
    if (o.stage === 'speak') radioLine(d, o, o.line, { question: true });
    if (o.kind === 'find' && d.items.find((i) => i.uid === o.itemUid)?.found) completeOrder(d);
    return;
  }
  d.order = null;
  d.nextOrderIn = rand(c.orderGap[0], c.orderGap[1]);
}

/* ================================================================== */
/*  Freddy                                                             */
/* ================================================================== */

function aggression(d: D): number {
  const c = getCfg(d.night).monster;
  let p = c.base + c.perAnger * d.anger + 0.025 * d.hour;
  if (d.alarmOn) p += 0.15;
  if (d.monster.calm > 0) p *= 0.25;
  return Math.min(0.85, p);
}

function advanceMonster(d: D) {
  const m = d.monster;
  const c = getCfg(d.night);
  if (m.pos === 0) {
    m.pos = 1;
    audio.clank();
  } else if (m.pos === 1) {
    m.pos = 2;
    m.side = Math.random() < 0.5 ? 'L' : 'R';
    audio.footsteps(panOf(m.side), 4, 0.45);
    if (c.revealSide) toast(d, `👣 Pasos en el pasillo ${m.side === 'L' ? 'izquierdo' : 'derecho'}...`, 'bad');
    tip(d, 'hall', '👀 Freddy está en el pasillo. Apunta la linterna a las puertas. Decir «Turn on the light» lo espanta.');
  } else if (m.pos === 2) arriveAtDoor(d);
}

function arriveAtDoor(d: D) {
  const m = d.monster;
  m.pos = 3;
  m.leaving = 0;
  d.doorEventDone = true;
  audio.footsteps(panOf(m.side), 3, 0.9);
  if (d.doors[m.side] > 0) {
    repel(d, true);
    return;
  }
  audio.breath(panOf(m.side));
  const cur = d.order;
  const interrupted = !!cur && cur.kind !== 'door' && (cur.stage === 'speak' || cur.stage === 'press' || cur.stage === 'find');
  if (interrupted) d.suspended = cur;
  const o = makeDoorOrder(d, interrupted);
  d.order = o;
  presentOrder(d, o);
}

function repel(d: D, closedAlready: boolean) {
  const m = d.monster;
  const c = getCfg(d.night);
  audio.bang(panOf(m.side));
  m.pos = 0;
  m.cooldown = 10;
  m.leaving = 0;
  m.moveTimer = c.monster.interval;
  d.anger = Math.max(0, d.anger - 1);
  d.fx.shake = 0.6;
  if (closedAlready) {
    d.stats.score += 150;
    toast(d, '💥 Freddy chocó con la puerta cerrada... y se fue.', 'good');
  } else toast(d, '💥 Freddy golpea la puerta... y regresa al escenario.', 'good');
}

function jumpscare(d: D) {
  const side = d.monster.side;
  d.screen = 'jumpscare';
  d.death = {
    hourLabel: hourLabel(d.hour),
    night: d.night,
    phrase: doorReply(side).model,
    reason: {
      en: `Freddy came in through the ${SIDE_WORD[side].en} door.`,
      es: `Freddy entró por la puerta ${SIDE_WORD[side].es}.`,
    },
  };
  cancelSpeech();
  audio.stopNightLoops();
  if (d.settings.reducedScares) audio.stinger();
  else audio.scream();
  saveWords(d);
}

function doorTimeout(d: D) {
  const m = d.monster;
  if (m.pos === 3 && d.doors[m.side] <= 0 && m.leaving <= 0) {
    const idx = d.inventory.indexOf('mask');
    if (idx >= 0) {
      d.inventory.splice(idx, 1);
      audio.stinger();
      toast(d, '🎭 ¡La máscara engañó a Freddy! Se fue...', 'good', 4);
      m.pos = 0;
      m.cooldown = 12;
      failOrder(d, true);
    } else jumpscare(d);
  } else failOrder(d, true);
}

/* ================================================================== */
/*  Acciones de la oficina                                             */
/* ================================================================== */

function closeDoor(d: D, side: Side) {
  if (d.doors[side] > 0) {
    toast(d, 'La puerta ya está cerrada.', 'info');
    return;
  }
  d.doors[side] = DOOR_CLOSED_SECONDS;
  audio.doorSlam(panOf(side));
  const m = d.monster;
  if (m.pos === 3 && m.side === side && m.leaving <= 0) {
    m.leaving = 1.4;
    if (d.order?.kind === 'door') completeOrder(d);
  } else if (d.order?.kind === 'door' && d.order.stage !== 'done' && m.side !== side) {
    toast(d, '✖ ¡Esa no es la puerta! Revisa con la linterna.', 'bad');
  }
}

function executeAction(d: D, a: ActionId) {
  const m = d.monster;
  const help = helpVisible(d);
  switch (a) {
    case 'closeLeft':
      closeDoor(d, 'L');
      break;
    case 'closeRight':
      closeDoor(d, 'R');
      break;
    case 'lightOn':
      d.fx.lightFlash = 2.6;
      audio.lightSwitch();
      if (m.pos === 2) {
        m.pos = 1;
        m.cooldown = Math.max(m.cooldown, 6);
        toast(d, '💡 La luz espantó a Freddy del pasillo.', 'good');
      }
      break;
    case 'fanOff':
      d.fanOn = false;
      audio.setFan(false);
      audio.click();
      break;
    case 'fanOn':
      d.fanOn = true;
      audio.setFan(true);
      audio.click();
      break;
    case 'alarmOff':
      if (d.alarmOn) {
        d.alarmOn = false;
        audio.setAlarm(false);
      }
      audio.click();
      break;
    case 'pullLever':
      d.fx.lever = 1.2;
      d.powerFailing = false;
      audio.lever();
      d.battery = Math.min(100, d.battery + 8);
      toast(d, '⚡ Generador reiniciado: +8% de batería', 'good');
      break;
    case 'checkCamera': {
      d.fx.camera = 6;
      audio.cameraBlip();
      const where = POS_NAME[m.pos];
      const side = m.pos >= 2 ? ` (${m.side === 'L' ? 'left / izquierda' : 'right / derecha'})` : '';
      toast(d, `📺 CAM: Freddy is ${where.en}${side}${help ? ` — ${where.es}` : ''}`, m.pos >= 2 ? 'bad' : 'info', 5);
      break;
    }
    case 'playMusic':
      m.calm = 35;
      audio.musicBox();
      toast(d, '🎵 La música calma a Freddy durante 35 s.', 'good');
      break;
  }
}

/* ================================================================== */
/*  Reconocimiento de voz → objetivos activos                          */
/* ================================================================== */

interface Target {
  type: 'reply' | 'help' | 'action' | 'pickup';
  tag?: ReplyOption['tag'];
  help?: HelpKind;
  action?: ActionId;
  uid?: number;
  priority: number;
  options: { tokens: string[]; display: Bilingual }[];
}

function actionTarget(a: ActionId, priority: number): Target {
  return {
    type: 'action',
    action: a,
    priority,
    options: ACTIONS[a].phrases.map((p) => ({ tokens: normalize(p.en), display: { en: p.en, es: p.es } })),
  };
}

function buildTargets(d: D): Target[] {
  const list: Target[] = [];
  const o = d.order;
  if (o && o.stage === 'speak') {
    for (const r of o.replies) {
      list.push({
        type: 'reply',
        tag: r.tag,
        priority: 3,
        options: r.accept.map((a) => ({ tokens: normalize(a), display: r.model })),
      });
    }
  }
  if (o && (o.stage === 'speak' || o.stage === 'press' || o.stage === 'find')) {
    for (const h of HELP_KINDS) {
      const def = HELP_PHRASES[h];
      list.push({ type: 'help', help: h, priority: 2, options: def.accept.map((a) => ({ tokens: normalize(a), display: def.model })) });
    }
  }
  if (d.inspecting) {
    const it = d.items.find((i) => i.uid === d.inspecting!.uid);
    if (it) {
      const def = ITEMS[it.kind];
      list.push({
        type: 'pickup',
        uid: it.uid,
        priority: 4,
        options: def.accepted.map((a) => ({ tokens: normalize(a), display: { en: def.en, es: def.es } })),
      });
    }
  }
  for (const a of ACTION_IDS) {
    if ((d.cooldowns[a] ?? 0) > 0) continue;
    if (a === 'fanOn' && d.fanOn) continue;
    if (a === 'fanOff' && !d.fanOn) continue;
    if (a === 'alarmOff' && !d.alarmOn) continue;
    list.push(actionTarget(a, 1));
  }
  return list;
}

function applyTarget(d: D, t: Target, display: Bilingual, heard: string, sc: number) {
  const fb: Feedback = { heard, target: display, score: sc, ok: true, words: wordHits(display.en, heard), age: 0 };
  d.feedback = fb;
  const o = d.order;
  if (t.type === 'reply' && o) {
    if (!handleReply(d, o, t.tag, heard)) {
      d.stats.misses++;
      fb.ok = false;
      fb.words = [];
      fb.target = undefined;
      fb.note = '📻 La radio no te cree. ¡Mira otra vez!';
      return;
    }
    d.stats.matches++;
    record(d, display, true);
    fb.note = noteFor(o);
    tip(d, 'press', '✨ ¡Bien! Si un control brilla en verde, haz clic en él.');
    return;
  }
  d.stats.matches++;
  record(d, display, true);
  if (t.type === 'help' && o && t.help) {
    handleHelp(d, o, t.help, heard);
    fb.note = HELP_PHRASES[t.help].info;
  } else if (t.type === 'action' && t.action) {
    d.unlocked[t.action] = UNLOCK_SECONDS;
    const ctl = CONTROLS[ACTIONS[t.action].control];
    fb.note = `Ahora presiona: ${ctl.icon} ${ctl.label.es}`;
    audio.unlock();
  } else if (t.type === 'pickup' && t.uid != null) {
    fb.note = '¡Recogido!';
    collectItem(d, t.uid);
  }
}

/* ================================================================== */
/*  API pública (acciones que llama la interfaz)                       */
/* ================================================================== */

function saveWords(d: D) {
  const words = { ...d.progress.words };
  for (const r of Object.values(d.stats.practiced)) {
    const prev = words[r.en];
    words[r.en] = { en: r.en, es: r.es || prev?.es || '', ok: (prev?.ok ?? 0) + r.ok, tries: (prev?.tries ?? 0) + r.tries };
  }
  d.progress.words = words;
  persist(d.settings, d.progress);
}

export function accuracy(st: NightStats): number {
  const total = st.matches + st.misses;
  return total === 0 ? 0 : st.matches / total;
}

function completeNight(d: D) {
  d.screen = 'complete';
  cancelSpeech();
  audio.stopNightLoops();
  audio.chime6am();
  const st = d.stats;
  const acc = accuracy(st);
  const stars = st.ordersFail === 0 && acc >= 0.8 ? 3 : acc >= 0.6 && st.ordersFail <= 3 ? 2 : 1;
  const p = d.progress;
  const newBest = st.score > (p.best[d.night] ?? 0);
  p.unlocked = Math.max(p.unlocked, Math.min(NIGHTS.length + 1, d.night + 1));
  p.stars[d.night] = Math.max(p.stars[d.night] ?? 0, stars);
  if (newBest) p.best[d.night] = st.score;
  d.lastResult = { stars, newBest, accuracy: acc };
  saveWords(d);
}

export const game = {
  go(screen: Screen) {
    mutate((d) => {
      d.screen = screen;
    });
  },

  setSettings(patch: Partial<Settings>) {
    mutate((d) => {
      Object.assign(d.settings, patch);
      persist(d.settings, d.progress);
    });
    if (patch.volume != null) audio.setVolume(patch.volume);
  },

  resetProgress() {
    mutate((d) => {
      d.progress = { unlocked: 1, stars: {}, best: {}, words: {} };
      d.night = 1;
      persist(d.settings, d.progress);
    });
  },

  /** Menú → (prueba de micrófono) → llamada de la noche. */
  startFlow(night: number) {
    mutate((d) => {
      d.night = Math.max(1, Math.min(NIGHTS.length, night));
      const needMic = d.settings.inputMode === 'voice' && speechSupported && !d.micChecked;
      d.screen = needMic ? 'micCheck' : 'intro';
    });
  },

  micDone(switchToText = false) {
    mutate((d) => {
      d.micChecked = true;
      if (switchToText) {
        d.settings.inputMode = 'text';
        persist(d.settings, d.progress);
      }
      d.screen = 'intro';
    });
  },

  startNight() {
    cancelSpeech();
    mutate((d) => {
      const n = d.night;
      Object.assign(d, freshNight(n));
      d.screen = 'playing';
      const c = getCfg(n);
      for (let i = 0; i < c.extraItems; i++) spawnItem(d, weightedItem(d));
    });
    audio.init();
    audio.startAmbience();
    audio.setFan(true);
  },

  tick(dt: number) {
    mutate((d) => {
      if (d.screen !== 'playing') return;
      const c = getCfg(d.night);
      d.t += dt;
      if (d.t >= c.hourSeconds * 6) {
        d.hour = 6;
        completeNight(d);
        return;
      }
      const hour = Math.floor(d.t / c.hourSeconds);
      if (hour !== d.hour) {
        d.hour = hour;
        audio.hourChime();
        toast(d, `🕐 ${hourLabel(hour)}`, 'info', 2.5);
      }

      // Linterna
      if (d.flashlight) {
        d.battery -= c.batteryDrain * dt;
        if (d.battery <= 0) {
          d.battery = 0;
          d.flashlight = false;
          audio.flashlightDie();
          toast(d, '🔋 ¡La linterna se quedó sin batería! Busca pilas.', 'bad', 4);
        } else if (d.battery < 15 && !d.tips.lowBattery) {
          d.tips.lowBattery = true;
          toast(d, '🔋 Batería baja. Apaga la linterna (F) cuando no la necesites.', 'bad', 4);
        }
      }

      // Puertas
      for (const side of ['L', 'R'] as Side[]) {
        if (d.doors[side] > 0) {
          d.doors[side] -= dt;
          if (d.doors[side] <= 0) {
            d.doors[side] = 0;
            audio.doorOpen(panOf(side));
          }
        }
      }

      // Temporizadores varios
      for (const k of Object.keys(d.unlocked) as ActionId[]) {
        const v = (d.unlocked[k] ?? 0) - dt;
        if (v <= 0) delete d.unlocked[k];
        else d.unlocked[k] = v;
      }
      for (const k of Object.keys(d.cooldowns) as ActionId[]) {
        const v = (d.cooldowns[k] ?? 0) - dt;
        if (v <= 0) delete d.cooldowns[k];
        else d.cooldowns[k] = v;
      }
      for (const k of Object.keys(d.fx) as (keyof Effects)[]) d.fx[k] = Math.max(0, d.fx[k] - dt);
      if (d.powerFailing) d.fx.flicker = Math.max(d.fx.flicker, 0.3);
      if (d.feedback) d.feedback.age += dt;
      d.toasts = d.toasts.filter((t) => (t.ttl -= dt) > 0);
      if (d.inspecting) {
        d.inspecting.timeLeft -= dt;
        if (d.inspecting.timeLeft <= 0) d.inspecting = null;
      }

      // Freddy
      const m = d.monster;
      m.cooldown = Math.max(0, m.cooldown - dt);
      m.calm = Math.max(0, m.calm - dt);
      if (m.pos === 3) {
        if (m.leaving > 0) {
          m.leaving -= dt;
          if (m.leaving <= 0) repel(d, false);
        }
      } else {
        if (c.forcedDoorAt && !d.doorEventDone && !m.forced && d.t >= c.forcedDoorAt) {
          // Tutorial: garantizamos una visita de Freddy en la noche 1.
          m.forced = true;
          if (m.pos < 2) {
            m.pos = 2;
            m.side = 'L';
            audio.footsteps(panOf('L'), 4, 0.5);
            toast(d, '👣 Pasos en el pasillo izquierdo...', 'bad');
          }
          m.moveTimer = 6;
        }
        m.moveTimer -= dt;
        if (m.moveTimer <= 0) {
          m.moveTimer = c.monster.interval * rand(0.75, 1.25);
          if (m.forced && !d.doorEventDone) advanceMonster(d);
          else if (m.cooldown <= 0 && Math.random() < aggression(d)) advanceMonster(d);
        }
      }
      if (d.screen !== 'playing') return;

      // Conversación actual. El reloj se detiene mientras la radio habla.
      const o = d.order;
      if (o) {
        if (o.stage === 'speak' || o.stage === 'press' || o.stage === 'find') {
          if (!isSpeaking()) o.timeLeft -= dt;
          if (o.timeLeft <= 0) {
            o.timeLeft = 0;
            if (o.kind === 'door') doorTimeout(d);
            else failOrder(d);
          }
        } else {
          o.resultTimer -= dt;
          if (o.resultTimer <= 0 && !isSpeaking()) finishOrder(d);
        }
      } else {
        d.nextOrderIn -= dt;
        if (d.nextOrderIn <= 0) newOrder(d);
      }
      if (d.screen !== 'playing') return;

      // Ambiente
      d.ambientIn -= dt;
      if (d.ambientIn <= 0) {
        d.ambientIn = rand(14, 30);
        const r = Math.random();
        if (r < 0.25) audio.clank();
        else if (r < 0.5 && m.pos >= 1) audio.footsteps(pick([-0.9, 0.9]), 2, 0.2);
        else if (r < 0.7 && d.night >= 2) audio.whisper(pick([-0.7, 0.7]));
        else if (r < 0.88) {
          d.fx.flicker = Math.max(d.fx.flicker, 0.8);
          audio.flickerBuzz();
        } else if (m.pos === 1 && !d.settings.reducedScares) {
          d.fx.windowFace = 0.4;
          audio.stinger();
        }
      }

      audio.setHeartbeat(m.pos === 3 ? 0.9 : m.pos === 2 ? 0.35 : 0);
    });
  },

  handleSpeech(alts: string[], isFinal: boolean): boolean {
    let consumed = false;
    mutate((d) => {
      if (d.screen !== 'playing') return;
      const text = alts[0] ?? '';
      d.heard = isFinal ? '' : text;
      const targets = buildTargets(d);
      const th = THRESHOLDS[d.settings.strictness];
      type Best = { t: Target; display: Bilingual; score: number; alt: string };
      let best: Best | null = null;
      let focus: Best | null = null;
      for (const alt of alts) {
        const said = normalize(alt);
        if (!said.length) continue;
        for (const t of targets) {
          for (const opt of t.options) {
            const sc = scoreTokens(opt.tokens, said);
            const cand = { t, display: opt.display, score: sc, alt };
            if (!best || sc > best.score + 1e-6 || (Math.abs(sc - best.score) < 1e-6 && t.priority > best.t.priority)) best = cand;
            if (t.priority >= 3 && (!focus || sc > focus.score)) focus = cand;
          }
        }
      }
      const need = isFinal ? th : Math.max(th, 0.88);
      if (best && best.score >= need) {
        consumed = true;
        d.heard = '';
        applyTarget(d, best.t, best.display, best.alt, best.score);
      } else if (isFinal && text.trim()) {
        const f = focus ?? best;
        const o = d.order;
        const replying = !!o && o.stage === 'speak' && focus?.t.type === 'reply';
        const masked = replying && !!o && (o.help === 'gaps' || o.help === 'hint' || o.help === 'none');
        // Solo cuenta como error si había algo que decir (conversación u objeto activo).
        if (focus) d.stats.misses++;
        d.feedback = {
          heard: text,
          target: f?.display,
          score: f?.score ?? 0,
          ok: false,
          words: f ? wordHits(f.display.en, text) : [],
          age: 0,
          masked,
          note: replying ? '📻 La radio no te entendió. ¡Inténtalo otra vez!' : f && f.score >= th - 0.15 ? '¡Casi! Inténtalo otra vez.' : 'No coincide. Escucha 🔊 y repite.',
        };
        if (focus) record(d, focus.display, false);
        audio.miss();
        if (replying && o) {
          // La radio reacciona como en una conversación real.
          youLine(o, text, false);
          const voice = d.settings.radioVoice && d.t - d.lastMissVoice > 7;
          if (voice) d.lastMissVoice = d.t;
          radioLine(d, o, pick(MISHEARD), { voice: voice ? 'radio' : false });
          tip(d, 'helpPhrases', '💡 Si no entiendes, di «Can you repeat that?», «Slower, please» o «What does it mean?».');
        }
      }
    });
    return consumed;
  },

  submitTyped(text: string): boolean {
    return game.handleSpeech([text], true);
  },

  pressControl(control: ControlId) {
    mutate((d) => {
      if (d.screen !== 'playing') return;
      const o = d.order;
      if (control === 'radio') {
        if (o && (o.stage === 'speak' || o.stage === 'press' || o.stage === 'find')) handleHelp(d, o, 'repeat');
        else audio.staticBurst(0.4);
        return;
      }
      const acts = actionsForControl(control);
      const a = acts.find((x) => (d.unlocked[x] ?? 0) > 0);
      if (!a) {
        audio.locked();
        if (o && o.stage === 'speak' && o.kind !== 'talk') {
          toast(d, '🎙 Primero respóndele a la radio.', 'info');
          return;
        }
        const suggestion = control === 'fan' ? (d.fanOn ? 'fanOff' : 'fanOn') : acts[0];
        const cd = d.cooldowns[suggestion] ?? 0;
        if (cd > 0) toast(d, `⏳ Espera ${Math.ceil(cd)} s para usarlo otra vez.`, 'info');
        else {
          const p = phraseFor(suggestion, getCfg(d.night).level);
          const showPhrase = getCfg(d.night).hints || d.bookCharges > 0 || d.settings.translations === 'always';
          toast(d, showPhrase ? `🔒 Bloqueado. Di: «${p.en}»` : '🔒 Bloqueado. Di la frase correcta (TAB = comandos).', 'info');
        }
        return;
      }
      delete d.unlocked[a];
      executeAction(d, a);
      d.cooldowns[a] = ACTIONS[a].cooldown;
      const cur = d.order;
      if (cur && cur.stage === 'press' && cur.pressAction === a) completeOrder(d);
    });
  },

  clickItem(uid: number) {
    mutate((d) => {
      if (d.screen !== 'playing') return;
      const it = d.items.find((i) => i.uid === uid);
      if (!it || it.found) return;
      if (!d.flashlight || d.battery <= 0) {
        toast(d, '🔦 Está muy oscuro. Enciende la linterna (F o clic derecho).', 'info');
        return;
      }
      d.inspecting = { uid, timeLeft: PICKUP_SECONDS };
      audio.click();
      tip(d, 'pickup', '🎙 Di el nombre del objeto en inglés para recogerlo.');
    });
  },

  cancelInspect() {
    mutate((d) => {
      d.inspecting = null;
    });
  },

  useItem(kind: ItemKind) {
    mutate((d) => {
      if (d.screen !== 'playing' || kind !== 'bell') return;
      const idx = d.inventory.indexOf('bell');
      if (idx < 0) return;
      d.inventory.splice(idx, 1);
      audio.bell();
      const m = d.monster;
      if (m.pos === 3) {
        if (m.leaving <= 0) m.leaving = 0.8;
        if (d.order?.kind === 'door') completeOrder(d);
      } else {
        m.pos = 0;
        m.cooldown = 15;
      }
      toast(d, '🔔 ¡Ding! Freddy vuelve al escenario...', 'good');
    });
  },

  toggleFlashlight() {
    mutate((d) => {
      if (d.screen !== 'playing') return;
      if (d.battery <= 0) {
        audio.locked();
        toast(d, '🔋 Sin batería. Busca pilas (battery).', 'bad');
        return;
      }
      d.flashlight = !d.flashlight;
      audio.flashlightToggle(d.flashlight);
    });
  },

  /** Tecla R / clic en la radio: igual que decir "Can you repeat that?". */
  replay() {
    mutate((d) => {
      const o = d.order;
      if (o && (o.stage === 'speak' || o.stage === 'press' || o.stage === 'find')) handleHelp(d, o, 'repeat');
    });
  },

  toggleCommands(open?: boolean) {
    mutate((d) => {
      d.commandsOpen = open ?? !d.commandsOpen;
    });
  },

  pause() {
    mutate((d) => {
      if (d.screen === 'playing') d.screen = 'paused';
    });
    cancelSpeech();
    audio.suspend();
  },

  resume() {
    audio.resume();
    mutate((d) => {
      if (d.screen === 'paused') d.screen = 'playing';
    });
  },

  quitToMenu() {
    cancelSpeech();
    audio.resume();
    audio.stopNightLoops();
    mutate((d) => {
      if (d.screen === 'paused' || d.screen === 'playing') saveWords(d);
      d.screen = 'menu';
    });
  },
};
