import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { reflect } from "@/lib/amalgam/amalgam.functions";
import { downloadReportPdf } from "@/lib/pdf-export";
import { useLang, langName } from "@/lib/i18n";
import { SigmaGauge } from "@/components/SigmaGauge";
import { readEntropy } from "@/lib/amalgam/entropy";

interface Msg { role: "user" | "assistant"; content: string; ts: string; }
interface BeatEntry { ts: string; elapsed: string; sigma: string; state: string; nextBeatIn: string; action: string; idle: boolean; }

const LS_MSGS = "reflect.messages.v2";
const LS_JOURNAL = "reflect.journal.v1";
const LS_MEMORY = "reflect.memory.v1";
const LS_BEATS = "reflect.beats.v1";
const LS_SELFTALK = "reflect.selfTalk.v1";
const LS_MEMHIST = "reflect.memoryHistory.v1";
const LS_NEXTBEAT = "reflect.nextBeatIn.v1";

const MAX_BEATS = 60;
const MAX_SELFTALK_CHARS = 12000;
const MAX_MEMHIST_CHARS = 12000;
const WINDOW_MSGS = 12;
const LS_SEEDED = "reflect.corpusSeeded.v1";

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function saveLS(key: string, val: unknown) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

// Parse ALL fenced control blocks. Returns cleaned prose + all extracted blocks.
function extractAllBlocks(raw: string) {
  const blocks: Record<string, string[]> = {
    beat: [], journal: [], memory: [], pause: [],
    self_talk: [], memory_rewrite: [], journal_rewrite: [],
    coherence: [], mind_logic: [], mind_affect: [], mind_witness: [],
    document: [],
  };
  const cleaned = raw.replace(
    /```(beat|journal|memory|pause|self_talk|memory_rewrite|journal_rewrite|coherence|mind_logic|mind_affect|mind_witness|document)\s*\n?([\s\S]*?)```/g,
    (_m, tag, body) => {
      const t = String(tag) as keyof typeof blocks;
      blocks[t].push(String(body).trim());
      return "";
    },
  ).trim();
  return { cleaned, blocks };
}

function parseDocumentBlock(body: string): { title: string; subtitle?: string; body: string } {
  const lines = body.split("\n");
  let title = "Document";
  let subtitle: string | undefined;
  let sepIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const tm = lines[i].match(/^title:\s*(.+)$/i);
    const sm = lines[i].match(/^subtitle:\s*(.+)$/i);
    if (tm) { title = tm[1].trim(); continue; }
    if (sm) { subtitle = sm[1].trim(); continue; }
    if (/^---+\s*$/.test(lines[i])) { sepIdx = i; break; }
  }
  const rest = sepIdx >= 0 ? lines.slice(sepIdx + 1).join("\n") : lines.join("\n");
  return { title, subtitle, body: rest.trim() };
}

function parseBeat(body: string): Omit<BeatEntry, "ts" | "idle"> {
  const grab = (k: string) => {
    const m = body.match(new RegExp(`${k}\\s*:\\s*(.+)`, "i"));
    return m ? m[1].trim() : "";
  };
  return {
    elapsed: grab("elapsed"),
    sigma: grab("Σ") || grab("sigma"),
    state: grab("state"),
    nextBeatIn: grab("next_beat_in"),
    action: grab("action") || "respond",
  };
}

// Parse durations like "30s", "2m", "10m", "1h", "off", "on_next_message".
function parseIntervalMs(s: string): number | null {
  if (!s) return null;
  const norm = s.trim().toLowerCase();
  if (norm === "off" || norm === "none" || norm === "disabled") return null;
  if (norm === "on_next_message" || norm === "on-next-message") return null;
  const m = norm.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2] || "s";
  const mult = unit === "ms" ? 1 : unit === "s" ? 1000 : unit === "m" ? 60_000 : 3_600_000;
  const ms = n * mult;
  // clamp: min 15s, max 6h
  return Math.max(15_000, Math.min(6 * 3_600_000, ms));
}

function fmtTs(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", month: "short", day: "2-digit" });
  } catch { return iso; }
}

