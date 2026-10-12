import { ACTIONS, SIDE_WORD, doorAction } from './content';
import type { ActionId, Bilingual, CheckKind, HelpKind, Level, ReplyOption, Side } from './types';

/**
 * Conversaciones con la radio. Nivel intermedio (A2-B1).
 * La radio dice `line`, el estudiante responde algo de `accept`
 * (en minúsculas, sin puntuación; las contracciones se expanden solas:
 * "I'll" = "i will"), y la radio contesta con `ack`.
 */

export interface Dialogue {
  level: Level;
  line: Bilingual;
  /** Respuesta modelo que se muestra en pantalla. */
  model: Bilingual;
  /** Respuestas incorrectas para la ayuda de opciones (noche 2). */
  distractors: string[];
  ack: Bilingual;
  done?: Bilingual;
}

/** Respuestas afirmativas que sirven para cualquier pedido. */
export const GENERIC_OK = [
  'i will do it',
  'i can do it',
  'i will do it now',
  'i will do it right now',
  'no problem',
  'right away',
  'i am on it',
];

export const DISTRACTORS = [
  'I like pizza.',
  "It's very cold.",
  "I'm in the kitchen.",
  'My name is Freddy.',
  'The music is beautiful.',
  "I'm hungry.",
  'Under the desk.',
];

/* ------------------------------------------------------------------ */
/*  Pedidos de acción: respondes y luego presionas el control          */
/* ------------------------------------------------------------------ */

export type OrderableAction = Exclude<ActionId, 'closeLeft' | 'closeRight'>;

export interface ActionDialogues {
  accept: string[];
  /** Pista en español (noche 4). */
  hint: string;
  dialogues: Dialogue[];
}

