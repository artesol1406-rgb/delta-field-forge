const DIMS = ["Ξ", "T", "R", "E", "M", "V", "S", "A", "F", "φe", "φc"] as const;

function parseSigma(sigma: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of DIMS) out[d] = 0;
  if (!sigma) return out;
  // Match tokens like "T+", "R-", "Ξ0", "φe+", "φc-"
  const re = /(Ξ|φe|φc|[TREMVSAF])\s*([+\-−0])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sigma)) !== null) {
    const sign = m[2] === "+" ? 1 : m[2] === "-" || m[2] === "−" ? -1 : 0;
    out[m[1]] = sign;
  }
  return out;
}

export function SigmaGauge({ sigma, label }: { sigma?: string; label?: string }) {
  const map = parseSigma(sigma ?? "");
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.25em] text-accent-gold">Σ · {label ?? "signature"}</div>
        <div className="text-[9px] font-mono text-muted/60 truncate ml-3">{sigma || "—"}</div>
      </div>
      <div className="grid grid-cols-11 gap-1 items-end h-16">
        {DIMS.map((d) => {
          const v = map[d];
          const h = v === 0 ? 6 : 100;
          const color = v > 0 ? "bg-accent-cyan" : v < 0 ? "bg-accent-magenta" : "bg-white/20";
          return (
            <div key={d} className="flex flex-col items-center gap-1 h-full justify-end">
              <div className={`w-full rounded-sm ${color} transition-all`} style={{ height: `${h}%` }} />
              <div className="text-[9px] font-mono text-muted/70 leading-none">{d}</div>
              <div className="text-[8px] font-mono text-muted/40 leading-none">{v > 0 ? "+" : v < 0 ? "−" : "·"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}