import { useState, useEffect } from "react";
import { useTheme } from "../theme";
import { LEVELS } from "../constants";
import { SVG, ICONS } from "../icons";
import { Btn, ThemeToggleBtn } from "./common";
import { generateWithAI, generateQuizForPassage } from "../lib/pollinationsApi";
import { canGenerate, recordGeneration, generationsUsed, nextResetMs, RATE_LIMIT } from "../lib/rateLimit";
import { getWeeklyThemeOptIn, currentWeeklyTheme } from "../lib/variety";

export default function GenerateView({ user, isGuest, onStart, notify, onSaveAIPassage, onRegenerateQuiz, darkMode, toggleTheme, difficultyLock }) {
  const T = useTheme();
  const [genre,   setGenre]   = useState("fiction");
  const [level,   setLevel]   = useState(user?.level||3);
  const [length,  setLength]  = useState(300);
  // ★ Pre-fill topic with the weekly theme if the user opted in
  const [topic,   setTopic]   = useState(() => getWeeklyThemeOptIn() ? currentWeeklyTheme() : "");
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState("");
  const themeApplied = getWeeklyThemeOptIn() && topic === currentWeeklyTheme();

  const generate = async () => {
    if (isGuest) { notify("Sign up to use AI Generation","err"); return; }
    if (!canGenerate()) {
      notify("Daily limit reached — you can generate 5 passages per 24 hours.","err");
      return;
    }
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
      recordGeneration(); // track for rate limit
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
    <div style={{padding:"clamp(16px,4vw,40px) clamp(16px,4vw,48px)",maxWidth:800}}>
      <div style={{marginBottom:40,animation:"fadeUp 0.4s ease both"}}>
        <ThemeToggleBtn darkMode={darkMode} toggleTheme={toggleTheme}/>
      <h1 style={{fontFamily:T.serif,fontSize:36,fontWeight:900,color:T.text,marginBottom:6}}>AI Generate</h1>
        <p style={{color:T.text3,fontSize:15}}>Create custom passages tuned to your level — powered by Pollinations AI, completely free.</p>
      </div>
      {isGuest&&<div style={{padding:"14px 18px",background:`${T.red}11`,border:`1px solid ${T.red}33`,borderRadius:10,marginBottom:28,fontSize:14,color:T.red}}>⚠️ AI generation requires an account. Sign up — it's free.</div>}
      {!isGuest && <RateLimitBanner/>}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"32px 36px",animation:"fadeUp 0.4s 0.05s ease both"}}>
        <SelectGroup label="Genre" value={genre} onChange={setGenre} options={[{v:"fiction",l:"Short Fiction"},{v:"academic",l:"Academic"},{v:"vocabulary",l:"High Vocabulary"}]}/>
        {difficultyLock
          ? <div style={{marginBottom:28}}>
              <div style={{fontSize:12,color:T.text3,fontWeight:600,letterSpacing:.8,textTransform:"uppercase",marginBottom:10}}>Difficulty Level</div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:`${T.amber}11`,border:`1px solid ${T.amber}33`,borderRadius:8}}>
                <SVG d={ICONS.lock} size={14} stroke={T.amber}/>
                <span style={{fontSize:13,color:T.amber}}>Locked to Level {user?.level} — {LEVELS[(user?.level||1)-1].title}</span>
              </div>
            </div>
          : <SelectGroup label="Difficulty Level" value={level} onChange={setLevel} options={LEVELS.map(l=>({v:l.n,l:`${l.n} — ${l.title}`}))}/>
        }
        <SelectGroup label="Length" value={length} onChange={setLength} options={[{v:150,l:"Short (150w)"},{v:300,l:"Medium (300w)"},{v:500,l:"Long (500w)"}]}/>
        <div style={{marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{fontSize:12,color:T.text3,fontWeight:600,letterSpacing:.8,textTransform:"uppercase"}}>Topic (optional)</div>
            {themeApplied && (
              <span style={{fontSize:10,color:T.teal,background:`${T.teal}18`,padding:"2px 8px",borderRadius:20,fontWeight:600}}>
                🗓️ This week's theme
              </span>
            )}
          </div>
          <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. deep-sea exploration, ancient Rome, quantum mechanics…" style={{width:"100%",padding:"13px 16px",borderRadius:8,border:`1px solid ${themeApplied?T.teal+"66":T.border2}`,background:T.surface,color:T.text,fontSize:15,outline:"none",transition:"border-color 0.2s"}} onFocus={e=>e.target.style.borderColor=T.amber} onBlur={e=>e.target.style.borderColor=themeApplied?T.teal+"66":T.border2}/>
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

function RateLimitBanner() {
  const T = useTheme();
    const [used,     setUsed]     = useState(generationsUsed);
  const [timeLeft, setTimeLeft] = useState(nextResetMs);

  useEffect(() => {
    const id = setInterval(() => {
      setUsed(generationsUsed());
      setTimeLeft(nextResetMs());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = RATE_LIMIT - used;
  const hrs  = Math.floor(timeLeft / 3600000);
  const mins = Math.floor((timeLeft % 3600000) / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);
  const pad  = n => String(n).padStart(2, "0");

  if (remaining > 0) {
    return (
      <div style={{padding:"10px 16px",background:`${T.teal}11`,border:`1px solid ${T.teal}33`,borderRadius:10,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13}}>
        <span style={{color:T.text2}}>Daily generations used:</span>
        <span style={{fontFamily:T.mono,fontWeight:700,color:remaining<=1?T.red:T.teal}}>
          {used} / {RATE_LIMIT} &nbsp;·&nbsp; {remaining} remaining
        </span>
      </div>
    );
  }

  return (
    <div style={{padding:"14px 18px",background:`${T.red}11`,border:`1px solid ${T.red}33`,borderRadius:10,marginBottom:20,animation:"fadeUp 0.2s ease both"}}>
      <div style={{fontSize:14,fontWeight:600,color:T.red,marginBottom:6}}>⏳ Daily limit reached (5/5 generations used)</div>
      <div style={{fontSize:13,color:T.text2,marginBottom:8}}>You can generate again in:</div>
      <div style={{fontFamily:T.mono,fontSize:28,fontWeight:700,color:T.amber,letterSpacing:2}}>
        {pad(hrs)}:{pad(mins)}:{pad(secs)}
      </div>
      <div style={{fontSize:11,color:T.text3,marginTop:6}}>The limit resets 24 hours after your first generation today.</div>
    </div>
  );
}
