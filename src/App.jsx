import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   READTOR  ·  Web Application
   Aesthetic: Editorial dark — deep navy ink, warm amber accents, serif headlines
   Layout: Fixed sidebar + wide content canvas, multi-column dashboard
───────────────────────────────────────────────────────────────────────────── */

// ── Google Fonts injection ───────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

// ── CSS Reset + Variables ────────────────────────────────────────────────────
const globalCSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 16px; }
  body { background: #07080f; color: #e8e4d8; font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 3px; }
  input, textarea, button, select { font-family: inherit; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes rsvpIn { 0% { opacity:0; transform:scale(0.88) translateY(6px); } 40% { opacity:1; transform:scale(1) translateY(0); } 85% { opacity:1; } 100% { opacity:0; } }
  .fadeUp { animation: fadeUp 0.4s ease both; }
  .fadeUp-d1 { animation: fadeUp 0.4s 0.05s ease both; }
  .fadeUp-d2 { animation: fadeUp 0.4s 0.1s ease both; }
  .fadeUp-d3 { animation: fadeUp 0.4s 0.15s ease both; }
  .fadeUp-d4 { animation: fadeUp 0.4s 0.2s ease both; }
  .fadeUp-d5 { animation: fadeUp 0.4s 0.25s ease both; }
`;
const styleEl = document.createElement("style");
styleEl.textContent = globalCSS;
document.head.appendChild(styleEl);

// ── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg:      "#07080f",
  surface: "#0d0f1c",
  card:    "#111420",
  card2:   "#161926",
  border:  "#1e2235",
  border2: "#262b3f",
  text:    "#e8e4d8",
  text2:   "#a8a49a",
  text3:   "#5a5870",
  amber:   "#e8a838",
  amber2:  "#f5c76a",
  amberGlow: "rgba(232,168,56,0.12)",
  teal:    "#3ecfb0",
  teal2:   "#5ee8cb",
  red:     "#e85555",
  serif:   "'Playfair Display', Georgia, serif",
  sans:    "'DM Sans', sans-serif",
  mono:    "'DM Mono', monospace",
};

// ── Data ─────────────────────────────────────────────────────────────────────
const LEVELS = [
  { n:1,  min:100, max:149, comp:60, title:"Novice"      },
  { n:2,  min:150, max:199, comp:62, title:"Beginner"    },
  { n:3,  min:200, max:239, comp:65, title:"Developing"  },
  { n:4,  min:240, max:279, comp:68, title:"Intermediate"},
  { n:5,  min:280, max:319, comp:72, title:"Proficient"  },
  { n:6,  min:320, max:369, comp:75, title:"Advanced"    },
  { n:7,  min:370, max:429, comp:78, title:"Expert"      },
  { n:8,  min:430, max:499, comp:80, title:"Master"      },
  { n:9,  min:500, max:599, comp:83, title:"Elite"       },
  { n:10, min:600, max:900, comp:85, title:"Legendary"   },
];

const QUOTES = [
  { q: "A reader lives a thousand lives before he dies.", a: "George R.R. Martin" },
  { q: "Reading is to the mind what exercise is to the body.", a: "Joseph Addison" },
  { q: "Not all readers are leaders, but all leaders are readers.", a: "Harry S. Truman" },
  { q: "Once you learn to read, you will be forever free.", a: "Frederick Douglass" },
  { q: "A book is a dream that you hold in your hands.", a: "Neil Gaiman" },
  { q: "There is no friend as loyal as a book.", a: "Ernest Hemingway" },
];

const PASSAGES = [
  {
    id:"p1", title:"The Quantum Leap", genre:"Science Fiction", level:5, wordCount:312,
    text:`The laboratory hummed with an almost imperceptible frequency that Dr. Elena Vasquez had learned to associate with breakthrough moments. Three years of incremental progress had culminated in tonight's experiment, and as she adjusted the quantum field stabilizer, she allowed herself a rare moment of anticipation.\n\nThe particle array stretched across the chamber like a constellation of frozen stars. Each node represented thousands of calculations, millions of variables collapsed into a single elegant equation that her mentor, the formidable Professor Chen, had once declared theoretically impossible.\n\n"Theoretical impossibility," she murmured to herself, "is merely an invitation."\n\nThe readout flickered. For exactly 0.003 seconds, the entanglement held — two particles maintaining perfect correlation across a distance that should have severed any meaningful connection. Elena's breath caught in her throat. The implications cascaded through her mind with terrifying velocity: instantaneous communication, unhackable encryption, the dissolution of every barrier that distance had ever imposed upon human connection.\n\nThen the array collapsed. The hum dissipated. The laboratory returned to its ordinary silence.\n\nBut Elena was already drafting the paper in her head, her fingers moving across the keyboard with the particular urgency of someone who has just glimpsed the future and cannot bear the thought of losing it again. Tomorrow, the world would still look the same. But she knew, with the absolute certainty of empirical evidence, that nothing would ever be quite the same again.\n\nShe saved the data seventeen times in succession, each backup a prayer to the gods of irreversibility.`,
    tags:["science fiction","technology"],
  },
  {
    id:"p2", title:"Cognitive Load Theory", genre:"Academic", level:7, wordCount:287,
    text:`Cognitive load theory, developed by educational psychologist John Sweller in the 1980s, posits that the human working memory has a finite capacity and that instructional design must account for this limitation to optimize learning outcomes. The theory distinguishes among three types of cognitive load: intrinsic, extraneous, and germane.\n\nIntrinsic load refers to the inherent complexity of the material being learned — a function of element interactivity, or the degree to which individual components must be processed simultaneously to be understood. High-element-interactivity material, such as grammatical syntax or algebraic manipulation, imposes substantial intrinsic load because learners cannot process each element in isolation.\n\nExtraneous load, by contrast, arises from suboptimal instructional design — redundant information, poorly organized presentations, or formats that require learners to split their attention between multiple sources. Unlike intrinsic load, extraneous load is theoretically eliminable through careful pedagogical intervention.\n\nGermane load describes the cognitive resources devoted to schema formation and automation — the processes by which novel information is integrated into long-term memory structures. Contemporary revisions of the theory have reconceptualized germane load not as a separate category but as the productive application of working memory resources toward schema acquisition.\n\nPractical implications for educators are considerable: worked examples reduce extraneous load during initial skill acquisition; problem completion tasks scaffold the transition to independent problem solving; and variability in practice conditions enhances schema generalization. The theory remains one of the most empirically supported frameworks in instructional psychology.`,
    tags:["psychology","education"],
  },
  {
    id:"p3", title:"Rain-Drenched Encounter", genre:"Literary Fiction", level:8, wordCount:298,
    text:`The deluge arrived without preamble, as though the sky had been holding its breath for precisely this moment. Mira ducked beneath the inadequate awning of a shuttered parfumerie, her coat already saturated, her composure performing the kind of studied nonchalance that only the truly soaked can muster.\n\nIt was in this state of aqueous ignominy that she noticed him — a man of perhaps forty, possessing the kind of face that suggested a turbulent biography, standing at the periphery of the canopy's protection as though he had not yet decided whether shelter was something he deserved.\n\n"You may stand closer," she said. "The awning's jurisdiction extends at least another meter."\n\nHe regarded her with an expression of calibrated surprise, the kind assembled by someone who encounters unexpected kindness so rarely that they have developed a separate cognitive apparatus for processing it.\n\n"Mira Delacroix," she offered, extending a hand that was essentially indistinguishable from the rain.\n\n"Thomas Vane." His handshake was firm, deliberate — a handshake that communicated a history of being underestimated. "I was beginning to suspect this street was entirely hostile to human occupation."\n\n"Most streets are, in weather like this. They revert to their fundamental nature — indifferent, ancient, completely unimpressed by our architectural pretensions."\n\nHe laughed, a genuinely unguarded sound that seemed to surprise him more than it surprised her. And in that moment, with water running in rivulets along the cobblestones and the city reduced to a moody impressionistic blur, Mira had the particular sensation of encountering something consequential disguised as coincidence.`,
    tags:["fiction","literary"],
  },
  {
    id:"p4", title:"The Architecture of Memory", genre:"Academic", level:6, wordCount:264,
    text:`Memory is not a filing cabinet. This metaphor, intuitive as it seems, fundamentally misrepresents how human recollection actually functions. Rather than retrieving a stored file, remembering is an act of reconstruction — an elaborate synthesis of fragments, schema, and contextual cues that produces something resembling the original experience, but never exactly replicates it.\n\nNeuroscientific research has illuminated the distributed nature of memory storage. Episodic memories — those tied to specific personal experiences — engage a network of brain regions including the hippocampus, prefrontal cortex, and amygdala. The hippocampus plays a particularly critical role in encoding and consolidating new memories, a function devastatingly illustrated by patients with hippocampal damage who cannot form new long-term memories while retaining older ones.\n\nSemantic memory, by contrast, stores factual knowledge abstracted from specific experiences. A person who knows that Paris is the capital of France does not necessarily remember learning this fact; the information has been decontextualized and integrated into a broader conceptual network.\n\nThe reconstructive nature of memory has profound implications for reliability. Each act of retrieval slightly modifies the stored trace — a phenomenon known as reconsolidation — making memory susceptible to distortion through suggestion, context, and the passage of time. Eyewitness testimony, long considered legally compelling, has been substantially undermined by decades of research demonstrating the malleability of human recollection.`,
    tags:["neuroscience","psychology","memory"],
  },
  {
    id:"p5", title:"The Last Lighthouse Keeper", genre:"Fiction", level:4, wordCount:243,
    text:`The light swept the darkness in its slow, patient arc, as it had every night for forty-three years. Martin stood at the window of the lamp room and watched the beam cross the black water, the same motion he had watched ten thousand times before, and still he found it calming.\n\nThe automated systems would take over in the spring. The maritime authority had sent the letter in October, formal and apologetic in equal measure, noting that manned lighthouses were increasingly impractical in an era of GPS navigation and satellite communication. Martin had read it three times, folded it carefully, and placed it in the drawer beneath the logbooks that stretched back to 1947.\n\nHis predecessor, a man named Halvorsen who had retired with remarkable reluctance in 1981, had told him something on his first day that Martin had carried ever since: "The light isn't for the ships," the old man had said. "The ships have radar now. The light is for the sea. To remind it that we're still watching."\n\nMartin had thought this sentimental at the time. He no longer did.\n\nBelow, the Atlantic moved in its restless, incomprehensible way, indifferent to his vigil. But he would watch it anyway, for as many nights as remained to him. Some duties, he had come to understand, derived their meaning entirely from the act of performing them.`,
    tags:["fiction","atmosphere","literary"],
  },
  {
    id:"p6", title:"Emergence and Complexity", genre:"Academic", level:9, wordCount:301,
    text:`Emergence — the phenomenon whereby complex systems exhibit properties irreducible to, and unpredictable from, the properties of their constituent components — represents one of the most philosophically challenging concepts in contemporary science. When individual neurons fire, we get cognition. When water molecules interact, we get wetness. When simple trading rules aggregate, we get market bubbles. The emergent property belongs to the system as a whole and cannot be located in any single part.\n\nThe distinction between weak and strong emergence has occupied philosophers of science for decades. Weak emergence describes properties that are, in principle, derivable from lower-level descriptions through sufficient computational power — even if such derivation would be practically intractable. Strong emergence, more controversially, posits properties that are fundamentally irreducible: no amount of knowledge about components would allow prediction of the emergent behavior.\n\nConsciousness is the most contested candidate for strong emergence. The hard problem of consciousness — why physical processes give rise to subjective experience at all — remains stubbornly resistant to reductionist explanation. Attempts to locate qualia in neural architecture confront the explanatory gap between third-person physical description and first-person phenomenal experience.\n\nComplex adaptive systems theory offers a different framework: emergence is not merely an epistemological limitation but an ontological feature of reality. Systems with nonlinear dynamics, feedback loops, and sensitive dependence on initial conditions generate novelty that cannot be anticipated from initial conditions alone. In this view, the universe is fundamentally creative — perpetually generating forms of organization that transcend their origins.`,
    tags:["philosophy","science","complexity"],
  },
];

