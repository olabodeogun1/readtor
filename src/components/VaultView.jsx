import { useState } from "react";
import { useTheme } from "../theme";
import { PASSAGES } from "../constants";
import { SVG, ICONS } from "../icons";
import { Btn, ThemeToggleBtn } from "./common";

// ── Small reusable line chart — no external dependency ───────────────────────
function MetricChart({ points, color }) {
  const T = useTheme();
  if (points.length < 2) {
    return (
      <div style={{padding:"30px 0",textAlign:"center",color:T.text3,fontSize:13}}>
        Read a few more sessions to see your trend line.
      </div>
    );
  }
  const w = 600, h = 160, pad = 24;
  const max = Math.max(...points, 10);
  const min = Math.min(...points, 0);
  const range = (max - min) || 1;
  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const lineD = coords.map((p, i) => (i === 0 ? "M" : "L") + p[0] + "," + p[1]).join(" ");
  const areaD = lineD +
    ` L${coords[coords.length-1][0]},${h-pad} L${coords[0][0]},${h-pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:"100%",height:"auto",display:"block"}}>
      <path d={areaD} fill={`${color}18`} />
      <path d={lineD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {coords.map(([x,y],i) => <circle key={i} cx={x} cy={y} r="3.5" fill={color}/>)}
    </svg>
  );
}

export default function VaultView({ sessions, onStart, darkMode, toggleTheme }) {
  const T = useTheme();
  const [tab,      setTab]      = useState("history"); // history | report
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [sortBy,   setSortBy]   = useState("date");
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
  const compColor  = c => c >= 70 ? T.teal : c >= 50 ? T.amber : T.red;

  // ── Report Card derived data ────────────────────────────────────────────
  const chronological = [...sessions].sort((a,b) => a.ts - b.ts).slice(-20);
  const wpmPoints  = chronological.map(s => s.wpm || 0);
  const compPoints = chronological.filter(s => s.comp > 0).map(s => s.comp);

  const genreCounts = {};
  const genreComp   = {};
  sessions.forEach(s => {
    const p = PASSAGES.find(p => p.title === s.passage?.title);
    if (!p) return;
    genreCounts[p.genre] = (genreCounts[p.genre]||0) + 1;
    if (s.comp > 0) {
      genreComp[p.genre] = genreComp[p.genre] || [];
      genreComp[p.genre].push(s.comp);
    }
  });
  const topGenres = Object.entries(genreCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const genreAvgComp = Object.entries(genreComp).map(([genre, arr]) => ({
    genre, avg: Math.round(arr.reduce((a,b)=>a+b,0)/arr.length),
  })).sort((a,b) => b.avg - a.avg);
  const strongest = genreAvgComp[0];
  const weakest    = genreAvgComp[genreAvgComp.length - 1];

  const avgWpm  = sessions.length ? Math.round(sessions.reduce((a,b)=>a+(b.wpm||0),0)/sessions.length) : 0;
  const bestWpm = sessions.length ? Math.max(...sessions.map(s=>s.wpm||0)) : 0;
  const avgComp = sessions.filter(s=>s.comp>0).length
    ? Math.round(sessions.filter(s=>s.comp>0).reduce((a,b)=>a+(b.comp||0),0)/sessions.filter(s=>s.comp>0).length)
    : 0;

  const monthLabel = new Date().toLocaleDateString("en-US", { month:"long", year:"numeric" });

  return (
    <div style={{padding:"clamp(16px,4vw,40px) clamp(16px,4vw,48px)",maxWidth:1100}}>
      <ThemeToggleBtn darkMode={darkMode} toggleTheme={toggleTheme}/>

      <div style={{marginBottom:24,animation:"fadeUp 0.4s ease both"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
          <SVG d={ICONS.vault} size={28} stroke={T.amber}/>
          <h1 style={{fontFamily:T.serif,fontSize:36,fontWeight:900,color:T.text}}>My Reading Vault</h1>
        </div>
        <p style={{color:T.text3,fontSize:15}}>Your complete intellectual history, and how far you've come.</p>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:24,animation:"fadeUp 0.4s 0.04s ease both"}}>
        {[["history","📜 History"],["report","📊 Report Card"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:"9px 18px",borderRadius:8,border:`1px solid ${tab===id?T.amber:T.border}`,
              background:tab===id?T.amberGlow:"transparent",color:tab===id?T.amber:T.text2,
              cursor:"pointer",fontSize:13,fontWeight:tab===id?600:400,transition:"all 0.15s"}}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════ HISTORY TAB ══════════════ */}
      {tab === "history" && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:28}}>
            {[
              { label:"Total Sessions",    value: sessions.length, color: T.amber },
              { label:"Avg WPM",           value: avgWpm,           color: T.teal  },
              { label:"Avg Comprehension", value: avgComp ? avgComp+"%" : "—", color: "#a78bfa" },
              { label:"Best WPM",          value: bestWpm,          color: "#f97316" },
            ].map(s => (
              <div key={s.label} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px"}}>
                <div style={{fontFamily:T.mono,fontSize:26,fontWeight:700,color:s.color}}>{s.value}</div>
                <div style={{fontSize:11,color:T.text3,marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>

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
                <div style={{display:"grid",gridTemplateColumns:"1fr 80px 90px 80px 110px",gap:0,
                  borderBottom:`1px solid ${T.border}`,background:T.surface}}>
                  {["Passage","WPM","Score","Words","Date"].map(h=>(
                    <div key={h} style={{padding:"11px 16px",fontSize:11,color:T.text3,fontWeight:600,
                      letterSpacing:.5,textTransform:"uppercase"}}>{h}</div>
                  ))}
                </div>
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

              {totalPages > 1 && (
                <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,marginTop:24}}>
                  <Btn variant="secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</Btn>
                  <span style={{fontSize:13,color:T.text3}}>Page {page} of {totalPages} · {filtered.length} sessions</span>
                  <Btn variant="secondary" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next →</Btn>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════════ REPORT CARD TAB ══════════════ */}
      {tab === "report" && (
        <div id="report-card-printable">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #report-card-printable, #report-card-printable * { visibility: visible; }
              #report-card-printable { position: absolute; left: 0; top: 0; width: 100%; }
              .no-print { display: none !important; }
            }
          `}</style>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
            <div>
              <div style={{fontFamily:T.serif,fontSize:22,fontWeight:700,color:T.text}}>Reading Report Card</div>
              <div style={{fontSize:13,color:T.text3}}>{monthLabel}</div>
            </div>
            <div className="no-print">
              <Btn variant="secondary" onClick={()=>window.print()}>🖨️ Print / Save as PDF</Btn>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div style={{textAlign:"center",padding:"80px 40px",background:T.card,border:`1px solid ${T.border}`,borderRadius:16}}>
              <div style={{fontSize:48,marginBottom:12}}>📊</div>
              <div style={{fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.text,marginBottom:8}}>No data yet</div>
              <div style={{fontSize:14,color:T.text3}}>Complete a few sessions and your report card will build itself.</div>
            </div>
          ) : (
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:24}}>
                {[
                  { label:"Sessions",   value: sessions.length, color: T.amber },
                  { label:"Avg WPM",    value: avgWpm,           color: T.teal  },
                  { label:"Best WPM",   value: bestWpm,          color: "#f97316" },
                  { label:"Avg Score",  value: avgComp ? avgComp+"%" : "—", color: "#a78bfa" },
                ].map(s => (
                  <div key={s.label} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px"}}>
                    <div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:s.color}}>{s.value}</div>
                    <div style={{fontSize:11,color:T.text3,marginTop:4}}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"22px",marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>WPM Growth (last {chronological.length} sessions)</div>
                <MetricChart points={wpmPoints} color={T.teal}/>
              </div>

              <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"22px",marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Comprehension Trend</div>
                <MetricChart points={compPoints} color={T.amber}/>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
                <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"22px"}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Top Genres</div>
                  {topGenres.length === 0
                    ? <div style={{fontSize:13,color:T.text3}}>Read curated passages to see genre stats.</div>
                    : topGenres.map(([genre,count]) => (
                      <div key={genre} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                          <span style={{color:T.text2}}>{genre}</span>
                          <span style={{color:T.text3,fontFamily:T.mono}}>{count}</span>
                        </div>
                        <div style={{height:6,background:T.surface,borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${(count/topGenres[0][1])*100}%`,
                            background:`linear-gradient(90deg,${T.amber},${T.amber2})`,borderRadius:3}}/>
                        </div>
                      </div>
                    ))
                  }
                </div>

                <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"22px"}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Strongest & Weakest Categories</div>
                  {!strongest ? (
                    <div style={{fontSize:13,color:T.text3}}>Complete a few quizzes to see this breakdown.</div>
                  ) : (
                    <>
                      <div style={{marginBottom:16,padding:"12px 14px",background:`${T.teal}11`,borderRadius:10,border:`1px solid ${T.teal}33`}}>
                        <div style={{fontSize:11,color:T.teal,fontWeight:700,marginBottom:3}}>💪 STRONGEST</div>
                        <div style={{fontSize:14,color:T.text}}>{strongest.genre}</div>
                        <div style={{fontSize:12,color:T.text3}}>{strongest.avg}% avg comprehension</div>
                      </div>
                      {weakest && weakest.genre !== strongest.genre && (
                        <div style={{padding:"12px 14px",background:`${T.red}11`,borderRadius:10,border:`1px solid ${T.red}33`}}>
                          <div style={{fontSize:11,color:T.red,fontWeight:700,marginBottom:3}}>🎯 ROOM TO GROW</div>
                          <div style={{fontSize:14,color:T.text}}>{weakest.genre}</div>
                          <div style={{fontSize:12,color:T.text3}}>{weakest.avg}% avg comprehension</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
