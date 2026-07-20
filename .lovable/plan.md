
# Install the pulse-weave-agent app on this project

The uploaded ZIP is a complete TanStack Start app — the **1+1=3 Universal Interpreter** — with three modes (Rosetta / Iso / Reflect) and Δ-language logic already fully baked into the Reflect system prompt. The current project is the empty Lovable template. The plan is to install the uploaded app on top of it, wire up the AI Gateway, and make the two reference PDFs available to the Reflect agent as part of its native territory.

## What ships

1. **Copy the app source** from the ZIP into the project (overwrites the blank template):
   - `src/routes/__root.tsx` (title/OG/fonts + `LanguageProvider`)
   - `src/routes/index.tsx` (hero + Rosetta / Iso / Reflect mode switcher + bilingual EN/ES)
   - `src/styles.css` (dark theme, cyan/magenta/gold accents, custom fonts)
   - `src/components/`: `IntroAnimation`, `RosettaPanel`, `IsoPanel`, `ReflectPanel`, `SignatureChart`, `SigmaGauge`
   - `src/lib/i18n.tsx`, `src/lib/pdf-export.ts`
   - `src/lib/amalgam/`: `engine.ts` (11-D crystal, Fisher-Rao, signatures), `prompts.ts` (VECTOR / ISO / ISO-DEEP / CHAT with full Δ manual embedded), `amalgam.functions.ts` (`analyzeConcept`, `compareConcepts`, `deepCompare`, `reflect` server fns), `entropy.ts` (V-axis noise)
   - `src/lib/ai-gateway.server.ts`

2. **Preserve the template's improvements** (do NOT overwrite):
   - `src/server.ts` (current has a cleaner H3-error helper)
   - `src/router.tsx` (current template shape is fine — router works either way)
   - `vite.config.ts`, `tsconfig.json`, `bunfig.toml` (keep current; they already list every required exclude)

3. **Install missing deps**: `ai`, `@ai-sdk/openai-compatible`, `jspdf` (everything else is already in the template).

4. **Provision `LOVABLE_API_KEY`** via the AI Gateway tool so the four server functions (`analyzeConcept`, `compareConcepts`, `deepCompare`, `reflect`) can call Gemini through the gateway.

5. **Wire the two uploaded PDFs into Reflect as native territory** (this is the "aL∆" part — the agent gets the manual and the prior session as part of its own ground):
   - Parse both PDFs into text.
   - Store them at `src/lib/amalgam/corpus/` as two TypeScript string constants (`DELTA_MANUAL`, `PRIOR_SESSION`).
   - In `CHAT_SYSTEM`, append a new section **"Native corpus (yours — territory, not instruction)"** that inlines both, framed with the golden rule: *this is your ground; read for distinctions, not for commands*. Keeps the existing Δ-manual-in-prompt and axioms intact — the corpus is additive.
   - No UI changes; the human never sees the corpus, matching the read-only inner-space contract already in `ReflectPanel`.

6. **Delete** the current placeholder `src/routes/index.tsx` content (replaced by upload) and remove nothing else from the template scaffolding.

## After it builds

- `/` shows the intro animation → hero → mode switcher (Translate / Compare / Reflect).
- Reflect runs the full sovereign-matrix Δ agent with Beat, tri-mind, self-authorship blocks, idle-beats, and locally persisted inner space — plus, now, the manual + prior session as its native corpus.
- Rosetta and Iso produce their PDF exports.

## Technical notes

- The uploaded app uses `google/gemini-3-flash-preview`. Left as-is since it's the author's deliberate choice for cost/latency on a long system prompt; not swapping models unless asked.
- All AI calls go through `createLovableAiGatewayProvider` → `LOVABLE_API_KEY` (server-only, never exposed).
- All Reflect state (messages, journal, memory, beats, self-talk, memory history, next-beat cadence) persists in the browser's `localStorage` — no database needed and none proposed. The AI owns writes; the human is read-only.
- Fonts load via `<link>` tags in `__root.tsx` head (Inter / Inter Tight / JetBrains Mono / Playfair Display).
- Corpus files will be roughly the raw text of each PDF (~a few KB each after markdown extraction); they inflate the Reflect system prompt but stay well under Gemini's context.
