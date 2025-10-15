export default function colorToString(input?: { r?: number; g?: number; b?: number } | string) {
  if (typeof input === 'string' && /^#[0-9A-F]{6}$/i.test(input)) {
      return input.toUpperCase();
  }

  const color = input as { r?: number; g?: number; b?: number };
  const r = color.r ?? 0;
  const g = color.g ?? 0;
  const b = color.b ?? 0;

  const hexString = "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).toUpperCase();
  
  return hexString;
}