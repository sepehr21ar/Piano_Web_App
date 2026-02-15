import { useEffect, useMemo, useRef, useState } from "react";

interface Key {
  midi: number;
  note: string;
  isBlack: boolean;
  whiteIndex: number;
}

export interface DemoNote {
  midi: number;
  durationMs: number;
}

interface PianoKeyboardProps {
  sequence?: DemoNote[];
  sequenceToken?: number;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MIN_MIDI = 60; // C4
const MAX_MIDI = 103; // G7

function midiToNote(midi: number) {
  const name = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

function buildKeys(): Key[] {
  const keys: Key[] = [];
  let whiteIndex = -1;
  for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi += 1) {
    const note = midiToNote(midi);
    const isBlack = note.includes("#");
    if (!isBlack) whiteIndex += 1;
    keys.push({ midi, note, isBlack, whiteIndex });
  }
  return keys;
}

function createImpulseResponse(ctx: AudioContext) {
  const seconds = 1.2;
  const length = Math.floor(seconds * ctx.sampleRate);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const decay = Math.pow(1 - i / length, 2.4);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
  }
  return impulse;
}

export default function PianoKeyboard({ sequence = [], sequenceToken = 0 }: PianoKeyboardProps) {
  const [active, setActive] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const keys = useMemo(() => buildKeys(), []);
  const whiteWidth = 34;
  const blackWidth = 22;

  const ensureAudioGraph = () => {
    if (audioCtxRef.current && masterRef.current && reverbRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
    masterRef.current = master;

    const reverb = ctx.createConvolver();
    reverb.buffer = createImpulseResponse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.24;
    reverb.connect(wet).connect(master);
    reverbRef.current = reverb;
  };

  const playNote = (midi: number, velocity = 1) => {
    ensureAudioGraph();
    const ctx = audioCtxRef.current;
    const master = masterRef.current;
    const reverb = reverbRef.current;
    if (!ctx || !master || !reverb) return;
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);

    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.linearRampToValueAtTime(0.62 * velocity, now + 0.005);
    bodyGain.gain.exponentialRampToValueAtTime(0.22 * velocity, now + 0.16);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2800, now);
    filter.Q.value = 0.8;

    const osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(freq, now);
    osc1.detune.value = -1.5;

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, now);
    osc2.detune.value = 1.5;

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.value = 0.25;

    osc1.connect(filter);
    osc2.connect(harmonicGain).connect(filter);
    filter.connect(bodyGain).connect(master);
    bodyGain.connect(reverb);

    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i += 1) {
      noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseData.length);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 1500;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.11 * velocity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    noise.connect(noiseFilter).connect(noiseGain).connect(master);

    osc1.start(now);
    osc2.start(now);
    noise.start(now);
    osc1.stop(now + 1.6);
    osc2.stop(now + 1.6);
    noise.stop(now + 0.04);

    setActive(midi);
    window.setTimeout(() => setActive((curr) => (curr === midi ? null : curr)), 140);
  };

  useEffect(() => {
    for (const timer of timeoutsRef.current) {
      window.clearTimeout(timer);
    }
    timeoutsRef.current = [];

    if (!sequence.length || sequenceToken === 0) return;
    let elapsed = 0;
    for (const note of sequence) {
      const timer = window.setTimeout(() => playNote(note.midi, 0.9), elapsed);
      timeoutsRef.current.push(timer);
      elapsed += note.durationMs;
    }
    return () => {
      for (const timer of timeoutsRef.current) {
        window.clearTimeout(timer);
      }
      timeoutsRef.current = [];
    };
  }, [sequenceToken]);

  return (
    <div className="piano">
      {keys.filter((k) => !k.isBlack).map((key) => (
        <div
          key={key.midi}
          className={`key white ${active === key.midi ? "active" : ""}`}
          style={{ width: whiteWidth }}
          onMouseDown={() => playNote(key.midi, 1)}
          onTouchStart={() => playNote(key.midi, 1)}
        >
          {key.note}
        </div>
      ))}
      {keys.filter((k) => k.isBlack).map((key) => (
        <div
          key={key.midi}
          className={`key black ${active === key.midi ? "active" : ""}`}
          style={{ left: (key.whiteIndex + 1) * whiteWidth - blackWidth / 2, width: blackWidth }}
          onMouseDown={() => playNote(key.midi, 1)}
          onTouchStart={() => playNote(key.midi, 1)}
        >
          {key.note}
        </div>
      ))}
    </div>
  );
}
