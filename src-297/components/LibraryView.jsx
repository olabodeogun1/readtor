import { useState } from "react";
import { useTheme } from "../theme";
import { PASSAGES } from "../constants";
import { SVG, ICONS } from "../icons";
import { Btn, Tag, ThemeToggleBtn } from "./common";

export default function LibraryView({ onStart, aiPassages, myAIPassages, userId, onPublish, onDeleteAI, onRegenerateQuiz, notify, darkMode, toggleTheme }) {
  const T = useTheme();
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
    <div style={{padding:"clamp(16px,4vw,40px) clamp(16px,4vw,48px)"}}>
      <ThemeToggleBtn darkMode={darkMode} toggleTheme={toggleTheme}/>
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