const QUIZZES = {
  p1: [
    { id:"q1", type:"mc", q:"What did the entanglement achieve for exactly 0.003 seconds?", choices:["Nuclear fusion","Perfect particle correlation","Time reversal","Quantum tunneling"], correct:1, exp:"Two particles maintained perfect correlation across a distance that should have severed any connection." },
    { id:"q2", type:"tf", q:"Professor Chen believed Elena's equation was theoretically achievable.", choices:["True","False"], correct:1, exp:"Professor Chen had 'declared theoretically impossible' — Elena treated this as an invitation." },
    { id:"q3", type:"mc", q:"What was Elena's immediate reaction after the experiment ended?", choices:["She called Professor Chen","She began drafting a paper","She ran the experiment again","She celebrated with colleagues"], correct:1, exp:"Elena immediately started drafting the paper in her head while typing urgently." },
    { id:"q4", type:"mc", q:"How many times did Elena save her data?", choices:["3","7","17","Once"], correct:2, exp:"She saved the data seventeen times in succession, 'each backup a prayer to the gods of irreversibility.'" },
    { id:"q5", type:"tf", q:"The particle array was still functional at the end of the passage.", choices:["True","False"], correct:1, exp:"The array collapsed and the hum dissipated, returning the laboratory to silence." },
  ],
  p2: [
    { id:"q1", type:"mc", q:"Who developed Cognitive Load Theory?", choices:["Vygotsky","Piaget","John Sweller","Benjamin Bloom"], correct:2, exp:"John Sweller developed the theory in the 1980s." },
    { id:"q2", type:"mc", q:"Which load type is caused by poor instructional design?", choices:["Intrinsic","Extraneous","Germane","Schema"], correct:1, exp:"Extraneous load arises from suboptimal instructional design." },
    { id:"q3", type:"tf", q:"Intrinsic load can be eliminated through better instructional design.", choices:["True","False"], correct:1, exp:"Only extraneous load is eliminable; intrinsic load is inherent to material complexity." },
    { id:"q4", type:"mc", q:"What does germane load relate to?", choices:["Material difficulty","Poor presentation","Schema formation and automation","Working memory limits"], correct:2, exp:"Germane load describes resources devoted to schema formation — integrating new info into long-term memory." },
  ],
  p3: [
    { id:"q1", type:"mc", q:"Where did Mira take shelter from the rain?", choices:["A café","A shuttered parfumerie","A hotel lobby","A bookshop"], correct:1, exp:"Mira ducked beneath the inadequate awning of a shuttered parfumerie." },
    { id:"q2", type:"tf", q:"Thomas Vane was accustomed to receiving unexpected kindness.", choices:["True","False"], correct:1, exp:"He had 'a separate cognitive apparatus for processing' unexpected kindness — implying it was rare." },
    { id:"q3", type:"mc", q:"What did Mira sense at the passage's end?", choices:["Annoyance at the stranger","Something consequential disguised as coincidence","A desire to leave quickly","Recognition of Thomas from before"], correct:1, exp:"Mira had 'the particular sensation of encountering something consequential disguised as coincidence.'" },
  ],
  p4: [
    { id:"q1", type:"mc", q:"According to the passage, memory is best described as:", choices:["A filing cabinet","A database","An act of reconstruction","A photograph"], correct:2, exp:"The passage argues memory is 'an act of reconstruction' not retrieval of stored files." },
    { id:"q2", type:"mc", q:"Which brain region plays a critical role in encoding new memories?", choices:["Cerebellum","Hippocampus","Occipital lobe","Cerebral cortex"], correct:1, exp:"The hippocampus plays a particularly critical role in encoding and consolidating new memories." },
    { id:"q3", type:"tf", q:"Semantic memory retains the specific context in which facts were learned.", choices:["True","False"], correct:1, exp:"Semantic memory stores factual knowledge 'abstracted from specific experiences.'" },
  ],
  p5: [
    { id:"q1", type:"mc", q:"How long had Martin worked at the lighthouse?", choices:["Twenty years","Thirty years","Forty-three years","Fifty years"], correct:2, exp:"Martin had watched the beam sweep the darkness 'every night for forty-three years.'" },
    { id:"q2", type:"mc", q:"What was Halvorsen's insight about the lighthouse beam?", choices:["It warns ships of rocks","It is for the sea, not the ships","It powers the radio beacon","It scares away birds"], correct:1, exp:"Halvorsen said 'The light isn't for the ships — the light is for the sea. To remind it that we're still watching.'" },
    { id:"q3", type:"tf", q:"Martin immediately found Halvorsen's philosophy sentimental and wise.", choices:["True","False"], correct:1, exp:"Martin 'had thought this sentimental at the time' — he only came to understand it later." },
  ],
  p6: [
    { id:"q1", type:"mc", q:"What does 'emergence' refer to?", choices:["Simple behaviors in isolated systems","Properties irreducible to component parts","Predictable outcomes from basic rules","Gradual evolutionary changes"], correct:1, exp:"Emergence is when complex systems exhibit properties 'irreducible to and unpredictable from' their components." },
    { id:"q2", type:"mc", q:"What is the 'hard problem of consciousness'?", choices:["Understanding neural pathways","Why we forget dreams","Why physical processes give rise to subjective experience","How memories are stored"], correct:2, exp:"The hard problem asks 'why physical processes give rise to subjective experience at all.'" },
    { id:"q3", type:"tf", q:"Strong emergence claims properties can always be derived with enough computation.", choices:["True","False"], correct:1, exp:"Weak emergence says derivation is possible in principle; strong emergence posits properties that are 'fundamentally irreducible.'" },
  ],
};

