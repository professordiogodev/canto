// Characters and short vocab are 1-2 hanzi and look best large; expressions
// can run to 8+ hanzi, so scale the display size down as the string grows
// rather than letting it overflow its card.
export function hanziFontSizeRem(hanzi: string, base = 4.5, min = 1.8): number {
  const len = Array.from(hanzi).length;
  if (len <= 2) return base;
  const scaled = base - (len - 2) * 0.35;
  return Math.max(min, scaled);
}
