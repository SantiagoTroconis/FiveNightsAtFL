export type Side = 'L' | 'R';

export interface Bilingual {
  en: string;
  es: string;
}

export type Level = 1 | 2 | 3;

export interface Phrase extends Bilingual {
  level: Level;
}

export type ActionId =
  | 'closeLeft'
  | 'closeRight'
  | 'lightOn'
  | 'fanOff'
  | 'fanOn'
  | 'alarmOff'
  | 'pullLever'
  | 'checkCamera'
  | 'playMusic';

export type ControlId =
  | 'doorL'
  | 'doorR'
  | 'light'
  | 'fan'
  | 'alarm'
  | 'lever'
  | 'camera'
  | 'musicBox'
  | 'radio';

export type ItemKind = 'battery' | 'bell' | 'mask' | 'book' | 'clock';

export type SpotId =
  | 'underDesk'
  | 'onDesk'
  | 'shelf'
  | 'plant'
  | 'box'
  | 'leftDoor'
  | 'rightDoor'
  | 'floor'
  | 'trash';

/**
 * Cuánta ayuda ve el estudiante para responder (baja cada noche):
 * full = respuesta completa + traducción · choices = elegir entre opciones ·
 * gaps = respuesta con huecos · hint = pista en español · none = nada.
 */
export type HelpLevel = 'full' | 'choices' | 'gaps' | 'hint' | 'none';

/** Frases de ayuda que el estudiante puede decirle a la radio. */
export type HelpKind = 'repeat' | 'slower' | 'meaning';

/**
 * action = la radio te pide algo → respondes → presionas el control.
 * talk = pregunta personal → respondes.
 * check = pregunta de verdad ("¿hay alguien en la puerta?") → miras y respondes la verdad.
 * find = te pide buscar un objeto → respondes → lo encuentras y dices su nombre.
 * door = Freddy llegó → dices qué puerta → la cierras.
 */
export type OrderKind = 'action' | 'talk' | 'check' | 'find' | 'door';

export type CheckKind = 'door' | 'fan' | 'flashlight';

export type OrderStage = 'speak' | 'press' | 'find' | 'done' | 'failed';

/** Una respuesta posible. Las preguntas de verdad tienen dos (tag yes/no). */
export interface ReplyOption {
  model: Bilingual;
  accept: string[];
  tag?: 'yes' | 'no' | Side;
  /** Condición en español para mostrarla con ayuda completa ("Si no hay nadie"). */
  when?: string;
}

export interface LogLine {
  who: 'radio' | 'you';
  en: string;
  es?: string;
  ok?: boolean;
  /** Es la pregunta principal (se oculta en la noche 5). */
  question?: boolean;
}

export interface Order {
  id: number;
  kind: OrderKind;
  /** Lo que la radio pregunta/pide. */
  line: Bilingual;
  replies: ReplyOption[];
  help: HelpLevel;
  /** Opciones para elegir (ayuda "choices"), ya mezcladas. */
  choices?: string[];
  hint: string;
  /** Lo que la radio contesta cuando respondes bien. */
  ack: Bilingual;
  /** Lo que dice al completar la orden. */
  doneLine?: Bilingual;
  action?: ActionId;
  /** Acción que completa la orden al presionarla (etapa "press"). */
  pressAction?: ActionId;
  doorSide?: Side;
  checkKind?: CheckKind;
  checkSide?: Side;
  itemUid?: number;
  stage: OrderStage;
  timeLeft: number;
  timeTotal: number;
  helpsUsed: number;
  showTranslation: boolean;
  /** La pregunta se oculta: solo se escucha (noche 5). */
  masked: boolean;
  revealed: boolean;
  log: LogLine[];
  /** Respuesta correcta que se muestra si fallas. */
  failAnswer?: Bilingual;
  resultTimer: number;
}

export interface WorldItem {
  uid: number;
  kind: ItemKind;
  spot: SpotId;
  found: boolean;
}

export interface Monster {
  /** 0 escenario · 1 comedor · 2 pasillo · 3 en la puerta */
  pos: 0 | 1 | 2 | 3;
  side: Side;
  moveTimer: number;
  cooldown: number;
  calm: number;
  leaving: number;
  forced: boolean;
}

export interface Effects {
  lightFlash: number;
  camera: number;
  flicker: number;
  shake: number;
  staticFx: number;
  windowFace: number;
  lever: number;
}

export interface Feedback {
  heard: string;
  target?: Bilingual;
  score: number;
  ok: boolean;
  words: { w: string; hit: boolean }[];
  age: number;
  note?: string;
}

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'good' | 'bad' | 'tip';
  ttl: number;
}

export interface PracticeRecord {
  en: string;
  es: string;
  ok: number;
  tries: number;
}

export interface NightStats {
  score: number;
  streak: number;
  bestStreak: number;
  ordersOk: number;
  ordersFail: number;
  matches: number;
  misses: number;
  items: number;
  practiced: Record<string, PracticeRecord>;
}

export type Screen =
  | 'splash'
  | 'menu'
  | 'howto'
  | 'settings'
  | 'words'
  | 'micCheck'
  | 'intro'
  | 'playing'
  | 'paused'
  | 'jumpscare'
  | 'gameover'
  | 'complete';

export type Strictness = 'easy' | 'normal' | 'hard';

export interface Settings {
  volume: number;
  strictness: Strictness;
  inputMode: 'voice' | 'text';
  radioVoice: boolean;
  reducedScares: boolean;
  accent: 'en-US' | 'en-GB';
  translations: 'auto' | 'always' | 'never';
}

export interface Progress {
  unlocked: number;
  stars: Record<number, number>;
  best: Record<number, number>;
  words: Record<string, PracticeRecord>;
}

export interface DeathInfo {
  hourLabel: string;
  night: number;
  phrase?: Bilingual;
  reason: Bilingual;
}

export interface NightConfig {
  night: number;
  title: Bilingual;
  level: Level;
  hourSeconds: number;
  translations: boolean;
  hints: boolean;
  revealSide: boolean;
  monster: { base: number; perAnger: number; interval: number };
  orderGap: [number, number];
  orderTime: number;
  doorTime: number;
  findTime: number;
  batteryDrain: number;
  help: HelpLevel;
  /** La pregunta de la radio no se muestra escrita: solo se escucha. */
  maskRadio: boolean;
  kinds: { action: number; talk: number; check: number; find: number };
  extraItems: number;
  script?: ScriptedOrder[];
  forcedDoorAt?: number;
}

export type ScriptedOrder =
  | { kind: 'talk'; id: string }
  | { kind: 'action'; action: ActionId }
  | { kind: 'find'; item: ItemKind }
  | { kind: 'check'; check: CheckKind; side?: Side };