export const ACTION_DIALOGUES: Record<OrderableAction, ActionDialogues> = {
  fanOff: {
    hint: 'Acepta y di que lo vas a apagar.',
    accept: [
      'i will turn it off',
      'i will switch it off',
      'i am turning it off',
      'turning it off',
      'i can turn it off',
      'i will turn off the fan',
      'i will stop it',
      'i will stop the fan',
    ],
    dialogues: [
      {
        level: 1,
        line: { en: 'Hey, the fan is making a weird noise. Can you turn it off?', es: 'Oye, el ventilador hace un ruido raro. ¿Puedes apagarlo?' },
        model: { en: "Sure, I'll turn it off.", es: 'Claro, lo apago.' },
        distractors: ['I like the music.', "It's very cold."],
        ack: { en: 'Thanks. Do it quickly!', es: 'Gracias. ¡Hazlo rápido!' },
        done: { en: 'Much better. Good job.', es: 'Mucho mejor. Buen trabajo.' },
      },
      {
        level: 2,
        line: { en: 'That fan is too loud. Freddy might hear it. Could you switch it off?', es: 'Ese ventilador hace mucho ruido. Freddy podría oírlo. ¿Podrías apagarlo?' },
        model: { en: "No problem, I'll switch it off.", es: 'No hay problema, lo apago.' },
        distractors: ["I'm hungry.", 'The door is open.'],
        ack: { en: 'Thank you. Hurry!', es: 'Gracias. ¡Apúrate!' },
        done: { en: 'Silence... good.', es: 'Silencio... bien.' },
      },
      {
        level: 3,
        line: { en: 'Listen... the fan is covering the sound of his footsteps. Turn it off, please.', es: 'Escucha... el ventilador tapa el sonido de sus pasos. Apágalo, por favor.' },
        model: { en: "OK, I'm turning it off right now.", es: 'Bien, lo estoy apagando ahora mismo.' },
        distractors: ['I can hear the music.', "It's under the desk."],
        ack: { en: 'Good. Now listen carefully.', es: 'Bien. Ahora escucha con atención.' },
        done: { en: 'Now we can hear him coming.', es: 'Ahora podemos oírlo venir.' },
      },
    ],
  },
  fanOn: {
    hint: 'Acepta y di que lo vas a encender.',
    accept: [
      'i will turn it on',
      'i will switch it on',
      'i am turning it on',
      'turning it on',
      'i can turn it on',
      'i will turn on the fan',
      'i will start it',
      'i will start the fan',
    ],
    dialogues: [
      {
        level: 1,
        line: { en: "It's really hot in there, right? Can you turn on the fan?", es: 'Hace mucho calor ahí, ¿verdad? ¿Puedes encender el ventilador?' },
        model: { en: "Yes, I'll turn it on.", es: 'Sí, lo enciendo.' },
        distractors: ["It's a battery.", 'Close the door.'],
        ack: { en: 'Great. Press the fan.', es: 'Genial. Presiona el ventilador.' },
        done: { en: 'Ah, fresh air.', es: 'Ah, aire fresco.' },
      },
      {
        level: 2,
        line: { en: "I can't breathe in that office. Could you switch on the fan?", es: 'No se puede respirar en esa oficina. ¿Podrías prender el ventilador?' },
        model: { en: "Sure, I'll switch it on.", es: 'Claro, lo prendo.' },
        distractors: ['I lost my flashlight.', 'Yes, I can hear you.'],
        ack: { en: 'Thanks. Go ahead.', es: 'Gracias. Adelante.' },
        done: { en: 'Much better.', es: 'Mucho mejor.' },
      },
      {
        level: 3,
        line: { en: 'The air is heavy tonight. Turn the fan back on, would you?', es: 'El aire está pesado esta noche. Vuelve a encender el ventilador, ¿sí?' },
        model: { en: "OK, I'm turning it on.", es: 'Bien, lo estoy encendiendo.' },
        distractors: ["He's at the door.", "It's two AM."],
        ack: { en: 'Thank you.', es: 'Gracias.' },
        done: { en: 'Better. Stay cool.', es: 'Mejor. Mantén la calma.' },
      },
    ],
  },
  lightOn: {
    hint: 'Di que vas a encender la luz.',
    accept: [
      'i will turn on the light',
      'i will turn on the lights',
      'i will turn it on',
      'i will switch it on',
      'i will turn them on',
      'i am turning them on',
      'i am turning it on',
      'turning on the light',
    ],
    dialogues: [
      {
        level: 1,
        line: { en: "It's too dark. I can't see anything on camera. Can you turn on the light?", es: 'Está muy oscuro. No veo nada en la cámara. ¿Puedes encender la luz?' },
        model: { en: "Yes, I'll turn on the light.", es: 'Sí, enciendo la luz.' },
        distractors: ['I like pizza.', "It's in the box."],
        ack: { en: 'Good. The switch is on the wall.', es: 'Bien. El interruptor está en la pared.' },
        done: { en: 'Better. Freddy hates the light.', es: 'Mejor. Freddy odia la luz.' },
      },
      {
        level: 2,
        line: { en: 'Something is moving in the hallway. Could you switch on the light?', es: 'Algo se mueve en el pasillo. ¿Podrías prender la luz?' },
        model: { en: "Sure, I'll switch it on.", es: 'Claro, la prendo.' },
        distractors: ["I'm not hungry.", 'The fan is broken.'],
        ack: { en: 'Quick, use the switch!', es: '¡Rápido, usa el interruptor!' },
        done: { en: "There... it's gone.", es: 'Ya... se fue.' },
      },
      {
        level: 3,
        line: { en: 'Turn on the lights. Now. Trust me.', es: 'Enciende las luces. Ya. Confía en mí.' },
        model: { en: "OK, I'm turning them on.", es: 'Bien, las estoy encendiendo.' },
        distractors: ["It's very hot.", 'Nobody is there.'],
        ack: { en: 'Do it!', es: '¡Hazlo!' },
        done: { en: "Phew. Don't ask what that was.", es: 'Uf. No preguntes qué era eso.' },
      },
    ],
  },
  alarmOff: {
    hint: 'Di que vas a detener la alarma.',
    accept: [
      'i will stop the alarm',
      'i will stop it',
      'i will turn it off',
      'i will turn off the alarm',
      'i will shut it off',
      'shutting it off',
      'i am stopping it',
      'i will press the red button',
    ],
    dialogues: [
      {
        level: 1,
        line: { en: 'Oh no, the alarm is ringing! Can you stop it?', es: '¡Oh no, la alarma está sonando! ¿Puedes detenerla?' },
        model: { en: "Yes, I'll stop the alarm.", es: 'Sí, detengo la alarma.' },
        distractors: ['I like this song.', "It's very cold."],
        ack: { en: 'Quick! Press the red button!', es: '¡Rápido! ¡Presiona el botón rojo!' },
        done: { en: 'Phew. That was close.', es: 'Uf. Estuvo cerca.' },
      },
      {
        level: 2,
        line: { en: 'Someone opened the back door and the alarm went off. Please turn it off!', es: 'Alguien abrió la puerta trasera y sonó la alarma. ¡Apágala, por favor!' },
        model: { en: "Don't worry, I'll turn it off.", es: 'No te preocupes, la apago.' },
        distractors: ["I'm in the kitchen.", 'Yes, I am awake.'],
        ack: { en: 'Hurry, the red button!', es: '¡Apúrate, el botón rojo!' },
        done: { en: 'OK... silence again.', es: 'Bien... silencio otra vez.' },
      },
      {
        level: 3,
        line: { en: "That alarm will wake him up. Shut it off before it's too late!", es: 'Esa alarma lo va a despertar. ¡Desactívala antes de que sea tarde!' },
        model: { en: "I'm on it. I'll shut it off now.", es: 'Voy. La desactivo ahora.' },
        distractors: ['The music box is on the desk.', "It's two AM."],
        ack: { en: 'Now! Do it now!', es: '¡Ya! ¡Hazlo ya!' },
        done: { en: 'I hope he didn’t hear it...', es: 'Espero que no lo haya oído...' },
      },
    ],
  },
  pullLever: {
    hint: 'Di que vas a jalar la palanca.',
    accept: [
      'i will pull the lever',
      'i will pull it',
      'i will pull it down',
      'pulling it down',
      'i am pulling it',
      'i am pulling it down',
      'i will restart it',
      'i will restart the generator',
    ],
    dialogues: [
      {
        level: 1,
        line: { en: 'The power is failing! Can you pull the lever?', es: '¡La energía está fallando! ¿Puedes jalar la palanca?' },
        model: { en: "Yes, I'll pull the lever.", es: 'Sí, jalo la palanca.' },
        distractors: ['I like pizza.', "It's on the shelf."],
        ack: { en: 'Hurry! The lever with the red handle!', es: '¡Apúrate! ¡La palanca con el mango rojo!' },
        done: { en: 'Power is back. Nice.', es: 'Volvió la energía. Bien.' },
      },
      {
        level: 2,
        line: { en: 'The lights are flickering again. Could you restart the generator?', es: 'Las luces parpadean otra vez. ¿Podrías reiniciar el generador?' },
        model: { en: "Sure, I'll restart it.", es: 'Claro, lo reinicio.' },
        distractors: ['Nobody is there.', 'I want to go home.'],
        ack: { en: 'Pull the lever down!', es: '¡Baja la palanca!' },
        done: { en: 'Good. The power is stable.', es: 'Bien. La energía está estable.' },
      },
      {
        level: 3,
        line: { en: "We're losing power. If it goes out, you're alone in the dark. Pull it down!", es: 'Estamos perdiendo energía. Si se va, estarás solo en la oscuridad. ¡Bájala!' },
        model: { en: "OK, I'm pulling it down now.", es: 'Bien, la estoy bajando ahora.' },
        distractors: ["I'm not scared.", 'The fan is on.'],
        ack: { en: 'Fast!', es: '¡Rápido!' },
        done: { en: "That was close. Don't do that to me.", es: 'Estuvo cerca. No me hagas eso.' },
      },
    ],
  },
  checkCamera: {
    hint: 'Di que vas a revisar la cámara.',
    accept: [
      'i will check the camera',
      'i will check it',
      'i will check the monitor',
      'i will look at it',
      'i will look at the camera',
      'i am checking it',
      'checking the camera',
    ],
    dialogues: [
      {
        level: 1,
        line: { en: 'I saw something on the stage. Can you check the camera?', es: 'Vi algo en el escenario. ¿Puedes revisar la cámara?' },
        model: { en: "Sure, I'll check the camera.", es: 'Claro, reviso la cámara.' },
        distractors: ["I'm hungry.", 'Close the window.'],
        ack: { en: 'Look at the monitor on your desk.', es: 'Mira el monitor de tu escritorio.' },
        done: { en: 'OK... keep an eye on him.', es: 'Bien... no le quites el ojo.' },
      },
      {
        level: 2,
        line: { en: 'Where is Freddy now? Could you look at the camera?', es: '¿Dónde está Freddy ahora? ¿Podrías mirar la cámara?' },
        model: { en: "Yes, I'll look at it.", es: 'Sí, la miro.' },
        distractors: ['I ate pizza.', 'The light is on.'],
        ack: { en: 'Press the monitor.', es: 'Presiona el monitor.' },
        done: { en: 'Good. Now we know where he is.', es: 'Bien. Ahora sabemos dónde está.' },
      },
      {
        level: 3,
        line: { en: 'I lost him. Check the monitor and tell me where he is.', es: 'Lo perdí. Revisa el monitor y dime dónde está.' },
        model: { en: "OK, I'm checking it now.", es: 'Bien, lo reviso ahora.' },
        distractors: ["It's very hot.", 'Yes, I can hear you.'],
        ack: { en: 'The monitor, quick.', es: 'El monitor, rápido.' },
        done: { en: "Don't lose him again.", es: 'No lo pierdas otra vez.' },
      },
    ],
  },
  playMusic: {
    hint: 'Di que vas a tocar la caja de música.',
    accept: [
      'i will play the music box',
      'i will play the music',
      'i will play it',
      'i will wind it up',
      'i am winding it up',
      'playing the music',
      'i will turn on the music',
    ],
    dialogues: [
      {
        level: 1,
        line: { en: 'Freddy likes music. It makes him calm. Can you play the music box?', es: 'A Freddy le gusta la música. Lo calma. ¿Puedes tocar la caja de música?' },
        model: { en: "Yes, I'll play the music box.", es: 'Sí, toco la caja de música.' },
        distractors: ['I like pizza.', "It's two AM."],
        ack: { en: "Great. It's on your desk.", es: 'Genial. Está en tu escritorio.' },
        done: { en: "Listen... he's quiet now.", es: 'Escucha... ahora está tranquilo.' },
      },
      {
        level: 2,
        line: { en: 'The music box stopped. Could you wind it up again?', es: 'La caja de música se detuvo. ¿Podrías darle cuerda otra vez?' },
        model: { en: "Sure, I'll wind it up.", es: 'Claro, le doy cuerda.' },
        distractors: ['The fan is off.', 'Nobody is there.'],
        ack: { en: 'Thanks. Go.', es: 'Gracias. Ve.' },
        done: { en: 'That song always calms him.', es: 'Esa canción siempre lo calma.' },
      },
      {
        level: 3,
        line: { en: 'If the music stops, he comes. You know what to do.', es: 'Si la música para, él viene. Ya sabes qué hacer.' },
        model: { en: "OK, I'll play the music.", es: 'Bien, pongo la música.' },
        distractors: ["I'm in the office.", 'The left door.'],
        ack: { en: "Don't let it stop.", es: 'No dejes que pare.' },
        done: { en: 'Good. Keep it playing.', es: 'Bien. Que siga sonando.' },
      },
    ],
  },
};

