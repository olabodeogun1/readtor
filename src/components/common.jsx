import { useTheme, T } from "../theme";
import { SVG, ICONS } from "../icons";

// ── Button — uses module-level T directly (kept in sync by App) ──────────
export const Btn = ({ children, onClick, variant="primary", disabled, style={}, size="md" }) => {
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

// ── Small pill tag ────────────────────────────────────────────────────────
export const Tag = ({ label, color }) => (
  <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:color==="amber"?`${T.amber}22`:color==="teal"?`${T.teal}22`:`${T.border2}`, color:color==="amber"?T.amber:color==="teal"?T.teal:T.text3, fontWeight:600, letterSpacing:.3, flexShrink:0 }}>
    {label}
  </span>
);

// ── Theme toggle — fixed top-right on every content page ─────────────────
export function ThemeToggleBtn({ darkMode, toggleTheme }) {
  const T = useTheme();
  return (
    <button onClick={toggleTheme}
      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{position:"fixed",top:12,right:16,zIndex:200,
        width:36,height:36,borderRadius:"50%",
        display:"flex",alignItems:"center",justifyContent:"center",
        border:`1px solid ${T.border2}`,background:T.card,color:T.text2,
        cursor:"pointer",boxShadow:"0 2px 12px rgba(0,0,0,0.25)",transition:"all 0.2s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.amber;e.currentTarget.style.color=T.amber;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border2;e.currentTarget.style.color=T.text2;}}>
      <SVG d={darkMode ? ICONS.sun : ICONS.moon} size={16} stroke="currentColor"/>
    </button>
  );
}

// ── Splash screen shown while checking session on load / after login ─────
export function SplashScreen() {
  const T = useTheme();
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
      <div style={{fontFamily:T.serif,fontSize:22,color:T.text2,textAlign:"center",padding:"0 20px",lineHeight:1.4,animation:"fadeUp 0.5s ease both"}}>
        Welcome to <span style={{fontSize:44,fontWeight:900,color:T.amber,letterSpacing:-1.5}}>Readtor</span>, your reading tutor.
      </div>
      <div style={{display:"flex",gap:6,marginTop:8,animation:"fadeUp 0.5s 0.2s ease both"}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:8,height:8,borderRadius:"50%",background:T.amber,animation:`pulse 1.2s ${i*0.2}s ease-in-out infinite`}}/>
        ))}
      </div>
    </div>
  );
}

// ── Reader Title badge — small reusable pill showing rank/title with icon ───
export function TitleBadge({ title, size = "md" }) {
  const T = useTheme();
  const fs   = size === "sm" ? 11 : 13;
  const pad  = size === "sm" ? "4px 10px" : "6px 14px";
  const icon = size === "sm" ? 13 : 15;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:pad,borderRadius:20,
      background:`${T.amber}18`,border:`1px solid ${T.amber}44`,color:T.amber,
      fontSize:fs,fontWeight:700,whiteSpace:"nowrap"}}>
      <span style={{fontSize:icon}}>{title.icon}</span>
      {title.name}
    </span>
  );
}

// ── Milestone Celebration — full-screen, one-time, not a badge ─────────────
export function MilestoneCelebration({ milestone, onDismiss }) {
  const T = useTheme();
  if (!milestone) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(5,6,12,0.88)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,
      animation:"fadeIn 0.3s ease both"}}>
      <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",
        background:`radial-gradient(circle, ${milestone.color}22 0%, transparent 70%)`,
        animation:"pulse 2.5s ease-in-out infinite"}}/>

      <div style={{position:"relative",background:T.surface,border:`1px solid ${milestone.color}55`,
        borderRadius:24,padding:"48px 40px",maxWidth:420,width:"100%",textAlign:"center",
        animation:"fadeUp 0.4s 0.1s ease both",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>

        <div style={{fontSize:64,marginBottom:20,animation:"fadeUp 0.5s 0.2s ease both"}}>
          {milestone.icon}
        </div>
        <div style={{fontSize:11,color:milestone.color,fontWeight:700,letterSpacing:2,
          textTransform:"uppercase",marginBottom:10}}>
          Milestone Unlocked
        </div>
        <div style={{fontFamily:T.serif,fontSize:26,fontWeight:900,color:T.text,marginBottom:14}}>
          {milestone.title}
        </div>
        <div style={{fontSize:14,color:T.text2,lineHeight:1.7,marginBottom:28}}>
          {milestone.desc}
        </div>

        <button onClick={onDismiss}
          style={{width:"100%",padding:"13px 20px",borderRadius:10,border:"none",cursor:"pointer",
            background:`linear-gradient(135deg,${milestone.color},${milestone.color}cc)`,
            color:"#07080f",fontSize:15,fontWeight:700,transition:"opacity 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          Continue Reading →
        </button>
      </div>
    </div>
  );
}
