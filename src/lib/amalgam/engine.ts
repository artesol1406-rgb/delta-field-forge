export const DIMS = ['Ξ','T','R','E','M','V','S','A','F','φe','φc'] as const;
export type Dim = typeof DIMS[number];
export type Vec = Record<Dim, number>;

export const DIM_DESC: Record<Dim, string> = {
  'Ξ':'Pause/Silence','T':'Tension','R':'Relation','E':'Expansion',
  'M':'Memory','V':'Void','S':'System','A':'Action','F':'Focus',
  'φe':'Fractal expansion','φc':'Fractal contraction',
};

export const DIM_DESC_ES: Record<Dim, string> = {
  'Ξ':'Pausa/Silencio','T':'Tensión','R':'Relación','E':'Expansión',
  'M':'Memoria','V':'Vacío','S':'Sistema','A':'Acción','F':'Foco',
  'φe':'Expansión fractal','φc':'Contracción fractal',
};

export const DOMAIN_NAME_ES: Record<string, string> = {
  physics: 'Física', music: 'Música', psychology: 'Psicología',
  narrative: 'Narrativa', biology: 'Biología', math: 'Matemáticas',
  philosophy: 'Filosofía', ecology: 'Ecología',
  religion: 'Religión', systems: 'Ingeniería de sistemas',
};

export function dimDesc(d: Dim, lang: 'en' | 'es' = 'en') {
  return (lang === 'es' ? DIM_DESC_ES : DIM_DESC)[d];
}

export function domainName(key: string, name: string, lang: 'en' | 'es' = 'en') {
  return lang === 'es' ? (DOMAIN_NAME_ES[key] ?? name) : name;
}

export interface Domain {
  name: string;
  icon: string;
  vocab: Record<Dim, string[]>;
}