export function actionAccept(a: OrderableAction): string[] {
  return [...ACTION_DIALOGUES[a].accept, ...GENERIC_OK, ...ACTIONS[a].phrases.map((p) => p.en)];
}

/* ------------------------------------------------------------------ */
/*  Charla: preguntas personales (solo responder)                      */
/* ------------------------------------------------------------------ */

export interface TalkDef extends Dialogue {
  id: string;
  hint: string;
  accept: string[];
  dynamic?: 'time';
}

export const TALKS: TalkDef[] = [
  {
    id: 'hear',
    level: 1,
    line: { en: 'Hello? Hello? Can you hear me?', es: '¿Hola? ¿Hola? ¿Me escuchas?' },
    model: { en: 'Yes, I can hear you.', es: 'Sí, te escucho.' },
    accept: ['yes i can hear you', 'i can hear you', 'yes i hear you', 'yes i can', 'loud and clear'],
    hint: 'Dile que sí lo escuchas.',
    distractors: ['I like pizza.', 'The fan is off.'],
    ack: { en: 'Great. The radio works.', es: 'Genial. La radio funciona.' },
  },
  {
    id: 'awake',
    level: 1,
    line: { en: 'Are you still awake? Talk to me.', es: '¿Sigues despierto? Háblame.' },
    model: { en: "Yes, I'm awake. Don't worry.", es: 'Sí, estoy despierto. No te preocupes.' },
    accept: ['yes i am awake', 'i am awake', 'yes i am', 'i am still awake', 'yes i am still awake'],
    hint: 'Dile que sigues despierto.',
    distractors: ['Close the door.', "It's a battery."],
    ack: { en: 'Good. Stay with me.', es: 'Bien. Quédate conmigo.' },
  },
  {
    id: 'how',
    level: 1,
    line: { en: 'How are you doing in there?', es: '¿Cómo te va ahí dentro?' },
    model: { en: "I'm fine, thanks.", es: 'Estoy bien, gracias.' },
    accept: ['i am fine', 'i am okay', 'i am good', 'i am scared', 'i am not okay', 'i am not fine', 'fine thanks', 'i am doing fine', 'i am doing okay', 'not bad'],
    hint: 'Dile cómo estás.',
    distractors: ['Yes, I can hear you.', 'Under the desk.'],
    ack: { en: 'Good... stay calm.', es: 'Bien... mantén la calma.' },
  },
  {
    id: 'name',
    level: 1,
    line: { en: "Sorry, I forgot your name. What's your name again?", es: 'Perdón, olvidé tu nombre. ¿Cómo te llamas?' },
    model: { en: 'My name is ...', es: 'Me llamo ...' },
    accept: ['my name is', 'call me', 'i am'],
    hint: 'Dile tu nombre.',
    distractors: ["I'm fine, thanks.", "It's two AM."],
    ack: { en: 'Nice to meet you... again.', es: 'Mucho gusto... otra vez.' },
  },
  {
    id: 'time',
    level: 2,
    line: { en: 'My watch is broken. What time is it?', es: 'Mi reloj está roto. ¿Qué hora es?' },
    model: { en: "It's twelve AM.", es: 'Son las doce de la noche.' },
    accept: [],
    dynamic: 'time',
    hint: 'Mira el reloj arriba a la izquierda y dile la hora.',
    distractors: ['My name is Freddy.', "I'm in the office."],
    ack: { en: 'Thanks. Only a few more hours.', es: 'Gracias. Solo unas horas más.' },
  },
  {
    id: 'scared',
    level: 2,
    line: { en: 'Be honest. Are you scared?', es: 'Sé honesto. ¿Tienes miedo?' },
    model: { en: "No, I'm not scared.", es: 'No, no tengo miedo.' },
    accept: ['i am not scared', 'i am scared', 'i am not afraid', 'i am afraid', 'no i am not', 'yes i am', 'a little'],
    hint: 'Dile si tienes miedo o no.',
    distractors: ['Yes, I can hear you.', 'The fan is on.'],
    ack: { en: 'Ha. Me too, to be honest.', es: 'Ja. Yo también, la verdad.' },
  },
  {
    id: 'eat',
    level: 2,
    line: { en: 'Did you eat dinner before your shift?', es: '¿Cenaste antes de tu turno?' },
    model: { en: 'Yes, I ate pizza.', es: 'Sí, comí pizza.' },
    accept: ['yes i did', 'no i did not', 'i ate', 'i had', 'i did not eat', 'not yet'],
    hint: 'Dile si cenaste y qué comiste.',
    distractors: ['The left door.', 'I can hear you.'],
    ack: { en: 'Good. You need energy tonight.', es: 'Bien. Necesitas energía esta noche.' },
  },
  {
    id: 'where',
    level: 3,
    line: { en: 'Where are you right now? Still in the office?', es: '¿Dónde estás ahora? ¿Sigues en la oficina?' },
    model: { en: "Yes, I'm still in the office.", es: 'Sí, sigo en la oficina.' },
    accept: ['i am in the office', 'i am still in the office', 'yes i am still here', 'i am still here', 'in the office', 'yes i am in the office'],
    hint: 'Dile dónde estás.',
    distractors: ["It's a bell.", 'Turn on the light.'],
    ack: { en: "Good. Don't leave the office.", es: 'Bien. No salgas de la oficina.' },
  },
  {
    id: 'ok',
    level: 3,
    line: { en: 'Is everything OK over there?', es: '¿Todo bien por allá?' },
    model: { en: 'Yes, everything is OK.', es: 'Sí, todo está bien.' },
    accept: ['everything is okay', 'everything is fine', 'yes everything is okay', 'yes everything is fine', 'everything is not okay', 'not really'],
    hint: 'Dile si todo está bien.',
    distractors: ["It's three AM.", 'The right door.'],
    ack: { en: 'Good to hear.', es: 'Me alegra oírlo.' },
  },
  {
    id: 'home',
    level: 3,
    line: { en: 'Do you want to go home?', es: '¿Quieres irte a casa?' },
    model: { en: 'Yes, I want to go home.', es: 'Sí, quiero irme a casa.' },
    accept: ['i want to go home', 'yes i want to go home', 'yes i do', 'no i do not', 'i do not want to go home'],
    hint: 'Dile si quieres irte a casa.',
    distractors: ['I found a battery.', 'The fan is off.'],
    ack: { en: 'Me too... me too.', es: 'Yo también... yo también.' },
  },
  {
    id: 'help',
    level: 3,
    line: { en: 'Do you need help over there?', es: '¿Necesitas ayuda por allá?' },
    model: { en: "No, I'm OK. Thanks.", es: 'No, estoy bien. Gracias.' },
    accept: ['i need help', 'yes i need help', 'yes i do', 'no i do not', 'no i am okay', 'i am okay', 'no thanks', 'i am fine'],
    hint: 'Dile si necesitas ayuda.',
    distractors: ["It's in the box.", 'My name is Freddy.'],
    ack: { en: "OK. I'm here if you need me.", es: 'Bien. Aquí estoy si me necesitas.' },
  },
];

