import { useTheme } from "../theme";
import { LEVELS, QUOTES } from "../constants";
import { SVG, ICONS } from "../icons";
import { Btn, ThemeToggleBtn } from "./common";

const STEPS = [
  { icon:"📖", title:"Read",     desc:"Pick a passage and read at your own pace, with speed-reading tools to guide you." },
  { icon:"🧠", title:"Test",     desc:"Take a short quiz so you know how much you really absorbed, not just how fast you went." },
  { icon:"🃏", title:"Remember", desc:"Missed questions become flashcards, resurfaced with spaced repetition." },
];

export default function WelcomeView({ user, isGuest, onContinue, onNavigate, darkMode, toggleTheme }) {
  const T = useTheme();
  const firstName = user?.name?.split(" ")[0] || "Reader";
  const isNew     = !isGuest && !(user?.totalSessions > 0);
  const level     = LEVELS[(user?.level || 1) - 1];
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const quote     = QUOTES[new Date().getDate() % QUOTES.length];

  const headline = isGuest ? `Welcome, ${firstName}.`
                 : isNew   ? `Welcome to Readtor, ${firstName}.`
                 :           `Welcome back, ${firstName}.`;
  const subline  = isGuest ? "You're exploring as a guest. Sign up any time to keep your progress."
                 : isNew   ? "Let's get your first reading session going."
                 :           "Pick up where you left off and keep your streak alive.";

  const stats = [
    { icon:"⚡", label:"Level",    value:level.title },
    { icon:"🔥", label:"Streak",   value:`${user?.streak || 0} day${user?.streak === 1 ? "" : "s"}` },
    { icon:"✓",  label:"Sessions", value:user?.totalSessions || 0 },
  ];

  const actions = [
    { icon:"📚", label:"Browse the Library", desc:"Curated passages by level",    view:"library"  },
    { icon:"✨", label:"Generate with AI",   desc:"Fresh content at your level",  view:"generate" },
    { icon:"📤", label:"Upload a Text",      desc:"Practice with your own words", view:"upload"   },
  ];

  return (
    <div style={{minHeight:"100vh",background:T.bg,position:"relative",overflow:"hidden",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:"clamp(32px,6vw,64px) clamp(16px,4vw,48px)"}}>
      <ThemeToggleBtn darkMode={darkMode} toggleTheme={toggleTheme}/>

      <div style={{position:"absolute",top:"-15%",left:"50%",transform:"translateX(-50%)",width:700,height:700,
        borderRadius:"50%",background:`radial-gradient(circle,${T.amber}10 0%,transparent 70%)`,pointerEvents:"none"}}/>

      <div style={{position:"relative",width:"100%",maxWidth:880}}>
        {/* Brand + greeting */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontFamily:T.serif,fontSize:28,fontWeight:900,color:T.amber,letterSpacing:-1,marginBottom:28,animation:"fadeUp 0.5s ease both"}}>
            Read<span style={{color:T.text}}>tor</span>
          </div>
          <div style={{fontSize:13,color:T.text3,letterSpacing:1,textTransform:"uppercase",marginBottom:10,animation:"fadeUp 0.5s 0.05s ease both"}}>{greeting}</div>
          <h1 style={{fontFamily:T.serif,fontSize:"clamp(30px,5vw,48px)",fontWeight:900,color:T.text,letterSpacing:-1.5,lineHeight:1.1,margin:"0 0 12px",animation:"fadeUp 0.5s 0.1s ease both"}}>{headline}</h1>
          <p style={{fontSize:16,color:T.text2,lineHeight:1.6,maxWidth:520,margin:"0 auto",animation:"fadeUp 0.5s 0.15s ease both"}}>{subline}</p>
        </div>

        {/* Returning-user stats, or how-it-works for new users and guests */}
        {isNew || isGuest ? (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginBottom:36}}>
            {STEPS.map((s,i)=>(
              <div key={s.title} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"22px",animation:`fadeUp 0.5s ${0.2+0.06*i}s ease both`}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <span style={{fontSize:24}}>{s.icon}</span>
                  <span style={{fontSize:11,color:T.amber,fontWeight:700,letterSpacing:1}}>STEP {i+1}</span>
                </div>
                <div style={{fontFamily:T.serif,fontSize:18,fontWeight:700,color:T.text,marginBottom:6}}>{s.title}</div>
                <div style={{fontSize:13,color:T.text3,lineHeight:1.6}}>{s.desc}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:36}}>
            {stats.map((s,i)=>(
              <div key={s.label} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"20px 22px",textAlign:"center",animation:`fadeUp 0.5s ${0.2+0.06*i}s ease both`}}>
                <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                <div style={{fontFamily:T.serif,fontSize:26,fontWeight:900,color:T.amber,letterSpacing:-0.5}}>{s.value}</div>
                <div style={{fontSize:12,color:T.text3,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Primary CTA */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,marginBottom:40,animation:"fadeUp 0.5s 0.4s ease both"}}>
          <Btn size="lg" onClick={onContinue}>
            {isNew ? "Get Started" : "Go to Dashboard"} <SVG d={ICONS.arrow} size={16} stroke="#07080f"/>
          </Btn>
          <span style={{fontSize:12,color:T.text3}}>or jump straight in</span>
        </div>

        {/* Quick jumps */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginBottom:44,animation:"fadeUp 0.5s 0.45s ease both"}}>
          {actions.map(a=>(
            <button key={a.view} onClick={()=>onNavigate(a.view)}
              style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}
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

        {/* Quote */}
        <div style={{maxWidth:480,margin:"0 auto",padding:"16px 22px",borderLeft:`3px solid ${T.amber}55`,animation:"fadeUp 0.5s 0.5s ease both"}}>
          <div style={{fontFamily:T.serif,fontSize:15,fontStyle:"italic",color:T.text2,lineHeight:1.7,marginBottom:6}}>"{quote.q}"</div>
          <div style={{fontSize:11,color:T.text3,letterSpacing:.5}}>— {quote.a}</div>
        </div>
      </div>
    </div>
  );
}
