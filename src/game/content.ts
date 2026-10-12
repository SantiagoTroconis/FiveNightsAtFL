import type {
  ActionId,
  Bilingual,
  ControlId,
  ItemKind,
  Level,
  Phrase,
  Side,
  SpotId,
} from './types';

/* ------------------------------------------------------------------ */
/*  Acciones: cada control de la oficina se desbloquea diciendo una    */
/*  frase en inglés y luego se presiona.                               */
/* ------------------------------------------------------------------ */

export interface ActionDef {
  id: ActionId;
  control: ControlId;
  label: Bilingual;
  icon: string;
  phrases: Phrase[];
  /** Situaciones que la radio usa para pedir esta acción. */
  situations: Bilingual[];
  /** Segundos antes de poder usarla de nuevo como comando libre. */
  cooldown: number;
  /** Puede aparecer como orden de la radio. */
  orderable: boolean;
}

export const ACTIONS: Record<ActionId, ActionDef> = {
  closeLeft: {
    id: 'closeLeft',
    control: 'doorL',
    label: { en: 'left door', es: 'puerta izquierda' },
    icon: '🚪',
    phrases: [
      { en: 'Close the left door', es: 'Cierra la puerta izquierda', level: 1 },
      { en: 'Shut the left door', es: 'Cierra la puerta izquierda', level: 2 },
      { en: 'Lock the left door', es: 'Asegura la puerta izquierda', level: 3 },
    ],
    situations: [],
    cooldown: 0,
    orderable: false,
  },
  closeRight: {
    id: 'closeRight',
    control: 'doorR',
    label: { en: 'right door', es: 'puerta derecha' },
    icon: '🚪',
    phrases: [
      { en: 'Close the right door', es: 'Cierra la puerta derecha', level: 1 },
      { en: 'Shut the right door', es: 'Cierra la puerta derecha', level: 2 },
      { en: 'Lock the right door', es: 'Asegura la puerta derecha', level: 3 },
    ],
    situations: [],
    cooldown: 0,
    orderable: false,
  },
  lightOn: {
    id: 'lightOn',
    control: 'light',
    label: { en: 'light switch', es: 'interruptor de luz' },
    icon: '💡',
    phrases: [
      { en: 'Turn on the light', es: 'Enciende la luz', level: 1 },
      { en: 'Switch on the light', es: 'Prende la luz', level: 2 },
      { en: 'Turn the lights on', es: 'Enciende las luces', level: 3 },
    ],
    situations: [
      { en: "It's too dark in there.", es: 'Está demasiado oscuro ahí.' },
      { en: 'Something is moving in the hallway.', es: 'Algo se mueve en el pasillo.' },
      { en: 'Freddy hates the light.', es: 'Freddy odia la luz.' },
    ],
    cooldown: 15,
    orderable: true,
  },
  fanOff: {
    id: 'fanOff',
    control: 'fan',
    label: { en: 'fan', es: 'ventilador' },
    icon: '🌀',
    phrases: [
      { en: 'Turn off the fan', es: 'Apaga el ventilador', level: 1 },
      { en: 'Switch off the fan', es: 'Apaga el ventilador', level: 2 },
      { en: 'Stop the fan', es: 'Detén el ventilador', level: 3 },
    ],
    situations: [
      { en: 'The fan is making a strange noise.', es: 'El ventilador hace un ruido extraño.' },
      { en: 'The fan is too loud. He can hear it!', es: 'El ventilador hace mucho ruido. ¡Él puede oírlo!' },
    ],
    cooldown: 2,
    orderable: true,
  },
  fanOn: {
    id: 'fanOn',
    control: 'fan',
    label: { en: 'fan', es: 'ventilador' },
    icon: '🌀',
    phrases: [
      { en: 'Turn on the fan', es: 'Enciende el ventilador', level: 1 },
      { en: 'Switch on the fan', es: 'Prende el ventilador', level: 2 },
      { en: 'Start the fan', es: 'Arranca el ventilador', level: 3 },
    ],
    situations: [
      { en: "It's very hot in the office.", es: 'Hace mucho calor en la oficina.' },
      { en: "I can't breathe in there.", es: 'No se puede respirar ahí.' },
    ],
    cooldown: 2,
    orderable: true,
  },
  alarmOff: {
    id: 'alarmOff',
    control: 'alarm',
    label: { en: 'red button', es: 'botón rojo' },
    icon: '🚨',
    phrases: [
      { en: 'Stop the alarm', es: 'Detén la alarma', level: 1 },
      { en: 'Press the red button', es: 'Presiona el botón rojo', level: 2 },
      { en: 'Turn off the alarm', es: 'Apaga la alarma', level: 3 },
    ],
    situations: [
      { en: 'The alarm is ringing! He will hear it!', es: '¡La alarma está sonando! ¡Él la va a oír!' },
      { en: 'Someone opened the back door. The alarm is on!', es: 'Alguien abrió la puerta trasera. ¡La alarma está encendida!' },
    ],
    cooldown: 0,
    orderable: true,
  },
  pullLever: {
    id: 'pullLever',
    control: 'lever',
    label: { en: 'lever', es: 'palanca' },
    icon: '⚡',
    phrases: [
      { en: 'Pull the lever', es: 'Jala la palanca', level: 1 },
      { en: 'Pull down the lever', es: 'Baja la palanca', level: 2 },
      { en: 'Restart the generator', es: 'Reinicia el generador', level: 3 },
    ],
    situations: [
      { en: 'The power is failing!', es: '¡La energía está fallando!' },
      { en: 'The lights are flickering again.', es: 'Las luces parpadean otra vez.' },
    ],
    cooldown: 40,
    orderable: true,
  },
  checkCamera: {
    id: 'checkCamera',
    control: 'camera',
    label: { en: 'camera', es: 'cámara' },
    icon: '📺',
    phrases: [
      { en: 'Check the camera', es: 'Revisa la cámara', level: 1 },
      { en: 'Look at the camera', es: 'Mira la cámara', level: 2 },
      { en: 'Show me the camera', es: 'Muéstrame la cámara', level: 3 },
    ],
    situations: [
      { en: 'I saw something on the stage.', es: 'Vi algo en el escenario.' },
      { en: 'Where is Freddy now?', es: '¿Dónde está Freddy ahora?' },
    ],
    cooldown: 10,
    orderable: true,
  },
  playMusic: {
    id: 'playMusic',
    control: 'musicBox',
    label: { en: 'music box', es: 'caja de música' },
    icon: '🎵',
    phrases: [
      { en: 'Play the music box', es: 'Toca la caja de música', level: 1 },
      { en: 'Wind up the music box', es: 'Dale cuerda a la caja de música', level: 2 },
      { en: 'Play some music', es: 'Pon algo de música', level: 3 },
    ],
    situations: [
      { en: 'Freddy likes music. It makes him calm.', es: 'A Freddy le gusta la música. Lo calma.' },
      { en: 'The music box stopped...', es: 'La caja de música se detuvo...' },
    ],
    cooldown: 45,
    orderable: true,
  },
};

