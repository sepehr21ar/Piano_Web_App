import { useMemo, useState } from "react";
import PianoKeyboard, { DemoNote } from "../components/PianoKeyboard";

const SONGS: { id: string; name: string; notes: DemoNote[] }[] = [
  {
    id: "ode", 
    name: "Ode To Joy",
    notes: [
      { midi: 64, durationMs: 350 }, { midi: 64, durationMs: 350 }, { midi: 65, durationMs: 350 }, { midi: 67, durationMs: 350 },
      { midi: 67, durationMs: 350 }, { midi: 65, durationMs: 350 }, { midi: 64, durationMs: 350 }, { midi: 62, durationMs: 350 },
      { midi: 60, durationMs: 350 }, { midi: 60, durationMs: 350 }, { midi: 62, durationMs: 350 }, { midi: 64, durationMs: 350 },
      { midi: 64, durationMs: 500 }, { midi: 62, durationMs: 250 }, { midi: 62, durationMs: 700 },
    ],
  },
  {
    id: "twinkle",
    name: "Twinkle Twinkle",
    notes: [
      { midi: 60, durationMs: 400 }, { midi: 60, durationMs: 400 }, { midi: 67, durationMs: 400 }, { midi: 67, durationMs: 400 },
      { midi: 69, durationMs: 400 }, { midi: 69, durationMs: 400 }, { midi: 67, durationMs: 700 },
      { midi: 65, durationMs: 400 }, { midi: 65, durationMs: 400 }, { midi: 64, durationMs: 400 }, { midi: 64, durationMs: 400 },
      { midi: 62, durationMs: 400 }, { midi: 62, durationMs: 400 }, { midi: 60, durationMs: 700 },
    ],
  },
  {
    id: "fur",
    name: "Fur Elise Intro",
    notes: [
      { midi: 76, durationMs: 300 }, { midi: 75, durationMs: 300 }, { midi: 76, durationMs: 300 }, { midi: 75, durationMs: 300 },
      { midi: 76, durationMs: 300 }, { midi: 71, durationMs: 300 }, { midi: 74, durationMs: 300 }, { midi: 72, durationMs: 300 },
      { midi: 69, durationMs: 500 }, { midi: 60, durationMs: 350 }, { midi: 64, durationMs: 350 }, { midi: 69, durationMs: 350 },
      { midi: 71, durationMs: 600 },
    ],
  },
];

export default function PianoPage() {
  const [selectedSongId, setSelectedSongId] = useState("ode");
  const [sequenceToken, setSequenceToken] = useState(0);

  const selectedSong = useMemo(
    () => SONGS.find((song) => song.id === selectedSongId) ?? SONGS[0],
    [selectedSongId],
  );

  return (
    <div className="piano-stage">
      <div className="piano-hero">
        <h2>Hands-on Piano</h2>
        <p>Playable range: C4 to G7. Choose a built-in song and watch notes play on the keyboard.</p>
      </div>

      <div className="song-preset-row">
        {SONGS.map((song) => (
          <button
            key={song.id}
            className={`song-chip ${selectedSongId === song.id ? "active" : ""}`}
            onClick={() => setSelectedSongId(song.id)}
          >
            {song.name}
          </button>
        ))}
        <button className="button" onClick={() => setSequenceToken((t) => t + 1)}>
          Play Selected Song
        </button>
      </div>

      <div className="piano-wrap">
        <PianoKeyboard sequence={selectedSong.notes} sequenceToken={sequenceToken} />
      </div>
    </div>
  );
}
