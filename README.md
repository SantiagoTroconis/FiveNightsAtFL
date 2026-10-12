# Snake of Freddy 🐻🔦

Juego de terror para el navegador (estilo *Five Nights at Freddy's*) que enseña inglés **conversando**.
Eres el guardia nocturno de *Freddy's Family Diner*. El gerente te habla por la radio en inglés y **espera tu
respuesta**: si te pide algo, le respondes y luego presionas el botón. Si no le respondes a tiempo, Freddy se acerca…
y si llega a una puerta abierta, te atrapa.

## Cómo ejecutarlo

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en **Google Chrome o Microsoft Edge** y permite el micrófono.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Revisa tipos y genera la versión final en `dist/` |
| `npm run preview` | Sirve la carpeta `dist/` para probarla |

Truco para probar rápido: añade `?fast` a la URL (`http://localhost:5173/?fast`) y cada hora dura 8 segundos.

## Publicarlo en tu página web

1. `npm run build`
2. Sube el contenido de `dist/` a cualquier hosting estático (tu servidor, Netlify, Vercel, GitHub Pages…).
   Funciona en cualquier subcarpeta (`base: './'`).
3. **Importante:** el micrófono solo funciona en sitios con **HTTPS** (o `localhost`).
4. Si lo insertas en otra página con un `<iframe>`, debes darle permiso de micrófono:

```html
<iframe src="https://tusitio.com/snake-of-freddy/" allow="microphone; autoplay" width="1280" height="720"></iframe>
```

## Cómo se juega

- **Linterna:** mueve el mouse para alumbrar. `F` o clic derecho la enciende/apaga. La batería se gasta.
- **Conversaciones con la radio** (panel abajo a la izquierda, tipo chat). Mientras la radio habla, el reloj se detiene.
  - 📻 **Pedido:** *"The fan is making a weird noise. Can you turn it off?"* → respondes *"Sure, I'll turn it off."*
    → la radio contesta *"Thanks. Do it quickly!"* → el control brilla en verde → haz clic en él.
  - 💬 **Pregunta:** *"Are you still awake?"* → *"Yes, I'm awake. Don't worry."* (basta con responder).
  - 🔦 **¿Qué ves?:** *"Can you check the left door? Is anyone there?"* → mira con la linterna y di **la verdad**
    (*"No, there's nobody there."* / *"Yes! Freddy is there!"*). Si mientes, la radio no te cree y pierdes tiempo.
  - 🔎 **Busca:** *"I left a battery under the desk. Can you find it?"* → *"Sure, I'll look for it."* → encuéntrala,
    haz clic y di su nombre.
  - ⚠ **Peligro:** *"He's coming! Which door? Tell me!"* → *"He's at the right door!"* → *"Close it now!"* →
    presiona el botón de esa puerta.
  - Se aceptan varias respuestas válidas (*"Sure, I'll do it"*, *"No problem"*, *"OK, I'm turning it off"*…).
  - Si la radio no te entiende, te lo dice (*"What? The signal is bad. Say it again."*) y vuelves a intentarlo.
- **Frases de ayuda** (2 por conversación): *"Can you repeat that?"* (repite), *"Slower, please"* (más despacio),
  *"What does it mean?"* (muestra la traducción, cuesta 3 s).
- **Comandos libres** (`TAB`): puedes hablar cuando quieras. *"Turn on the light"* espanta a Freddy del pasillo,
  *"Check the camera"* muestra dónde está, *"Play the music box"* lo calma, *"Pull the lever"* recarga batería.
- **Objetos escondidos:** pila (+batería), campana (Freddy vuelve al escenario), máscara (te salva una vez),
  libro (ayuda completa en 3 conversaciones), reloj (adelanta 20 minutos).
- **Pistas de sonido:** usa audífonos; los pasos de Freddy suenan a la izquierda o a la derecha.

Teclas: `F` linterna · `M` micrófono · `R` pedir que repita · `B` campana · `TAB` comandos · `ESC` pausa.

### Las 5 noches (cada una con menos ayuda)

| Noche | Qué ves para responder |
| --- | --- |
| 1 · Primer turno | La respuesta completa + traducción, tutorial y visita guiada de Freddy |
| 2 · Elige bien | 3 opciones: eliges la que tiene sentido (o la verdadera) y la dices |
| 3 · Sin traducciones | La respuesta con huecos: *"Sure, I'll t___ it o__."* |
| 4 · Tus propias palabras | Solo una pista en español: *"Acepta y di que lo vas a apagar."* |
| 5 · La última noche | Nada: la pregunta ni siquiera se ve escrita, solo se escucha |

Cada noche da de 1 a 3 estrellas según tu precisión. "Mis frases" guarda todo lo que practicaste.

## Tecnología y dependencias

| Paquete | Para qué |
| --- | --- |
| `react`, `react-dom` | Interfaz |
| `zustand` + `immer` | Estado del juego (motor de órdenes, Freddy, objetos) |
| `vite`, `typescript`, `@vitejs/plugin-react` | Compilación |
| `@fontsource/creepster`, `special-elite`, `vt323` | Tipografías incluidas (funcionan sin internet) |

APIs del navegador (no requieren instalación):

- **Web Speech API – `SpeechRecognition`:** reconoce lo que dice el estudiante (Chrome/Edge/Safari).
  En Chrome el reconocimiento usa los servidores de Google, así que necesita internet.
  En Firefox no existe: el juego cambia automáticamente a **modo escritura**.
- **`speechSynthesis`:** la voz de la radio y los botones 🔊 de pronunciación.
- **Web Audio API:** todos los efectos (pasos, golpes, grito, latido, alarma, caja de música) se sintetizan
  en tiempo real; no hay archivos de audio.

Todos los gráficos (oficina, Freddy, objetos) son SVG dibujados en código: no hay imágenes externas.

## Estructura

```
src/
  game/
    config.ts      Título, dificultad de cada noche, umbrales de pronunciación
    dialogues.ts   Conversaciones de la radio y respuestas aceptadas (¡edita aquí para agregar diálogos!)
    content.ts     Comandos libres, objetos, escondites y llamadas de cada noche
    matching.ts    Comparación tolerante de lo que dijo el estudiante
    store.ts       Motor del juego (órdenes, Freddy, voz, objetos, puntuación)
    storage.ts     Progreso guardado en localStorage
  audio/           Efectos sintetizados y voz de la radio
  speech/          Hook de reconocimiento de voz
  components/
    scene/         Oficina, Freddy, objetos, capa de luces
    hud/           Radio, panel de voz, batería, comandos, avisos
    screens/       Menú, ajustes, intro, prueba de micrófono, susto, resultados
```

### Agregar o cambiar frases

En `src/game/dialogues.ts` (las respuestas aceptadas van en minúsculas y sin puntuación; las contracciones
se entienden solas: *"I'll"* = *"i will"*):

- `ACTION_DIALOGUES`: pedidos de la radio por control y por nivel (1 = fácil, 3 = difícil). Cada uno tiene la frase
  de la radio (`line`), la respuesta modelo (`model`), opciones incorrectas para la noche 2 (`distractors`),
  la contestación de la radio (`ack`) y la frase final (`done`). `accept` son las respuestas válidas.
- `TALKS`: preguntas personales (*"Are you awake?"*, *"What time is it?"*…).
- `CHECKS`: preguntas de verdad (puerta, ventilador, linterna) con su respuesta de *sí* y de *no*.
- `HELP_PHRASES`, `MISHEARD`, `LIES`: frases de ayuda y reacciones de la radio.

En `src/game/content.ts`:

- `ACTIONS`: comandos libres de cada control por nivel.
- `ITEMS` y `SPOTS`: objetos y lugares (practican vocabulario y preposiciones: *under, on, behind, in, next to*).
- `NIGHT_CALLS`: la llamada del gerente al inicio de cada noche.

La cantidad de ayuda de cada noche (`help`: `full`, `choices`, `gaps`, `hint`, `none`) se cambia en `src/game/config.ts`.

El título del juego se cambia en `GAME_TITLE` (`src/game/config.ts`).
