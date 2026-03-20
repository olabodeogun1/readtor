import { useState, useEffect, useRef, useCallback } from "react";
import { signUp, signIn, signInWithGoogle, signOut, getSession, getProfile, ensureProfile } from './auth';
import { supabase } from './supabaseClient';

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

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
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes rsvpIn { 0% { opacity:0; transform:scale(0.88) translateY(6px); } 40% { opacity:1; transform:scale(1) translateY(0); } 85% { opacity:1; } 100% { opacity:0; } }
  .fadeUp { animation: fadeUp 0.4s ease both; }
`;
const styleEl = document.createElement("style");
styleEl.textContent = globalCSS;
document.head.appendChild(styleEl);

const T = {
  bg:        "#07080f",
  surface:   "#0d0f1c",
  card:      "#111420",
  card2:     "#161926",
  border:    "#1e2235",
  border2:   "#262b3f",
  text:      "#e8e4d8",
  text2:     "#a8a49a",
  text3:     "#5a5870",
  amber:     "#e8a838",
  amber2:    "#f5c76a",
  amberGlow: "rgba(232,168,56,0.12)",
  teal:      "#3ecfb0",
  teal2:     "#5ee8cb",
  red:       "#e85555",
  serif:     "'Playfair Display', Georgia, serif",
  sans:      "'DM Sans', sans-serif",
  mono:      "'DM Mono', monospace",
};

const LEVELS = [
  { n:1,  min:100, max:149, comp:60, title:"Novice"       },
  { n:2,  min:150, max:199, comp:62, title:"Beginner"     },
  { n:3,  min:200, max:239, comp:65, title:"Developing"   },
  { n:4,  min:240, max:279, comp:68, title:"Intermediate" },
  { n:5,  min:280, max:319, comp:72, title:"Proficient"   },
  { n:6,  min:320, max:369, comp:75, title:"Advanced"     },
  { n:7,  min:370, max:429, comp:78, title:"Expert"       },
  { n:8,  min:430, max:499, comp:80, title:"Master"       },
  { n:9,  min:500, max:599, comp:83, title:"Elite"        },
  { n:10, min:600, max:900, comp:85, title:"Legendary"    },
];

const QUOTES = [
  { q:"A reader lives a thousand lives before he dies.",           a:"George R.R. Martin" },
  { q:"Reading is to the mind what exercise is to the body.",      a:"Joseph Addison"     },
  { q:"Not all readers are leaders, but all leaders are readers.", a:"Harry S. Truman"    },
  { q:"Once you learn to read, you will be forever free.",         a:"Frederick Douglass" },
  { q:"A book is a dream that you hold in your hands.",            a:"Neil Gaiman"        },
  { q:"There is no friend as loyal as a book.",                    a:"Ernest Hemingway"   },
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
  {
    id:"p7", title:"The First Morning in Lagos", genre:"Fiction", level:3, wordCount:238,
    text:`Tunde woke before the generator came on. In those few quiet minutes, the city breathed differently — slower, softer, as if Lagos itself needed a moment before resuming its relentless performance.\n\nHe lay still on the narrow bed and listened. A rooster somewhere behind the compound. The distant call to prayer drifting from the mosque on Adeleke Street. The sound of his mother already moving in the kitchen, the rhythmic thump of a pestle that had been waking him every morning for twenty-two years.\n\nHe was leaving today.\n\nThe scholarship letter was folded in the inside pocket of his good jacket, which hung on the door like a question mark. Edinburgh. The word had felt impossible in his mouth when he first read it, a sound from a different kind of life. Now it felt simply heavy.\n\nHis mother appeared in the doorway. She did not say anything for a long moment, just looked at him the way she sometimes looked at the photographs on the wall — with a careful attention, as if trying to memorize something she suspected she might not always have.\n\n"Eat first," she said finally. "Everything else can wait until you have eaten."\n\nHe got up. Outside, the generator coughed to life, and Lagos resumed its noise, and his last ordinary morning began.`,
    tags:["fiction","africa","coming of age"],
  },
  {
    id:"p8", title:"How Habits Form", genre:"Academic", level:4, wordCount:251,
    text:`Every habit, no matter how complex it appears, follows the same basic structure: a cue, a routine, and a reward. This three-part loop, identified by researchers at MIT in the 1990s through experiments with rats navigating mazes, underlies virtually every habitual behavior in humans — from brushing teeth to checking a phone to reaching for a cigarette.\n\nThe cue is a trigger that tells the brain to enter automatic mode and which habit to use. It can be a time of day, an emotional state, a location, the presence of certain people, or an immediately preceding action. The routine is the physical, mental, or emotional behavior that follows the cue. The reward is what tells the brain whether the loop is worth remembering for the future.\n\nOver time, as a cue-routine-reward pattern is repeated, the brain begins to anticipate the reward the moment the cue appears. This anticipation — called craving — is what gives habits their power and their persistence. It is also what makes habits so difficult to break: removing the routine does not remove the craving, which continues to be triggered by the original cue.\n\nThe most reliable method for changing a habit is not elimination but substitution: keeping the existing cue and reward while inserting a new routine in between. This approach works because the neural pathway created by the original habit remains intact; only its behavioral expression is altered. Understanding this mechanism is the first step toward exercising deliberate control over the patterns that quietly govern daily life.`,
    tags:["psychology","habits","self-improvement"],
  },
  {
    id:"p9", title:"The Cartographer's Dilemma", genre:"Science Fiction", level:6, wordCount:274,
    text:`Every map is a lie. This was the first thing Professor Osei told his students, and the last thing they believed.\n\nMaps impose stillness on things that move. They draw lines where lines do not exist. They reduce the infinite texture of the world to a surface you can fold and put in your pocket. Every map is an argument about what matters — and therefore, silently, about what does not.\n\nDr. Amara Osei had spent thirty years making maps of places that did not officially exist: disputed borders, contested coastlines, territories whose names changed depending on who you asked. Her work had been cited in international court cases. It had also, twice, gotten her detained at airports.\n\nNow she stood at the edge of something unprecedented. The survey drones had returned from the deep Saharan coordinates with data that refused to make sense. The topography was wrong — not incorrect in the way data was sometimes corrupted, but wrong in the way a dream is wrong, internally consistent yet fundamentally impossible.\n\nA valley that appeared in evening scans was absent by morning. A ridge that the lidar confirmed at thirty meters simply was not there when the ground team arrived.\n\n"The land is moving," said her assistant, Kofi, not helpfully.\n\n"Land doesn't move on that timescale," Amara said.\n\n"Then perhaps," Kofi said carefully, "we need a different kind of map."\n\nShe looked at the data again. He was right, she realized — but she had no idea what kind of map could hold a place like this.`,
    tags:["science fiction","africa","mystery"],
  },
  {
    id:"p10", title:"The Economics of Sleep", genre:"Academic", level:5, wordCount:262,
    text:`Sleep deprivation costs the United States an estimated 411 billion dollars annually in lost productivity — a figure that places insufficient sleep among the most expensive public health problems in the developed world. Yet despite overwhelming evidence of its physiological necessity, sleep remains culturally undervalued, frequently sacrificed in the pursuit of professional achievement.\n\nThe consequences of this trade-off are considerably more severe than most people appreciate. After seventeen hours without sleep, cognitive performance declines to a level equivalent to a blood alcohol concentration of 0.05 percent. After twenty-four hours, that equivalence rises to 0.10 percent — legally intoxicated in every jurisdiction. Unlike alcohol impairment, however, sleep deprivation impairs one's ability to accurately assess one's own level of impairment, creating a dangerous confidence in compromised performance.\n\nThe mechanisms behind these effects are well understood. During sleep, the glymphatic system — a network of channels surrounding the brain's blood vessels — clears metabolic waste products that accumulate during waking hours, including amyloid-beta proteins associated with Alzheimer's disease. The hippocampus consolidates short-term memories into long-term storage. Stress hormones are regulated. Immune function is restored.\n\nPerhaps most significantly for knowledge workers, the prefrontal cortex — the region responsible for judgment, creativity, and nuanced decision-making — is disproportionately sensitive to sleep loss. The very cognitive functions that professionals most rely upon are the first to deteriorate.\n\nIn this light, the cultural equation of sleeplessness with productivity is not merely misguided. It is measurably self-defeating.`,
    tags:["health","science","productivity"],
  },
  {
    id:"p11", title:"Letters Never Sent", genre:"Literary Fiction", level:7, wordCount:256,
    text:`My grandmother kept them in a shoebox under the bed she had slept in for fifty-one years. After she died, my mother found them before I did, and when she handed them to me her face had the particular expression of someone delivering news they have not yet fully absorbed themselves.\n\nThere were forty-three letters. All addressed to a man named Romuald Szymanski at an address in Warsaw that no longer existed. None of them had ever been posted.\n\nThe earliest was dated August 1959. The most recent, December 2019 — three months before she died, in her ninety-first year, in the same room where she had written all the others.\n\nI do not read Polish with any fluency. My grandmother had always spoken to me in English, a language she had mastered with characteristic determination after arriving in London in 1946 with nothing except a cardboard suitcase and the kind of composure that can only be assembled from the ruins of something unimaginable.\n\nI had the letters translated by a professor at University College. She called me after the third one to ask if I was all right.\n\nWhat I learned was this: my grandmother had been twenty-one years old when she last saw Romuald Szymanski. She had spent the following seventy years conducting, in private, the conversation that history had interrupted. The letters were not expressions of grief. They were simply — and this is what undid me — a continuation. As if she had simply refused to accept that the story was over.`,
    tags:["literary fiction","history","family"],
  },
  {
    id:"p12", title:"The Deep Ocean", genre:"Academic", level:8, wordCount:289,
    text:`More than eighty percent of the ocean remains unmapped, unobserved, and unexplored — a fact that becomes increasingly extraordinary when one considers that the ocean constitutes roughly ninety-seven percent of Earth's habitable volume. We have more detailed maps of the lunar surface than we do of the seafloor.\n\nThe practical obstacles to deep-sea exploration are formidable. At a depth of one thousand meters, pressure reaches approximately one hundred atmospheres — sufficient to crush most conventional equipment. At the deepest point in the ocean, the Challenger Deep in the Mariana Trench, pressure exceeds one thousand atmospheres. Only three descents by humans have ever reached that depth, the most recent in 2019.\n\nYet the organisms that inhabit these crushing depths have evolved solutions of considerable elegance. The barreleye fish maintains transparent fluid-filled chambers in its head that allow it to rotate its eyes upward to detect the silhouettes of prey against faint surface light. The anglerfish generates bioluminescent lures through a symbiotic relationship with bacteria that produce light via chemical oxidation. The Pompeii worm tolerates temperatures exceeding eighty degrees Celsius at hydrothermal vents while its anterior end remains in water near two degrees — the steepest temperature gradient endured by any known animal.\n\nWhat these adaptations suggest, to biologists of a certain disposition, is less a catalogue of curiosities than a reminder: life does not merely tolerate extreme conditions. It specializes in them. Every environment that has ever seemed too hostile for biology has eventually yielded organisms that found it, specifically, home.`,
    tags:["science","ocean","biology"],
  },
];

