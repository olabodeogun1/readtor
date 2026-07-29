import { useState } from "react";
import { useTheme } from "../theme";
import { PASSAGES } from "../constants";
import { SVG, ICONS } from "../icons";
import { Btn, ThemeToggleBtn } from "./common";

export default function VaultView({ sessions, onStart, darkMode, toggleTheme }) {
  const T = useTheme();
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [sortBy,   setSortBy]   = useState("date");   // date | wpm | comp
  const PER_PAGE = 20;

  const filtered = sessions
    .filter(s => !search || (s.passage?.title||"").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "wpm")  return (b.wpm||0)  - (a.wpm||0);
      if (sortBy === "comp") return (b.comp||0) - (a.comp||0);
      return b.ts - a.ts;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const compColor = c => c >= 70 ? T.teal : c >= 50 ? T.amber : T.red;

  return (
    <div style={{padding:"clamp(16px,4vw,40px) clamp(16px,4vw,48px)",maxWidth:1100}}>
      <ThemeToggleBtn darkMode={darkMode} toggleTheme={toggleTheme}/>

      <div style={{marginBottom:28,animation:"fadeUp 0.4s ease both"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
          <SVG d={ICONS.vault} size={28} stroke={T.amber}/>
          <h1 style={{fontFamily:T.serif,fontSize:36,fontWeight:900,color:T.text}}>My Reading Vault</h1>
        </div>
        <p style={{color:T.text3,fontSize:15}}>Every passage you've ever read — your complete intellectual history.</p>
      </div>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:28}}>
        {[
          { label:"Total Sessions",    value: sessions.length,                                                             color: T.amber  },
          { label:"Avg WPM",           value: sessions.length ? Math.round(sessions.reduce((a,b)=>a+(b.wpm||0),0)/sessions.length) : 0, color: T.teal   },
          { label:"Avg Comprehension", value: sessions.filter(s=>s.comp>0).length ? Math.round(sessions.filter(s=>s.comp>0).reduce((a,b)=>a+(b.comp||0),0)/sessions.filter(s=>s.comp>0).length)+"%" : "—", color: "#a78bfa" },
          { label:"Best WPM",          value: sessions.length ? Math.max(...sessions.map(s=>s.wpm||0)) : 0,               color: "#f97316" },
        ].map(s => (
          <div key={s.label} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px"}}>
            <div style={{fontFamily:T.mono,fontSize:26,fontWeight:700,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:T.text3,marginTop:4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <SVG d={ICONS.search} size={14} stroke={T.text3} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
            placeholder="Search by passage title…"
            style={{width:"100%",padding:"10px 14px 10px 36px",borderRadius:8,border:`1px solid ${T.border2}`,
              background:T.card,color:T.text,fontSize:14,outline:"none",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor=T.amber}
            onBlur={e=>e.target.style.borderColor=T.border2}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["date","Latest"],["wpm","Top WPM"],["comp","Top Score"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setSortBy(k);setPage(1);}}
              style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${sortBy===k?T.amber:T.border}`,
                background:sortBy===k?T.amberGlow:"transparent",color:sortBy===k?T.amber:T.text3,
                cursor:"pointer",fontSize:13,fontWeight:sortBy===k?600:400,transition:"all 0.15s"}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div style={{textAlign:"center",padding:"80px 40px",background:T.card,border:`1px solid ${T.border}`,borderRadius:16}}>
          <div style={{fontSize:48,marginBottom:12}}>📭</div>
          <div style={{fontFamily:T.serif,fontSize:22,fontWeight:700,color:T.text,marginBottom:8}}>Your vault is empty</div>
          <div style={{fontSize:14,color:T.text3}}>Complete your first reading session to start building your history.</div>
        </div>
      ) : (
        <>
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",animation:"fadeUp 0.4s ease both"}}>
            {/* Table header */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 80px 90px 80px 110px",gap:0,
              borderBottom:`1px solid ${T.border}`,background:T.surface}}>
              {["Passage","WPM","Score","Words","Date"].map(h=>(
                <div key={h} style={{padding:"11px 16px",fontSize:11,color:T.text3,fontWeight:600,
                  letterSpacing:.5,textTransform:"uppercase"}}>{h}</div>
              ))}
            </div>
            {/* Rows */}
            {pageItems.map((s,i) => (
              <div key={s.id||i}
                style={{display:"grid",gridTemplateColumns:"1fr 80px 90px 80px 110px",
                  borderBottom:i<pageItems.length-1?`1px solid ${T.border}`:"none",
                  transition:"background 0.12s",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.amberGlow}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                onClick={()=>{
                  const p = PASSAGES.find(p=>p.title===s.passage?.title);
                  if(p) onStart(p);
                }}>
                <div style={{padding:"13px 16px",fontSize:14,color:T.text,display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                  <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.passage?.title||"—"}</div>
                  {s.passage?.title && PASSAGES.find(p=>p.title===s.passage.title) &&
                    <span style={{fontSize:10,color:T.teal,flexShrink:0}}>↩ re-read</span>}
                </div>
                <div style={{padding:"13px 16px",fontSize:14,color:T.amber,fontWeight:700,fontFamily:T.mono}}>{s.wpm||"—"}</div>
                <div style={{padding:"13px 16px",fontSize:14,fontFamily:T.mono}}>
                  {s.comp>0 ? <span style={{color:compColor(s.comp),fontWeight:600}}>{s.comp}%</span> : <span style={{color:T.text3}}>—</span>}
                </div>
                <div style={{padding:"13px 16px",fontSize:13,color:T.text2,fontFamily:T.mono}}>{s.wordsRead||"—"}</div>
                <div style={{padding:"13px 16px",fontSize:12,color:T.text3}}>{new Date(s.ts).toLocaleDateString()}</div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,marginTop:24}}>
              <Btn variant="secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</Btn>
              <span style={{fontSize:13,color:T.text3}}>Page {page} of {totalPages} · {filtered.length} sessions</span>
              <Btn variant="secondary" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next →</Btn>
            </div>
          )}
        </>
      )}
    </div>
  );
}
