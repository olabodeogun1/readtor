import { useState, useEffect } from "react";
import { useTheme } from "../theme";
import { LEVELS, QUOTES, PASSAGES } from "../constants";
import { SVG, ICONS } from "../icons";
import { Btn, Tag, ThemeToggleBtn } from "./common";
import { fetchDailyPassage, saveDailyPassage } from "../lib/supabaseHelpers";
import { generateWithAI, generateQuizForPassage } from "../lib/pollinationsApi";
import {
  currentWeeklyTheme, getWeeklyThemeOptIn, todayKey, todaysTopic, todaysGenre,
  pickRoulettePassage, pickPassageByMood, MOODS,
} from "../lib/variety";

export default function DashboardView({ user, isGuest, sessions, onStart, flashcards, setView, darkMode, toggleTheme }) {
  const T = useTheme();
  const level    = LEVELS[(user?.level||1)-1];
  const quote    = QUOTES[new Date().getDate()%QUOTES.length];
  const avgWpm   = sessions.length ? Math.round(sessions.reduce((s,x)=>s+(x.wpm||0),0)/sessions.length) : 0;
  const avgComp  = sessions.length ? Math.round(sessions.reduce((s,x)=>s+(x.comp||0),0)/sessions.length) : 0;
  const dueCards = flashcards.filter(f=>f.due<=Date.now()).length;

  // ★ Variety features state
  const [dailyPassage,    setDailyPassage]    = useState(null);
  const [loadingDaily,    setLoadingDaily]    = useState(true);
  const [rouletteLoading, setRouletteLoading] = useState(false);
  const [moodOpen,        setMoodOpen]        = useState(false);
  const weeklyTheme = currentWeeklyTheme();

  // Load (or generate) today's Daily Drop passage once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const key = todayKey();
      try {
        let daily = await fetchDailyPassage(key);
        if (!daily && !isGuest) {
          // First visitor of the day generates it for everyone
          const topic = todaysTopic();
          const genre = todaysGenre();
          const prompts = {
            fiction:    `Write a 280-word short fiction passage. Use engaging narrative. Topic: ${topic}. Write only the passage, no title.`,
            academic:   `Write a 280-word expository passage. Use clear academic language. Topic: ${topic}. Write only the passage, no title.`,
            vocabulary: `Write a 280-word passage with rich vocabulary used naturally. Topic: ${topic}. Write only the passage, no title.`,
          };
          const text = await generateWithAI(prompts[genre]);
          let quizJson = null;
          try { quizJson = await generateQuizForPassage(text, topic); } catch(e) {}
          const title = topic.charAt(0).toUpperCase() + topic.slice(1);
          daily = await saveDailyPassage(key, {
            title, genre: `Daily · ${genre}`, level: 5,
            wordCount: text.split(/\s+/).length, text, quizJson,
          });
        }
        if (!cancelled) setDailyPassage(daily);
      } catch(e) { console.error("Daily drop failed:", e); }
      if (!cancelled) setLoadingDaily(false);
    })();
    return () => { cancelled = true; };
  }, [isGuest]);

  const handleSurpriseMe = () => {
    setRouletteLoading(true);
    setTimeout(() => {
      const passage = pickRoulettePassage(sessions);
      setRouletteLoading(false);
      onStart(passage);
    }, 500); // brief pause so the "shuffling" feel registers
  };

  const handleMoodPick = (moodId) => {
    setMoodOpen(false);
    const passage = pickPassageByMood(moodId, user?.level);
    onStart(passage);
  };

  // ★ Quick Start items — some navigate, some run an action directly
  const quickStart = [
    { label:"Browse Library",   icon:"📚", desc:"12 curated passages by level",  view:"library"    },
    { label:"Generate with AI", icon:"✨", desc:"Free AI content at your level",  view:"generate"   },
    { label:"Upload a Text",    icon:"📤", desc:"Practice with your own content", view:"upload"     },
    { label:`Flashcards${dueCards>0?` (${dueCards} due)`:""}`, icon:"🃏", desc:"Spaced repetition review", view:"flashcards" },
    { label:"Surprise Me",      icon:"🎲", desc:"Random passage, new genre",     action:handleSurpriseMe },
    { label:"Read by Mood",     icon:"🎭", desc:"Match a passage to how you feel", action:()=>setMoodOpen(true) },
  ];

  return (
    <div style={{padding:"clamp(16px,4vw,40px) clamp(16px,4vw,48px)",maxWidth:1200}}>
      <ThemeToggleBtn darkMode={darkMode} toggleTheme={toggleTheme}/>
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

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:16,marginBottom:40}}>
        {[
          {label:"Reading Level",  value:level.title,                      sub:`Level ${user?.level} of 10`,  color:T.amber,   icon:"⚡"},
          {label:"Current Streak", value:`${user?.streak||0}`,             sub:"consecutive days",            color:"#ff7043", icon:"🔥"},
          {label:"Streak Shields", value:user?.streakShields||0,           sub:"earned every 7 days",         color:T.teal,    icon:"🛡️"},
          {label:"Sessions",       value:user?.totalSessions||"0",         sub:"total completed",             color:"#a78bfa", icon:"✓"},
        ].map((s,i)=>(
          <div key={s.label} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"22px",animation:`fadeUp 0.4s ${0.05*i}s ease both`}}>
            <div style={{fontSize:24,marginBottom:8}}>{s.icon}</div>
            <div style={{fontFamily:T.serif,fontSize:32,fontWeight:900,color:s.color,letterSpacing:-1}}>{s.value}</div>
            <div style={{fontSize:12,color:T.text3,marginTop:4}}>{s.sub}</div>
            <div style={{fontSize:13,color:T.text2,marginTop:2,fontWeight:500}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ★ Weekly Theme banner */}
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",marginBottom:20,
        background:`linear-gradient(90deg,${T.amberGlow},transparent)`,border:`1px solid ${T.amber}33`,
        borderRadius:12,animation:"fadeUp 0.4s 0.15s ease both",flexWrap:"wrap"}}>
        <span style={{fontSize:18}}>🗓️</span>
        <span style={{fontSize:13,color:T.text2}}>
          This week's theme: <strong style={{color:T.amber}}>{weeklyTheme}</strong>
        </span>
        <span style={{fontSize:11,color:T.text3,marginLeft:"auto"}}>
          {getWeeklyThemeOptIn() ? "✓ Applied to your AI generations" : "Enable in Settings to shape your AI passages"}
        </span>
      </div>

      {/* ★ Daily Drop hero card */}
      <div style={{background:`linear-gradient(135deg,${T.card},${T.surface})`,border:`1px solid ${T.teal}44`,
        borderRadius:16,padding:"24px 28px",marginBottom:24,animation:"fadeUp 0.4s 0.18s ease both",
        position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",
          background:`${T.teal}11`,pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap",position:"relative"}}>
          <div style={{flex:1,minWidth:220}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:20}}>📰</span>
              <span style={{fontSize:11,color:T.teal,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Today's Drop</span>
            </div>
            {loadingDaily ? (
              <div style={{display:"flex",alignItems:"center",gap:10,color:T.text3,fontSize:14}}>
                <span style={{animation:"spin 1.2s linear infinite",display:"inline-block"}}>✦</span>
                Preparing today's passage…
              </div>
            ) : dailyPassage ? (
              <>
                <div style={{fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.text,marginBottom:4}}>{dailyPassage.title}</div>
                <div style={{fontSize:13,color:T.text3}}>{dailyPassage.wordCount} words · fresh every day, same for every reader</div>
              </>
            ) : (
              <div style={{fontSize:14,color:T.text3}}>Sign in to unlock today's Daily Drop passage.</div>
            )}
          </div>
          {dailyPassage && !loadingDaily && (
            <Btn variant="teal" onClick={()=>onStart(dailyPassage)}>
              Read Today's Passage <SVG d={ICONS.arrow} size={14} stroke={T.bg}/>
            </Btn>
          )}
        </div>
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

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:24,animation:"fadeUp 0.4s 0.25s ease both"}}>
        <div>
          {user?.difficultyLock && (
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",
              background:`${T.amber}11`,border:`1px solid ${T.amber}33`,borderRadius:10,marginBottom:16,
              fontSize:13,color:T.amber}}>
              <SVG d={ICONS.lock} size={14} stroke={T.amber}/>
              <span>Difficulty Lock is ON — passages and AI are pinned to Level {user?.level}.</span>
              <button onClick={()=>setView("settings")} style={{marginLeft:"auto",background:"none",border:"none",
                cursor:"pointer",color:T.amber,fontSize:12,textDecoration:"underline"}}>Change in Settings</button>
            </div>
          )}
          <div style={{fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.text,marginBottom:16}}>Recommended For You</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {PASSAGES.filter(p=>Math.abs(p.level-(user?.level||3))<=2).slice(0,3).map(p=><PassageRow key={p.id} passage={p} onStart={onStart}/>)}
          </div>
        </div>
        <div>
          <div style={{fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.text,marginBottom:16}}>Quick Start</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {quickStart.map(a=>(
              <button key={a.label} onClick={()=>a.action ? a.action() : setView(a.view)}
                disabled={a.label==="Surprise Me" && rouletteLoading}
                style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,cursor:"pointer",textAlign:"left",transition:"all 0.15s",width:"100%"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.amber+"55";e.currentTarget.style.background=T.amberGlow;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;}}>
                <span style={{fontSize:22}}>{a.label==="Surprise Me"&&rouletteLoading?"🔄":a.icon}</span>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:T.text}}>{a.label==="Surprise Me"&&rouletteLoading?"Shuffling…":a.label}</div>
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

      {/* ★ Mood Selector modal */}
      {moodOpen && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,
          display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
          onClick={()=>setMoodOpen(false)}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:18,
            padding:"32px",maxWidth:460,width:"100%",animation:"fadeUp 0.25s ease both"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:T.serif,fontSize:22,fontWeight:700,color:T.text,marginBottom:6}}>How are you feeling?</div>
            <div style={{fontSize:13,color:T.text3,marginBottom:24}}>We'll match a passage to your mood.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {MOODS.map(m=>(
                <button key={m.id} onClick={()=>handleMoodPick(m.id)}
                  style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
                    padding:"18px 14px",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.amber+"77";e.currentTarget.style.background=T.amberGlow;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;}}>
                  <div style={{fontSize:26,marginBottom:8}}>{m.icon}</div>
                  <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:3}}>{m.label}</div>
                  <div style={{fontSize:11,color:T.text3,lineHeight:1.4}}>{m.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={()=>setMoodOpen(false)}
              style={{marginTop:20,width:"100%",background:"none",border:"none",cursor:"pointer",
                color:T.text3,fontSize:13,padding:8}}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PassageRow({ passage, onStart }) {
  const T = useTheme();
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