const HOUR_EN = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six'];
const HOUR_ES = ['las doce', 'la una', 'las dos', 'las tres', 'las cuatro', 'las cinco', 'las seis'];

export function timeAnswer(hour: number): { model: Bilingual; accept: string[] } {
  const w = HOUR_EN[hour] ?? 'twelve';
  const es = HOUR_ES[hour] ?? 'las doce';
  const verb = hour === 1 ? 'Es' : 'Son';
  return {
    model: { en: `It's ${w} AM.`, es: `${verb} ${es} de la ${hour === 0 ? 'noche' : 'mañana'}.` },
    accept: [`it is ${w} am`, `${w} am`, `it is ${w} oclock`, `${w} oclock`, `it is ${w}`, `${w} in the morning`],
  };
}

/* ------------------------------------------------------------------ */
/*  Preguntas de verdad: miras y respondes lo que ves                  */
/* ------------------------------------------------------------------ */

interface CheckDef {
  lines: { level: Level; en: string; es: string }[];
  yes: ReplyOption;
  no: ReplyOption;
  hint: string;
}

/** {side} se reemplaza por left/right (izquierda/derecha). */
export const CHECKS: Record<CheckKind, CheckDef> = {
  door: {
    lines: [
      { level: 1, en: 'Can you check the {side} door? Is anyone there?', es: '¿Puedes revisar la puerta {side}? ¿Hay alguien ahí?' },
      { level: 2, en: 'I lost the signal on camera two... Can you check the {side} door? Is anyone there?', es: 'Perdí la señal de la cámara dos... ¿Puedes revisar la puerta {side}? ¿Hay alguien?' },
      { level: 3, en: "Something's wrong with the {side} door. Look at it. Is someone there?", es: 'Algo pasa con la puerta {side}. Mírala. ¿Hay alguien?' },
    ],
    yes: {
      tag: 'yes',
      when: 'Si ves a Freddy',
      model: { en: 'Yes! Freddy is there!', es: '¡Sí! ¡Freddy está ahí!' },
      accept: ['yes freddy is there', 'yes he is there', 'yes he is', 'yes someone is there', 'yes there is someone', 'yes i can see him', 'freddy is there', 'he is there', 'someone is there', 'i can see him'],
    },
    no: {
      tag: 'no',
      when: 'Si no hay nadie',
      model: { en: "No, there's nobody there.", es: 'No, no hay nadie.' },
      accept: ['no there is nobody there', 'there is nobody there', 'there is nobody', 'nobody is there', 'no nobody', 'no one is there', 'there is no one there', 'no there is no one', 'i cannot see anyone', 'i cannot see him', 'no i cannot see him'],
    },
    hint: 'Mira la puerta con la linterna y dime si hay alguien.',
  },
  fan: {
    lines: [
      { level: 1, en: "I can't hear the fan on the radio. Is it on?", es: 'No oigo el ventilador por la radio. ¿Está encendido?' },
      { level: 2, en: 'Quick question: is the fan on right now?', es: 'Pregunta rápida: ¿el ventilador está encendido ahora?' },
    ],
    yes: {
      tag: 'yes',
      when: 'Si está encendido',
      model: { en: "Yes, it's on.", es: 'Sí, está encendido.' },
      accept: ['yes it is on', 'it is on', 'yes the fan is on', 'the fan is on', 'yes it is'],
    },
    no: {
      tag: 'no',
      when: 'Si está apagado',
      model: { en: "No, it's off.", es: 'No, está apagado.' },
      accept: ['no it is off', 'it is off', 'the fan is off', 'no the fan is off', 'no it is not', 'it is not on', 'no it is not on'],
    },
    hint: 'Mira el ventilador y dime si está encendido.',
  },
  flashlight: {
    lines: [
      { level: 1, en: "Is your flashlight on? I can't see any light on camera.", es: '¿Tu linterna está encendida? No veo luz en la cámara.' },
      { level: 3, en: 'Tell me, is your flashlight on or off?', es: 'Dime, ¿tu linterna está encendida o apagada?' },
    ],
    yes: {
      tag: 'yes',
      when: 'Si tu linterna está encendida',
      model: { en: 'Yes, my flashlight is on.', es: 'Sí, mi linterna está encendida.' },
      accept: ['yes my flashlight is on', 'my flashlight is on', 'yes it is on', 'it is on', 'yes it is', 'it is on'],
    },
    no: {
      tag: 'no',
      when: 'Si tu linterna está apagada',
      model: { en: "No, it's off.", es: 'No, está apagada.' },
      accept: ['no it is off', 'it is off', 'my flashlight is off', 'no my flashlight is off', 'no it is not', 'it is not on'],
    },
    hint: 'Dime si tu linterna está encendida o apagada.',
  },
};

