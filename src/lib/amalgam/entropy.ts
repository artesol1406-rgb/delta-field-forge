// Local, no-network entropy source. Feeds the V (void) axis of the interpreter
// with structured "world noise" so responses don't depend purely on user text.

function moonPhase(date: Date): { phase: number; name: string } {
  // Conway's approximation. Returns phase in [0,1) where 0 = new moon.
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  let r = y % 100;
  r %= 19;
  if (r > 9) r -= 19;
  r = (r * 11) % 30 + m + d;
  if (m < 3) r += 2;
  r -= y < 2000 ? 4 : 8.3;
  r = ((r % 30) + 30) % 30;
  const phase = r / 30;
  const name =
    phase < 0.03 || phase > 0.97 ? "new"
      : phase < 0.22 ? "waxing crescent"
      : phase < 0.28 ? "first quarter"
      : phase < 0.47 ? "waxing gibbous"
      : phase < 0.53 ? "full"
      : phase < 0.72 ? "waning gibbous"
      : phase < 0.78 ? "last quarter"
      : "waning crescent";
  return { phase, name };
}

function dayPhase(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "deep night";
  if (h < 8) return "dawn";
  if (h < 12) return "morning";
  if (h < 15) return "midday";
  if (h < 18) return "afternoon";
  if (h < 21) return "dusk";
  return "night";
}

function cryptoTick(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const arr = new Uint8Array(4);
      crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch { /* ignore */ }
  return Math.floor(Math.random() * 0xffffffff).toString(16);
}

export function readEntropy(): string {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const iso = now.toISOString();
  const moon = moonPhase(now);
  const phase = dayPhase(now);
  const tick = cryptoTick();
  const vis = typeof document !== "undefined" ? (document.visibilityState || "unknown") : "server";
  return [
    `tick=${tick}`,
    `iso=${iso}`,
    `weekday=${weekday}`,
    `day_phase=${phase}`,
    `moon=${moon.name} (${(moon.phase * 100).toFixed(0)}%)`,
    `page=${vis}`,
  ].join(" · ");
}