// ── AI Helper ─────────────────────────────────────────────────────────────────
async function callClaude(prompt, system) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514",
      max_tokens:1000,
      system: system || "You are a reading education AI. Generate high-quality passages for reading practice. Be precise and engaging.",
      messages:[{ role:"user", content:prompt }],
    }),
  });
  const d = await res.json();
  return d.content?.map(b => b.text||"").join("") || "";
}

// ── Icon Component ─────────────────────────────────────────────────────────────
const SVG = ({ d, size=18, stroke=T.text2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

const ICONS = {
  home:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  library:  ["M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z","M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"],
  generate: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
  cards:    ["M2 5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2z","M7 19v-4","M17 19v-4","M7 19h10"],
  upload:   ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M17 8l-5-5-5 5","M12 3v12"],
  settings: ["M12 15a3 3 0 100-6 3 3 0 000 6z","M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"],
  logout:   ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4","M16 17l5-5-5-5","M21 12H9"],
  play:     "M5 3l14 9-14 9V3z",
  pause:    ["M6 4h4v16H6z","M14 4h4v16h-4z"],
  check:    "M20 6L9 17l-5-5",
  x:        "M18 6L6 18M6 6l12 12",
  arrow:    "M5 12h14M12 5l7 7-7 7",
  flame:    "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z",
  eye:      ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 100 6 3 3 0 000-6z"],
  award:    ["M12 15l-3.78 2.31.95-4.3L5.83 9.8l4.39-.42L12 5.5l1.78 3.88 4.39.42-3.34 3.21.95 4.3z","M8.21 20.83l.9-4.08M15.79 20.83l-.9-4.08M12 22v-7"],
};

// ── Reusable Button ───────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant="primary", disabled, style={}, size="md" }) => {
  const pad = size==="sm" ? "6px 14px" : size==="lg" ? "14px 28px" : "10px 20px";
  const fs  = size==="sm" ? 13 : size==="lg" ? 16 : 14;
  const variants = {
    primary:  { background:`linear-gradient(135deg,${T.amber},${T.amber2})`, color:"#07080f", border:"none" },
    secondary:{ background:T.card2, color:T.text, border:`1px solid ${T.border2}` },
    ghost:    { background:"transparent", color:T.text2, border:`1px solid ${T.border}` },
    danger:   { background:`${T.red}22`, color:T.red, border:`1px solid ${T.red}55` },
    teal:     { background:`linear-gradient(135deg,${T.teal},${T.teal2})`, color:"#07080f", border:"none" },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding:pad, fontSize:fs, fontWeight:600, borderRadius:8, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.45:1, display:"inline-flex", alignItems:"center", gap:7, transition:"all 0.15s", ...v, ...style }}
      onMouseEnter={e => { if(!disabled) e.currentTarget.style.opacity="0.85"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity="1"; }}>
      {children}
    </button>
  );
};