const QUIZZES = {
  p1: [
    { id:"q1", type:"mc", q:"What did the entanglement achieve for exactly 0.003 seconds?", choices:["Nuclear fusion","Perfect particle correlation","Time reversal","Quantum tunneling"], correct:1, exp:"Two particles maintained perfect correlation across a distance that should have severed any connection." },
    { id:"q2", type:"tf", q:"Professor Chen believed Elena's equation was theoretically achievable.", choices:["True","False"], correct:1, exp:"Professor Chen declared it 'theoretically impossible' — Elena treated this as an invitation." },
    { id:"q3", type:"mc", q:"What was Elena's immediate reaction after the experiment ended?", choices:["She called Professor Chen","She began drafting a paper","She ran the experiment again","She celebrated with colleagues"], correct:1, exp:"Elena immediately started drafting the paper in her head while typing urgently." },
    { id:"q4", type:"mc", q:"How many times did Elena save her data?", choices:["3","7","17","Once"], correct:2, exp:"She saved the data seventeen times in succession." },
    { id:"q5", type:"tf", q:"The particle array was still functional at the end of the passage.", choices:["True","False"], correct:1, exp:"The array collapsed and the hum dissipated, returning the laboratory to silence." },
  ],
  p2: [
    { id:"q1", type:"mc", q:"Who developed Cognitive Load Theory?", choices:["Vygotsky","Piaget","John Sweller","Benjamin Bloom"], correct:2, exp:"John Sweller developed the theory in the 1980s." },
    { id:"q2", type:"mc", q:"Which load type is caused by poor instructional design?", choices:["Intrinsic","Extraneous","Germane","Schema"], correct:1, exp:"Extraneous load arises from suboptimal instructional design." },
    { id:"q3", type:"tf", q:"Intrinsic load can be eliminated through better instructional design.", choices:["True","False"], correct:1, exp:"Only extraneous load is eliminable; intrinsic load is inherent to material complexity." },
    { id:"q4", type:"mc", q:"What does germane load relate to?", choices:["Material difficulty","Poor presentation","Schema formation and automation","Working memory limits"], correct:2, exp:"Germane load describes resources devoted to schema formation." },
  ],
  p3: [
    { id:"q1", type:"mc", q:"Where did Mira take shelter from the rain?", choices:["A café","A shuttered parfumerie","A hotel lobby","A bookshop"], correct:1, exp:"Mira ducked beneath the awning of a shuttered parfumerie." },
    { id:"q2", type:"tf", q:"Thomas Vane was accustomed to receiving unexpected kindness.", choices:["True","False"], correct:1, exp:"He had a 'separate cognitive apparatus for processing' unexpected kindness — implying it was rare." },
    { id:"q3", type:"mc", q:"What did Mira sense at the passage's end?", choices:["Annoyance at the stranger","Something consequential disguised as coincidence","A desire to leave quickly","Recognition of Thomas from before"], correct:1, exp:"Mira had 'the particular sensation of encountering something consequential disguised as coincidence.'" },
  ],
  p4: [
    { id:"q1", type:"mc", q:"According to the passage, memory is best described as:", choices:["A filing cabinet","A database","An act of reconstruction","A photograph"], correct:2, exp:"The passage argues memory is 'an act of reconstruction.'" },
    { id:"q2", type:"mc", q:"Which brain region plays a critical role in encoding new memories?", choices:["Cerebellum","Hippocampus","Occipital lobe","Cerebral cortex"], correct:1, exp:"The hippocampus plays a particularly critical role in encoding and consolidating new memories." },
    { id:"q3", type:"tf", q:"Semantic memory retains the specific context in which facts were learned.", choices:["True","False"], correct:1, exp:"Semantic memory stores factual knowledge 'abstracted from specific experiences.'" },
  ],
  p5: [
    { id:"q1", type:"mc", q:"How long had Martin worked at the lighthouse?", choices:["Twenty years","Thirty years","Forty-three years","Fifty years"], correct:2, exp:"Martin had watched the beam sweep the darkness 'every night for forty-three years.'" },
    { id:"q2", type:"mc", q:"What was Halvorsen's insight about the lighthouse beam?", choices:["It warns ships of rocks","It is for the sea, not the ships","It powers the radio beacon","It scares away birds"], correct:1, exp:"Halvorsen said the light is for the sea — to remind it that we're still watching." },
    { id:"q3", type:"tf", q:"Martin immediately found Halvorsen's philosophy sentimental and wise.", choices:["True","False"], correct:1, exp:"Martin 'had thought this sentimental at the time' — he only came to understand it later." },
  ],
  p6: [
    { id:"q1", type:"mc", q:"What does 'emergence' refer to?", choices:["Simple behaviors in isolated systems","Properties irreducible to component parts","Predictable outcomes from basic rules","Gradual evolutionary changes"], correct:1, exp:"Emergence is when complex systems exhibit properties irreducible to their components." },
    { id:"q2", type:"mc", q:"What is the 'hard problem of consciousness'?", choices:["Understanding neural pathways","Why we forget dreams","Why physical processes give rise to subjective experience","How memories are stored"], correct:2, exp:"The hard problem asks why physical processes give rise to subjective experience." },
    { id:"q3", type:"tf", q:"Strong emergence claims properties can always be derived with enough computation.", choices:["True","False"], correct:1, exp:"Weak emergence allows derivation in principle; strong emergence posits fundamentally irreducible properties." },
  ],
  p7: [
    { id:"q1", type:"mc", q:"Where is Tunde's scholarship taking him?", choices:["London","New York","Edinburgh","Accra"], correct:2, exp:"The scholarship letter said Edinburgh." },
    { id:"q2", type:"tf", q:"Tunde's mother was still asleep when he woke up.", choices:["True","False"], correct:1, exp:"His mother was already moving in the kitchen, using a pestle." },
    { id:"q3", type:"mc", q:"What hung on the door like a 'question mark'?", choices:["The scholarship letter","His good jacket","A calendar","A photograph"], correct:1, exp:"His good jacket hung on the door like a question mark." },
    { id:"q4", type:"tf", q:"Tunde felt purely excited about leaving.", choices:["True","False"], correct:1, exp:"The word Edinburgh 'felt simply heavy' — suggesting mixed or burdened feelings." },
  ],
  p8: [
    { id:"q1", type:"mc", q:"What are the three parts of the habit loop?", choices:["Trigger, action, outcome","Cue, routine, reward","Signal, behavior, result","Prompt, response, reinforcement"], correct:1, exp:"The habit loop consists of a cue, a routine, and a reward." },
    { id:"q2", type:"mc", q:"What is 'craving' in the context of habits?", choices:["The physical sensation of hunger","Anticipation of the reward triggered by the cue","Boredom that leads to habit formation","The guilt after breaking a habit"], correct:1, exp:"Craving is the brain's anticipation of the reward the moment the cue appears." },
    { id:"q3", type:"tf", q:"The best way to break a habit is to eliminate the cue entirely.", choices:["True","False"], correct:1, exp:"The most reliable method is substitution — keeping the cue and reward, replacing only the routine." },
    { id:"q4", type:"mc", q:"Where was the original habit loop research conducted?", choices:["Harvard","Stanford","MIT","Oxford"], correct:2, exp:"Researchers at MIT identified the loop through experiments with rats navigating mazes." },
  ],
  p9: [
    { id:"q1", type:"mc", q:"What is the first thing Professor Osei tells his students?", choices:["Every border is contested","Every map is a lie","Geography is political","Distance is relative"], correct:1, exp:"'Every map is a lie' is the first and last thing his students believe." },
    { id:"q2", type:"tf", q:"Amara's cartography work had caused her trouble at airports.", choices:["True","False"], correct:0, exp:"Her work had gotten her detained at airports twice." },
    { id:"q3", type:"mc", q:"What was strange about the valley in the drone data?", choices:["It was underwater","It appeared in evening scans but was absent by morning","It was twice the expected size","It moved northward overnight"], correct:1, exp:"The valley appeared in evening scans but was absent by morning." },
  ],
  p10: [
    { id:"q1", type:"mc", q:"After 17 hours without sleep, performance is equivalent to a BAC of:", choices:["0.02%","0.05%","0.08%","0.10%"], correct:1, exp:"After seventeen hours without sleep, cognitive performance equals a BAC of 0.05%." },
    { id:"q2", type:"mc", q:"What does the glymphatic system do during sleep?", choices:["Stores new memories","Regulates heart rate","Clears metabolic waste from the brain","Produces growth hormone"], correct:2, exp:"The glymphatic system clears metabolic waste products that accumulate during waking hours." },
    { id:"q3", type:"tf", q:"Sleep-deprived people are generally good at assessing their own impairment.", choices:["True","False"], correct:1, exp:"Sleep deprivation impairs one's ability to accurately assess one's own level of impairment." },
    { id:"q4", type:"mc", q:"Which brain region is most sensitive to sleep loss?", choices:["Cerebellum","Hippocampus","Amygdala","Prefrontal cortex"], correct:3, exp:"The prefrontal cortex — responsible for judgment and creativity — is disproportionately sensitive to sleep loss." },
  ],
  p11: [
    { id:"q1", type:"mc", q:"How many letters were in the shoebox?", choices:["12","27","43","51"], correct:2, exp:"There were forty-three letters in the shoebox." },
    { id:"q2", type:"tf", q:"The grandmother had posted the letters but never received replies.", choices:["True","False"], correct:1, exp:"None of the letters had ever been posted." },
    { id:"q3", type:"mc", q:"When was the most recent letter written?", choices:["August 1959","December 2019","January 2020","March 1946"], correct:1, exp:"The most recent letter was dated December 2019, three months before she died." },
    { id:"q4", type:"mc", q:"How did the translator react after reading the third letter?", choices:["She sent a written summary","She called to ask if the narrator was all right","She refused to continue","She wrote a note of admiration"], correct:1, exp:"The professor called after the third letter to ask if the narrator was all right." },
  ],
  p12: [
    { id:"q1", type:"mc", q:"What percentage of the ocean remains unexplored?", choices:["Over 40%","Over 60%","Over 80%","Over 95%"], correct:2, exp:"More than eighty percent of the ocean remains unmapped and unexplored." },
    { id:"q2", type:"tf", q:"We have more detailed maps of the seafloor than of the Moon.", choices:["True","False"], correct:1, exp:"We have more detailed maps of the lunar surface than of the seafloor." },
    { id:"q3", type:"mc", q:"What temperature gradient does the Pompeii worm tolerate?", choices:["20°C to 2°C","80°C to 2°C","60°C to 10°C","100°C to 5°C"], correct:1, exp:"The Pompeii worm tolerates temperatures exceeding 80°C at its tail while its head stays near 2°C." },
    { id:"q4", type:"mc", q:"How many human descents have reached the Challenger Deep?", choices:["One","Two","Three","Five"], correct:2, exp:"Only three descents by humans have ever reached the Challenger Deep, the most recent in 2019." },
  ],
};

// ── Pollinations AI ───────────────────────────────────────────────────────────
// ── Pollinations AI helpers ──────────────────────────────────────────────────

// Detect if a response is a reasoning leak (the whole thing is internal thinking,
// not a passage). Returns true if the response should be discarded and retried.
function isReasoningLeak(raw) {
  const text = raw.trim();
  // Starts with a JSON blob containing reasoning_content or role:assistant
  if (text.startsWith("{") && (
    text.includes('"reasoning_content"') ||
    text.includes('"role":"assistant"') ||
    text.includes('"tool_calls"')
  )) return true;
  // Plain text reasoning markers that indicate the model is thinking aloud
  const markers = [
    "reasoning_content", "tool_calls", "I'll write", "I'll craft",
    "Let's write", "Let's count", "Let's compose", "Let me write",
    "Word count:", "Now count words", "We need to draft", "We'll produce",
    "We'll count", "We'll craft", "Draft:\n", "Let's verify",
  ];
  return markers.some(m => text.includes(m));
}

// Passage generation — uses the Anthropic API via the in-app proxy
// Falls back through multiple Pollinations models, skipping any that leak reasoning
async function generateWithAI(prompt) {
  const instruction = "Write a reading passage. Output ONLY the passage text. "
    + "No title, no preamble, no word count, no commentary, no JSON, no reasoning. "
    + "Start immediately with the first sentence of the passage.\n\n";
  const body = instruction + prompt;
  const encoded = encodeURIComponent(body);
  const models = ["openai", "mistral", "llama", "phi"];
  for (const model of models) {
    try {
      const res = await fetch(
        "https://text.pollinations.ai/" + encoded + "?model=" + model + "&seed=" + Date.now()
      );
      if (!res.ok) continue;
      const raw = await res.text();
      // Discard and retry next model if this is a reasoning leak
      if (isReasoningLeak(raw)) continue;
      // Strip any accidental markdown fences
      const text = raw.trim().replace(/^```[\w]*\n?|```$/gm, "").trim();
      if (text && text.length >= 80) return text;
    } catch(e) { /* try next model */ }
  }
  throw new Error("All AI models returned unusable output. Please try again.");
}

