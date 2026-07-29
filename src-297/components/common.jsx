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
      <div style={{fontFamily:T.serif,fontSize:48,fontWeight:900,color:T.amber,letterSpacing:-2,animation:"fadeUp 0.5s ease both"}}>
        Read<span style={{color:T.text}}>tor</span>
      </div>
      <div style={{fontSize:14,color:T.text3,animation:"fadeUp 0.5s 0.1s ease both"}}>Welcome to Readtor</div>
      <div style={{display:"flex",gap:6,marginTop:8,animation:"fadeUp 0.5s 0.2s ease both"}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:8,height:8,borderRadius:"50%",background:T.amber,animation:`pulse 1.2s ${i*0.2}s ease-in-out infinite`}}/>
        ))}
      </div>
    </div>
  );
}