// ── Tag ────────────────────────────────────────────────────────────────────────
const Tag = ({ label, color }) => (
  <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background: color==="amber"?`${T.amber}22`:color==="teal"?`${T.teal}22`:`${T.border2}`, color: color==="amber"?T.amber:color==="teal"?T.teal:T.text3, fontWeight:600, letterSpacing:.3, flexShrink:0 }}>
    {label}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("auth");
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [activePassage, setActivePassage] = useState(null);
  const [quizSession, setQuizSession] = useState(null); // {passage, sessionData}
  const [lastResults, setLastResults] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg, type="ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const login = (email, name) => {
    setUser({ id:"u1", name: name||email.split("@")[0], email, level:3, streak:7, totalSessions:24, totalWords:48200, avgWpm:248 });
    setView("dashboard");
    notify(`Welcome back! Ready to read faster?`);
  };

  const signup = (email, name) => {
    setUser({ id:"u1", name, email, level:1, streak:0, totalSessions:0, totalWords:0, avgWpm:0 });
    setView("dashboard");
    notify("Account created. Your reading journey begins now.");
  };

  const guestLogin = () => {
    setIsGuest(true);
    setUser({ id:"guest", name:"Guest Reader", level:1, streak:0, totalSessions:0, totalWords:0, avgWpm:0 });
    setView("dashboard");
  };

  const logout = () => { setUser(null); setIsGuest(false); setView("auth"); };

  const startReading = (passage) => {
    setActivePassage(passage);
    setView("reading");
  };

  const finishReading = (sessionData) => {
    setSessions(prev => [sessionData, ...prev]);
    setQuizSession({ passage: sessionData.passage, sessionData });
    setView("quiz");
  };

  const submitQuiz = (results) => {
    setLastResults(results);
    if (results.missed.length > 0) {
      const cards = results.missed.map(q => ({
        id: `${Date.now()}-${Math.random()}`,
        question: q.q,
        answer: q.exp,
        due: Date.now(),
        interval: 1,
      }));
      setFlashcards(prev => [...prev, ...cards]);
    }
    if (user) setUser(prev => ({ ...prev, totalSessions: prev.totalSessions+1, streak: prev.streak+1 }));
    setView("results");
  };

  const dueCards = flashcards.filter(f => f.due <= Date.now()).length;

  // Layout
  if (view === "auth") return <AuthPage onLogin={login} onSignup={signup} onGuest={guestLogin} toast={toast} notify={notify} />;

  const NAV = [
    { id:"dashboard", label:"Dashboard",  icon:"home"     },
    { id:"library",   label:"Library",    icon:"library"  },
    { id:"generate",  label:"AI Generate",icon:"generate" },
    { id:"flashcards",label:"Flashcards", icon:"cards",   badge:dueCards },
    { id:"upload",    label:"Upload",     icon:"upload"   },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg }}>
      {/* ── Sidebar ── */}
      {!["reading","quiz","results"].includes(view) && (
        <aside style={{ width:220, flexShrink:0, background:T.surface, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", position:"fixed", left:0, top:0, bottom:0, zIndex:50 }}>
          {/* Logo */}
          <div style={{ padding:"28px 20px 24px", borderBottom:`1px solid ${T.border}` }}>
            <div style={{ fontFamily:T.serif, fontSize:26, fontWeight:900, color:T.amber, letterSpacing:-0.5 }}>Readtor</div>
            <div style={{ fontSize:11, color:T.text3, marginTop:2, letterSpacing:.5 }}>Read · Absorb · Remember</div>
          </div>

          {/* Nav */}
          <nav style={{ flex:1, padding:"16px 10px", display:"flex", flexDirection:"column", gap:2 }}>
            {NAV.map(n => {
              const active = view === n.id;
              return (
                <button key={n.id} onClick={() => setView(n.id)} style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 12px", borderRadius:8, border:"none", background: active ? T.amberGlow : "transparent", color: active ? T.amber : T.text2, cursor:"pointer", fontSize:14, fontWeight: active ? 600 : 400, textAlign:"left", position:"relative", transition:"all 0.15s" }}
                  onMouseEnter={e => { if(!active) e.currentTarget.style.background=T.card; }}
                  onMouseLeave={e => { if(!active) e.currentTarget.style.background="transparent"; }}>
                  <SVG d={ICONS[n.icon]} size={17} stroke={active ? T.amber : T.text3} />
                  {n.label}
                  {n.badge > 0 && <span style={{ marginLeft:"auto", background:T.red, color:"#fff", fontSize:10, width:18, height:18, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{n.badge}</span>}
                  {active && <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:3, height:20, background:T.amber, borderRadius:"0 2px 2px 0" }} />}
                </button>
              );
            })}
          </nav>

          {/* User */}
          <div style={{ padding:"12px 10px 16px", borderTop:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px" }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${T.amber},${T.amber2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:T.bg, flexShrink:0 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</div>
                <div style={{ fontSize:11, color:T.text3 }}>Level {user?.level} · {LEVELS[(user?.level||1)-1].title}</div>
              </div>
            </div>
            <button onClick={logout} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", width:"100%", background:"none", border:"none", cursor:"pointer", color:T.text3, fontSize:13, borderRadius:6 }}
              onMouseEnter={e => { e.currentTarget.style.color = T.red; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.text3; }}>
              <SVG d={ICONS.logout} size={15} stroke="currentColor" />
              Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* ── Main ── */}
      <main style={{ flex:1, marginLeft: ["reading","quiz","results"].includes(view) ? 0 : 220, minHeight:"100vh", overflow:"auto" }}>
        {view==="dashboard"  && <DashboardView  user={user} isGuest={isGuest} sessions={sessions} onStart={startReading} flashcards={flashcards} />}
        {view==="library"    && <LibraryView    onStart={startReading} />}
        {view==="generate"   && <GenerateView   user={user} isGuest={isGuest} onStart={startReading} notify={notify} />}
        {view==="flashcards" && <FlashcardsView flashcards={flashcards} setFlashcards={setFlashcards} />}
        {view==="upload"     && <UploadView     onStart={startReading} notify={notify} />}
        {view==="reading"    && activePassage && <ReadingView passage={activePassage} onFinish={finishReading} onExit={() => setView("dashboard")} />}
        {view==="quiz"       && quizSession   && <QuizView passage={quizSession.passage} sessionData={quizSession.sessionData} onSubmit={submitQuiz} onExit={() => setView("dashboard")} />}
        {view==="results"    && lastResults   && <ResultsView results={lastResults} onDone={() => setView("dashboard")} onFlashcards={() => setView("flashcards")} />}
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:"fixed", bottom:28, right:28, background: toast.type==="ok" ? T.card2 : `${T.red}22`, border:`1px solid ${toast.type==="ok" ? T.amber+"55" : T.red+"55"}`, color: toast.type==="ok" ? T.text : T.red, padding:"12px 20px", borderRadius:10, fontSize:14, zIndex:999, animation:"fadeUp 0.3s ease both", boxShadow:"0 8px 32px rgba(0,0,0,0.4)", maxWidth:340 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PAGE  — split screen, editorial
// ─────────────────────────────────────────────────────────────────────────────
function AuthPage({ onLogin, onSignup, onGuest }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name,  setName]  = useState("");
  const [pass,  setPass]  = useState("");

  const submit = () => {
    if (!email.includes("@")) return;
    if (mode==="login") onLogin(email, name||email.split("@")[0]);
    else { if (!name) return; onSignup(email, name); }
  };

  const inp = { width:"100%", padding:"12px 16px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.card, color:T.text, fontSize:15, outline:"none", transition:"border-color 0.2s" };

  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      {/* Left panel — hero */}
      <div style={{ flex:1, background:`linear-gradient(160deg, #0d0f1c 0%, #07080f 60%)`, display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 64px", borderRight:`1px solid ${T.border}`, position:"relative", overflow:"hidden" }}>
        {/* BG decoration */}
        <div style={{ position:"absolute", top:"-10%", right:"-5%", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle, ${T.amber}08 0%, transparent 70%)`, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-5%", left:"10%", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle, ${T.teal}06 0%, transparent 70%)`, pointerEvents:"none" }} />

        <div style={{ fontFamily:T.serif, fontSize:64, fontWeight:900, color:T.amber, letterSpacing:-2, lineHeight:1, marginBottom:16, animation:"fadeUp 0.6s ease both" }}>
          Read<span style={{ color:T.text }}>tor</span>
        </div>
        <div style={{ fontSize:20, color:T.text2, fontStyle:"italic", fontFamily:T.serif, marginBottom:48, animation:"fadeUp 0.6s 0.1s ease both", lineHeight:1.5 }}>
          Read faster.<br/>Think deeper.<br/>Remember more.
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:32, animation:"fadeUp 0.6s 0.2s ease both" }}>
          {[["10×","Reading modes"],["AI","Generated content"],["SM-2","Spaced repetition"]].map(([v,l]) => (
            <div key={v}>
              <div style={{ fontFamily:T.serif, fontSize:32, fontWeight:900, color:T.amber }}>{v}</div>
              <div style={{ fontSize:12, color:T.text3, marginTop:2, letterSpacing:.3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div style={{ marginTop:64, padding:"24px 28px", borderLeft:`3px solid ${T.amber}55`, animation:"fadeUp 0.6s 0.3s ease both" }}>
          <div style={{ fontFamily:T.serif, fontSize:17, fontStyle:"italic", color:T.text2, lineHeight:1.7, marginBottom:10 }}>
            "A reader lives a thousand lives before he dies."
          </div>
          <div style={{ fontSize:12, color:T.text3, letterSpacing:.5 }}>— George R.R. Martin</div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ width:440, flexShrink:0, display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 48px", background:T.surface }}>
        <div style={{ fontFamily:T.serif, fontSize:28, fontWeight:700, color:T.text, marginBottom:6 }}>
          {mode==="login" ? "Welcome back" : "Begin your journey"}
        </div>
        <div style={{ fontSize:14, color:T.text3, marginBottom:36 }}>
          {mode==="login" ? "Sign in to continue your practice" : "Create an account — it's free"}
        </div>

        {/* Toggle */}
        <div style={{ display:"flex", background:T.card, borderRadius:8, padding:4, marginBottom:28, border:`1px solid ${T.border}` }}>
          {["login","signup"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:"9px", borderRadius:6, border:"none", background: mode===m ? T.amber : "transparent", color: mode===m ? T.bg : T.text2, fontWeight: mode===m ? 700 : 400, cursor:"pointer", fontSize:14, transition:"all 0.15s" }}>
              {m==="login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {mode==="signup" && <input style={inp} placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=T.border2} />}
          <input style={inp} placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=T.border2} />
          <input style={inp} placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=T.border2} />
          <Btn onClick={submit} size="lg" style={{ width:"100%", justifyContent:"center", marginTop:4 }}>
            {mode==="login" ? "Sign In →" : "Create Account →"}
          </Btn>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
          <div style={{ flex:1, height:1, background:T.border }} />
          <span style={{ fontSize:12, color:T.text3 }}>or</span>
          <div style={{ flex:1, height:1, background:T.border }} />
        </div>

        <Btn variant="ghost" onClick={onGuest} style={{ width:"100%", justifyContent:"center" }}>
          Continue as Guest
        </Btn>

        <p style={{ fontSize:11, color:T.text3, marginTop:24, lineHeight:1.7, textAlign:"center" }}>
          By continuing you agree to our Terms of Service and Privacy Policy.
          Readtor is safe for ages 13+.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function DashboardView({ user, isGuest, sessions, onStart, flashcards }) {
  const level = LEVELS[(user?.level||1)-1];
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const avgWpm  = sessions.length ? Math.round(sessions.reduce((s,x)=>s+x.wpm,0)/sessions.length) : user?.avgWpm||0;
  const avgComp = sessions.length ? Math.round(sessions.reduce((s,x)=>s+x.comp,0)/sessions.length) : 0;
  const dueCards = flashcards.filter(f=>f.due<=Date.now()).length;

  return (
    <div style={{ padding:"40px 48px", maxWidth:1200 }}>
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:40, animation:"fadeUp 0.4s ease both" }}>
        <div>
          <div style={{ fontSize:13, color:T.text3, marginBottom:6, letterSpacing:.5 }}>
            {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
          </div>
          <h1 style={{ fontFamily:T.serif, fontSize:36, fontWeight:900, color:T.text, letterSpacing:-1 }}>
            Good {new Date().getHours()<12?"morning":"afternoon"}, {user?.name?.split(" ")[0]}.
          </h1>
          <p style={{ color:T.text3, marginTop:6, fontSize:15 }}>
            {isGuest ? "You're in guest mode — sign up to unlock everything." : `Level ${user?.level} · ${level.title} · ${user?.streak} day streak 🔥`}
          </p>
        </div>
        {/* Quote */}
        <div style={{ maxWidth:320, padding:"16px 20px", background:T.card, border:`1px solid ${T.border}`, borderRadius:12, borderLeft:`3px solid ${T.amber}` }}>
          <div style={{ fontFamily:T.serif, fontSize:14, fontStyle:"italic", color:T.text2, lineHeight:1.6, marginBottom:8 }}>"{quote.q}"</div>
          <div style={{ fontSize:11, color:T.text3, letterSpacing:.3 }}>— {quote.a}</div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16, marginBottom:40 }}>
        {[
          { label:"Reading Level",  value: level.title, sub:`Level ${user?.level} of 10`, color:T.amber, icon:"⚡" },
          { label:"Current Streak", value:`${user?.streak}`, sub:"consecutive days", color:"#ff7043", icon:"🔥" },
          { label:"Avg WPM",        value: avgWpm||"--",   sub:"words per minute",   color:T.teal,  icon:"📖" },
          { label:"Sessions",       value: user?.totalSessions||"0", sub:"total completed", color:"#a78bfa", icon:"✓" },
        ].map((s,i) => (
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"22px 22px", animation:`fadeUp 0.4s ${0.05*i}s ease both` }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontFamily:T.serif, fontSize:32, fontWeight:900, color:s.color, letterSpacing:-1 }}>{s.value}</div>
            <div style={{ fontSize:12, color:T.text3, marginTop:4 }}>{s.sub}</div>
            <div style={{ fontSize:13, color:T.text2, marginTop:2, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Level progress */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"24px 28px", marginBottom:32, animation:"fadeUp 0.4s 0.2s ease both" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:T.serif, fontSize:18, fontWeight:700, color:T.text }}>Your Reading Level</div>
            <div style={{ fontSize:13, color:T.text3, marginTop:2 }}>Target: {level.min}–{level.max} WPM · {level.comp}%+ comprehension</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:T.serif, fontSize:28, fontWeight:900, color:T.amber }}>Lv {user?.level}</div>
            <div style={{ fontSize:12, color:T.text3 }}>{level.title}</div>
          </div>
        </div>
        <div style={{ background:T.surface, borderRadius:4, height:8, overflow:"hidden" }}>
          <div style={{ height:"100%", background:`linear-gradient(90deg,${T.amber},${T.amber2})`, width:`${((user?.level||1)-1)/9*100}%`, transition:"width 0.8s ease", borderRadius:4 }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11, color:T.text3 }}>
          <span>Novice</span><span>Legendary</span>
        </div>
      </div>

      {/* Two columns: recommended + quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:24, animation:"fadeUp 0.4s 0.25s ease both" }}>
        {/* Recommended passages */}
        <div>
          <div style={{ fontFamily:T.serif, fontSize:20, fontWeight:700, color:T.text, marginBottom:16 }}>Recommended For You</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {PASSAGES.filter(p => Math.abs(p.level - (user?.level||3)) <= 2).slice(0,3).map(p => (
              <PassageRow key={p.id} passage={p} onStart={onStart} />
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <div style={{ fontFamily:T.serif, fontSize:20, fontWeight:700, color:T.text, marginBottom:16 }}>Quick Start</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { label:"Browse Library",    icon:"📚", desc:"Curated passages by level", view:"library" },
              { label:"Generate with AI",  icon:"✨", desc:"Custom content at your level", view:"generate" },
              { label:"Upload a Text",     icon:"📤", desc:"Practice with your own content", view:"upload" },
              { label:`Flashcards ${dueCards > 0 ? `(${dueCards} due)`:``}`, icon:"🃏", desc:"Spaced repetition review", view:"flashcards" },
            ].map(a => (
              <button key={a.label} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:T.card, border:`1px solid ${T.border}`, borderRadius:10, cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=T.amber+"55"; e.currentTarget.style.background=T.amberGlow; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.card; }}>
                <span style={{ fontSize:22 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{a.label}</div>
                  <div style={{ fontSize:12, color:T.text3 }}>{a.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div style={{ marginTop:40, animation:"fadeUp 0.4s 0.3s ease both" }}>
          <div style={{ fontFamily:T.serif, fontSize:20, fontWeight:700, color:T.text, marginBottom:16 }}>Recent Sessions</div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  {["Passage","WPM","Comprehension","Words Read","Date"].map(h => (
                    <th key={h} style={{ padding:"12px 20px", textAlign:"left", fontSize:11, color:T.text3, fontWeight:600, letterSpacing:.5, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0,5).map((s,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:"14px 20px", fontSize:14, color:T.text }}>{s.passage.title}</td>
                    <td style={{ padding:"14px 20px", fontSize:14, color:T.amber, fontWeight:700, fontFamily:T.mono }}>{s.wpm}</td>
                    <td style={{ padding:"14px 20px", fontSize:14, color:T.teal, fontFamily:T.mono }}>{s.comp||"—"}%</td>
                    <td style={{ padding:"14px 20px", fontSize:14, color:T.text2, fontFamily:T.mono }}>{s.wordsRead}</td>
                    <td style={{ padding:"14px 20px", fontSize:12, color:T.text3 }}>{new Date(s.ts).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Passage row component
function PassageRow({ passage, onStart }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px", background:T.card, border:`1px solid ${T.border}`, borderRadius:12, transition:"all 0.15s", cursor:"pointer" }}
      onClick={() => onStart(passage)}
      onMouseEnter={e => { e.currentTarget.style.borderColor=T.amber+"44"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:T.serif, fontSize:16, fontWeight:700, color:T.text, marginBottom:6 }}>{passage.title}</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          <Tag label={`Level ${passage.level}`} color="amber" />
          <Tag label={passage.genre} />
          <Tag label={`${passage.wordCount}w`} />
        </div>
      </div>
      <Btn size="sm" onClick={(e) => { e.stopPropagation(); onStart(passage); }}>
        Read <SVG d={ICONS.arrow} size={13} stroke={T.bg} />
      </Btn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIBRARY
// ─────────────────────────────────────────────────────────────────────────────
function LibraryView({ onStart }) {
  const [genre, setGenre] = useState("all");
  const [search, setSearch] = useState("");
  const genres = ["all", ...new Set(PASSAGES.map(p=>p.genre))];
  const filtered = PASSAGES.filter(p => (genre==="all" || p.genre===genre) && (p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t=>t.includes(search.toLowerCase()))));

  return (
    <div style={{ padding:"40px 48px" }}>
      <div style={{ marginBottom:32, animation:"fadeUp 0.4s ease both" }}>
        <h1 style={{ fontFamily:T.serif, fontSize:36, fontWeight:900, color:T.text, marginBottom:6 }}>Library</h1>
        <p style={{ color:T.text3, fontSize:15 }}>Curated passages organized by level, genre, and topic.</p>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:28, animation:"fadeUp 0.4s 0.05s ease both" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search passages..." style={{ padding:"10px 16px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.card, color:T.text, fontSize:14, outline:"none", width:260 }} />
        <div style={{ display:"flex", gap:6 }}>
          {genres.map(g => (
            <button key={g} onClick={() => setGenre(g)} style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${genre===g ? T.amber : T.border}`, background: genre===g ? T.amberGlow : "transparent", color: genre===g ? T.amber : T.text3, cursor:"pointer", fontSize:13, fontWeight: genre===g ? 600 : 400, transition:"all 0.15s" }}>
              {g==="all" ? "All" : g}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:20 }}>
        {filtered.map((p, i) => (
          <div key={p.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"24px", display:"flex", flexDirection:"column", gap:16, animation:`fadeUp 0.4s ${0.04*i}s ease both`, transition:"border-color 0.15s", cursor:"pointer" }}
            onClick={() => onStart(p)}
            onMouseEnter={e => e.currentTarget.style.borderColor=T.amber+"44"}
            onMouseLeave={e => e.currentTarget.style.borderColor=T.border}>
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ fontFamily:T.serif, fontSize:18, fontWeight:700, color:T.text, lineHeight:1.3 }}>{p.title}</div>
                <Tag label={`Lv ${p.level}`} color="amber" />
              </div>
              <div style={{ fontSize:13, color:T.text3, lineHeight:1.6 }}>
                {p.text.slice(0,120)}...
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <Tag label={p.genre} />
              <Tag label={`${p.wordCount} words`} />
              {p.tags.slice(0,2).map(t => <Tag key={t} label={t} />)}
            </div>
            <Btn size="sm" style={{ alignSelf:"flex-start" }}>
              Start Reading <SVG d={ICONS.arrow} size={13} stroke={T.bg} />
            </Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// READING VIEW  — full-screen immersive reader
// ─────────────────────────────────────────────────────────────────────────────
function ReadingView({ passage, onFinish, onExit }) {
  const [mode, setMode]         = useState("highlight");
  const [wpm, setWpm]           = useState(250);
  const [playing, setPlaying]   = useState(false);
  const [wordIdx, setWordIdx]   = useState(0);
  const [elapsed, setElapsed]   = useState(0);
  const [startTs, setStartTs]   = useState(null);
  const [fontSize, setFontSize] = useState(18);
  const timerRef  = useRef(null);
  const clockRef  = useRef(null);
  const words     = passage.text.split(/\s+/);
  const progress  = words.length > 1 ? (wordIdx / (words.length-1)) * 100 : 0;
  const liveWpm   = elapsed > 4 ? Math.round((wordIdx / elapsed) * 60) : wpm;

  const tick = useCallback(() => {
    setWordIdx(prev => {
      if (prev+1 >= words.length) { setPlaying(false); return words.length-1; }
      return prev+1;
    });
  }, [words.length]);

  useEffect(() => {
    if (playing) {
      const ms = (60/wpm)*1000;
      timerRef.current = setInterval(tick, ms);
    } else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [playing, wpm, tick]);

  useEffect(() => {
    if (playing) {
      if (!startTs) setStartTs(Date.now());
      clockRef.current = setInterval(() => setElapsed(e=>e+1), 1000);
    } else { clearInterval(clockRef.current); }
    return () => clearInterval(clockRef.current);
  }, [playing]);

  const finish = () => {
    const t = Math.max(elapsed, 1);
    const actualWpm = Math.round((wordIdx/t)*60) || wpm;
    onFinish({ passage, wpm:actualWpm, comp:0, wordsRead:wordIdx, timeSeconds:t, ts:Date.now() });
  };

  // Highlight mode chunks
  const CHUNK = 6;
  const chunks = [];
  for (let i=0; i<words.length; i+=CHUNK) chunks.push({ words: words.slice(i,i+CHUNK), start:i, active: wordIdx>=i && wordIdx<i+CHUNK });

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:T.bg }}>
      {/* Top bar */}
      <div style={{ padding:"14px 32px", borderBottom:`1px solid ${T.border}`, background:T.surface, display:"flex", alignItems:"center", gap:20, flexShrink:0 }}>
        <button onClick={onExit} style={{ background:"none", border:"none", cursor:"pointer", color:T.text3, fontSize:13, display:"flex", alignItems:"center", gap:6 }}
          onMouseEnter={e=>e.currentTarget.style.color=T.red}
          onMouseLeave={e=>e.currentTarget.style.color=T.text3}>
          <SVG d={ICONS.x} size={16} stroke="currentColor" /> Exit
        </button>
        <div style={{ fontFamily:T.serif, fontSize:17, fontWeight:700, color:T.text, flex:1, textAlign:"center" }}>{passage.title}</div>
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:T.mono, fontSize:22, fontWeight:700, color:T.amber }}>{liveWpm}</div>
            <div style={{ fontSize:10, color:T.text3, letterSpacing:.5 }}>WPM</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:T.mono, fontSize:18, color:T.teal }}>{Math.round(progress)}%</div>
            <div style={{ fontSize:10, color:T.text3, letterSpacing:.5 }}>done</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:3, background:T.card, flexShrink:0 }}>
        <div style={{ height:"100%", background:`linear-gradient(90deg,${T.amber},${T.amber2})`, width:`${progress}%`, transition:"width 0.2s" }} />
      </div>

      {/* Mode + controls strip */}
      <div style={{ padding:"12px 32px", borderBottom:`1px solid ${T.border}`, background:T.surface, display:"flex", alignItems:"center", gap:16, flexShrink:0 }}>
        {/* Mode tabs */}
        <div style={{ display:"flex", gap:4 }}>
          {[["highlight","Highlight"],["rsvp","RSVP"],["scroll","Scroll"]].map(([m,l]) => (
            <button key={m} onClick={() => { setMode(m); setPlaying(false); setWordIdx(0); }} style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${mode===m ? T.amber : T.border}`, background: mode===m ? T.amberGlow : "transparent", color: mode===m ? T.amber : T.text3, cursor:"pointer", fontSize:13, fontWeight: mode===m ? 600 : 400, transition:"all 0.15s" }}>{l}</button>
          ))}
        </div>

        <div style={{ height:20, width:1, background:T.border }} />

        {/* Speed */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
          <span style={{ fontSize:12, color:T.text3, whiteSpace:"nowrap" }}>Speed</span>
          <input type="range" min={80} max={900} step={10} value={wpm} onChange={e=>setWpm(+e.target.value)} style={{ flex:1, maxWidth:220, accentColor:T.amber }} />
          <span style={{ fontFamily:T.mono, fontSize:14, color:T.text2, minWidth:70 }}>{wpm} wpm</span>
        </div>

        <div style={{ height:20, width:1, background:T.border }} />

        {/* Font size */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:12, color:T.text3 }}>Font</span>
          <button onClick={() => setFontSize(f=>Math.max(14,f-2))} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, width:28, height:28, cursor:"pointer", color:T.text2, fontSize:14 }}>−</button>
          <button onClick={() => setFontSize(f=>Math.min(32,f+2))} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, width:28, height:28, cursor:"pointer", color:T.text2, fontSize:14 }}>+</button>
        </div>

        <div style={{ height:20, width:1, background:T.border }} />

        {/* Play / Finish */}
        <div style={{ display:"flex", gap:8 }}>
          {mode !== "scroll" && (
            <Btn onClick={() => setPlaying(p=>!p)} variant={playing ? "secondary":"primary"} size="sm">
              {playing ? <>⏸ Pause</> : <>▶ Play</>}
            </Btn>
          )}
          <Btn onClick={finish} variant="teal" size="sm">
            Finish & Quiz →
          </Btn>
        </div>
      </div>

      {/* Reading area */}
      <div style={{ flex:1, overflow:"auto", display:"flex", alignItems: mode==="rsvp" ? "center":"flex-start", justifyContent:"center" }}>
        {mode==="rsvp" && (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{ fontFamily:T.serif, fontSize:Math.max(48, fontSize*2.5), color:T.text, minHeight:100, display:"flex", alignItems:"center", justifyContent:"center", letterSpacing:-0.5, animation:"rsvpIn 0.25s ease both" }} key={wordIdx}>
              <span style={{ color:T.amber }}>{words[wordIdx]}</span>
            </div>
            <div style={{ fontSize:13, color:T.text3, marginTop:24, fontFamily:T.mono }}>
              {wordIdx+1} / {words.length} words
            </div>
          </div>
        )}
        {mode==="highlight" && (
          <div style={{ maxWidth:760, padding:"48px 64px", lineHeight:2.2, fontSize:fontSize, color:T.text, fontFamily:T.serif }}>
            {chunks.map((c,i) => (
              <span key={i} style={{ background: c.active ? `${T.amber}2a` : "transparent", borderRadius:4, padding:"2px 0", transition:"background 0.15s" }}>
                {c.words.join(" ")}{" "}
              </span>
            ))}
          </div>
        )}
        {mode==="scroll" && (
          <div style={{ maxWidth:720, padding:"48px 64px", fontSize:fontSize, fontFamily:T.serif, lineHeight:2.2, color:T.text }}>
            {passage.text.split("\n\n").map((para,i) => (
              <p key={i} style={{ marginBottom:"1.8em" }}>{para}</p>
            ))}
            <div style={{ marginTop:40, paddingTop:24, borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"flex-end" }}>
              <Btn onClick={finish} variant="teal">Finished — Take Quiz →</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ VIEW
// ─────────────────────────────────────────────────────────────────────────────
function QuizView({ passage, sessionData, onSubmit, onExit }) {
  const questions = QUIZZES[passage.id] || QUIZZES.p1;
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const q = questions[current];

  const submit = () => {
    const missed = [];
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct) correct++;
      else missed.push(q);
    });
    const score = Math.round((correct/questions.length)*100);
    onSubmit({ score, correct, total:questions.length, missed, passage, sessionData });
  };

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg }}>
      {/* Left — question panel */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"48px 56px", overflowY:"auto" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:40 }}>
          <div>
            <div style={{ fontFamily:T.serif, fontSize:28, fontWeight:900, color:T.text }}>Comprehension Quiz</div>
            <div style={{ fontSize:14, color:T.text3, marginTop:4 }}>{passage.title}</div>
          </div>
          <button onClick={onExit} style={{ background:"none", border:"none", cursor:"pointer", color:T.text3, fontSize:13 }}
            onMouseEnter={e=>e.currentTarget.style.color=T.red}
            onMouseLeave={e=>e.currentTarget.style.color=T.text3}>
            Skip quiz
          </button>
        </div>

        {/* Progress dots */}
        <div style={{ display:"flex", gap:8, marginBottom:36 }}>
          {questions.map((_,i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{ flex:1, height:5, borderRadius:3, cursor:"pointer", background: answers[questions[i].id]!==undefined ? T.amber : i===current ? T.teal : T.card2, transition:"background 0.2s" }} />
          ))}
        </div>

        {/* Question */}
        <div style={{ animation:"fadeIn 0.25s ease both" }} key={q.id}>
          <div style={{ fontSize:11, color:T.amber, letterSpacing:1, fontWeight:700, textTransform:"uppercase", marginBottom:12 }}>
            Question {current+1} of {questions.length} · {q.type==="tf" ? "True / False" : "Multiple Choice"}
          </div>
          <div style={{ fontFamily:T.serif, fontSize:22, lineHeight:1.6, color:T.text, marginBottom:32 }}>{q.q}</div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {q.choices.map((c,i) => {
              const sel = answers[q.id]===i;
              return (
                <button key={i} onClick={() => setAnswers(prev=>({...prev,[q.id]:i}))} style={{ padding:"16px 20px", borderRadius:10, border:`2px solid ${sel ? T.amber : T.border}`, background: sel ? T.amberGlow : T.card, color:T.text, textAlign:"left", cursor:"pointer", fontSize:15, transition:"all 0.15s", display:"flex", alignItems:"center", gap:14 }}
                  onMouseEnter={e => { if(!sel){ e.currentTarget.style.borderColor=T.amber+"44"; e.currentTarget.style.background=T.card2; }}}
                  onMouseLeave={e => { if(!sel){ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.card; }}}>
                  <span style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${sel ? T.amber : T.border2}`, background: sel ? T.amber : "transparent", color: sel ? T.bg : T.text3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>
                    {sel ? "✓" : String.fromCharCode(65+i)}
                  </span>
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display:"flex", gap:12, marginTop:40 }}>
          {current>0 && <Btn variant="secondary" onClick={()=>setCurrent(c=>c-1)}>← Previous</Btn>}
          {current < questions.length-1
            ? <Btn onClick={()=>setCurrent(c=>c+1)}>Next →</Btn>
            : <Btn onClick={submit} disabled={Object.keys(answers).length < questions.length} variant="teal">Submit Quiz ✓</Btn>
          }
        </div>
      </div>

      {/* Right — passage preview */}
      <div style={{ width:380, flexShrink:0, borderLeft:`1px solid ${T.border}`, padding:"48px 32px", overflowY:"auto", background:T.surface }}>
        <div style={{ fontSize:13, color:T.text3, marginBottom:16, fontWeight:600, letterSpacing:.5, textTransform:"uppercase" }}>Passage Reference</div>
        <div style={{ fontFamily:T.serif, fontSize:15, lineHeight:1.9, color:T.text2 }}>
          {passage.text.slice(0,600)}
          <span style={{ color:T.text3 }}>…</span>
        </div>
        {sessionData && (
          <div style={{ marginTop:24, padding:"14px 16px", background:T.card, borderRadius:10, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:11, color:T.text3, marginBottom:8, letterSpacing:.5, textTransform:"uppercase" }}>Your Session</div>
            <div style={{ display:"flex", gap:20 }}>
              <div><div style={{ fontFamily:T.mono, fontSize:20, color:T.amber, fontWeight:700 }}>{sessionData.wpm}</div><div style={{ fontSize:11, color:T.text3 }}>WPM</div></div>
              <div><div style={{ fontFamily:T.mono, fontSize:20, color:T.teal, fontWeight:700 }}>{sessionData.wordsRead}</div><div style={{ fontSize:11, color:T.text3 }}>words</div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ResultsView({ results, onDone, onFlashcards }) {
  const { score, correct, total, missed, passage, sessionData } = results;
  const grade = score>=85 ? ["🏆","Exceptional!",T.amber] : score>=70 ? ["⭐","Great work!",T.teal] : score>=50 ? ["📈","Keep going!","#ffa500"] : ["💪","Room to grow","#a78bfa"];

  return (
    <div style={{ padding:"48px 64px", maxWidth:1000, animation:"fadeUp 0.4s ease both" }}>
      {/* Hero */}
      <div style={{ display:"flex", gap:48, marginBottom:48 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:56, marginBottom:16 }}>{grade[0]}</div>
          <div style={{ fontFamily:T.serif, fontSize:40, fontWeight:900, color:grade[2], letterSpacing:-1, marginBottom:8 }}>{grade[1]}</div>
          <div style={{ fontSize:16, color:T.text2, marginBottom:32 }}>You answered {correct} of {total} questions correctly on <em>{passage.title}</em>.</div>

          <div style={{ display:"flex", gap:16 }}>
            <Btn size="lg" onClick={onDone}>Back to Dashboard</Btn>
            {missed.length>0 && <Btn variant="secondary" size="lg" onClick={onFlashcards}>📇 Add {missed.length} to Flashcards</Btn>}
          </div>
        </div>

        {/* Score ring */}
        <div style={{ width:200, flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:T.card, border:`1px solid ${T.border}`, borderRadius:20, padding:32 }}>
          <div style={{ fontFamily:T.serif, fontSize:72, fontWeight:900, color:grade[2], lineHeight:1 }}>{score}</div>
          <div style={{ fontSize:16, color:T.text3, marginTop:4 }}>out of 100</div>
          {sessionData && (
            <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${T.border}`, width:"100%", textAlign:"center" }}>
              <div style={{ fontFamily:T.mono, fontSize:24, color:T.amber, fontWeight:700 }}>{sessionData.wpm}</div>
              <div style={{ fontSize:11, color:T.text3 }}>words per minute</div>
            </div>
          )}
        </div>
      </div>

      {/* Missed questions review */}
      {missed.length > 0 && (
        <div>
          <div style={{ fontFamily:T.serif, fontSize:22, fontWeight:700, color:T.text, marginBottom:16 }}>Review Missed Questions</div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {missed.map(q => (
              <div key={q.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"20px 24px" }}>
                <div style={{ fontSize:15, color:T.text, marginBottom:10, fontFamily:T.serif }}>{q.q}</div>
                <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <span style={{ color:T.teal, fontSize:16 }}>✓</span>
                  <div style={{ fontSize:14, color:T.teal }}>{q.choices[q.correct]}</div>
                </div>
                <div style={{ fontSize:13, color:T.text3, marginTop:8, lineHeight:1.6 }}>{q.exp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encouragement */}
      <div style={{ marginTop:40, padding:"20px 24px", background:T.amberGlow, border:`1px solid ${T.amber}33`, borderRadius:12 }}>
        <div style={{ fontFamily:T.serif, fontSize:16, fontStyle:"italic", color:T.text2, lineHeight:1.7 }}>
          {score>=70 ? `Excellent session! You read ${passage.wordCount} words${sessionData ? ` at ${sessionData.wpm} WPM` : ""}. One more session today to strengthen your streak.` : `Every passage you read builds your vocabulary and comprehension. Come back tomorrow — consistency beats intensity.`}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function GenerateView({ user, isGuest, onStart, notify }) {
  const [genre,   setGenre]   = useState("fiction");
  const [level,   setLevel]   = useState(user?.level||3);
  const [length,  setLength]  = useState(300);
  const [topic,   setTopic]   = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (isGuest) { notify("Sign up to use AI Generation", "err"); return; }
    setLoading(true);
    try {
      const prompts = {
        fiction:   `Write a ${length}-word short fiction passage for a reader at level ${level} (target WPM ~${LEVELS[level-1].min}). Use varied sentence length and advanced vocabulary. Topic: ${topic || "a chance encounter in an old city"}. No profanity or adult content.`,
        academic:  `Write a ${length}-word expository passage for level ${level} readers. Use precise academic language and 2-3 domain-specific terms. Topic: ${topic || "the science of memory and learning"}. End with a summary sentence.`,
        vocabulary:`Write a ${length}-word passage for level ${level} readers featuring rich, sophisticated vocabulary. Include at least 8 advanced words in natural context. Topic: ${topic || "the nature of time and perception"}. No adult content.`,
      };
      const text = await callClaude(prompts[genre]);
      const p = {
        id:`gen-${Date.now()}`,
        title: topic ? topic.charAt(0).toUpperCase()+topic.slice(1) : `AI: ${genre.charAt(0).toUpperCase()+genre.slice(1)}`,
        genre: `AI ${genre.charAt(0).toUpperCase()+genre.slice(1)}`,
        level, wordCount: text.split(/\s+/).length,
        text, tags:["ai-generated",genre],
      };
      notify("Passage ready!");
      onStart(p);
    } catch(e) { notify("Generation failed — please try again", "err"); }
    setLoading(false);
  };

  const SelectGroup = ({ label, options, value, onChange }) => (
    <div style={{ marginBottom:28 }}>
      <div style={{ fontSize:12, color:T.text3, fontWeight:600, letterSpacing:.8, textTransform:"uppercase", marginBottom:10 }}>{label}</div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {options.map(o => (
          <button key={o.v} onClick={() => onChange(o.v)} style={{ padding:"9px 18px", borderRadius:8, border:`1px solid ${value===o.v ? T.amber : T.border}`, background: value===o.v ? T.amberGlow : T.card, color: value===o.v ? T.amber : T.text2, cursor:"pointer", fontSize:14, fontWeight: value===o.v ? 600 : 400, transition:"all 0.15s" }}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding:"40px 48px", maxWidth:800 }}>
      <div style={{ marginBottom:40, animation:"fadeUp 0.4s ease both" }}>
        <h1 style={{ fontFamily:T.serif, fontSize:36, fontWeight:900, color:T.text, marginBottom:6 }}>AI Generate</h1>
        <p style={{ color:T.text3, fontSize:15 }}>Create custom passages tuned to your level and interests using Claude AI.</p>
      </div>

      {isGuest && (
        <div style={{ padding:"14px 18px", background:`${T.red}11`, border:`1px solid ${T.red}33`, borderRadius:10, marginBottom:28, fontSize:14, color:T.red, animation:"fadeUp 0.4s ease both" }}>
          ⚠️ AI generation requires an account. Sign up — it's free.
        </div>
      )}

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"32px 36px", animation:"fadeUp 0.4s 0.05s ease both" }}>
        <SelectGroup label="Genre" value={genre} onChange={setGenre}
          options={[{v:"fiction",l:"Short Fiction"},{v:"academic",l:"Academic"},{v:"vocabulary",l:"High Vocabulary"}]} />
        <SelectGroup label="Difficulty Level" value={level} onChange={setLevel}
          options={LEVELS.map(l=>({v:l.n,l:`${l.n} — ${l.title}`}))} />
        <SelectGroup label="Length" value={length} onChange={setLength}
          options={[{v:150,l:"Short (150w)"},{v:300,l:"Medium (300w)"},{v:500,l:"Long (500w)"}]} />

        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:12, color:T.text3, fontWeight:600, letterSpacing:.8, textTransform:"uppercase", marginBottom:10 }}>Topic (optional)</div>
          <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. deep-sea exploration, ancient Rome, quantum mechanics…" style={{ width:"100%", padding:"13px 16px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.surface, color:T.text, fontSize:15, outline:"none", transition:"border-color 0.2s" }} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=T.border2} />
        </div>

        <Btn size="lg" onClick={generate} disabled={loading} style={{ width:"100%", justifyContent:"center" }}>
          {loading
            ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>✦</span> Generating…</>
            : <>✨ Generate Passage</>}
        </Btn>
      </div>

      {/* Prompt preview */}
      <div style={{ marginTop:24, padding:"18px 22px", background:T.card, border:`1px solid ${T.border}`, borderRadius:10, animation:"fadeUp 0.4s 0.1s ease both" }}>
        <div style={{ fontSize:11, color:T.text3, fontWeight:600, letterSpacing:.8, textTransform:"uppercase", marginBottom:8 }}>Example Prompts Used</div>
        <div style={{ fontSize:13, color:T.text3, lineHeight:1.8, fontFamily:T.mono }}>
          Fiction: "Write a {length}-word story for level {level}..."<br/>
          Academic: "Expository passage with domain-specific terms..."<br/>
          High Vocab: "Rich vocabulary with contextual usage..."
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLASHCARDS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function FlashcardsView({ flashcards, setFlashcards }) {
  const [idx, setIdx]       = useState(0);
  const [flipped, setFlipped] = useState(false);
  const due = flashcards.filter(f => f.due <= Date.now());

  const review = (easy) => {
    const card = due[idx % due.length];
    setFlashcards(prev => prev.map(f => f.id===card.id
      ? { ...f, interval: easy ? f.interval*2 : 1, due: Date.now() + (easy ? f.interval*2 : 1)*86400000 }
      : f
    ));
    setFlipped(false);
    setIdx(i => i+1);
  };

  return (
    <div style={{ padding:"40px 48px" }}>
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:T.serif, fontSize:36, fontWeight:900, color:T.text, marginBottom:6 }}>Flashcards</h1>
        <p style={{ color:T.text3, fontSize:15 }}>Spaced repetition for long-term retention. {due.length} card{due.length!==1?"s":""} due for review.</p>
      </div>

      {due.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 40px", background:T.card, border:`1px solid ${T.border}`, borderRadius:20 }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
          <div style={{ fontFamily:T.serif, fontSize:28, fontWeight:900, color:T.text, marginBottom:8 }}>All caught up!</div>
          <div style={{ fontSize:15, color:T.text3 }}>No flashcards due. Complete quizzes to add more.</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, maxWidth:900 }}>
          {/* Card */}
          <div style={{ display:"flex", flexDirection:"column" }}>
            <div onClick={() => setFlipped(f=>!f)} style={{ background:T.card, border:`2px solid ${flipped ? T.amber : T.border}`, borderRadius:20, padding:"48px 40px", minHeight:280, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.25s", textAlign:"center" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.amber+"55"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=flipped?T.amber:T.border}>
              <div style={{ fontSize:11, color:flipped?T.amber:T.text3, letterSpacing:1, textTransform:"uppercase", fontWeight:700, marginBottom:20 }}>
                {flipped ? "Answer" : "Question"}
              </div>
              <div style={{ fontFamily:T.serif, fontSize:18, lineHeight:1.7, color:T.text }}>
                {flipped ? due[idx % due.length]?.answer : due[idx % due.length]?.question}
              </div>
              {!flipped && <div style={{ fontSize:12, color:T.text3, marginTop:24 }}>Click to reveal answer</div>}
            </div>

            {flipped && (
              <div style={{ display:"flex", gap:12, marginTop:16, animation:"fadeUp 0.2s ease both" }}>
                <Btn variant="danger" onClick={() => review(false)} style={{ flex:1, justifyContent:"center" }}>
                  😕 Forgot
                </Btn>
                <Btn variant="teal" onClick={() => review(true)} style={{ flex:1, justifyContent:"center" }}>
                  ✓ Got it
                </Btn>
              </div>
            )}
          </div>

          {/* Stats sidebar */}
          <div>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"24px", marginBottom:16 }}>
              <div style={{ fontSize:12, color:T.text3, letterSpacing:.5, textTransform:"uppercase", marginBottom:16, fontWeight:600 }}>Queue</div>
              <div style={{ fontFamily:T.serif, fontSize:44, fontWeight:900, color:T.amber, marginBottom:4 }}>{due.length}</div>
              <div style={{ fontSize:14, color:T.text3 }}>cards due for review</div>
            </div>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"24px" }}>
              <div style={{ fontSize:12, color:T.text3, letterSpacing:.5, textTransform:"uppercase", marginBottom:16, fontWeight:600 }}>Spaced Repetition</div>
              <div style={{ fontSize:14, color:T.text2, lineHeight:1.8 }}>
                Cards you answer correctly are shown less frequently.<br/><br/>
                Cards you forget are shown again sooner.<br/><br/>
                This is based on the SM-2 algorithm.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD VIEW
