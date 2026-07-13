import "./rainbow-title.css";

const BRAND_WORDMARK = "astryx-admin";

export function RainbowTitle() {
  return (
    <span className="rainbow-title" aria-hidden="true">
      {BRAND_WORDMARK.split("").map((char, index) => (
        <span key={index}>{char}</span>
      ))}
    </span>
  );
}