// ── AI Quiz generation ────────────────────────────────────────────────────────
// Returns an array of 5 quiz question objects matching our QUIZZES format
async function generateQuizForPassage(passageText, passageTitle) {
  const body = `You are a reading comprehension quiz creator. Return ONLY a raw JSON array — no markdown, no explanation, no code fences.

Read this passage and create exactly 5 quiz questions.

PASSAGE:
${passageText.slice(0, 2000)}

Return a JSON array of exactly 5 objects. Each object:
{ "id":"q1", "type":"mc", "q":"question text", "choices":["A","B","C","D"], "correct":0, "exp":"one sentence explanation" }
For true/false: { "id":"q2", "type":"tf", "q":"statement", "choices":["True","False"], "correct":0, "exp":"..." }

Rules: mix mc and tf, base questions ONLY on the passage, correct is zero-based index. Output ONLY the JSON array starting with [`;

  const encoded = encodeURIComponent(body);
  const res = await fetch(`https://text.pollinations.ai/${encoded}?model=mistral&seed=${Date.now()}`);
  if (!res.ok) throw new Error("Quiz generation failed");
  const raw = await res.text();

  // Aggressively find the JSON array — strip any reasoning preamble
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end   = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found in response");
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Invalid quiz array");

  return parsed.slice(0, 5).map((q, i) => ({
    id:      q.id      || `q${i+1}`,
    type:    q.type    || "mc",
    q:       q.q       || q.question || "Question",
    choices: Array.isArray(q.choices) ? q.choices : ["True","False"],
    correct: typeof q.correct === "number" ? q.correct : 0,
    exp:     q.exp     || q.explanation || "See passage.",
  }));
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function fetchSessions(userId) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({
    id:          row.id,
    passage:     { title: row.passage_title, id: "db", wordCount: row.words_read },
    wpm:         row.wpm,
    comp:        row.comprehension,
    wordsRead:   row.words_read,
    timeSeconds: row.time_seconds,
    ts:          new Date(row.created_at).getTime(),
  }));
}

async function saveSession(userId, { passage, wpm, comp, wordsRead, timeSeconds }) {
  const { error } = await supabase.from("sessions").insert({
    user_id:       userId,
    passage_title: passage.title,
    wpm,
    words_read:    wordsRead,
    comprehension: comp || 0,
    time_seconds:  timeSeconds,
  });
  if (error) throw error;
}

async function incrementProfile(userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_sessions, streak")
    .eq("id", userId)
    .single();
  if (!profile) return;
  await supabase.from("profiles").update({
    total_sessions: (profile.total_sessions || 0) + 1,
    streak:         (profile.streak || 0) + 1,
  }).eq("id", userId);
}

// ★ Saved uploads helpers
async function fetchUploads(userId) {
  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({
    id:        row.id,
    title:     row.title,
    text:      row.text,
    wordCount: row.word_count,
    createdAt: new Date(row.created_at).getTime(),
    // shape it as a passage object so startReading works directly
    genre:     "Uploaded",
    level:     5,
    tags:      ["uploaded"],
    isUpload:  true,
  }));
}

async function saveUpload(userId, { title, text, wordCount }) {
  const { data, error } = await supabase.from("uploads").insert({
    user_id:    userId,
    title,
    text,
    word_count: wordCount,
  }).select().single();
  if (error) throw error;
  return {
    id:        data.id,
    title:     data.title,
    text:      data.text,
    wordCount: data.word_count,
    createdAt: new Date(data.created_at).getTime(),
    genre:     "Uploaded",
    level:     5,
    tags:      ["uploaded"],
    isUpload:  true,
  };
}

async function deleteUpload(uploadId) {
  const { error } = await supabase.from("uploads").delete().eq("id", uploadId);
  if (error) throw error;
}

// ★ AI Passages helpers — shared community library
async function fetchAIPassages() {
  const { data, error } = await supabase
    .from("ai_passages")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToAIPassage);
}

function rowToAIPassage(row) {
  return {
    id:           row.id,
    title:        row.title,
    genre:        row.genre,
    level:        row.level,
    wordCount:    row.word_count,
    text:         row.text,
    quizJson:     typeof row.quiz_json === "string" ? JSON.parse(row.quiz_json) : row.quiz_json,
    createdBy:    row.created_by,
    creatorName:  row.creator_name || "Anonymous",
    isPublic:     row.is_public,
    createdAt:    new Date(row.created_at).getTime(),
    tags:         ["ai-generated"],
    isAIPassage:  true,
  };
}

async function saveAIPassage(userId, creatorName, { title, genre, level, wordCount, text, quizJson }) {
  const { data, error } = await supabase.from("ai_passages").insert({
    created_by:   userId,
    creator_name: creatorName,
    title,
    genre,
    level,
    word_count:   wordCount,
    text,
    quiz_json:    JSON.stringify(quizJson),
    is_public:    false,   // private by default; user publishes manually
  }).select().single();
  if (error) throw error;
  return rowToAIPassage(data);
}

async function fetchMyAIPassages(userId) {
  const { data, error } = await supabase
    .from("ai_passages")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToAIPassage);
}

async function publishAIPassage(passageId) {
  const { error } = await supabase
    .from("ai_passages")
    .update({ is_public: true })
    .eq("id", passageId);
  if (error) throw error;
}

async function unpublishAIPassage(passageId) {
  const { error } = await supabase
    .from("ai_passages")
    .update({ is_public: false })
    .eq("id", passageId);
  if (error) throw error;
}

async function deleteAIPassage(passageId) {
  const { error } = await supabase.from("ai_passages").delete().eq("id", passageId);
  if (error) throw error;
}

async function updateAIPassageQuiz(passageId, quizJson) {
  const { error } = await supabase
    .from("ai_passages")
    .update({ quiz_json: JSON.stringify(quizJson) })
    .eq("id", passageId);
  if (error) throw error;
}

// ── Icons & primitives ────────────────────────────────────────────────────────
const SVG = ({ d, size=18, stroke=T.text2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

const ICONS = {
  home:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  library:  ["M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z","M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"],
  generate: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
  cards:    ["M2 5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2z","M7 19v-4","M17 19v-4","M7 19h10"],
  upload:   ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M17 8l-5-5-5 5","M12 3v12"],
  logout:   ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4","M16 17l5-5-5-5","M21 12H9"],
  x:        "M18 6L6 18M6 6l12 12",
  arrow:    "M5 12h14M12 5l7 7-7 7",
  trash:    ["M3 6h18","M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6","M10 11v6","M14 11v6","M9 6V4h6v2"],
};

const Btn = ({ children, onClick, variant="primary", disabled, style={}, size="md" }) => {
  const pad = size==="sm"?"6px 14px":size==="lg"?"14px 28px":"10px 20px";
  const fs  = size==="sm"?13:size==="lg"?16:14;
  const variants = {
    primary:  { background:`linear-gradient(135deg,${T.amber},${T.amber2})`, color:"#07080f", border:"none" },
    secondary:{ background:T.card2,       color:T.text,  border:`1px solid ${T.border2}` },
    ghost:    { background:"transparent", color:T.text2, border:`1px solid ${T.border}`  },
    danger:   { background:`${T.red}22`,  color:T.red,   border:`1px solid ${T.red}55`   },
    teal:     { background:`linear-gradient(135deg,${T.teal},${T.teal2})`, color:"#07080f", border:"none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding:pad, fontSize:fs, fontWeight:600, borderRadius:8, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.45:1, display:"inline-flex", alignItems:"center", gap:7, transition:"all 0.15s", ...(variants[variant]||variants.primary), ...style }}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity="0.85";}}
      onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}>
      {children}
    </button>
  );
};

const Tag = ({ label, color }) => (
  <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:color==="amber"?`${T.amber}22`:color==="teal"?`${T.teal}22`:`${T.border2}`, color:color==="amber"?T.amber:color==="teal"?T.teal:T.text3, fontWeight:600, letterSpacing:.3, flexShrink:0 }}>
    {label}
  </span>
);