export const DOMAINS: Record<string, Domain> = {
  physics:   { name:'Physics',     icon:'⚛', vocab:{ 'Ξ':['quantum vacuum','equilibrium point','ground state'],'T':['tension','gradient','force field','entropy'],'R':['gravitational field','interaction','coupling'],'E':['expansion','kinetic energy','rising entropy'],'M':['inertia','mass','system history'],'V':['dissipation','radiation','energy loss'],'S':['symmetry','conservation','invariant law'],'A':['acceleration','momentum','work'],'F':['energy focus','resonance','coherence'],'φe':['expansive fractal','deterministic chaos'],'φc':['singularity','gravitational collapse'] } },
  music:     { name:'Music',       icon:'♪', vocab:{ 'Ξ':['silence','rest','fermata'],'T':['dissonance','harmonic tension','diminished chord'],'R':['counterpoint','harmony','consonance'],'E':['crescendo','modulation','thematic development'],'M':['recurring motif','leitmotif','main theme'],'V':['decrescendo','resolution','cadence'],'S':['formal structure','sonata form','tonality'],'A':['rhythm','tempo','pulse'],'F':['main melody','solo voice','timbral focus'],'φe':['improvisation','free variation'],'φc':['pedal tone','ostinato','loop'] } },
  psychology:{ name:'Psychology',  icon:'◉', vocab:{ 'Ξ':['reflective pause','full presence','mindfulness'],'T':['inner conflict','anxiety','cognitive dissonance'],'R':['bond','attachment','transference'],'E':['growth','openness','self-expansion'],'M':['implicit memory','trauma','personal history'],'V':['catharsis','letting go','grief'],'S':['ego structure','defense','cognitive schema'],'A':['behavior','impulse','agency'],'F':['attention','concentration','cognitive flow'],'φe':['divergent thinking','creativity'],'φc':['rumination','obsessive loop'] } },
  narrative: { name:'Narrative',   icon:'§', vocab:{ 'Ξ':['dramatic pause','ellipsis','frozen time'],'T':['conflict','antagonism','knot'],'R':['character relationship','alliance','love'],'E':['climax','revelation','world opening'],'M':['backstory','flashback','hero memory'],'V':['mentor death','loss','sacrifice'],'S':['narrative structure','character arc','plot'],'A':['action','decision','plot twist'],'F':['hero goal','call to adventure'],'φe':['open world','multiple endings'],'φc':['inevitable fate','tragedy'] } },
  biology:   { name:'Biology',     icon:'❋', vocab:{ 'Ξ':['homeostasis','resting state','latency'],'T':['inflammation','cell stress','alarm signal'],'R':['symbiosis','cell communication','neural network'],'E':['growth','differentiation','mitosis'],'M':['DNA','epigenetics','immune memory'],'V':['apoptosis','autophagy','programmed cell death'],'S':['organism','ecosystem','homeostatic regulation'],'A':['movement','metabolism','motor response'],'F':['specialization','ecological niche','selection'],'φe':['evolution','phylogenetic branching'],'φc':['extinction','ecological collapse'] } },
  math:      { name:'Mathematics', icon:'∑', vocab:{ 'Ξ':['zero','neutral element','fixed point'],'T':['derivative','gradient','discontinuity'],'R':['function','morphism','equivalence relation'],'E':['integral','divergent series','open space'],'M':['recursion','series','memory function'],'V':['limit to zero','empty set','kernel'],'S':['axiom','theorem','algebraic structure'],'A':['operator','transformation','mapping'],'F':['convergence','attractor point','optimum'],'φe':['fractal','non-integer dimension','chaos'],'φc':['singular point','function zero'] } },
  philosophy:{ name:'Philosophy',  icon:'◬', vocab:{ 'Ξ':['epoché','socratic silence','buddhist void'],'T':['dialectic','contradiction','aporia'],'R':['intersubjectivity','logos','I-Thou relation'],'E':['becoming','transcendence','openness to being'],'M':['collective memory','tradition','history of being'],'V':['nothingness','nihilism','ontological void'],'S':['philosophical system','category','principle'],'A':['praxis','will','free act'],'F':['truth','intellectual clarity','intuition'],'φe':['potential infinite','pure possibility'],'φc':['determinism','logical necessity'] } },
  ecology:   { name:'Ecology',     icon:'❀', vocab:{ 'Ξ':['ecological climax','balance','stable state'],'T':['competition','predation','environmental stress'],'R':['trophic web','symbiosis','interdependence'],'E':['ecological succession','colonization','dispersal'],'M':['seed bank','soil memory','cycle'],'V':['decomposition','nutrient recycling'],'S':['ecosystem','biome','biogeochemical cycle'],'A':['migration','energy flow','water cycle'],'F':['keystone species','fundamental niche'],'φe':['biodiversity','speciation'],'φc':['mass extinction','trophic collapse'] } },
  religion:  { name:'Religion',    icon:'☸', vocab:{ 'Ξ':['contemplative silence','sabbath','divine stillness','samadhi'],'T':['spiritual struggle','dark night of the soul','sin','temptation'],'R':['communion','covenant','sangha','agape'],'E':['revelation','ascension','enlightenment','grace'],'M':['scripture','tradition','liturgical memory','ancestral lineage'],'V':['kenosis','self-emptying','renunciation','dissolution in God'],'S':['doctrine','canon','dharma','sacred order'],'A':['ritual','pilgrimage','prayer','sacrament'],'F':['devotion','intention','sacred focus','mantra'],'φe':['mysticism','infinite divinity','apophatic theology'],'φc':['dogma','orthodoxy','fixed creed'] } },
  systems:   { name:'Systems Engineering', icon:'⚙', vocab:{ 'Ξ':['steady state','idle equilibrium','baseline'],'T':['load','bottleneck','constraint','failure mode'],'R':['interface','coupling','dependency graph','protocol'],'E':['scalability','throughput growth','capacity expansion'],'M':['logs','state store','persistence','audit trail'],'V':['decommission','garbage collection','graceful degradation'],'S':['architecture','control loop','requirements baseline'],'A':['actuator','pipeline','automation','workflow'],'F':['SLO','key metric','observability target'],'φe':['emergent behavior','distributed complexity','self-organization'],'φc':['cascade failure','deadlock','single point of failure'] } },
};