// ─────────────────────────────────────────────────────────────────────────────
function UploadView({ onStart, notify }) {
  const [title, setTitle] = useState("");
  const [text,  setText]  = useState("");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const start = () => {
    if (wordCount < 50) { notify("Please paste at least 50 words", "err"); return; }
    onStart({ id:`upload-${Date.now()}`, title:title||"My Upload", genre:"Custom", level:5, wordCount, text:text.trim(), tags:["uploaded"] });
  };

  return (
    <div style={{ padding:"40px 48px", maxWidth:860 }}>
      <div style={{ marginBottom:36, animation:"fadeUp 0.4s ease both" }}>
        <h1 style={{ fontFamily:T.serif, fontSize:36, fontWeight:900, color:T.text, marginBottom:6 }}>Upload Text</h1>
        <p style={{ color:T.text3, fontSize:15 }}>Paste any text to practice with your own content — articles, essays, chapters.</p>
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"32px", animation:"fadeUp 0.4s 0.05s ease both" }}>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, color:T.text3, fontWeight:600, letterSpacing:.8, textTransform:"uppercase", display:"block", marginBottom:8 }}>Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Chapter 3 — The Origin of Species" style={{ width:"100%", padding:"12px 16px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.surface, color:T.text, fontSize:15, outline:"none" }} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=T.border2} />
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, color:T.text3, fontWeight:600, letterSpacing:.8, textTransform:"uppercase", display:"block", marginBottom:8 }}>
            Paste Text <span style={{ color:T.text3, textTransform:"none", letterSpacing:0, fontSize:11 }}>· {wordCount} words · {wordCount>=50 ? "✓ ready" : `need ${50-wordCount} more`}</span>
          </label>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste your text here (minimum 50 words)…" style={{ width:"100%", height:320, padding:"16px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.surface, color:T.text, fontSize:16, fontFamily:T.serif, lineHeight:1.8, resize:"vertical", outline:"none" }} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=T.border2} />
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:13, color:T.text3 }}>Supports plain text paste · PDF and DOCX import in full version</div>
          <Btn size="lg" onClick={start} disabled={wordCount<50}>
            Start Session →
          </Btn>
        </div>
      </div>
    </div>
  );
}