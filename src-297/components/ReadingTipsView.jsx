import { useState } from "react";
import { useTheme } from "../theme";
import { ThemeToggleBtn } from "./common";

export default function ReadingTipsView({ darkMode, toggleTheme }) {
  const T = useTheme();
    const [activeCategory, setActiveCategory] = useState("speed");

  const TIPS = {
    speed: {
      label: "Speed Reading",
      icon:  "⚡",
      color: T.amber,
      tips: [
        { title:"Stop Subvocalizing", body:"Most people 'say' words in their head as they read. This limits your speed to speaking pace (~150 WPM). Practice reading without mentally pronouncing each word — your brain can process text far faster than speech." },
        { title:"Use a Pointer", body:"Guide your eyes with a finger or pen moving steadily across each line. This reduces regression (re-reading) and trains your eyes to move in a smoother, more deliberate pattern." },
        { title:"Expand Your Eye Span", body:"Train yourself to take in 3–4 words per eye fixation instead of one. Practice by focusing on the centre of a line and absorbing the words around it without moving your eyes to each word." },
        { title:"Use the RSVP Mode", body:"Rapid Serial Visual Presentation eliminates eye movement entirely. Start at 200 WPM and increase by 25 WPM every session until comprehension drops, then back off slightly." },
        { title:"Skim First, Then Read", body:"For non-fiction, skim headings, first sentences of each paragraph, and the conclusion before reading fully. Your brain processes the full text faster when it has a structural map." },
      ]
    },
    comprehension: {
      label: "Comprehension",
      icon:  "🧠",
      color: T.teal,
      tips: [
        { title:"Ask Questions Before Reading", body:"Before starting a passage, ask: What do I already know about this? What do I expect to learn? This primes your brain to actively seek information rather than passively consume words." },
        { title:"Chunk and Summarise", body:"After every paragraph or section, pause for 3 seconds and mentally summarise the main point in one sentence. This forces active engagement and significantly improves retention." },
        { title:"Connect to Prior Knowledge", body:"Actively link new information to things you already know. The more connections your brain makes, the stronger the memory trace. Ask: How does this relate to something I know?" },
        { title:"Read Difficult Texts Twice", body:"First pass: read for the big picture at normal pace. Second pass: read slowly and critically. Two moderate passes beat one slow, exhausting read for both speed and retention." },
        { title:"Spaced Repetition", body:"Review key ideas 1 day, 3 days, 7 days, and 21 days after reading. This is the single most evidence-backed technique for long-term retention. The flashcard system in Readtor uses this principle." },
      ]
    },
    focus: {
      label: "Focus & Environment",
      icon:  "🎯",
      color: "#a78bfa",
      tips: [
        { title:"The 25-Minute Rule (Pomodoro)", body:"Read in 25-minute focused blocks with 5-minute breaks. After 4 blocks, take a 20-minute break. This prevents mental fatigue and maintains high comprehension across longer sessions." },
        { title:"Eliminate Visual Distractions", body:"Close all unnecessary browser tabs. The mere presence of a notification badge reduces cognitive capacity by up to 20% even if you don't click it." },
        { title:"Read at Your Peak Hours", body:"Identify your daily peak cognitive window (usually 2–4 hours after waking). Schedule your most demanding reading during this window — comprehension can be 30–40% higher than off-peak." },
        { title:"Background Sound", body:"Low-intensity ambient noise (40–70 dB) — like a coffee shop or brown noise — slightly enhances creative thinking during reading. Silence is best for highly technical material." },
        { title:"Physical Posture", body:"Sit upright with the text at eye level. Slouching reduces oxygen flow to the brain by up to 30%. Reading while lying down is fine for light material but slows processing of complex text." },
      ]
    },
    vocabulary: {
      label: "Vocabulary Building",
      icon:  "📖",
      color: "#f97316",
      tips: [
        { title:"Context Before Dictionary", body:"When you encounter an unknown word, try to infer its meaning from context before looking it up. This active inference process burns the word into memory more effectively than passive lookup." },
        { title:"The 1-in-10 Rule", body:"If you encounter more than 1 unknown word per 10 words, the text is too difficult for fluent reading. Drop down a level, build vocabulary, and return. Frustration reading destroys motivation." },
        { title:"Word Families", body:"Learn words in families: if you learn 'cognition', also learn 'cognitive', 'cognisant', 'cognisance'. This multiplies your vocabulary gain from a single root word." },
        { title:"Read Widely Across Genres", body:"Academic, literary, and journalistic writing each use different vocabulary registers. Readers who consume all three develop far richer word banks than those who stick to one genre." },
        { title:"The Feynman Technique", body:"After reading, close the material and explain the main ideas in simple language as if teaching a child. Gaps in your explanation reveal gaps in your understanding, not just your vocabulary." },
      ]
    },
    digital: {
      label: "Digital Reading",
      icon:  "💻",
      color: T.teal,
      tips: [
        { title:"F-Pattern Awareness", body:"Eye-tracking research shows people read screens in an F-pattern: fully across the top, partially across the middle, then down the left edge. For important content, front-load key information into the first lines." },
        { title:"Dark Mode Reduces Strain", body:"For extended reading sessions (30+ minutes), dark mode with warm amber text significantly reduces eye strain compared to white backgrounds under artificial lighting." },
        { title:"Font Size Matters", body:"Reading comprehension improves with font sizes of 16–20px on screen. Smaller fonts increase cognitive load. Use the font size controls in each reading mode." },
        { title:"Line Length Optimum", body:"The optimal line length for reading comprehension is 50–75 characters (about 12–14 words). Wider lines cause eyes to lose their place; narrower lines break reading flow." },
        { title:"Avoid Passive Scrolling", body:"Passive feed-scrolling (social media) trains your brain into a shallow, fragmented attention mode. Counteract this with deliberate long-form reading sessions of at least 20 minutes." },
      ]
    },
  };

  const category = TIPS[activeCategory];

  return (
    <div style={{padding:"clamp(16px,4vw,40px) clamp(16px,4vw,48px)",maxWidth:1100}}>
      <div style={{marginBottom:36,animation:"fadeUp 0.4s ease both"}}>
        <ThemeToggleBtn darkMode={darkMode} toggleTheme={toggleTheme}/>
      <h1 style={{fontFamily:T.serif,fontSize:36,fontWeight:900,color:T.text,marginBottom:6}}>Reading Tips</h1>
        <p style={{color:T.text3,fontSize:15}}>Evidence-based techniques from reading science, cognitive psychology, and speed-reading research.</p>
      </div>

      {/* Category tabs */}
      <div style={{display:"flex",gap:8,marginBottom:36,flexWrap:"wrap",animation:"fadeUp 0.4s 0.05s ease both"}}>
        {Object.entries(TIPS).map(([key, cat]) => (
          <button key={key} onClick={()=>setActiveCategory(key)}
            style={{padding:"10px 18px",borderRadius:10,border:`1px solid ${activeCategory===key?cat.color:T.border}`,background:activeCategory===key?`${cat.color}18`:"transparent",color:activeCategory===key?cat.color:T.text2,cursor:"pointer",fontSize:13,fontWeight:activeCategory===key?700:400,transition:"all 0.15s",display:"flex",alignItems:"center",gap:7}}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Tips grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:20,animation:"fadeUp 0.4s 0.1s ease both"}}>
        {category.tips.map((tip, i) => (
          <div key={tip.title} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px",display:"flex",flexDirection:"column",gap:10,animation:`fadeUp 0.3s ${i*0.06}s ease both`,borderLeft:`4px solid ${category.color}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:T.serif,fontSize:16,fontWeight:700,color:T.text}}>{tip.title}</span>
            </div>
            <p style={{fontSize:14,color:T.text2,lineHeight:1.75,margin:0}}>{tip.body}</p>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{marginTop:40,padding:"16px 20px",background:T.amberGlow,border:`1px solid ${T.amber}33`,borderRadius:12,animation:"fadeUp 0.4s 0.3s ease both"}}>
        <div style={{fontFamily:T.serif,fontSize:14,fontStyle:"italic",color:T.text2,lineHeight:1.7}}>
          "The more that you read, the more things you will know. The more that you learn, the more places you'll go." — Dr. Seuss. Practice these techniques consistently with Readtor's reading modes and track your WPM progress over time.
        </div>
      </div>
    </div>
  );
}
