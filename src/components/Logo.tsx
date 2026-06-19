/**
 * Caira brand mark — three flowing ribbons with a play notch, on a rounded
 * purple tile. Self-contained (works on any background).
 */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flex: 'none', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cairaTile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6c5ce7" />
          <stop offset="1" stopColor="#4a3bc4" />
        </linearGradient>
      </defs>
      <rect width="56" height="56" rx="16" fill="url(#cairaTile)" />
      <path d="M8 14 C20 6, 36 6, 48 14 C36 18, 20 18, 8 14 Z" fill="#ffffff" opacity="0.55" />
      <path d="M8 28 C20 20, 36 20, 48 28 C36 32, 20 32, 8 28 Z" fill="#ffffff" opacity="0.78" />
      <path d="M8 42 C20 34, 36 34, 48 42 C36 46, 20 46, 8 42 Z" fill="#ffffff" />
      <path d="M24 21 L37 28 L24 35 Z" fill="#4a3bc4" />
    </svg>
  );
}

/** "Caira" wordmark in the brand typeface. */
export function Wordmark({ size = 17, color = 'var(--ink)' }: { size?: number; color?: string }) {
  return (
    <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: size, letterSpacing: '-0.03em', color }}>
      Caira
    </span>
  );
}
