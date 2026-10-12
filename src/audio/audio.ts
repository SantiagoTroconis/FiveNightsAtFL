/**
 * Todos los sonidos del juego se sintetizan en tiempo real con la Web Audio API:
 * no hay archivos de audio que descargar ni licencias que gestionar.
 */

type Wave = OscillatorType;

interface ToneOpts {
  type?: Wave;
  freq: number;
  freqEnd?: number;
  start?: number;
  dur: number;
  gain?: number;
  attack?: number;
  pan?: number;
  dest?: AudioNode;
}

interface NoiseOpts {
  start?: number;
  dur: number;
  gain?: number;
  type?: BiquadFilterType;
  freq?: number;
  freqEnd?: number;
  Q?: number;
  attack?: number;
  pan?: number;
  dest?: AudioNode;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private distCurve: Float32Array<ArrayBuffer> | null = null;
  private loops = new Map<string, () => void>();
  private heartbeatTimer: number | null = null;
  private heartbeatIntensity = 0;
  private volume = 0.8;

  /** Debe llamarse desde un gesto del usuario (clic) por las políticas de autoplay. */
  init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 5;
    const master = ctx.createGain();
    master.gain.value = this.volume;
    master.connect(comp);
    comp.connect(ctx.destination);

    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const n = 2048;
    const curve = new Float32Array(n);
    const k = 80;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }

    this.ctx = ctx;
    this.master = master;
    this.noiseBuf = buf;
    this.distCurve = curve;
  }

  get ready(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    void this.ctx?.resume();
  }

  /* ------------------------------ primitivas ------------------------------ */

  private out(pan = 0, dest?: AudioNode): AudioNode {
    const ctx = this.ctx!;
    const target = dest ?? this.master!;
    if (!pan) return target;
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    p.connect(target);
    return p;
  }

  private tone({ type = 'sine', freq, freqEnd, start = 0, dur, gain = 0.2, attack = 0.005, pan = 0, dest }: ToneOpts): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t0 = ctx.currentTime + start;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(this.out(pan, dest));
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  private noise({ start = 0, dur, gain = 0.2, type = 'lowpass', freq = 1000, freqEnd, Q = 1, attack = 0.005, pan = 0, dest }: NoiseOpts): void {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuf || ctx.state !== 'running') return;
    const t0 = ctx.currentTime + start;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t0);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    f.Q.value = Q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.out(pan, dest));
    src.start(t0, Math.random() * 1.5);
    src.stop(t0 + dur + 0.05);
  }

  /* --------------------------------- UI ---------------------------------- */

  click(): void {
    this.tone({ type: 'square', freq: 1200, freqEnd: 700, dur: 0.05, gain: 0.04 });
  }

  hover(): void {
    this.tone({ type: 'sine', freq: 520, dur: 0.05, gain: 0.015 });
  }

  success(): void {
    [660, 880, 1320].forEach((f, i) => this.tone({ type: 'triangle', freq: f, start: i * 0.08, dur: 0.35, gain: 0.1 }));
  }

  unlock(): void {
    this.tone({ type: 'triangle', freq: 520, freqEnd: 1040, dur: 0.18, gain: 0.09 });
    this.tone({ type: 'sine', freq: 1560, start: 0.12, dur: 0.25, gain: 0.05 });
  }

  miss(): void {
    this.tone({ type: 'square', freq: 220, freqEnd: 180, dur: 0.18, gain: 0.035 });
  }

  fail(): void {
    this.tone({ type: 'sawtooth', freq: 140, freqEnd: 80, dur: 0.6, gain: 0.14 });
    this.tone({ type: 'square', freq: 149, freqEnd: 84, dur: 0.6, gain: 0.05 });
  }

  locked(): void {
    this.tone({ type: 'square', freq: 170, dur: 0.1, gain: 0.06 });
    this.tone({ type: 'square', freq: 150, start: 0.13, dur: 0.12, gain: 0.06 });
  }

  pickup(): void {
    this.tone({ type: 'triangle', freq: 880, freqEnd: 1760, dur: 0.2, gain: 0.09 });
    this.tone({ type: 'sine', freq: 1320, start: 0.1, dur: 0.4, gain: 0.06 });
  }

  /* ------------------------------- oficina ------------------------------- */

  radioBeep(): void {
    this.noise({ dur: 0.3, gain: 0.07, type: 'bandpass', freq: 2600, Q: 0.8 });
    this.tone({ type: 'sine', freq: 1400, start: 0.05, dur: 0.08, gain: 0.06 });
    this.tone({ type: 'sine', freq: 1400, start: 0.17, dur: 0.08, gain: 0.06 });
  }

  staticBurst(dur = 0.6): void {
    this.noise({ dur, gain: 0.12, type: 'highpass', freq: 1400, attack: 0.01 });
  }

  doorSlam(pan = 0): void {
    this.noise({ dur: 0.55, gain: 0.7, type: 'lowpass', freq: 700, freqEnd: 120, attack: 0.002, pan });
    this.tone({ type: 'sine', freq: 75, freqEnd: 38, dur: 0.45, gain: 0.6, attack: 0.003, pan });
    this.tone({ type: 'square', freq: 210, dur: 0.14, gain: 0.04, pan });
  }

  doorOpen(pan = 0): void {
    this.noise({ dur: 0.7, gain: 0.1, type: 'bandpass', freq: 900, freqEnd: 380, Q: 2, attack: 0.05, pan });
    this.tone({ type: 'sawtooth', freq: 90, freqEnd: 150, dur: 0.6, gain: 0.03, attack: 0.05, pan });
  }

  bang(pan = 0): void {
    for (let i = 0; i < 3; i++) {
      this.noise({ start: i * 0.27, dur: 0.28, gain: 0.85, type: 'lowpass', freq: 420, attack: 0.002, pan });
      this.tone({ type: 'sine', freq: 58, freqEnd: 34, start: i * 0.27, dur: 0.32, gain: 0.75, attack: 0.002, pan });
    }
  }

  footsteps(pan = 0, steps = 4, vol = 0.5): void {
    for (let i = 0; i < steps; i++) {
      const s = i * (0.45 + Math.random() * 0.08);
      this.noise({ start: s, dur: 0.17, gain: 0.5 * vol, type: 'lowpass', freq: 260, attack: 0.004, pan });
      this.tone({ type: 'sine', freq: 80, freqEnd: 45, start: s, dur: 0.16, gain: 0.4 * vol, attack: 0.004, pan });
      this.tone({ type: 'square', freq: 1900, start: s + 0.01, dur: 0.03, gain: 0.006 * vol, pan });
    }
  }

  breath(pan = 0): void {
    this.noise({ dur: 1.4, gain: 0.11, type: 'bandpass', freq: 650, Q: 0.7, attack: 0.6, pan });
    this.noise({ start: 1.6, dur: 1.6, gain: 0.09, type: 'bandpass', freq: 480, Q: 0.7, attack: 0.7, pan });
  }

  clank(pan = (Math.random() - 0.5) * 1.4): void {
    this.tone({ type: 'square', freq: 310, dur: 0.3, gain: 0.03, pan });
    this.tone({ type: 'triangle', freq: 1260, dur: 0.7, gain: 0.025, pan });
    this.tone({ type: 'triangle', freq: 1873, dur: 0.5, gain: 0.015, pan });
    this.noise({ dur: 0.12, gain: 0.05, type: 'highpass', freq: 3000, pan });
  }

  whisper(pan = 0): void {
    this.noise({ dur: 1.8, gain: 0.05, type: 'bandpass', freq: 3200, freqEnd: 1700, Q: 5, attack: 0.5, pan });
    this.noise({ start: 0.4, dur: 1.4, gain: 0.04, type: 'bandpass', freq: 1300, freqEnd: 2100, Q: 6, attack: 0.4, pan });
  }

  stinger(): void {
    [220, 233, 311, 466, 622].forEach((f) => this.tone({ type: 'sawtooth', freq: f, dur: 1.3, gain: 0.06, attack: 0.01 }));
    this.noise({ dur: 0.5, gain: 0.2, type: 'highpass', freq: 900, attack: 0.003 });
  }

  flickerBuzz(): void {
    for (let i = 0; i < 4; i++) {
      this.tone({ type: 'square', freq: 110, start: i * 0.18 + Math.random() * 0.05, dur: 0.12, gain: 0.025 });
    }
  }

  lightSwitch(): void {
    this.noise({ dur: 0.04, gain: 0.3, type: 'highpass', freq: 3500 });
    this.tone({ type: 'square', freq: 120, start: 0.03, dur: 0.5, gain: 0.025 });
  }

  lever(): void {
    this.noise({ dur: 0.35, gain: 0.3, type: 'bandpass', freq: 420, attack: 0.01 });
    this.tone({ type: 'sine', freq: 52, start: 0.2, dur: 0.6, gain: 0.4, attack: 0.01 });
    this.tone({ type: 'sawtooth', freq: 60, freqEnd: 120, start: 0.25, dur: 1.2, gain: 0.03, attack: 0.1 });
  }

  cameraBlip(): void {
    this.tone({ type: 'sine', freq: 900, dur: 0.07, gain: 0.05 });
    this.noise({ start: 0.05, dur: 0.35, gain: 0.06, type: 'bandpass', freq: 3000 });
  }

  flashlightToggle(on: boolean): void {
    this.tone({ type: 'square', freq: on ? 2400 : 1800, dur: 0.02, gain: 0.05 });
    this.noise({ dur: 0.025, gain: 0.08, type: 'highpass', freq: 5000 });
  }

  flashlightDie(): void {
    this.tone({ type: 'sawtooth', freq: 300, freqEnd: 60, dur: 0.7, gain: 0.06 });
  }

  bell(): void {
    for (let r = 0; r < 3; r++) {
      const s = r * 0.55;
      this.tone({ type: 'sine', freq: 1320, start: s, dur: 2, gain: 0.13 });
      this.tone({ type: 'sine', freq: 1320 * 2.76, start: s, dur: 1.1, gain: 0.04 });
      this.tone({ type: 'sine', freq: 1320 * 5.4, start: s, dur: 0.5, gain: 0.02 });
    }
  }

  musicBox(): void {
    // Melodía original en menor, timbre de caja musical.
    const notes = [76, 79, 83, 81, 79, 76, 78, 75, 76, 71, 72, 74, 76, 79, 78, 76];
    notes.forEach((m, i) => {
      const f = 440 * Math.pow(2, (m - 69) / 12);
      const s = i * 0.3;
      this.tone({ type: 'triangle', freq: f, start: s, dur: 0.9, gain: 0.07, attack: 0.003 });
      this.tone({ type: 'sine', freq: f * 2.01, start: s, dur: 0.5, gain: 0.025, attack: 0.003 });
    });
  }

  hourChime(): void {
    this.tone({ type: 'sine', freq: 523, dur: 1.6, gain: 0.05 });
    this.tone({ type: 'sine', freq: 784, start: 0.35, dur: 1.8, gain: 0.04 });
  }

  chime6am(): void {
    const seq = [1047, 1319, 1568, 2093, 1568, 2093];
    seq.forEach((f, i) => {
      this.tone({ type: 'sine', freq: f, start: i * 0.32, dur: 1.8, gain: 0.1 });
      this.tone({ type: 'triangle', freq: f / 2, start: i * 0.32, dur: 1.2, gain: 0.04 });
    });
  }

  scream(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noiseBuf || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.85, t0 + 0.03);
    g.gain.setValueAtTime(0.85, t0 + 1.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.75);
    const shaper = ctx.createWaveShaper();
    shaper.curve = this.distCurve;
    shaper.connect(g);
    g.connect(this.master);
    for (const f of [310, 470, 620, 880, 1150]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t0);
      o.frequency.linearRampToValueAtTime(f * 1.25, t0 + 0.25);
      o.frequency.linearRampToValueAtTime(f * 0.8, t0 + 1.7);
      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 14 + Math.random() * 12;
      const lg = ctx.createGain();
      lg.gain.value = f * 0.08;
      lfo.connect(lg);
      lg.connect(o.frequency);
      const og = ctx.createGain();
      og.gain.value = 0.16;
      o.connect(og);
      og.connect(shaper);
      o.start(t0);
      lfo.start(t0);
      o.stop(t0 + 1.85);
      lfo.stop(t0 + 1.85);
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const ng = ctx.createGain();
    ng.gain.value = 0.45;
    src.connect(hp);
    hp.connect(ng);
    ng.connect(shaper);
    src.start(t0);
    src.stop(t0 + 1.85);
    this.tone({ type: 'sine', freq: 62, freqEnd: 30, dur: 1.2, gain: 0.8, attack: 0.005 });
  }

  /* -------------------------------- bucles -------------------------------- */

  startAmbience(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noiseBuf || this.loops.has('amb')) return;
    const out = ctx.createGain();
    out.gain.value = 0.0001;
    out.gain.setTargetAtTime(1, ctx.currentTime, 1.5);
    out.connect(this.master);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 240;
    lp.connect(out);
    const spec: [number, Wave, number][] = [
      [43.6, 'sine', 0.16],
      [44.15, 'sine', 0.14],
      [87.4, 'triangle', 0.035],
      [65.6, 'sawtooth', 0.012],
    ];
    const oscs = spec.map(([f, type, gv]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const gg = ctx.createGain();
      gg.gain.value = gv;
      o.connect(gg);
      gg.connect(lp);
      o.start();
      return o;
    });
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 340;
    nf.Q.value = 0.6;
    const ng = ctx.createGain();
    ng.gain.value = 0.022;
    src.connect(nf);
    nf.connect(ng);
    ng.connect(out);
    src.start();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = ctx.createGain();
    lg.gain.value = 170;
    lfo.connect(lg);
    lg.connect(nf.frequency);
    lfo.start();
    this.loops.set('amb', () => {
      out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
      window.setTimeout(() => {
        oscs.forEach((o) => o.stop());
        src.stop();
        lfo.stop();
        out.disconnect();
      }, 1500);
    });
  }

  stopAmbience(): void {
    this.stopLoop('amb');
  }

  setFan(on: boolean): void {
    const ctx = this.ctx;
    if (!on) return this.stopLoop('fan');
    if (!ctx || !this.master || !this.noiseBuf || this.loops.has('fan')) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 190;
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 8.5;
    const lg = ctx.createGain();
    lg.gain.value = 0.025;
    lfo.connect(lg);
    lg.connect(g.gain);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.out(0.35));
    src.start();
    lfo.start();
    this.loops.set('fan', () => {
      src.stop();
      lfo.stop();
      g.disconnect();
    });
  }

  setAlarm(on: boolean): void {
    const ctx = this.ctx;
    if (!on) return this.stopLoop('alarm');
    if (!ctx || !this.master || this.loops.has('alarm')) return;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = 880;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    const g = ctx.createGain();
    g.gain.value = 0.035;
    o.connect(lp);
    lp.connect(g);
    g.connect(this.out(0.25));
    o.start();
    let hi = true;
    const id = window.setInterval(() => {
      hi = !hi;
      o.frequency.setValueAtTime(hi ? 880 : 660, ctx.currentTime);
    }, 230);
    this.loops.set('alarm', () => {
      window.clearInterval(id);
      o.stop();
      g.disconnect();
    });
  }

  setHeartbeat(intensity: number): void {
    this.heartbeatIntensity = intensity;
    if (intensity <= 0) {
      if (this.heartbeatTimer != null) window.clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
      return;
    }
    if (this.heartbeatTimer == null) this.beat();
  }

  private beat = (): void => {
    const i = this.heartbeatIntensity;
    if (i <= 0) {
      this.heartbeatTimer = null;
      return;
    }
    this.tone({ type: 'sine', freq: 64, freqEnd: 40, dur: 0.18, gain: 0.35 * i, attack: 0.01 });
    this.tone({ type: 'sine', freq: 56, freqEnd: 38, start: 0.2, dur: 0.2, gain: 0.25 * i, attack: 0.01 });
    this.heartbeatTimer = window.setTimeout(this.beat, (1.1 - 0.55 * i) * 1000);
  };

  private stopLoop(name: string): void {
    const stop = this.loops.get(name);
    if (stop) {
      try {
        stop();
      } catch {
        /* el nodo ya estaba detenido */
      }
      this.loops.delete(name);
    }
  }

  /** Detiene los bucles de la noche (ventilador, alarma, latido). La ambientación sigue. */
  stopNightLoops(): void {
    this.stopLoop('fan');
    this.stopLoop('alarm');
    this.setHeartbeat(0);
  }
}

export const audio = new AudioEngine();

export const panOf = (side: 'L' | 'R'): number => (side === 'L' ? -0.8 : 0.8);