export const CHECK_ACK = {
  doorDanger: { en: 'Close it! Close it now!', es: '¡Ciérrala! ¡Ciérrala ya!' },
  doorDangerDone: { en: 'Good... that was close.', es: 'Bien... estuvo cerca.' },
  doorSafe: { en: 'Phew. OK, thank you.', es: 'Uf. Bien, gracias.' },
  other: { en: 'OK, thanks. Just checking.', es: 'Bien, gracias. Solo revisaba.' },
};

/** Lo que dice la radio si respondes algo que no es verdad. */
export const LIES = {
  doorThere: { en: 'Are you sure? I can hear him breathing...', es: '¿Seguro? Lo oigo respirar...' },
  doorEmpty: { en: "Are you sure? Look again... I don't see him on camera.", es: '¿Seguro? Mira otra vez... No lo veo en la cámara.' },
  wrongDoor: { en: "Are you sure? I can't see him there! Look again!", es: '¿Seguro? ¡No lo veo ahí! ¡Mira otra vez!' },
  other: { en: 'Are you sure? Look again.', es: '¿Seguro? Mira otra vez.' },
};

export function sideText(t: string, side: Side, lang: 'en' | 'es'): string {
  return t.replace('{side}', SIDE_WORD[side][lang]);
}

/* ------------------------------------------------------------------ */
/*  Freddy en la puerta                                                */
/* ------------------------------------------------------------------ */

