import { useState } from "react";
import { useTheme } from "../theme";
import { SVG, ICONS } from "../icons";
import { Btn, Tag, ThemeToggleBtn } from "./common";

export default function UploadView({ onStart, notify, uploads, isGuest, userId, onSave, onDelete, darkMode, toggleTheme }) {
  const T = useTheme();
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
    <div style={{padding:"clamp(16px,4vw,40px) clamp(16px,4vw,48px)",maxWidth:960}}>
      <div style={{marginBottom:32,animation:"fadeUp 0.4s ease both"}}>
        <ThemeToggleBtn darkMode={darkMode} toggleTheme={toggleTheme}/>
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
