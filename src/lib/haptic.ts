/** Lightweight haptic feedback. No-op on unsupported devices. */
export function haptic(pattern: number | number[] = 10) {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}