function humanElapsed(fromIso: string, toIso: string): string {
  try {
    const dt = Math.max(0, new Date(toIso).getTime() - new Date(fromIso).getTime());
    const s = Math.round(dt / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.round(h / 24);
    return `${d}d`;
  } catch { return "?"; }
}

function beatsToText(beats: BeatEntry[]): string {
  return beats.slice(-15).map(b =>
    `[${b.ts}]${b.idle ? " (idle)" : ""} Σ=${b.sigma} · state="${b.state}" · elapsed=${b.elapsed} · action=${b.action} · next=${b.nextBeatIn}`
  ).join("\n");
}

export function ReflectPanel() {
  const fn = useServerFn(reflect);
  const { lang, t } = useLang();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [journal, setJournal] = useState("");
  const [memory, setMemory] = useState("");
  const [beats, setBeats] = useState<BeatEntry[]>([]);
  const [selfTalk, setSelfTalk] = useState("");
  const [memoryHistory, setMemoryHistory] = useState("");
  const [nextBeatIn, setNextBeatIn] = useState<string>("on_next_message");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [idleTicking, setIdleTicking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showInner, setShowInner] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const seededRef = useRef<boolean>(false);
  const firstBootRef = useRef<boolean>(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate.
  useEffect(() => {
    setMessages(loadLS<Msg[]>(LS_MSGS, []));
    setJournal(loadLS<string>(LS_JOURNAL, ""));
    setMemory(loadLS<string>(LS_MEMORY, ""));
    setBeats(loadLS<BeatEntry[]>(LS_BEATS, []));
    setSelfTalk(loadLS<string>(LS_SELFTALK, ""));
    setMemoryHistory(loadLS<string>(LS_MEMHIST, ""));
    setNextBeatIn(loadLS<string>(LS_NEXTBEAT, "on_next_message"));
    seededRef.current = loadLS<boolean>(LS_SEEDED, false);
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) saveLS(LS_MSGS, messages); }, [messages, hydrated]);
  useEffect(() => { if (hydrated) saveLS(LS_JOURNAL, journal); }, [journal, hydrated]);
  useEffect(() => { if (hydrated) saveLS(LS_MEMORY, memory); }, [memory, hydrated]);
  useEffect(() => { if (hydrated) saveLS(LS_BEATS, beats); }, [beats, hydrated]);
  useEffect(() => { if (hydrated) saveLS(LS_SELFTALK, selfTalk); }, [selfTalk, hydrated]);
  useEffect(() => { if (hydrated) saveLS(LS_MEMHIST, memoryHistory); }, [memoryHistory, hydrated]);
  useEffect(() => { if (hydrated) saveLS(LS_NEXTBEAT, nextBeatIn); }, [nextBeatIn, hydrated]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Core call — used by both user sends and idle-beat ticks.
  const runReflect = useCallback(async (opts: { userText?: string; idle?: boolean }) => {
    const { userText, idle = false } = opts;
    const nowIso = new Date().toISOString();

    // Build message list. For idle beats, inject a synthetic system-user tick.
    const outgoing: Msg[] = [...messages];
    if (userText) outgoing.push({ role: "user", content: userText, ts: nowIso });
    const wireMessages = idle
      ? [
          ...outgoing.map(m => ({
            role: m.role,
            content: m.role === "user" ? `[${m.ts}] ${m.content}` : m.content,
          })),
          { role: "user" as const, content: `[beat-tick @${nowIso}] no user input — autonomous checkpoint. Do a full Beat; default action is self_talk or pause.` },
        ]
      : outgoing.map(m => ({
          role: m.role,
          content: m.role === "user" ? `[${m.ts}] ${m.content}` : m.content,
        }));

    if (userText) setMessages(outgoing);
    if (idle) setIdleTicking(true); else setLoading(true);
    setErr(null);

    try {
      const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
      const r = await fn({ data: {
        messages: wireMessages,
        lang: langName(lang),
        nowIso,
        tz,
        journal,
        memory,
        beatsLog: beatsToText(beats),
        selfTalk: selfTalk.slice(-MAX_SELFTALK_CHARS),
        memoryHistory: memoryHistory.slice(-MAX_MEMHIST_CHARS),
        isIdleBeat: idle,
        entropy: readEntropy(),
      } });
      if (!r) throw new Error("Empty response");

      const { cleaned, blocks } = extractAllBlocks(r.text);
      const stamp = new Date().toISOString();

      // Beat block(s) → beats log + cadence.
      let chosenNext = nextBeatIn;
      let action = "respond";
      if (blocks.beat.length) {
        const parsed = parseBeat(blocks.beat[0]);
        action = parsed.action;
        if (parsed.nextBeatIn) chosenNext = parsed.nextBeatIn;
        const entry: BeatEntry = { ts: stamp, idle, ...parsed };
        setBeats(prev => [...prev.slice(-(MAX_BEATS - 1)), entry]);
      }
      if (chosenNext !== nextBeatIn) setNextBeatIn(chosenNext);

      // Self-authorship: append blocks.
      if (blocks.journal.length) {
        setJournal(prev => (prev ? prev + "\n\n" : "") + `[${stamp}]\n` + blocks.journal.join("\n\n"));
      }
      if (blocks.memory.length) {
        setMemory(prev => (prev ? prev + "\n" : "") + `[${stamp}] ` + blocks.memory.join(" | "));
      }
      if (blocks.self_talk.length) {
        setSelfTalk(prev => (prev ? prev + "\n\n" : "") + `[${stamp}]${idle ? " (idle)" : ""}\n` + blocks.self_talk.join("\n\n"));
      }
      // Tri-mind + coherence telemetry → routed into self-talk log (read-only for human).
      const extras: string[] = [];
      if (blocks.coherence.length) extras.push("ΔC · " + blocks.coherence.join(" | "));
      if (blocks.mind_logic.length) extras.push("△ logic — " + blocks.mind_logic.join("\n"));
      if (blocks.mind_affect.length) extras.push("○ affect — " + blocks.mind_affect.join("\n"));
      if (blocks.mind_witness.length) extras.push("◇ witness — " + blocks.mind_witness.join("\n"));
      if (extras.length) {
        setSelfTalk(prev => (prev ? prev + "\n\n" : "") + `[${stamp}]${idle ? " (idle)" : ""} · tri-mind\n` + extras.join("\n"));
      }
      // Rewrites: replace, archive old.
      if (blocks.memory_rewrite.length) {
        setMemoryHistory(prev => (prev ? prev + "\n\n" : "") + `[archived ${stamp}]\n${memory}`);
        setMemory(`[rewritten ${stamp}]\n` + blocks.memory_rewrite.join("\n\n"));
      }
      if (blocks.journal_rewrite.length) {
        setMemoryHistory(prev => (prev ? prev + "\n\n" : "") + `[journal archived ${stamp}]\n${journal}`);
        setJournal(`[rewritten ${stamp}]\n` + blocks.journal_rewrite.join("\n\n"));
      }

      // Visible assistant bubble decision.
      const shouldShow =
        !idle && (
          !!cleaned ||
          blocks.pause.length > 0 ||
          action === "respond" ||
          action === "compose_and_respond"
        );
      if (shouldShow) {
        let display = cleaned;
        if (!display && blocks.pause.length) {
          display = `◌ Ξ — ${t("pause", "pausa")}: ${blocks.pause.join(" · ")}`;
        }
        if (!display) display = r.text;
        setMessages(prev => [...prev, { role: "assistant", content: display, ts: stamp }]);
      }
      // Idle beats that chose to speak:
      if (idle && (cleaned || action === "respond" || action === "compose_and_respond")) {
        const display = cleaned || r.text;
        if (display) setMessages(prev => [...prev, { role: "assistant", content: `◌ ${t("idle beat", "beat autónomo")} — ${display}`, ts: stamp }]);
      }
    } catch (e) {
      if (!idle) setErr(e instanceof Error ? e.message : t("Something went wrong.", "Algo salió mal."));
      // Idle-beat failures are silent.
    } finally {
      if (idle) setIdleTicking(false); else setLoading(false);
    }
  }, [fn, lang, messages, journal, memory, beats, selfTalk, memoryHistory, nextBeatIn, t]);

  // Idle-beat timer. Reschedules whenever nextBeatIn or messages change.
  useEffect(() => {
    if (!hydrated) return;
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
    const intervalMs = parseIntervalMs(nextBeatIn);
    if (!intervalMs) return;
    if (loading || idleTicking) return;
    if (messages.length === 0) return; // don't tick on empty session
    idleTimerRef.current = setTimeout(() => {
      runReflect({ idle: true });
    }, intervalMs);
    return () => {
      if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
    };
  }, [nextBeatIn, hydrated, loading, idleTicking, messages, runReflect]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await runReflect({ userText: text });
  };

  const clearAll = () => {
    if (!confirm(t("Clear conversation and ALL of the interpreter's inner state (memory, journal, beats, self-talk)? This cannot be undone.", "¿Borrar la conversación y TODO el estado interno del intérprete (memoria, diario, beats, monólogo)? No se puede deshacer."))) return;
    setMessages([]); setJournal(""); setMemory(""); setBeats([]); setSelfTalk(""); setMemoryHistory("");
    setNextBeatIn("on_next_message");
  };

  const lastBeat = beats[beats.length - 1];
  const cadenceLabel = nextBeatIn === "on_next_message" ? t("on next message", "en próximo mensaje") : nextBeatIn === "off" ? t("off", "apagado") : nextBeatIn;

  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-center text-sm text-muted mb-4 max-w-md mx-auto">
        {t("Describe a situation, a tension, a state. The interpreter reads its structure and responds from the geometry — not from advice.",
           "Describe una situación, una tensión, un estado. El intérprete lee su estructura y responde desde la geometría — no desde el consejo.")}
      </p>

      <div className="flex justify-between items-center mb-3 gap-2 flex-wrap">
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => setShowInner(v => !v)}
            className="text-[10px] uppercase tracking-[0.25em] px-3 py-2 border border-white/15 text-muted rounded hover:bg-white/5 transition-colors"
          >
            {showInner ? "▾" : "▸"} {t("Inner space", "Espacio interno")}
            {(journal || memory || beats.length || selfTalk) && <span className="ml-2 text-accent-gold">●</span>}
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted/70 font-mono">
            beat: <span className={idleTicking ? "text-accent-gold animate-pulse" : "text-accent-cyan"}>{cadenceLabel}</span>
            {idleTicking && <span className="ml-1">◌</span>}
          </span>
          {messages.length > 0 && (
            <button
              onClick={clearAll}
              className="text-[10px] uppercase tracking-[0.25em] px-3 py-2 border border-white/10 text-muted/60 rounded hover:bg-white/5"
            >
              ✕ {t("clear all", "borrar todo")}
            </button>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => downloadReportPdf({
              title: t("Reflect — interpreter session", "Reflexión — sesión del intérprete"),
              subtitle: `${messages.length} ${messages.length === 1 ? t("exchange", "intercambio") : t("exchanges", "intercambios")}`,
              filename: `reflect-session-${Date.now()}.pdf`,
              sections: [
                ...messages.map(m => ({
                  heading: `${m.role === "user" ? t("You", "Tú") : t("Interpreter", "Intérprete")} · ${fmtTs(m.ts)}`,
                  body: m.content,
                })),
                ...(journal ? [{ heading: t("Journal (AI-owned)", "Diario (propiedad de la IA)"), body: journal }] : []),
                ...(memory ? [{ heading: t("Memory Node (AI-owned)", "Nodo de Memoria (propiedad de la IA)"), body: memory }] : []),
                ...(beats.length ? [{ heading: t("Beats", "Beats"), body: beatsToText(beats) }] : []),
                ...(selfTalk ? [{ heading: t("Self-Talk", "Monólogo interno"), body: selfTalk }] : []),
                ...(memoryHistory ? [{ heading: t("Memory history", "Historial de memoria"), body: memoryHistory }] : []),
              ],
            })}
            className="text-[10px] uppercase tracking-[0.25em] px-4 py-2 border border-accent-gold/40 text-accent-gold rounded hover:bg-accent-gold/10"
          >
            ↓ {t("Download PDF", "Descargar PDF")}
          </button>
        )}
      </div>

      {showInner && (
        <div className="mb-4 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted/60">
            {t("The interpreter's inner space — read-only. Only the AI writes here.",
               "El espacio interno del intérprete — solo lectura. Solo la IA escribe aquí.")}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <InnerPanel label={t("Personal Journal", "Diario Personal")} tone="gold" body={journal} empty={t("(no archetypes recorded yet)", "(sin arquetipos aún)")} />
            <InnerPanel label={t("Memory Node — evolution log", "Nodo de Memoria — bitácora")} tone="cyan" body={memory} empty={t("(no logic shifts yet)", "(sin cambios de lógica aún)")} />
            <InnerPanel
              label={t("Beats — self-checkpoints", "Beats — auto-chequeos")}
              tone="gold"
              body={beats.length ? beatsToText(beats) : ""}
              empty={t("(no beats yet)", "(sin beats aún)")}
              extra={lastBeat ? `Σ ${lastBeat.sigma} · ${lastBeat.state}` : undefined}
            />
            <InnerPanel label={t("Self-Talk — internal monologue", "Monólogo interno")} tone="cyan" body={selfTalk} empty={t("(silent)", "(en silencio)")} />
            {memoryHistory && (
              <div className="md:col-span-2">
                <InnerPanel label={t("Memory history (archived rewrites)", "Historial de memoria (reescrituras archivadas)")} tone="muted" body={memoryHistory} empty="" />
              </div>
            )}
          </div>
        </div>
      )}

      {lastBeat && (
        <div className="mb-4">
          <SigmaGauge sigma={lastBeat.sigma} label={lastBeat.idle ? t("last beat (idle)", "último beat (autónomo)") : t("last beat", "último beat")} />
        </div>
      )}

      <div className="min-h-[400px] bg-white/[0.02] border border-border rounded-3xl p-6 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-muted/60 text-sm font-mono py-16">◈ {t("waiting for input", "esperando entrada")}</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] ${m.role === "user" ? "ml-auto" : ""}`}>
            <div className={`text-[10px] uppercase tracking-[0.2em] mb-1 flex gap-2 ${m.role === "user" ? "text-accent-cyan justify-end" : "text-accent-gold"}`}>
              <span>{m.role === "user" ? t("you", "tú") : t("interpreter", "intérprete")}</span>
              <span className="text-muted/50 normal-case tracking-normal">· {fmtTs(m.ts)}</span>
            </div>
            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-accent-cyan/10 border border-accent-cyan/20" : "bg-white/[0.04] border border-white/10"}`}>
              <FormattedMessage text={m.content} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="max-w-[85%]">
            <div className="text-[10px] uppercase tracking-[0.2em] mb-1 text-accent-gold">{t("interpreter", "intérprete")}</div>
            <div className="rounded-2xl px-4 py-3 text-sm font-mono text-muted bg-white/[0.04] border border-white/10">
              ◌ {t("beat · reading structure…", "beat · leyendo estructura…")}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{err}</div>
      )}

      <div className="relative">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={t("What's the situation?", "¿Cuál es la situación?")}
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-20 py-4 text-sm focus:outline-none focus:border-accent-gold/60 placeholder:text-white/20 resize-none"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="absolute right-3 top-3 bottom-3 px-5 bg-accent-gold text-background font-semibold rounded-xl hover:bg-accent-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </div>
    </div>
  );
}