export function fisherRao(a: Vec, b: Vec): number {
  const eps = 1e-8;
  const sa = Object.values(a).reduce((x,y) => x+y, 0) + eps;
  const sb = Object.values(b).reduce((x,y) => x+y, 0) + eps;
  let dot = 0;
  DIMS.forEach(d => { dot += Math.sqrt((a[d]/sa) * (b[d]/sb)); });
  return Math.acos(Math.min(1, Math.max(-1, dot)));
}

// ---- Manual Δ · Parte I §2–§4: canonical nested signature ----
// Ξ opens every signature (I5, container obligatorio). Symbols nest one inside
// another with {}: outermost = receptive container, innermost = active core.
// One symbol per level — no siblings, no words, no human names.
const SIG_THRESHOLD = 0.4;
const SIG_MAX_DEPTH = 6;

export function nestSignature(symbols: string[]): string {
  const inner = symbols.filter(s => s && !s.startsWith('Ξ'));
  return inner.length ? `Ξ { ${closeNest(inner)} }` : 'Ξ';
}

function closeNest(syms: string[]): string {
  if (syms.length === 1) return syms[0];
  return `${syms[0]} { ${closeNest(syms.slice(1))} }`;
}

function dominantDims(vec: Vec): Dim[] {
  return DIMS
    .filter(d => d !== 'Ξ' && vec[d] > SIG_THRESHOLD)
    .sort((a, b) => vec[b] - vec[a])
    .slice(0, SIG_MAX_DEPTH);
}

export function toSignature(vec: Vec): string {
  return nestSignature(dominantDims(vec));
}

export type Sign = -1 | 0 | 1;
export type Signs = Record<string, Sign>;

export function signedSignature(vec: Vec, signs: Signs): string {
  const tag = (d: Dim) => {
    const s = signs[d] ?? 0;
    return s === 1 ? `${d}+` : s === -1 ? `${d}−` : d;
  };
  return nestSignature(dominantDims(vec).map(tag));
}

// Manual Δ §10: Token3 (D,I,F) lives only in [Motion]. F is not inferred here,
// so Motion carries D and I; Ξ always opens at 0.0.
export function motionLine(vec: Vec): string {
  const parts = ['(Ξ,0.0)', ...dominantDims(vec).map(d => `(${d},${vec[d].toFixed(2)})`)];
  return `[Motion: ${parts.join('; ')}]`;
}

