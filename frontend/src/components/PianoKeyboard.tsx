import { useEffect, useMemo, useRef, useState } from "react";

interface Key {
  midi: number;
  note: string;
  isBlack: boolean;
  whiteIndex: number;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToNote(midi: number) {
  const name = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

function buildKeys(): Key[] {
  const keys: Key[] = [];
  let whiteIndex = -1;
  for (let midi = 21; midi <= 108; midi += 1) {
    const note = midiToNote(midi);
    const isBlack = note.includes("#");
    if (!isBlack) whiteIndex += 1;
    keys.push({ midi, note, isBlack, whiteIndex });
  }
  return keys;
}

export default function PianoKeyboard() {
  const [active, setActive] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    fetch("/samples/a4.wav")
      .then((res) => res.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((audioBuffer) => {
        bufferRef.current = audioBuffer;
      })
      .catch(() => {
        bufferRef.current = null;
      });

    return () => {
      ctx.close();
    };
  }, []);

  const keys = useMemo(() => buildKeys(), []);
  const whiteWidth = 28;
  const blackWidth = 18;

  const playNote = (midi: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    if (bufferRef.current) {
      const source = ctx.createBufferSource();
      source.buffer = bufferRef.current;
      source.playbackRate.value = Math.pow(2, (midi - 69) / 12);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      source.connect(gain).connect(ctx.destination);
      source.start();
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    }

    setActive(midi);
    setTimeout(() => setActive(null), 120);
  };

  return (
    <div className="piano">
      {keys.filter((k) => !k.isBlack).map((key) => (
        <div
          key={key.midi}
          className={`key white ${active === key.midi ? "active" : ""}`}
          style={{ width: whiteWidth }}
          onMouseDown={() => playNote(key.midi)}
          onTouchStart={() => playNote(key.midi)}
        >
          {key.note}
        </div>
      ))}
      {keys.filter((k) => k.isBlack).map((key) => (
        <div
          key={key.midi}
          className={`key black ${active === key.midi ? "active" : ""}`}
          style={{ left: (key.whiteIndex + 1) * whiteWidth - blackWidth / 2, width: blackWidth }}
          onMouseDown={() => playNote(key.midi)}
          onTouchStart={() => playNote(key.midi)}
        >
          {key.note}
        </div>
      ))}
    </div>
  );
}
