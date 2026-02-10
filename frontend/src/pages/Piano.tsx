import PianoKeyboard from "../components/PianoKeyboard";

export default function PianoPage() {
  return (
    <div>
      <h2>Hands-on Piano</h2>
      <div className="piano-wrap">
        <PianoKeyboard />
      </div>
    </div>
  );
}