export function metastability(midVec: Vec): { tag: 'Ξ' | 'φ+' | 'φ−'; label: string } {
  const vals = DIMS.map(d => midVec[d]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  if (variance < 0.02) return { tag: 'Ξ', label: 'silent equilibrium' };
  if (midVec['E'] > midVec['T']) return { tag: 'φ+', label: 'expansive tendency' };
  return { tag: 'φ−', label: 'contractive tendency' };
}

// ---- Manual Δ 2026.9.2 · Parte V: Fisher-Rao on the dipole space Σ ∈ (0,1)ⁿ ----
// g_ii = 1/(Σ_i(1−Σ_i)) ⇒ per-dim geodesic 2|arcsin√a − arcsin√b|; combined in L2.
export function fisherRaoDipole(a: Vec, b: Vec): number {
  const c = (x: number) => Math.min(1, Math.max(0, x));
  let s = 0;
  DIMS.forEach(d => { const g = 2 * (Math.asin(Math.sqrt(c(a[d]))) - Math.asin(Math.sqrt(c(b[d])))); s += g * g; });
  return Math.sqrt(s);
}

// ---- Manual Δ · Fase 3: amalgam = √(A·B) per dimension (geometric mean) ----
export function amalgam(a: Vec, b: Vec): Vec {
  const out = {} as Vec;
  DIMS.forEach(d => { out[d] = Math.sqrt(Math.max(0, a[d]) * Math.max(0, b[d])); });
  return out;
}

// ∇ (curvature, outside Σ): mean polar gap between the two crystals, in [0,1].
export function curvature(a: Vec, b: Vec): number {
  return DIMS.reduce((s, d) => s + Math.abs(a[d] - b[d]), 0) / DIMS.length;
}

// ---- APR v2 · tension τ = 1 − ‖P_B v_A‖²/‖v_A‖² = sin²θ (B's line as the plane) ----
export function aprTension(a: Vec, b: Vec): number {
  let dot = 0, na = 0, nb = 0;
  DIMS.forEach(d => { dot += a[d] * b[d]; na += a[d] * a[d]; nb += b[d] * b[d]; });
  if (na === 0 || nb === 0) return 1;
  return Math.max(0, Math.min(1, 1 - (dot * dot) / (na * nb)));
}

// ---- APR v2 · resonance degree ρ = ‖Gˣ−Gʸ‖_F / ‖Gˣ‖_F (0 = exact resonance) ----
export function gramResonance(x: number[][], y: number[][]): number {
  const gram = (f: number[][]) => f.map(u => f.map(v => u.reduce((s, ui, k) => s + ui * v[k], 0)));
  const gx = gram(x), gy = gram(y);
  let num = 0, den = 0;
  gx.forEach((row, i) => row.forEach((g, j) => { num += (g - gy[i][j]) ** 2; den += g * g; }));
  return den === 0 ? 0 : Math.sqrt(num) / Math.sqrt(den);
}

// ---- Invariant I3 (breath): φe and φc must not freeze at 0 ----
export function breathes(v: Vec): boolean {
  return v['φe'] > 0 && v['φc'] > 0;
}

export function normalize(vec: Partial<Record<string, number>>): Vec {
  const out = {} as Vec;
  DIMS.forEach(d => {
    const n = Number(vec[d]);
    // v2: 0.0 and 1.0 are valid poles; only missing values fall back to a faint trace.
    out[d] = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.08;
  });
  return out;
}

export interface TranslationItem {
  dim: Dim;
  intensity: number;
  words: string[];
  desc: string;
}

export function translate(vec: Vec, domainKey: string): TranslationItem[] {
  const dom = DOMAINS[domainKey];
  return DIMS
    .map(d => ({ d, v: vec[d] }))
    .sort((a,b) => b.v - a.v)
    .slice(0, 4)
    .filter(x => x.v > 0.12)
    .map(({d, v}) => ({ dim: d, intensity: v, words: dom.vocab[d] || [], desc: DIM_DESC[d] }));
}

export function makeSentence(translations: TranslationItem[], domainName: string, concept: string, seed = 0, lang: 'en' | 'es' = 'en'): string {
  const L = lang === 'es'
    ? { none: (c: string, d: string) => `"${c}" no tiene traducción clara en ${d}.`,
        pending: 'Traducción pendiente.',
        inDom: (d: string) => `En ${d}`,
        one: (d: string, a: string) => `En ${d}: ${a}.`,
        two: (d: string, a: string, b: string) => `En ${d}: ${a} en tensión con ${b}.`,
        three: (d: string, a: string, b: string, c: string) => `En ${d}: ${a} generando ${b} a través de ${c}.` }
    : { none: (c: string, d: string) => `"${c}" has no clear translation in ${d}.`,
        pending: 'Translation pending.',
        inDom: (d: string) => `In ${d}`,
        one: (d: string, a: string) => `In ${d}: ${a}.`,
        two: (d: string, a: string, b: string) => `In ${d}: ${a} in tension with ${b}.`,
        three: (d: string, a: string, b: string, c: string) => `In ${d}: ${a} generating ${b} through ${c}.` };
  if (!translations.length) return L.none(concept, domainName);
  const pick = (arr: string[], salt: number) => arr[Math.abs((seed + salt) % arr.length)] || arr[0];
  const parts = translations.slice(0,3).map((t, i) => pick(t.words, i)).filter(Boolean);
  if (!parts.length) return L.pending;
  if (parts.length === 1) return L.one(domainName, parts[0]);
  if (parts.length === 2) return L.two(domainName, parts[0], parts[1]);
  return L.three(domainName, parts[0], parts[1], parts[2]);
}

export function midpoint(a: Vec, b: Vec): Vec {
  const out = {} as Vec;
  DIMS.forEach(d => { out[d] = (a[d] + b[d]) / 2; });
  return out;
}

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