// ── Google "G" logo SVG (official brand colours) ──────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" style={{flexShrink:0}}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [view,          setView]          = useState("auth");
  const [user,          setUser]          = useState(null);
  const [isGuest,       setIsGuest]       = useState(false);
  const [sessions,      setSessions]      = useState([]);
  const [uploads,       setUploads]       = useState([]);   // ★ saved uploads
  const [aiPassages,    setAIPassages]    = useState([]);   // ★ public community AI passages
  const [myAIPassages,  setMyAIPassages]  = useState([]);   // ★ current user's own AI passages (all)
  const [flashcards,    setFlashcards]    = useState([]);
  const [activePassage, setActivePassage] = useState(null);
  const [quizSession,   setQuizSession]   = useState(null);
  const [lastResults,   setLastResults]   = useState(null);
  const [toast,         setToast]         = useState(null);
  // ★ dynamic quiz questions (null = use static QUIZZES lookup)
  const [pendingQuiz,   setPendingQuiz]   = useState(null);

  const notify = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };

  // ── Load user + sessions + uploads on mount ───────────────────────────────
  useEffect(() => {
    getSession().then(async session => {
      if (session) {
        try {
          await ensureProfile(
            session.user.id,
            session.user.user_metadata?.name || session.user.user_metadata?.full_name,
            session.user.email
          );
          const profile = await getProfile(session.user.id);
          setUser({
            id: session.user.id,
            name: profile.name,
            email: session.user.email,
            level: profile.level,
            streak: profile.streak,
            totalSessions: profile.total_sessions,
          });
          const [past, savedUploads, aiP, myAIP] = await Promise.all([
            fetchSessions(session.user.id),
            fetchUploads(session.user.id),
            fetchAIPassages(),
            fetchMyAIPassages(session.user.id),
          ]);
          setSessions(past);
          setUploads(savedUploads);
          setAIPassages(aiP);
          setMyAIPassages(myAIP);
          setView("dashboard");
        } catch(e) { setView("auth"); }
      }
    });
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const data    = await signIn(email, password);
      const profile = await getProfile(data.user.id);
      setUser({
        id: data.user.id, name: profile.name, email: data.user.email,
        level: profile.level, streak: profile.streak, totalSessions: profile.total_sessions,
      });
      const [past, savedUploads, aiP, myAIP] = await Promise.all([
        fetchSessions(data.user.id),
        fetchUploads(data.user.id),
        fetchAIPassages(),
        fetchMyAIPassages(data.user.id),
      ]);
      setSessions(past);
      setUploads(savedUploads);
      setAIPassages(aiP);
      setMyAIPassages(myAIP);
      setView("dashboard");
      notify("Welcome back! Ready to read faster?");
    } catch(e) { notify(e.message || "Login failed — check your email and password", "err"); }
  };

  const signup = async (email, password, name) => {
    try { await signUp(email, password, name); return { success:true, message:"Account created! Sign in to get started." }; }
    catch(e) { return { success:false, message:e.message || "Signup failed — please try again" }; }
  };

  const googleLogin = async () => {
    try { await signInWithGoogle(); } catch(e) { notify("Google login failed — please try again", "err"); }
  };

  const guestLogin = () => {
    setIsGuest(true);
    setUser({ id:"guest", name:"Guest Reader", level:1, streak:0, totalSessions:0 });
    setView("dashboard");
  };

  const logout = async () => {
    await signOut();
    setUser(null); setIsGuest(false); setSessions([]); setUploads([]); setAIPassages([]); setMyAIPassages([]); setView("auth");
  };

  // ── Reading / quiz flow ───────────────────────────────────────────────────
  const startReading = passage => { setActivePassage(passage); setView("reading"); };

  const finishReading = async (sessionData) => {
    const p = sessionData.passage;
    // If the passage already carries quizJson (saved AI passage), use it directly
    if (p.quizJson) {
      setPendingQuiz(null); // QuizView will read p.quizJson
    } else if (!QUIZZES[p.id]) {
      // Upload or unsaved AI passage — generate quiz now
      notify("Generating quiz from your text… ✨");
      try {
        const qs = await generateQuizForPassage(p.text, p.title);
        setPendingQuiz(qs);
      } catch(e) {
        console.error("Quiz generation failed:", e);
        setPendingQuiz(null);
      }
    } else {
      setPendingQuiz(null); // curated passage — static quiz
    }
    setQuizSession({ passage: p, sessionData });
    setView("quiz");
  };

  const submitQuiz = async (results) => {
    setLastResults(results);
    setPendingQuiz(null);

    if (results.missed.length > 0) {
      const cards = results.missed.map(q => ({
        id:`${Date.now()}-${Math.random()}`, question:q.q, answer:q.exp, due:Date.now(), interval:1,
      }));
      setFlashcards(prev => [...prev, ...cards]);
    }

    if (!isGuest && user?.id) {
      try {
        await saveSession(user.id, { ...results.sessionData, comp: results.score });
        await incrementProfile(user.id);
        const [past, profile] = await Promise.all([
          fetchSessions(user.id),
          getProfile(user.id),
        ]);
        setSessions(past);
        setUser(prev => ({ ...prev, totalSessions: profile.total_sessions, streak: profile.streak }));
      } catch(e) {
        console.error("Failed to save session:", e);
        notify("Session couldn't be saved — check your connection.", "err");
      }
    } else {
      setSessions(prev => [results.sessionData, ...prev]);
      setUser(prev => prev ? { ...prev, totalSessions:(prev.totalSessions||0)+1, streak:(prev.streak||0)+1 } : prev);
    }
    setView("results");
  };

  // ★ Save a new upload to Supabase and add to local state
  const handleSaveUpload = async (uploadData) => {
    if (isGuest || !user?.id) return null;
    try {
      const saved = await saveUpload(user.id, uploadData);
      setUploads(prev => [saved, ...prev]);
      return saved;
    } catch(e) {
      notify("Couldn't save — check your connection.", "err");
      return null;
    }
  };

  // ★ Save a newly generated AI passage + quiz to DB (private by default)
  const handleSaveAIPassage = async (passageData) => {
    if (isGuest || !user?.id) return null;
    try {
      const saved = await saveAIPassage(user.id, user.name, passageData);
      // Goes into myAIPassages (private); not in public aiPassages yet
      setMyAIPassages(prev => [saved, ...prev]);
      return saved;
    } catch(e) {
      console.error("Failed to save AI passage:", e);
      return null;
    }
  };

  // ★ Publish / unpublish an AI passage
  const handlePublishAIPassage = async (passageId, publish) => {
    try {
      if (publish) await publishAIPassage(passageId);
      else await unpublishAIPassage(passageId);
      setMyAIPassages(prev => prev.map(p => p.id === passageId ? { ...p, isPublic: publish } : p));
      // Refresh public list
      const pub = await fetchAIPassages();
      setAIPassages(pub);
    } catch(e) { console.error("Publish failed:", e); }
  };

  // ★ Delete an AI passage (owner only)
  const handleDeleteAIPassage = async (passageId) => {
    try {
      await deleteAIPassage(passageId);
      setMyAIPassages(prev => prev.filter(p => p.id !== passageId));
      setAIPassages(prev => prev.filter(p => p.id !== passageId));
    } catch(e) { console.error("Delete failed:", e); }
  };

  // ★ Regenerate quiz for an AI passage (original generator only)
  const handleRegenerateQuiz = async (passageId, passageText, passageTitle) => {
    try {
      const qs = await generateQuizForPassage(passageText, passageTitle);
      await updateAIPassageQuiz(passageId, qs);
      setAIPassages(prev => prev.map(p =>
        p.id === passageId ? { ...p, quizJson: qs } : p
      ));
      return qs;
    } catch(e) {
      throw e;
    }
  };

  // ★ Delete a saved upload
  const handleDeleteUpload = async (uploadId) => {
    try {
      await deleteUpload(uploadId);
      setUploads(prev => prev.filter(u => u.id !== uploadId));
      notify("Upload deleted.");
    } catch(e) {
      notify("Couldn't delete — try again.", "err");
    }
  };

  const dueCards = flashcards.filter(f=>f.due<=Date.now()).length;
  if (view==="auth") return <AuthPage onLogin={login} onSignup={signup} onGuest={guestLogin} onGoogle={googleLogin} />;

  const NAV = [
    { id:"dashboard", label:"Dashboard",   icon:"home"     },
    { id:"library",   label:"Library",     icon:"library"  },
    { id:"generate",  label:"AI Generate", icon:"generate" },
    { id:"flashcards",label:"Flashcards",  icon:"cards",   badge:dueCards },
    { id:"upload",    label:"Upload",      icon:"upload"   },
  ];

  return (
    <div style={{display:"flex",minHeight:"100vh",background:T.bg}}>
      {!["reading","quiz","results"].includes(view) && (
        <aside style={{width:220,flexShrink:0,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",position:"fixed",left:0,top:0,bottom:0,zIndex:50}}>
          <div style={{padding:"28px 20px 24px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{fontFamily:T.serif,fontSize:26,fontWeight:900,color:T.amber,letterSpacing:-0.5}}>Readtor</div>
            <div style={{fontSize:11,color:T.text3,marginTop:2,letterSpacing:.5}}>Read · Absorb · Remember</div>
          </div>
          <nav style={{flex:1,padding:"16px 10px",display:"flex",flexDirection:"column",gap:2}}>
            {NAV.map(n=>{
              const active=view===n.id;
              return (
                <button key={n.id} onClick={()=>setView(n.id)} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 12px",borderRadius:8,border:"none",background:active?T.amberGlow:"transparent",color:active?T.amber:T.text2,cursor:"pointer",fontSize:14,fontWeight:active?600:400,textAlign:"left",position:"relative",transition:"all 0.15s"}}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.background=T.card;}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}>
                  <SVG d={ICONS[n.icon]} size={17} stroke={active?T.amber:T.text3}/>
                  {n.label}
                  {n.badge>0 && <span style={{marginLeft:"auto",background:T.red,color:"#fff",fontSize:10,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{n.badge}</span>}
                  {active && <div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:3,height:20,background:T.amber,borderRadius:"0 2px 2px 0"}}/>}
                </button>
              );
            })}
          </nav>
          <div style={{padding:"12px 10px 16px",borderTop:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${T.amber},${T.amber2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:T.bg,flexShrink:0}}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</div>
                <div style={{fontSize:11,color:T.text3}}>Level {user?.level} · {LEVELS[(user?.level||1)-1].title}</div>
              </div>
            </div>
            <button onClick={logout} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",width:"100%",background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:13,borderRadius:6}}
              onMouseEnter={e=>e.currentTarget.style.color=T.red} onMouseLeave={e=>e.currentTarget.style.color=T.text3}>
              <SVG d={ICONS.logout} size={15} stroke="currentColor"/> Sign Out
            </button>
          </div>
        </aside>
      )}

      <main style={{flex:1,marginLeft:["reading","quiz","results"].includes(view)?0:220,minHeight:"100vh",overflow:"auto"}}>
        {view==="dashboard"  && <DashboardView  user={user} isGuest={isGuest} sessions={sessions} onStart={startReading} flashcards={flashcards} setView={setView}/>}
        {view==="library"    && <LibraryView    onStart={startReading} aiPassages={aiPassages} myAIPassages={myAIPassages} userId={user?.id} onPublish={handlePublishAIPassage} onDeleteAI={handleDeleteAIPassage} onRegenerateQuiz={handleRegenerateQuiz} notify={notify}/>}
        {view==="generate"   && <GenerateView   user={user} isGuest={isGuest} onStart={startReading} notify={notify} onSaveAIPassage={handleSaveAIPassage} onRegenerateQuiz={handleRegenerateQuiz}/>}
        {view==="flashcards" && <FlashcardsView flashcards={flashcards} setFlashcards={setFlashcards}/>}
        {view==="upload"     && <UploadView     onStart={startReading} notify={notify} uploads={uploads} isGuest={isGuest} userId={user?.id} onSave={handleSaveUpload} onDelete={handleDeleteUpload}/>}
        {view==="reading"    && activePassage && <ReadingView  passage={activePassage} onFinish={finishReading} onExit={()=>setView("dashboard")}/>}
        {view==="quiz"       && quizSession   && <QuizView     passage={quizSession.passage} sessionData={quizSession.sessionData} onSubmit={submitQuiz} onExit={()=>setView("dashboard")} dynamicQuestions={pendingQuiz}/>}
        {view==="results"    && lastResults   && <ResultsView  results={lastResults} onDone={()=>setView("dashboard")} onFlashcards={()=>setView("flashcards")}/>}
      </main>

      {toast && (
        <div style={{position:"fixed",bottom:28,right:28,background:toast.type==="ok"?T.card2:`${T.red}22`,border:`1px solid ${toast.type==="ok"?T.amber+"55":T.red+"55"}`,color:toast.type==="ok"?T.text:T.red,padding:"12px 20px",borderRadius:10,fontSize:14,zIndex:999,animation:"fadeUp 0.3s ease both",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",maxWidth:340}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PAGE
// ─────────────────────────────────────────────────────────────────────────────
function AuthPage({ onLogin, onSignup, onGuest, onGoogle }) {
  const [mode,    setMode]    = useState("login");
  const [email,   setEmail]   = useState("");
  const [name,    setName]    = useState("");
  const [pass,    setPass]    = useState("");
  const [loading, setLoading] = useState(false);
  const [formMsg, setFormMsg] = useState({text:"",type:""});

  const switchMode = m => { setMode(m); setFormMsg({text:"",type:""}); setEmail(""); setName(""); setPass(""); };

  const submit = async () => {
    setFormMsg({text:"",type:""});
    if (!email.includes("@"))     { setFormMsg({text:"Please enter a valid email address.",type:"err"}); return; }
    if (!pass || pass.length < 6) { setFormMsg({text:"Password must be at least 6 characters.",type:"err"}); return; }
    setLoading(true);
    if (mode==="login") {
      await onLogin(email, pass); setLoading(false);
    } else {
      if (!name||name.trim()==="") { setFormMsg({text:"Please enter your full name.",type:"err"}); setLoading(false); return; }
      const r = await onSignup(email, pass, name); setLoading(false);
      if (r.success) { setFormMsg({text:r.message,type:"ok"}); setMode("login"); setPass(""); setName(""); }
      else setFormMsg({text:r.message,type:"err"});
    }
  };

  const inp = {width:"100%",padding:"12px 16px",borderRadius:8,border:`1px solid ${T.border2}`,background:T.card,color:T.text,fontSize:15,outline:"none",transition:"border-color 0.2s"};

  return (
    <div style={{display:"flex",minHeight:"100vh"}}>
      {/* Left hero */}
      <div style={{flex:1,background:`linear-gradient(160deg,#0d0f1c 0%,#07080f 60%)`,display:"flex",flexDirection:"column",justifyContent:"center",padding:"60px 64px",borderRight:`1px solid ${T.border}`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-10%",right:"-5%",width:500,height:500,borderRadius:"50%",background:`radial-gradient(circle,${T.amber}08 0%,transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{fontFamily:T.serif,fontSize:64,fontWeight:900,color:T.amber,letterSpacing:-2,lineHeight:1,marginBottom:16,animation:"fadeUp 0.6s ease both"}}>Read<span style={{color:T.text}}>tor</span></div>
        <div style={{fontSize:20,color:T.text2,fontStyle:"italic",fontFamily:T.serif,marginBottom:48,animation:"fadeUp 0.6s 0.1s ease both",lineHeight:1.5}}>Read faster.<br/>Think deeper.<br/>Remember more.</div>
        <div style={{display:"flex",gap:32,animation:"fadeUp 0.6s 0.2s ease both"}}>
          {[["12","Curated passages"],["AI","Free generation"],["SM-2","Spaced repetition"]].map(([v,l])=>(
            <div key={v}><div style={{fontFamily:T.serif,fontSize:32,fontWeight:900,color:T.amber}}>{v}</div><div style={{fontSize:12,color:T.text3,marginTop:2,letterSpacing:.3}}>{l}</div></div>
          ))}
        </div>
        <div style={{marginTop:64,padding:"24px 28px",borderLeft:`3px solid ${T.amber}55`,animation:"fadeUp 0.6s 0.3s ease both"}}>
          <div style={{fontFamily:T.serif,fontSize:17,fontStyle:"italic",color:T.text2,lineHeight:1.7,marginBottom:10}}>"A reader lives a thousand lives before he dies."</div>
          <div style={{fontSize:12,color:T.text3,letterSpacing:.5}}>— George R.R. Martin</div>
        </div>
      </div>

      {/* Right form */}
      <div style={{width:440,flexShrink:0,display:"flex",flexDirection:"column",justifyContent:"center",padding:"60px 48px",background:T.surface}}>
        <div style={{fontFamily:T.serif,fontSize:28,fontWeight:700,color:T.text,marginBottom:6}}>{mode==="login"?"Welcome back":"Begin your journey"}</div>
        <div style={{fontSize:14,color:T.text3,marginBottom:28}}>{mode==="login"?"Sign in to continue your practice":"Create an account — it's free"}</div>

        {/* Tab toggle */}
        <div style={{display:"flex",background:T.card,borderRadius:8,padding:4,marginBottom:24,border:`1px solid ${T.border}`}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>switchMode(m)} style={{flex:1,padding:"9px",borderRadius:6,border:"none",background:mode===m?T.amber:"transparent",color:mode===m?T.bg:T.text2,fontWeight:mode===m?700:400,cursor:"pointer",fontSize:14,transition:"all 0.15s"}}>
              {m==="login"?"Sign In":"Sign Up"}
            </button>
          ))}
        </div>

        {formMsg.text && (
          <div style={{padding:"14px 16px",borderRadius:8,marginBottom:16,fontSize:14,lineHeight:1.6,animation:"fadeUp 0.2s ease both",background:formMsg.type==="ok"?"#0d2e1f":`${T.red}18`,border:`1px solid ${formMsg.type==="ok"?"#1a5c3a":T.red+"55"}`,color:formMsg.type==="ok"?"#4ade80":T.red}}>
            {formMsg.type==="ok"?"✅ ":"⚠️ "}{formMsg.text}
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {mode==="signup" && <input style={inp} placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=T.border2}/>}
          <input style={inp} placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=T.border2}/>
          <input style={inp} placeholder="Password (min 6 characters)" type="password" value={pass} onChange={e=>setPass(e.target.value)} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=T.border2} onKeyDown={e=>{if(e.key==="Enter")submit();}}/>
          <Btn onClick={submit} disabled={loading} size="lg" style={{width:"100%",justifyContent:"center",marginTop:4}}>
            {loading?<><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>✦</span> Please wait…</>:mode==="login"?"Sign In →":"Create Account →"}
          </Btn>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:12,margin:"20px 0"}}>
          <div style={{flex:1,height:1,background:T.border}}/><span style={{fontSize:12,color:T.text3}}>or</span><div style={{flex:1,height:1,background:T.border}}/>
        </div>

        {/* ★ Google button with real icon */}
        <button onClick={onGoogle} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"11px 20px",background:"#fff",color:"#3c4043",border:"1px solid #dadce0",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:500,marginBottom:10,transition:"all 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background="#f8f9fa";e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.12)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.boxShadow="none";}}>
          <GoogleIcon/>
          Continue with Google
        </button>

        <Btn variant="ghost" onClick={onGuest} style={{width:"100%",justifyContent:"center"}}>Continue as Guest</Btn>
        <p style={{fontSize:11,color:T.text3,marginTop:24,lineHeight:1.7,textAlign:"center"}}>By continuing you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD — ★ Quick Start buttons now navigate correctly
// ─────────────────────────────────────────────────────────────────────────────
function DashboardView({ user, isGuest, sessions, onStart, flashcards, setView }) {
  const level    = LEVELS[(user?.level||1)-1];
  const quote    = QUOTES[new Date().getDate()%QUOTES.length];
  const avgWpm   = sessions.length ? Math.round(sessions.reduce((s,x)=>s+(x.wpm||0),0)/sessions.length) : 0;
  const avgComp  = sessions.length ? Math.round(sessions.reduce((s,x)=>s+(x.comp||0),0)/sessions.length) : 0;
  const dueCards = flashcards.filter(f=>f.due<=Date.now()).length;

  // ★ Quick Start items now have a view target
  const quickStart = [
    { label:"Browse Library",   icon:"📚", desc:"12 curated passages by level",  view:"library"    },
    { label:"Generate with AI", icon:"✨", desc:"Free AI content at your level",  view:"generate"   },
    { label:"Upload a Text",    icon:"📤", desc:"Practice with your own content", view:"upload"     },
    { label:`Flashcards${dueCards>0?` (${dueCards} due)`:""}`, icon:"🃏", desc:"Spaced repetition review", view:"flashcards" },
  ];

  return (
    <div style={{padding:"40px 48px",maxWidth:1200}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:40,animation:"fadeUp 0.4s ease both"}}>
        <div>
          <div style={{fontSize:13,color:T.text3,marginBottom:6,letterSpacing:.5}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
          <h1 style={{fontFamily:T.serif,fontSize:36,fontWeight:900,color:T.text,letterSpacing:-1}}>Good {new Date().getHours()<12?"morning":"afternoon"}, {user?.name?.split(" ")[0]}.</h1>
          <p style={{color:T.text3,marginTop:6,fontSize:15}}>{isGuest?"You're in guest mode — sign up to save your progress.":`Level ${user?.level} · ${level.title} · ${user?.streak} day streak 🔥`}</p>
        </div>
        <div style={{maxWidth:320,padding:"16px 20px",background:T.card,border:`1px solid ${T.border}`,borderRadius:12,borderLeft:`3px solid ${T.amber}`}}>
          <div style={{fontFamily:T.serif,fontSize:14,fontStyle:"italic",color:T.text2,lineHeight:1.6,marginBottom:8}}>"{quote.q}"</div>
          <div style={{fontSize:11,color:T.text3,letterSpacing:.3}}>— {quote.a}</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:40}}>
        {[
          {label:"Reading Level",  value:level.title,              sub:`Level ${user?.level} of 10`,  color:T.amber,   icon:"⚡"},
          {label:"Current Streak", value:`${user?.streak||0}`,     sub:"consecutive days",            color:"#ff7043", icon:"🔥"},
          {label:"Avg WPM",        value:avgWpm||"--",             sub:"across all sessions",         color:T.teal,    icon:"📖"},
          {label:"Sessions",       value:user?.totalSessions||"0", sub:"total completed",             color:"#a78bfa", icon:"✓"},
        ].map((s,i)=>(
          <div key={s.label} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"22px",animation:`fadeUp 0.4s ${0.05*i}s ease both`}}>
            <div style={{fontSize:24,marginBottom:8}}>{s.icon}</div>
            <div style={{fontFamily:T.serif,fontSize:32,fontWeight:900,color:s.color,letterSpacing:-1}}>{s.value}</div>
            <div style={{fontSize:12,color:T.text3,marginTop:4}}>{s.sub}</div>
            <div style={{fontSize:13,color:T.text2,marginTop:2,fontWeight:500}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px 28px",marginBottom:32,animation:"fadeUp 0.4s 0.2s ease both"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontFamily:T.serif,fontSize:18,fontWeight:700,color:T.text}}>Your Reading Level</div>
            <div style={{fontSize:13,color:T.text3,marginTop:2}}>Target: {level.min}–{level.max} WPM · {level.comp}%+ comprehension</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:T.serif,fontSize:28,fontWeight:900,color:T.amber}}>Lv {user?.level}</div>
            <div style={{fontSize:12,color:T.text3}}>{level.title}</div>
          </div>
        </div>
        <div style={{background:T.surface,borderRadius:4,height:8,overflow:"hidden"}}>
          <div style={{height:"100%",background:`linear-gradient(90deg,${T.amber},${T.amber2})`,width:`${((user?.level||1)-1)/9*100}%`,transition:"width 0.8s ease",borderRadius:4}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:11,color:T.text3}}><span>Novice</span><span>Legendary</span></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:24,animation:"fadeUp 0.4s 0.25s ease both"}}>
        <div>
          <div style={{fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.text,marginBottom:16}}>Recommended For You</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {PASSAGES.filter(p=>Math.abs(p.level-(user?.level||3))<=2).slice(0,3).map(p=><PassageRow key={p.id} passage={p} onStart={onStart}/>)}
          </div>
        </div>
        <div>
          <div style={{fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.text,marginBottom:16}}>Quick Start</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {quickStart.map(a=>(
              <button key={a.label} onClick={()=>setView(a.view)}
                style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,cursor:"pointer",textAlign:"left",transition:"all 0.15s",width:"100%"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.amber+"55";e.currentTarget.style.background=T.amberGlow;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;}}>
                <span style={{fontSize:22}}>{a.icon}</span>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:T.text}}>{a.label}</div>
                  <div style={{fontSize:12,color:T.text3}}>{a.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {sessions.length > 0 && (
        <div style={{marginTop:40,animation:"fadeUp 0.4s 0.3s ease both"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.text}}>Session History</div>
            <div style={{fontSize:13,color:T.text3}}>{sessions.length} session{sessions.length!==1?"s":""} total · avg {avgComp}% comprehension</div>
          </div>
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  {["Passage","WPM","Comprehension","Words Read","Date"].map(h=>(
                    <th key={h} style={{padding:"12px 20px",textAlign:"left",fontSize:11,color:T.text3,fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0,10).map((s,i)=>(
                  <tr key={s.id||i} style={{borderBottom:i<Math.min(sessions.length,10)-1?`1px solid ${T.border}`:"none"}}>
                    <td style={{padding:"14px 20px",fontSize:14,color:T.text}}>{s.passage?.title||"—"}</td>
                    <td style={{padding:"14px 20px",fontSize:14,color:T.amber,fontWeight:700,fontFamily:T.mono}}>{s.wpm}</td>
                    <td style={{padding:"14px 20px",fontSize:14,fontFamily:T.mono}}>
                      <span style={{color:s.comp>=70?T.teal:s.comp>=50?"#ffa500":T.red}}>{s.comp||"—"}{s.comp?"%":""}</span>
                    </td>
                    <td style={{padding:"14px 20px",fontSize:14,color:T.text2,fontFamily:T.mono}}>{s.wordsRead}</td>
                    <td style={{padding:"14px 20px",fontSize:12,color:T.text3}}>{new Date(s.ts).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions.length > 10 && (
              <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,fontSize:13,color:T.text3,textAlign:"center"}}>
                Showing 10 of {sessions.length} sessions
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PassageRow({ passage, onStart }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:16,padding:"16px 20px",background:T.card,border:`1px solid ${T.border}`,borderRadius:12,transition:"all 0.15s",cursor:"pointer"}}
      onClick={()=>onStart(passage)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.amber+"44"} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:T.serif,fontSize:16,fontWeight:700,color:T.text,marginBottom:6}}>{passage.title}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Tag label={`Level ${passage.level}`} color="amber"/>
          <Tag label={passage.genre}/>
          <Tag label={`${passage.wordCount}w`}/>
        </div>
      </div>
      <Btn size="sm" onClick={e=>{e.stopPropagation();onStart(passage);}}>Read <SVG d={ICONS.arrow} size={13} stroke={T.bg}/></Btn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIBRARY
// ─────────────────────────────────────────────────────────────────────────────
function LibraryView({ onStart, aiPassages, myAIPassages, userId, onPublish, onDeleteAI, onRegenerateQuiz, notify }) {
  const [tab,    setTab]    = useState("curated");  // "curated" | "community" | "mine"
  const [genre,  setGenre]  = useState("all");
  const [search, setSearch] = useState("");
  const [regenId, setRegenId] = useState(null); // passage id being regenerated

  // Curated filter
  const genres   = ["all", ...new Set(PASSAGES.map(p => p.genre))];
  const filtered = PASSAGES.filter(p =>
    (genre === "all" || p.genre === genre) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) ||
     p.tags.some(t => t.includes(search.toLowerCase())))
  );

  // AI passage filter (community = public only; mine = user's own)
  const aiFiltered = (tab === "community" ? aiPassages : (myAIPassages || []))
    .filter(p =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.creatorName || "").toLowerCase().includes(search.toLowerCase())
    );

  const handleRegen = async (p) => {
    if (!onRegenerateQuiz) return;
    setRegenId(p.id);
    try {
      await onRegenerateQuiz(p.id, p.text, p.title);
      notify("Quiz regenerated ✓");
    } catch(e) {
      notify("Regeneration failed — try again.", "err");
    }
    setRegenId(null);
  };

  const TABS = [
    { id:"curated",   label:"📚 Curated",           count: PASSAGES.length },
    { id:"community", label:"🌐 Community AI",       count: aiPassages.length },
    { id:"mine",      label:"✨ My Generated",       count: (myAIPassages||[]).length },
  ];

  return (
    <div style={{padding:"40px 48px"}}>
      <div style={{marginBottom:28,animation:"fadeUp 0.4s ease both"}}>
        <h1 style={{fontFamily:T.serif,fontSize:36,fontWeight:900,color:T.text,marginBottom:6}}>Library</h1>
        <p style={{color:T.text3,fontSize:15}}>Curated passages, community AI passages, and your own generations.</p>
      </div>

      {/* Top tab bar */}
      <div style={{display:"flex",gap:6,marginBottom:24,animation:"fadeUp 0.4s 0.04s ease both"}}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>{setTab(t.id);setGenre("all");setSearch("");}}
            style={{padding:"9px 18px",borderRadius:8,border:`1px solid ${tab===t.id?T.amber:T.border}`,background:tab===t.id?T.amberGlow:"transparent",color:tab===t.id?T.amber:T.text2,cursor:"pointer",fontSize:13,fontWeight:tab===t.id?600:400,transition:"all 0.15s",display:"flex",alignItems:"center",gap:7}}>
            {t.label}
            <span style={{fontSize:10,background:tab===t.id?T.amber+"33":T.border2,color:tab===t.id?T.amber:T.text3,padding:"1px 6px",borderRadius:10}}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search + genre filters (curated only) */}
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:28,flexWrap:"wrap",animation:"fadeUp 0.4s 0.08s ease both"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder={tab==="curated"?"Search passages…":"Search by title or author…"}
          style={{padding:"10px 16px",borderRadius:8,border:`1px solid ${T.border2}`,background:T.card,color:T.text,fontSize:14,outline:"none",width:260}}/>
        {tab === "curated" && (
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {genres.map(g => (
              <button key={g} onClick={()=>setGenre(g)}
                style={{padding:"9px 16px",borderRadius:8,border:`1px solid ${genre===g?T.amber:T.border}`,background:genre===g?T.amberGlow:"transparent",color:genre===g?T.amber:T.text3,cursor:"pointer",fontSize:13,fontWeight:genre===g?600:400,transition:"all 0.15s"}}>
                {g==="all"?"All":g}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── CURATED TAB ── */}
      {tab === "curated" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:20}}>
          {filtered.map((p,i) => (
            <div key={p.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px",display:"flex",flexDirection:"column",gap:16,animation:`fadeUp 0.4s ${0.04*i}s ease both`,transition:"border-color 0.15s",cursor:"pointer"}}
              onClick={()=>onStart(p)} onMouseEnter={e=>e.currentTarget.style.borderColor=T.amber+"44"} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{fontFamily:T.serif,fontSize:18,fontWeight:700,color:T.text,lineHeight:1.3}}>{p.title}</div>
                  <Tag label={`Lv ${p.level}`} color="amber"/>
                </div>
                <div style={{fontSize:13,color:T.text3,lineHeight:1.6}}>{p.text.slice(0,120)}...</div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <Tag label={p.genre}/><Tag label={`${p.wordCount} words`}/>
                {p.tags.slice(0,2).map(t=><Tag key={t} label={t}/>)}
              </div>
              <Btn size="sm" style={{alignSelf:"flex-start"}}>Start Reading <SVG d={ICONS.arrow} size={13} stroke={T.bg}/></Btn>
            </div>
          ))}
        </div>
      )}

      {/* ── COMMUNITY / MINE TABS ── */}
      {(tab === "community" || tab === "mine") && (
        <div>
          {aiFiltered.length === 0 ? (
            <div style={{padding:"60px 40px",textAlign:"center",background:T.card,border:`1px solid ${T.border}`,borderRadius:16}}>
              <div style={{fontSize:40,marginBottom:12}}>{tab==="mine"?"✨":"🌐"}</div>
              <div style={{fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.text,marginBottom:8}}>
                {tab==="mine" ? "No generated passages yet" : "No community passages yet"}
              </div>
              <div style={{fontSize:14,color:T.text3,marginBottom:20}}>
                {tab==="mine" ? "Generate a passage and it will appear here." : "Be the first to publish a passage to the community!"}
              </div>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))",gap:20}}>
              {aiFiltered.map((p,i) => {
                const isOwner = userId && p.createdBy === userId;
                return (
                  <div key={p.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"22px",display:"flex",flexDirection:"column",gap:14,animation:`fadeUp 0.4s ${0.04*i}s ease both`,transition:"border-color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=T.teal+"44"} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>

                    {/* Header row */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                      <div style={{fontFamily:T.serif,fontSize:17,fontWeight:700,color:T.text,lineHeight:1.3,flex:1}}>{p.title}</div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <Tag label={`Lv ${p.level}`} color="amber"/>
                        {tab==="mine" && (
                          <span style={{fontSize:10,padding:"3px 8px",borderRadius:20,fontWeight:600,background:p.isPublic?`${T.teal}22`:`${T.amber}22`,color:p.isPublic?T.teal:T.amber}}>
                            {p.isPublic?"Public":"Private"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Excerpt */}
                    <div style={{fontSize:13,color:T.text3,lineHeight:1.6}}>{p.text.slice(0,110)}…</div>

                    {/* Meta row */}
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      <Tag label={p.genre}/>
                      <Tag label={`${p.wordCount} words`}/>
                      <Tag label={new Date(p.createdAt).toLocaleDateString()}/>
                      {tab==="community" && <Tag label={`by ${p.creatorName}`} color="teal"/>}
                    </div>

                    {/* Action row */}
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:2}}>
                      <Btn size="sm" onClick={()=>onStart({...p, quizJson: p.quizJson})}>
                        Read <SVG d={ICONS.arrow} size={13} stroke={T.bg}/>
                      </Btn>
                      {isOwner && (
                        <>
                          {/* Publish / Unpublish toggle */}
                          <Btn size="sm" variant="secondary"
                            onClick={()=>onPublish(p.id, !p.isPublic)}
                            style={{fontSize:12}}>
                            {p.isPublic ? "📥 Unpublish" : "🌐 Publish"}
                          </Btn>
                          {/* Regenerate quiz */}
                          <Btn size="sm" variant="ghost"
                            disabled={regenId===p.id}
                            onClick={()=>handleRegen(p)}
                            style={{fontSize:12}}>
                            {regenId===p.id
                              ? <><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>✦</span> Regen…</>
                              : "🔄 Regen Quiz"
                            }
                          </Btn>
                          {/* Delete */}
                          <Btn size="sm" variant="danger"
                            onClick={()=>onDeleteAI(p.id)}
                            style={{padding:"6px 10px"}}>
                            <SVG d={ICONS.trash} size={13} stroke={T.red}/>
                          </Btn>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// READING VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ReadingView({ passage, onFinish, onExit }) {
  const [mode,     setMode]     = useState("highlight");
  const [wpm,      setWpm]      = useState(250);
  const [playing,  setPlaying]  = useState(false);
  const [wordIdx,  setWordIdx]  = useState(0);
  const [elapsed,  setElapsed]  = useState(0);
  const [startTs,  setStartTs]  = useState(null);
  const [fontSize, setFontSize] = useState(18);
  const timerRef = useRef(null);
  const clockRef = useRef(null);
  const words    = passage.text.split(/\s+/);
  const progress = words.length>1?(wordIdx/(words.length-1))*100:0;
  const liveWpm  = elapsed>4?Math.round((wordIdx/elapsed)*60):wpm;

  const tick = useCallback(()=>{
    setWordIdx(prev=>{if(prev+1>=words.length){setPlaying(false);return words.length-1;}return prev+1;});
  },[words.length]);

  useEffect(()=>{
    if(playing){const ms=(60/wpm)*1000;timerRef.current=setInterval(tick,ms);}
    else clearInterval(timerRef.current);
    return()=>clearInterval(timerRef.current);
  },[playing,wpm,tick]);

  useEffect(()=>{
    if(playing){if(!startTs)setStartTs(Date.now());clockRef.current=setInterval(()=>setElapsed(e=>e+1),1000);}
    else clearInterval(clockRef.current);
    return()=>clearInterval(clockRef.current);
  },[playing]);

  const finish = ()=>{const t=Math.max(elapsed,1);onFinish({passage,wpm:Math.round((wordIdx/t)*60)||wpm,comp:0,wordsRead:wordIdx,timeSeconds:t,ts:Date.now()});};
  const CHUNK=6; const chunks=[];
  for(let i=0;i<words.length;i+=CHUNK)chunks.push({words:words.slice(i,i+CHUNK),start:i,active:wordIdx>=i&&wordIdx<i+CHUNK});

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.bg}}>
      <div style={{padding:"14px 32px",borderBottom:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",gap:20,flexShrink:0}}>
        <button onClick={onExit} style={{background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:13,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>e.currentTarget.style.color=T.red} onMouseLeave={e=>e.currentTarget.style.color=T.text3}>
          <SVG d={ICONS.x} size={16} stroke="currentColor"/> Exit
        </button>
        <div style={{fontFamily:T.serif,fontSize:17,fontWeight:700,color:T.text,flex:1,textAlign:"center"}}>{passage.title}</div>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          <div style={{textAlign:"right"}}><div style={{fontFamily:T.mono,fontSize:22,fontWeight:700,color:T.amber}}>{liveWpm}</div><div style={{fontSize:10,color:T.text3,letterSpacing:.5}}>WPM</div></div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:T.mono,fontSize:18,color:T.teal}}>{Math.round(progress)}%</div><div style={{fontSize:10,color:T.text3,letterSpacing:.5}}>done</div></div>
        </div>
      </div>
      <div style={{height:3,background:T.card,flexShrink:0}}><div style={{height:"100%",background:`linear-gradient(90deg,${T.amber},${T.amber2})`,width:`${progress}%`,transition:"width 0.2s"}}/></div>
      <div style={{padding:"12px 32px",borderBottom:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
        <div style={{display:"flex",gap:4}}>
          {[["highlight","Highlight"],["rsvp","RSVP"],["scroll","Scroll"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setPlaying(false);setWordIdx(0);}} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${mode===m?T.amber:T.border}`,background:mode===m?T.amberGlow:"transparent",color:mode===m?T.amber:T.text3,cursor:"pointer",fontSize:13,fontWeight:mode===m?600:400,transition:"all 0.15s"}}>{l}</button>
          ))}
        </div>
        <div style={{height:20,width:1,background:T.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
          <span style={{fontSize:12,color:T.text3,whiteSpace:"nowrap"}}>Speed</span>
          <input type="range" min={80} max={900} step={10} value={wpm} onChange={e=>setWpm(+e.target.value)} style={{flex:1,maxWidth:220,accentColor:T.amber}}/>
          <span style={{fontFamily:T.mono,fontSize:14,color:T.text2,minWidth:70}}>{wpm} wpm</span>
        </div>
        <div style={{height:20,width:1,background:T.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:T.text3}}>Font</span>
          <button onClick={()=>setFontSize(f=>Math.max(14,f-2))} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:4,width:28,height:28,cursor:"pointer",color:T.text2,fontSize:14}}>−</button>
          <button onClick={()=>setFontSize(f=>Math.min(32,f+2))} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:4,width:28,height:28,cursor:"pointer",color:T.text2,fontSize:14}}>+</button>
        </div>
        <div style={{height:20,width:1,background:T.border}}/>
        <div style={{display:"flex",gap:8}}>
          {mode!=="scroll"&&<Btn onClick={()=>setPlaying(p=>!p)} variant={playing?"secondary":"primary"} size="sm">{playing?<>⏸ Pause</>:<>▶ Play</>}</Btn>}
          <Btn onClick={finish} variant="teal" size="sm">Finish & Quiz →</Btn>
        </div>
      </div>
      <div style={{flex:1,overflow:"auto",display:"flex",alignItems:mode==="rsvp"?"center":"flex-start",justifyContent:"center"}}>
        {mode==="rsvp"&&<div style={{textAlign:"center",padding:40}}><div style={{fontFamily:T.serif,fontSize:Math.max(48,fontSize*2.5),color:T.text,minHeight:100,display:"flex",alignItems:"center",justifyContent:"center",animation:"rsvpIn 0.25s ease both"}} key={wordIdx}><span style={{color:T.amber}}>{words[wordIdx]}</span></div><div style={{fontSize:13,color:T.text3,marginTop:24,fontFamily:T.mono}}>{wordIdx+1} / {words.length} words</div></div>}
        {mode==="highlight"&&<div style={{maxWidth:760,padding:"48px 64px",lineHeight:2.2,fontSize:fontSize,color:T.text,fontFamily:T.serif}}>{chunks.map((c,i)=><span key={i} style={{background:c.active?`${T.amber}2a`:"transparent",borderRadius:4,padding:"2px 0",transition:"background 0.15s"}}>{c.words.join(" ")}{" "}</span>)}</div>}
        {mode==="scroll"&&<div style={{maxWidth:720,padding:"48px 64px",fontSize:fontSize,fontFamily:T.serif,lineHeight:2.2,color:T.text}}>{passage.text.split("\n\n").map((para,i)=><p key={i} style={{marginBottom:"1.8em"}}>{para}</p>)}<div style={{marginTop:40,paddingTop:24,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end"}}><Btn onClick={finish} variant="teal">Finished — Take Quiz →</Btn></div></div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ VIEW — ★ accepts dynamicQuestions for uploads/AI passages
// ─────────────────────────────────────────────────────────────────────────────
function QuizView({ passage, sessionData, onSubmit, onExit, dynamicQuestions }) {
  // Priority: 1) passage already has quizJson (saved AI passage) — zero API call
  //           2) dynamicQuestions generated after reading (upload / unsaved AI)
  //           3) static QUIZZES lookup for curated passages
  //           4) fallback loading state (generates on-the-fly)
  const questions = passage.quizJson || dynamicQuestions || QUIZZES[passage.id] || null;
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);

  const isLoading = !questions;
  const q = questions ? questions[current] : null;

  const isAIQuiz = !!(passage.quizJson || dynamicQuestions);

  const submit = () => {
    const missed = []; let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct) correct++;
      else missed.push(q);
    });
    onSubmit({ score: Math.round((correct/questions.length)*100), correct, total: questions.length, missed, passage, sessionData });
  };

  if (isLoading) {
    return (
      <div style={{display:"flex",height:"100vh",background:T.bg,alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <span style={{fontSize:32,animation:"spin 1.5s linear infinite",display:"inline-block"}}>✦</span>
        <div style={{fontSize:16,color:T.text2}}>Generating quiz from your text…</div>
        <div style={{fontSize:13,color:T.text3}}>This takes about 10 seconds</div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",height:"100vh",background:T.bg}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"48px 56px",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:40}}>
          <div>
            <div style={{fontFamily:T.serif,fontSize:28,fontWeight:900,color:T.text}}>Comprehension Quiz</div>
            <div style={{fontSize:14,color:T.text3,marginTop:4,display:"flex",alignItems:"center",gap:8}}>
              {passage.title}
              {isAIQuiz && (
                <span style={{fontSize:11,color:T.teal,background:`${T.teal}18`,padding:"2px 8px",borderRadius:20}}>
                  AI-generated quiz
                </span>
              )}
            </div>
          </div>
          <button onClick={onExit} style={{background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:13}}
            onMouseEnter={e=>e.currentTarget.style.color=T.red} onMouseLeave={e=>e.currentTarget.style.color=T.text3}>
            Skip quiz
          </button>
        </div>

        {/* Progress dots */}
        <div style={{display:"flex",gap:8,marginBottom:36}}>
          {questions.map((_,i) => (
            <div key={i} onClick={()=>setCurrent(i)} style={{flex:1,height:5,borderRadius:3,cursor:"pointer",background:answers[questions[i].id]!==undefined?T.amber:i===current?T.teal:T.card2,transition:"background 0.2s"}}/>
          ))}
        </div>

        {/* Question */}
        <div style={{animation:"fadeIn 0.25s ease both"}} key={q.id}>
          <div style={{fontSize:11,color:T.amber,letterSpacing:1,fontWeight:700,textTransform:"uppercase",marginBottom:12}}>
            Question {current+1} of {questions.length} · {q.type==="tf"?"True / False":"Multiple Choice"}
          </div>
          <div style={{fontFamily:T.serif,fontSize:22,lineHeight:1.6,color:T.text,marginBottom:32}}>{q.q}</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {q.choices.map((c,i) => {
              const sel = answers[q.id] === i;
              return (
                <button key={i} onClick={()=>setAnswers(prev=>({...prev,[q.id]:i}))}
                  style={{padding:"16px 20px",borderRadius:10,border:`2px solid ${sel?T.amber:T.border}`,background:sel?T.amberGlow:T.card,color:T.text,textAlign:"left",cursor:"pointer",fontSize:15,transition:"all 0.15s",display:"flex",alignItems:"center",gap:14}}
                  onMouseEnter={e=>{if(!sel){e.currentTarget.style.borderColor=T.amber+"44";e.currentTarget.style.background=T.card2;}}}
                  onMouseLeave={e=>{if(!sel){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;}}}>
                  <span style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${sel?T.amber:T.border2}`,background:sel?T.amber:"transparent",color:sel?T.bg:T.text3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>
                    {sel?"✓":String.fromCharCode(65+i)}
                  </span>
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{display:"flex",gap:12,marginTop:40}}>
          {current > 0 && <Btn variant="secondary" onClick={()=>setCurrent(c=>c-1)}>← Previous</Btn>}
          {current < questions.length-1
            ? <Btn onClick={()=>setCurrent(c=>c+1)}>Next →</Btn>
            : <Btn onClick={submit} disabled={Object.keys(answers).length<questions.length} variant="teal">Submit Quiz ✓</Btn>
          }
        </div>
      </div>

      {/* Side panel */}
      <div style={{width:380,flexShrink:0,borderLeft:`1px solid ${T.border}`,padding:"48px 32px",overflowY:"auto",background:T.surface}}>
        <div style={{fontSize:13,color:T.text3,marginBottom:16,fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>Passage Reference</div>
        <div style={{fontFamily:T.serif,fontSize:15,lineHeight:1.9,color:T.text2}}>{passage.text.slice(0,600)}<span style={{color:T.text3}}>…</span></div>
        {sessionData && (
          <div style={{marginTop:24,padding:"14px 16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:11,color:T.text3,marginBottom:8,letterSpacing:.5,textTransform:"uppercase"}}>Your Session</div>
            <div style={{display:"flex",gap:20}}>
              <div><div style={{fontFamily:T.mono,fontSize:20,color:T.amber,fontWeight:700}}>{sessionData.wpm}</div><div style={{fontSize:11,color:T.text3}}>WPM</div></div>
              <div><div style={{fontFamily:T.mono,fontSize:20,color:T.teal,fontWeight:700}}>{sessionData.wordsRead}</div><div style={{fontSize:11,color:T.text3}}>words</div></div>
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
  const {score,correct,total,missed,passage,sessionData}=results;
  const grade=score>=85?["🏆","Exceptional!",T.amber]:score>=70?["⭐","Great work!",T.teal]:score>=50?["📈","Keep going!","#ffa500"]:["💪","Room to grow","#a78bfa"];
  return (
    <div style={{padding:"48px 64px",maxWidth:1000,animation:"fadeUp 0.4s ease both"}}>
      <div style={{display:"flex",gap:48,marginBottom:48}}>
        <div style={{flex:1}}>
          <div style={{fontSize:56,marginBottom:16}}>{grade[0]}</div>
          <div style={{fontFamily:T.serif,fontSize:40,fontWeight:900,color:grade[2],letterSpacing:-1,marginBottom:8}}>{grade[1]}</div>
          <div style={{fontSize:16,color:T.text2,marginBottom:32}}>You answered {correct} of {total} questions correctly on <em>{passage.title}</em>.</div>
          <div style={{display:"flex",gap:16}}>
            <Btn size="lg" onClick={onDone}>Back to Dashboard</Btn>
            {missed.length>0&&<Btn variant="secondary" size="lg" onClick={onFlashcards}>📇 Add {missed.length} to Flashcards</Btn>}
          </div>
        </div>
        <div style={{width:200,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:32}}>
          <div style={{fontFamily:T.serif,fontSize:72,fontWeight:900,color:grade[2],lineHeight:1}}>{score}</div>
          <div style={{fontSize:16,color:T.text3,marginTop:4}}>out of 100</div>
          {sessionData&&<div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${T.border}`,width:"100%",textAlign:"center"}}><div style={{fontFamily:T.mono,fontSize:24,color:T.amber,fontWeight:700}}>{sessionData.wpm}</div><div style={{fontSize:11,color:T.text3}}>words per minute</div></div>}
        </div>
      </div>
      {missed.length>0&&<div><div style={{fontFamily:T.serif,fontSize:22,fontWeight:700,color:T.text,marginBottom:16}}>Review Missed Questions</div><div style={{display:"flex",flexDirection:"column",gap:14}}>{missed.map(q=><div key={q.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px 24px"}}><div style={{fontSize:15,color:T.text,marginBottom:10,fontFamily:T.serif}}>{q.q}</div><div style={{display:"flex",gap:8,alignItems:"flex-start"}}><span style={{color:T.teal,fontSize:16}}>✓</span><div style={{fontSize:14,color:T.teal}}>{q.choices[q.correct]}</div></div><div style={{fontSize:13,color:T.text3,marginTop:8,lineHeight:1.6}}>{q.exp}</div></div>)}</div></div>}
      <div style={{marginTop:40,padding:"20px 24px",background:T.amberGlow,border:`1px solid ${T.amber}33`,borderRadius:12}}>
        <div style={{fontFamily:T.serif,fontSize:16,fontStyle:"italic",color:T.text2,lineHeight:1.7}}>{score>=70?`Excellent session! You read ${passage.wordCount} words${sessionData?` at ${sessionData.wpm} WPM`:""}.`:`Every passage you read builds your vocabulary and comprehension. Consistency beats intensity.`}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function GenerateView({ user, isGuest, onStart, notify, onSaveAIPassage, onRegenerateQuiz }) {
  const [genre,   setGenre]   = useState("fiction");
  const [level,   setLevel]   = useState(user?.level||3);
  const [length,  setLength]  = useState(300);
  const [topic,   setTopic]   = useState("");
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState("");

  const generate = async () => {
    if (isGuest) { notify("Sign up to use AI Generation","err"); return; }
    setLoading(true); setStatus("Connecting to AI...");
    try {
      const prompts = {
        fiction:   `Write a ${length}-word short fiction passage for a level ${level}/10 reader. Use engaging narrative and varied sentences. Topic: ${topic||"a chance encounter in an old city"}. Write only the passage, no title.`,
        academic:  `Write a ${length}-word expository passage for a level ${level}/10 reader. Use clear academic language with 2-3 domain terms. Topic: ${topic||"the science of memory and learning"}. Write only the passage, no title.`,
        vocabulary:`Write a ${length}-word passage for a level ${level}/10 reader with rich sophisticated vocabulary used naturally in context. Topic: ${topic||"the nature of time and perception"}. Write only the passage, no title.`,
      };
      setStatus("Generating passage...");
      const text = await generateWithAI(prompts[genre]);
      const genreLabel = `AI ${genre.charAt(0).toUpperCase()+genre.slice(1)}`;
      const title = topic ? topic.charAt(0).toUpperCase()+topic.slice(1) : genreLabel;
      const wordCount = text.split(/\s+/).length;

      setStatus("Generating quiz...");
      let quizJson = null;
      try { quizJson = await generateQuizForPassage(text, title); } catch(e) { /* quiz optional */ }

      // Save to DB (public immediately)
      setStatus("Saving to community library...");
      let savedPassage = null;
      if (onSaveAIPassage) {
        savedPassage = await onSaveAIPassage({ title, genre: genreLabel, level, wordCount, text, quizJson });
      }

      const p = {
        id:        savedPassage ? savedPassage.id : `gen-${Date.now()}`,
        title,
        genre:     genreLabel,
        level,
        wordCount,
        text,
        tags:      ["ai-generated", genre],
        quizJson,
        isAIPassage: !!savedPassage,
        createdBy:   user?.id,
        creatorName: user?.name,
      };
      notify("Passage saved to library! Starting session…");
      onStart(p);
    } catch(e) { notify("Generation failed — Pollinations AI may be busy. Try again in a moment.","err"); }
    setLoading(false); setStatus("");
  };

  const SelectGroup = ({ label, options, value, onChange }) => (
    <div style={{marginBottom:28}}>
      <div style={{fontSize:12,color:T.text3,fontWeight:600,letterSpacing:.8,textTransform:"uppercase",marginBottom:10}}>{label}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {options.map(o=><button key={o.v} onClick={()=>onChange(o.v)} style={{padding:"9px 18px",borderRadius:8,border:`1px solid ${value===o.v?T.amber:T.border}`,background:value===o.v?T.amberGlow:T.card,color:value===o.v?T.amber:T.text2,cursor:"pointer",fontSize:14,fontWeight:value===o.v?600:400,transition:"all 0.15s"}}>{o.l}</button>)}
      </div>
    </div>
  );

  return (
    <div style={{padding:"40px 48px",maxWidth:800}}>
      <div style={{marginBottom:40,animation:"fadeUp 0.4s ease both"}}>
        <h1 style={{fontFamily:T.serif,fontSize:36,fontWeight:900,color:T.text,marginBottom:6}}>AI Generate</h1>
        <p style={{color:T.text3,fontSize:15}}>Create custom passages tuned to your level — powered by Pollinations AI, completely free.</p>
      </div>
      {isGuest&&<div style={{padding:"14px 18px",background:`${T.red}11`,border:`1px solid ${T.red}33`,borderRadius:10,marginBottom:28,fontSize:14,color:T.red}}>⚠️ AI generation requires an account. Sign up — it's free.</div>}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"32px 36px",animation:"fadeUp 0.4s 0.05s ease both"}}>
        <SelectGroup label="Genre" value={genre} onChange={setGenre} options={[{v:"fiction",l:"Short Fiction"},{v:"academic",l:"Academic"},{v:"vocabulary",l:"High Vocabulary"}]}/>
        <SelectGroup label="Difficulty Level" value={level} onChange={setLevel} options={LEVELS.map(l=>({v:l.n,l:`${l.n} — ${l.title}`}))}/>
        <SelectGroup label="Length" value={length} onChange={setLength} options={[{v:150,l:"Short (150w)"},{v:300,l:"Medium (300w)"},{v:500,l:"Long (500w)"}]}/>
        <div style={{marginBottom:32}}>
          <div style={{fontSize:12,color:T.text3,fontWeight:600,letterSpacing:.8,textTransform:"uppercase",marginBottom:10}}>Topic (optional)</div>
          <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. deep-sea exploration, ancient Rome, quantum mechanics…" style={{width:"100%",padding:"13px 16px",borderRadius:8,border:`1px solid ${T.border2}`,background:T.surface,color:T.text,fontSize:15,outline:"none",transition:"border-color 0.2s"}} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=T.border2}/>
        </div>
        <Btn size="lg" onClick={generate} disabled={loading||isGuest} style={{width:"100%",justifyContent:"center"}}>
          {loading?<><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>✦</span> {status||"Generating…"}</>:<>✨ Generate Passage</>}
        </Btn>
        {loading && (
          <div style={{marginTop:14,fontSize:13,color:T.text3,textAlign:"center"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:6}}>
              {["Generating passage...","Generating quiz...","Saving to community library..."].map((step,i)=>(
                <span key={step} style={{display:"flex",alignItems:"center",gap:4,opacity:status===step?1:0.35,transition:"opacity 0.3s"}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:status===step?T.amber:T.text3,display:"inline-block"}}/>
                  <span style={{fontSize:11,color:status===step?T.amber:T.text3,fontWeight:status===step?600:400}}>{step.replace("...","")}</span>
                  {i<2&&<span style={{color:T.text3,fontSize:11,marginLeft:2}}>→</span>}
                </span>
              ))}
            </div>
            <div style={{fontSize:11,color:T.text3}}>Passage + quiz generated and saved for everyone to use.</div>
          </div>
        )}
      </div>
      <div style={{marginTop:20,padding:"14px 18px",background:`${T.teal}11`,border:`1px solid ${T.teal}33`,borderRadius:10,fontSize:13,color:T.teal}}>
        ✓ Powered by <strong>Pollinations AI</strong> — free, no API key. Passages are saved to the community library for all users.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLASHCARDS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function FlashcardsView({ flashcards, setFlashcards }) {
  const [idx,     setIdx]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const due = flashcards.filter(f=>f.due<=Date.now());

  const review = easy => {
    const card=due[idx%due.length];
    setFlashcards(prev=>prev.map(f=>f.id===card.id?{...f,interval:easy?f.interval*2:1,due:Date.now()+(easy?f.interval*2:1)*86400000}:f));
    setFlipped(false); setIdx(i=>i+1);
  };

  return (
    <div style={{padding:"40px 48px"}}>
      <div style={{marginBottom:32}}>
        <h1 style={{fontFamily:T.serif,fontSize:36,fontWeight:900,color:T.text,marginBottom:6}}>Flashcards</h1>
        <p style={{color:T.text3,fontSize:15}}>Spaced repetition for long-term retention. {due.length} card{due.length!==1?"s":""} due for review.</p>
      </div>
      {due.length===0?(
        <div style={{textAlign:"center",padding:"80px 40px",background:T.card,border:`1px solid ${T.border}`,borderRadius:20}}>
          <div style={{fontSize:56,marginBottom:16}}>🎉</div>
          <div style={{fontFamily:T.serif,fontSize:28,fontWeight:900,color:T.text,marginBottom:8}}>All caught up!</div>
          <div style={{fontSize:15,color:T.text3}}>No flashcards due. Complete quizzes to add more.</div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:40,maxWidth:900}}>
          <div style={{display:"flex",flexDirection:"column"}}>
            <div onClick={()=>setFlipped(f=>!f)} style={{background:T.card,border:`2px solid ${flipped?T.amber:T.border}`,borderRadius:20,padding:"48px 40px",minHeight:280,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.25s",textAlign:"center"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.amber+"55"} onMouseLeave={e=>e.currentTarget.style.borderColor=flipped?T.amber:T.border}>
              <div style={{fontSize:11,color:flipped?T.amber:T.text3,letterSpacing:1,textTransform:"uppercase",fontWeight:700,marginBottom:20}}>{flipped?"Answer":"Question"}</div>
              <div style={{fontFamily:T.serif,fontSize:18,lineHeight:1.7,color:T.text}}>{flipped?due[idx%due.length]?.answer:due[idx%due.length]?.question}</div>
              {!flipped&&<div style={{fontSize:12,color:T.text3,marginTop:24}}>Click to reveal answer</div>}
            </div>
            {flipped&&<div style={{display:"flex",gap:12,marginTop:16,animation:"fadeUp 0.2s ease both"}}>
              <Btn variant="danger" onClick={()=>review(false)} style={{flex:1,justifyContent:"center"}}>😕 Forgot</Btn>
              <Btn variant="teal"   onClick={()=>review(true)}  style={{flex:1,justifyContent:"center"}}>✓ Got it</Btn>
            </div>}
          </div>
          <div>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px",marginBottom:16}}>
              <div style={{fontSize:12,color:T.text3,letterSpacing:.5,textTransform:"uppercase",marginBottom:16,fontWeight:600}}>Queue</div>
              <div style={{fontFamily:T.serif,fontSize:44,fontWeight:900,color:T.amber,marginBottom:4}}>{due.length}</div>
              <div style={{fontSize:14,color:T.text3}}>cards due for review</div>
            </div>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px"}}>
              <div style={{fontSize:12,color:T.text3,letterSpacing:.5,textTransform:"uppercase",marginBottom:16,fontWeight:600}}>Spaced Repetition</div>
              <div style={{fontSize:14,color:T.text2,lineHeight:1.8}}>Cards you answer correctly are shown less frequently.<br/><br/>Cards you forget are shown again sooner.<br/><br/>Based on the SM-2 algorithm.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD VIEW — ★ completely rebuilt with saved texts library
// ─────────────────────────────────────────────────────────────────────────────
function UploadView({ onStart, notify, uploads, isGuest, userId, onSave, onDelete }) {
  const [title,   setTitle]   = useState("");
  const [text,    setText]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState("new"); // "new" | "saved"
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const start = async () => {
    if (wordCount < 50) { notify("Please paste at least 50 words","err"); return; }
    const passage = {
      id:`upload-${Date.now()}`,
      title: title || "My Upload",
      genre:"Uploaded",
      level:5,
      wordCount,
      text: text.trim(),
      tags:["uploaded"],
    };
    // Auto-save if logged in
    if (!isGuest && userId) {
      setSaving(true);
      const saved = await onSave({ title: passage.title, text: passage.text, wordCount });
      setSaving(false);
      if (saved) {
        passage.id = saved.id; // use DB id so it stays consistent
        notify("Saved to your library ✓");
      }
    }
    onStart(passage);
  };

  const inp = {width:"100%",padding:"12px 16px",borderRadius:8,border:`1px solid ${T.border2}`,background:T.surface,color:T.text,fontSize:15,outline:"none",transition:"border-color 0.2s"};

  return (
    <div style={{padding:"40px 48px",maxWidth:960}}>
      <div style={{marginBottom:32,animation:"fadeUp 0.4s ease both"}}>
        <h1 style={{fontFamily:T.serif,fontSize:36,fontWeight:900,color:T.text,marginBottom:6}}>Upload Text</h1>
        <p style={{color:T.text3,fontSize:15}}>Paste any text to practice with — articles, essays, chapters. Saved automatically to your profile.</p>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",background:T.card,borderRadius:10,padding:4,marginBottom:28,border:`1px solid ${T.border}`,width:"fit-content",animation:"fadeUp 0.4s 0.05s ease both"}}>
        {[{id:"new",label:"📝 New Text"},{id:"saved",label:`📂 My Saved Texts${uploads.length>0?` (${uploads.length})`:""}`}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"9px 20px",borderRadius:8,border:"none",background:tab===t.id?T.amber:"transparent",color:tab===t.id?T.bg:T.text2,fontWeight:tab===t.id?700:400,cursor:"pointer",fontSize:14,transition:"all 0.15s"}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "new" && (
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"32px",animation:"fadeUp 0.4s ease both"}}>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,color:T.text3,fontWeight:600,letterSpacing:.8,textTransform:"uppercase",display:"block",marginBottom:8}}>Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Chapter 3 — The Origin of Species" style={inp} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=T.border2}/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,color:T.text3,fontWeight:600,letterSpacing:.8,textTransform:"uppercase",display:"block",marginBottom:8}}>
              Paste Text <span style={{color:T.text3,textTransform:"none",letterSpacing:0,fontSize:11}}>· {wordCount} words · {wordCount>=50?"✓ ready":`need ${50-wordCount} more`}</span>
            </label>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste your text here (minimum 50 words)…" style={{width:"100%",height:280,padding:"16px",borderRadius:8,border:`1px solid ${T.border2}`,background:T.surface,color:T.text,fontSize:16,fontFamily:T.serif,lineHeight:1.8,resize:"vertical",outline:"none"}} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=T.border2}/>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,color:T.text3}}>
              {isGuest ? "⚠️ Sign in to save texts to your profile." : "✓ Text will be saved to your profile automatically."}
            </div>
            <Btn size="lg" onClick={start} disabled={wordCount<50||saving}>
              {saving?<><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>✦</span> Saving…</>:"Start Reading →"}
            </Btn>
          </div>
        </div>
      )}

      {tab === "saved" && (
        <div style={{animation:"fadeUp 0.4s ease both"}}>
          {isGuest ? (
            <div style={{padding:"60px 40px",textAlign:"center",background:T.card,border:`1px solid ${T.border}`,borderRadius:16}}>
              <div style={{fontSize:40,marginBottom:12}}>🔒</div>
              <div style={{fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.text,marginBottom:8}}>Sign in to view saved texts</div>
              <div style={{fontSize:14,color:T.text3}}>Create a free account to save your texts and access them anytime.</div>
            </div>
          ) : uploads.length === 0 ? (
            <div style={{padding:"60px 40px",textAlign:"center",background:T.card,border:`1px solid ${T.border}`,borderRadius:16}}>
              <div style={{fontSize:40,marginBottom:12}}>📂</div>
              <div style={{fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.text,marginBottom:8}}>No saved texts yet</div>
              <div style={{fontSize:14,color:T.text3,marginBottom:20}}>Upload a text and it will be saved here automatically.</div>
              <Btn onClick={()=>setTab("new")}>Upload your first text →</Btn>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {uploads.map((u,i)=>(
                <div key={u.id} style={{display:"flex",alignItems:"center",gap:16,padding:"18px 22px",background:T.card,border:`1px solid ${T.border}`,borderRadius:12,transition:"border-color 0.15s",animation:`fadeUp 0.3s ${i*0.04}s ease both`}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=T.amber+"44"} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:T.serif,fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>{u.title}</div>
                    <div style={{fontSize:13,color:T.text3,lineHeight:1.5}}>{u.text.slice(0,100)}…</div>
                    <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                      <Tag label={`${u.wordCount} words`} color="amber"/>
                      <Tag label="Uploaded"/>
                      <Tag label={new Date(u.createdAt).toLocaleDateString()}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <Btn size="sm" onClick={()=>onStart(u)}>Read <SVG d={ICONS.arrow} size={13} stroke={T.bg}/></Btn>
                    <Btn size="sm" variant="danger" onClick={()=>onDelete(u.id)} style={{padding:"6px 10px"}}>
                      <SVG d={ICONS.trash} size={13} stroke={T.red}/>
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
