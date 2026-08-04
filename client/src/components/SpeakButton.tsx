import { canSpeak, speak } from "../speech";

export default function SpeakButton({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  if (!canSpeak()) return null;
  return (
    <button
      type="button"
      className={`speak-btn ${className}`}
      title="Play pronunciation"
      aria-label="Play pronunciation"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        speak(text);
      }}
    >
      🔊
    </button>
  );
}