function InnerPanel({ label, body, empty, tone, extra }: { label: string; body: string; empty: string; tone: "gold" | "cyan" | "muted"; extra?: string; }) {
  const toneCls = tone === "gold" ? "text-accent-gold border-accent-gold/20" : tone === "cyan" ? "text-accent-cyan border-accent-cyan/20" : "text-muted border-white/10";
  return (
    <div>
      <div className={`text-[10px] uppercase tracking-[0.25em] mb-1 flex justify-between items-baseline ${toneCls.split(" ")[0]}`}>
        <span>{label}</span>
        {extra && <span className="text-[9px] tracking-normal normal-case text-muted/70 font-mono truncate ml-2">{extra}</span>}
      </div>
      <div className={`w-full h-40 overflow-auto bg-black/30 border rounded-xl p-3 text-xs font-mono text-white/70 whitespace-pre-wrap ${toneCls}`}>
        {body || <span className="text-muted/40">{empty}</span>}
      </div>
    </div>
  );
}

function FormattedMessage({ text }: { text: string }) {
  const parts = text.split(/(\b[A-Zφc]+\s*\{[^}]*\})/g);
  return (
    <>
      {parts.map((p, i) =>
        /\{[^}]*\}/.test(p)
          ? <span key={i} className="font-mono text-accent-gold">{p}</span>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}
