import { useState } from "react";
import { useTheme } from "../theme";
import { Btn } from "./common";
import { GoogleIcon } from "../icons";

export default function AuthPage({ onLogin, onSignup, onGuest, onGoogle }) {
  const T = useTheme();
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
            {loading?<><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>✦</span> {mode==="login"?"Signing in…":"Creating account…"}</>:mode==="login"?"Sign In →":"Create Account →"}
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