export const DOOR_LINE: Bilingual = { en: "He's coming! Which door? Tell me!", es: '¡Ya viene! ¿Qué puerta? ¡Dime!' };
export const DOOR_INTERRUPT: Bilingual = { en: 'Wait... do you hear that?', es: 'Espera... ¿oyes eso?' };
export const DOOR_ACK: Bilingual = { en: 'Close it! Close it now!', es: '¡Ciérrala! ¡Ciérrala ya!' };
export const DOOR_DONE: Bilingual = { en: "He's gone... for now.", es: 'Se fue... por ahora.' };
export const DOOR_HINT = 'Escucha los pasos o mira las puertas y dime cuál es.';

export function doorReply(side: Side): ReplyOption {
  const w = SIDE_WORD[side];
  return {
    tag: side,
    model: { en: `He's at the ${w.en} door!`, es: `¡Está en la puerta ${w.es}!` },
    accept: [
      `he is at the ${w.en} door`,
      `freddy is at the ${w.en} door`,
      `at the ${w.en} door`,
      `the ${w.en} door`,
      `the ${w.en} one`,
      `on the ${w.en}`,
      `he is on the ${w.en}`,
      `it is the ${w.en} door`,
      w.en,
      ...ACTIONS[doorAction(side)].phrases.map((p) => p.en),
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  Buscar objetos                                                     */
/* ------------------------------------------------------------------ */

/** {item}/{spot} en inglés; {itemEs}/{spotEs}/{pron} en español. */
export const FIND_LINES: Bilingual[] = [
  { en: 'I left a {item} {spot}. Can you find it?', es: 'Dejé {itemEs} {spotEs}. ¿Puedes encontrar{pron}?' },
  { en: "There's a {item} {spot}. Could you get it for me?", es: 'Hay {itemEs} {spotEs}. ¿Podrías recoger{pron}?' },
];

export const FIND_ACCEPT = [
  'i will look for it',
  'i will find it',
  'i will get it',
  'i can find it',
  'i will look',
  'i am looking for it',
  'i will search for it',
  'i will pick it up',
  ...GENERIC_OK,
];

export const FIND_HINT = 'Acepta y di que lo vas a buscar.';
export const FIND_ACK: Bilingual = { en: 'Thanks. Use your flashlight.', es: 'Gracias. Usa tu linterna.' };
export const FIND_DONE: Bilingual = { en: 'You found it! Great.', es: '¡Lo encontraste! Genial.' };

/* ------------------------------------------------------------------ */
/*  Frases de ayuda y reacciones de la radio                           */
/* ------------------------------------------------------------------ */

export const HELP_PHRASES: Record<HelpKind, { model: Bilingual; accept: string[]; info: string }> = {
  repeat: {
    model: { en: 'Can you repeat that?', es: '¿Puedes repetir eso?' },
    accept: ['can you repeat that', 'could you repeat that', 'repeat that', 'say it again', 'can you say that again', 'repeat', 'pardon', 'sorry what', 'what did you say'],
    info: 'La radio repite',
  },
  slower: {
    model: { en: 'Slower, please.', es: 'Más despacio, por favor.' },
    accept: ['slower', 'more slowly', 'speak slower', 'speak more slowly', 'can you speak slower', 'slow down', 'say it slower'],
    info: 'Repite más despacio',
  },
  meaning: {
    model: { en: 'What does it mean?', es: '¿Qué significa?' },
    accept: ['what does it mean', 'what does that mean', 'what does mean', 'i do not understand', 'what is that in spanish', 'translate'],
    info: 'Muestra la traducción (−3 s)',
  },
};

export const HELP_KINDS = Object.keys(HELP_PHRASES) as HelpKind[];
export const MAX_HELPS = 2;

export const NO_MORE_HELP: Bilingual = { en: 'No time for that! Answer me!', es: '¡No hay tiempo para eso! ¡Respóndeme!' };
export const RESUME_LINE: Bilingual = { en: 'Where was I? Oh, yes...', es: '¿En qué estaba? Ah, sí...' };
export const TOO_LATE: Bilingual = { en: 'Too late...', es: 'Demasiado tarde...' };

export const MISHEARD: Bilingual[] = [
  { en: 'What? The signal is bad. Say it again.', es: '¿Qué? La señal es mala. Dilo otra vez.' },
  { en: "Sorry? I can't hear you very well.", es: '¿Perdón? No te escucho muy bien.' },
  { en: "Speak up! I can't understand you!", es: '¡Habla más fuerte! ¡No te entiendo!' },
];
