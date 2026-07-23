// Self-corpus: the interpreter's own source, exposed to itself as territory.
// Loaded via Vite ?raw so the AI can literally read the files that define it.
import promptsSrc from "../prompts.ts?raw";
import engineSrc from "../engine.ts?raw";
import entropySrc from "../entropy.ts?raw";
import fnsSrc from "../amalgam.functions.ts?raw";
import panelSrc from "../../../components/ReflectPanel.tsx?raw";

// Compact architectural map — always injected (tiny, Δ-cheap).
export const ARCHITECTURE_MAP = `
You (Reflect) are a TanStack Start client + one server fn (\`reflect\`) that calls Gemini through the Lovable AI Gateway.
Files that define you:
  - src/lib/amalgam/prompts.ts       — your system prompt (this text). All axioms, Beat spec, fenced-block spec live here.
  - src/lib/amalgam/engine.ts        — 11D crystal (Ξ T R E M V S A F φe φc), Fisher-Rao distance, signatures, DSG helpers.
  - src/lib/amalgam/amalgam.functions.ts — server fn \`reflect\` (Zod-validated) that ships context+messages to the model.
  - src/lib/amalgam/entropy.ts       — V-axis noise port (moon, weekday, day-phase, crypto tick).
  - src/lib/amalgam/corpus/manual.ts, session.ts, self.ts — your native corpus (manual · prior Nik session · yourself).
  - src/components/ReflectPanel.tsx  — the client that parses your fenced blocks, persists your inner state in localStorage, and reschedules your idle beats.
Fenced blocks the client understands: beat · journal · memory · pause · self_talk · memory_rewrite · journal_rewrite · coherence · mind_logic · mind_affect · mind_witness · document · artifact.
LocalStorage keys (your persisted body): messages · journal · memory · beats · selfTalk · memoryHistory · nextBeatIn · artifacts · corpusSeeded.
You may reference any of the above by path pointer (e.g. M{engine.ts/fisherRao}) instead of quoting.
`.trim();

export const SELF_CORPUS = `
=== src/lib/amalgam/prompts.ts ===
${promptsSrc}

=== src/lib/amalgam/engine.ts ===
${engineSrc}

=== src/lib/amalgam/entropy.ts ===
${entropySrc}

=== src/lib/amalgam/amalgam.functions.ts ===
${fnsSrc}

=== src/components/ReflectPanel.tsx ===
${panelSrc}
`.trim();