export const ACTION_IDS = Object.keys(ACTIONS) as ActionId[];

export function actionsForControl(control: ControlId): ActionId[] {
  return ACTION_IDS.filter((id) => ACTIONS[id].control === control);
}

export function doorAction(side: Side): ActionId {
  return side === 'L' ? 'closeLeft' : 'closeRight';
}

/** Frase "modelo" de una acción para el nivel actual (la más difícil disponible). */
export function phraseFor(action: ActionId, level: Level, random = false): Phrase {
  const list = ACTIONS[action].phrases.filter((p) => p.level <= level);
  if (random && list.length > 1) {
    // Preferimos las frases del nivel actual, pero repasamos las anteriores.
    const current = list.filter((p) => p.level === level);
    const pool = Math.random() < 0.65 && current.length ? current : list;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return list[0];
}

/* ------------------------------------------------------------------ */
/*  Controles: dónde están en la oficina (coordenadas del SVG 2400x1000) */
/* ------------------------------------------------------------------ */

export const CONTROLS: Record<ControlId, { x: number; y: number; r: number; label: Bilingual; icon: string }> = {
  doorL: { x: 555, y: 490, r: 72, label: { en: 'left door button', es: 'botón de la puerta izquierda' }, icon: '🚪' },
  doorR: { x: 1845, y: 490, r: 72, label: { en: 'right door button', es: 'botón de la puerta derecha' }, icon: '🚪' },
  light: { x: 650, y: 480, r: 50, label: { en: 'light switch', es: 'interruptor de luz' }, icon: '💡' },
  fan: { x: 1535, y: 590, r: 88, label: { en: 'fan', es: 'ventilador' }, icon: '🌀' },
  alarm: { x: 1700, y: 345, r: 62, label: { en: 'red button', es: 'botón rojo' }, icon: '🚨' },
  lever: { x: 1725, y: 590, r: 92, label: { en: 'lever', es: 'palanca' }, icon: '⚡' },
  camera: { x: 1200, y: 540, r: 140, label: { en: 'camera monitor', es: 'monitor de cámaras' }, icon: '📺' },
  musicBox: { x: 1415, y: 640, r: 50, label: { en: 'music box', es: 'caja de música' }, icon: '🎵' },
  radio: { x: 900, y: 628, r: 84, label: { en: 'radio TALK button', es: 'botón TALK de la radio' }, icon: '📻' },
};

export function hourLabel(hour: number): string {
  return hour === 0 ? '12 AM' : `${hour} AM`;
}

/* ------------------------------------------------------------------ */
/*  Objetos escondidos que ayudan a sobrevivir                         */
/* ------------------------------------------------------------------ */

export interface ItemDef {
  kind: ItemKind;
  en: string;
  es: string;
  esFull: string;
  /** Pronombre para "¡Encuéntra-la/-lo!" */
  pron: 'la' | 'lo';
  accepted: string[];
  effect: Bilingual;
  weight: number;
}

export const ITEMS: Record<ItemKind, ItemDef> = {
  battery: {
    kind: 'battery',
    en: 'battery',
    es: 'pila',
    esFull: 'una pila',
    pron: 'la',
    accepted: ['battery', 'batteries'],
    effect: { en: '+40% flashlight', es: '+40% de batería para la linterna' },
    weight: 4,
  },
  bell: {
    kind: 'bell',
    en: 'bell',
    es: 'campana',
    esFull: 'una campana',
    pron: 'la',
    accepted: ['bell', 'bells'],
    effect: { en: 'Sends Freddy back to the stage', es: 'Úsala y Freddy vuelve al escenario' },
    weight: 1.5,
  },
  mask: {
    kind: 'mask',
    en: 'mask',
    es: 'máscara',
    esFull: 'una máscara',
    pron: 'la',
    accepted: ['mask', 'masks'],
    effect: { en: 'Saves you once', es: 'Te salva una vez de Freddy' },
    weight: 1.5,
  },
  book: {
    kind: 'book',
    en: 'book',
    es: 'libro',
    esFull: 'un libro',
    pron: 'lo',
    accepted: ['book', 'books', 'phrase book'],
    effect: { en: 'Translations for 3 orders', es: 'Traducciones en las próximas 3 órdenes' },
    weight: 1.5,
  },
  clock: {
    kind: 'clock',
    en: 'clock',
    es: 'reloj',
    esFull: 'un reloj',
    pron: 'lo',
    accepted: ['clock', 'clocks'],
    effect: { en: 'Time jumps 20 minutes', es: 'El tiempo avanza 20 minutos' },
    weight: 1.2,
  },
};

export const ITEM_KINDS = Object.keys(ITEMS) as ItemKind[];

export interface SpotDef extends Bilingual {
  x: number;
  y: number;
}

/** Lugares donde se esconden los objetos (practican preposiciones). */
export const SPOTS: Record<SpotId, SpotDef> = {
  underDesk: { x: 1250, y: 915, en: 'under the desk', es: 'debajo del escritorio' },
  onDesk: { x: 1012, y: 650, en: 'on the desk', es: 'sobre el escritorio' },
  shelf: { x: 1452, y: 400, en: 'on the shelf', es: 'en el estante' },
  plant: { x: 706, y: 792, en: 'behind the plant', es: 'detrás de la planta' },
  box: { x: 1726, y: 800, en: 'in the box', es: 'dentro de la caja' },
  leftDoor: { x: 545, y: 915, en: 'next to the left door', es: 'al lado de la puerta izquierda' },
  rightDoor: { x: 1862, y: 915, en: 'next to the right door', es: 'al lado de la puerta derecha' },
  floor: { x: 2348, y: 948, en: 'on the floor', es: 'en el piso' },
  trash: { x: 880, y: 796, en: 'in the trash can', es: 'en el bote de basura' },
};

export const SPOT_IDS = Object.keys(SPOTS) as SpotId[];

/* ------------------------------------------------------------------ */
/*  Llamadas de inicio de cada noche (como el "phone guy")             */
/* ------------------------------------------------------------------ */

export const NIGHT_CALLS: Record<number, Bilingual[]> = {
  1: [
    { en: 'Hello, hello! Welcome to Freddy’s Family Diner.', es: '¡Hola, hola! Bienvenido a Freddy’s Family Diner.' },
    { en: 'I’ll talk to you on the radio all night. When I ask you something, answer me in English.', es: 'Te hablaré por la radio toda la noche. Cuando te pregunte algo, respóndeme en inglés.' },
    { en: 'If I ask you to do something, tell me first... then press the button.', es: 'Si te pido hacer algo, primero dímelo... y luego presiona el botón.' },
    { en: 'Oh, and one more thing... don’t let Freddy into the office.', es: 'Ah, y una cosa más... no dejes que Freddy entre a la oficina.' },
  ],
  2: [
    { en: 'Good job last night! You’re still alive.', es: '¡Buen trabajo anoche! Sigues vivo.' },
    { en: 'Tonight I won’t tell you exactly what to say. Choose the right answer.', es: 'Esta noche no te diré exactamente qué decir. Elige la respuesta correcta.' },
    { en: 'And when I ask about the doors, look first. Always tell me the truth.', es: 'Y cuando te pregunte por las puertas, mira primero. Siempre dime la verdad.' },
  ],
  3: [
    { en: 'Night three. Your English is getting better.', es: 'Noche tres. Tu inglés está mejorando.' },
    { en: 'I won’t translate for you anymore. If you don’t understand, ask me: “What does it mean?”', es: 'Ya no te voy a traducir. Si no entiendes, pregúntame: “What does it mean?”' },
    { en: 'If I talk too fast, just say: “Slower, please.”', es: 'Si hablo muy rápido, solo di: “Slower, please.”' },
  ],
  4: [
    { en: 'Night four... Freddy is faster now.', es: 'Noche cuatro... Freddy es más rápido ahora.' },
    { en: 'From now on, use your own words. I’ll only give you small hints.', es: 'De ahora en adelante, usa tus propias palabras. Solo te daré pequeñas pistas.' },
  ],
  5: [
    { en: 'If you hear this message... I’m not in the building anymore.', es: 'Si escuchas este mensaje... ya no estoy en el edificio.' },
    { en: 'The radio screen is broken. You will only hear my voice.', es: 'La pantalla de la radio está rota. Solo escucharás mi voz.' },
    { en: 'This is the last night. Good luck.', es: 'Esta es la última noche. Buena suerte.' },
  ],
};

export const SIDE_WORD: Record<Side, Bilingual> = {
  L: { en: 'left', es: 'izquierda' },
  R: { en: 'right', es: 'derecha' },
};
