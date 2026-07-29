import { useState, useEffect } from "react";
import { useTheme } from "../theme";
import { SVG, ICONS } from "../icons";
import { Btn, ThemeToggleBtn } from "./common";
import { fetchWeeklyLeaderboard } from "../lib/supabaseHelpers";

export default function LeaderboardView({ user, darkMode, toggleTheme, setView }) {
  const T = useTheme();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [sortBy,  setSortBy]  = useState("words"); // words | comprehension

  useEffect(() => {
    (async () => {
      setLoading(true); setError("");
      try {
        const data = await fetchWeeklyLeaderboard();
        setRows(data);
      } catch(e) {
        console.error(e);
        setError("Couldn't load the leaderboard right now.");
      }
      setLoading(false);
    })();
  }, []);

  const sorted = [...rows].sort((a, b) =>
    sortBy === "words"
      ? b.totalWords - a.totalWords
      : b.avgComprehension - a.avgComprehension
  );

  const medalFor = rank => rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : null;
  const myRow = sorted.find(r => r.isMe);

  return (
    <div style={{padding:"clamp(16px,4vw,40px) clamp(16px,4vw,48px)",maxWidth:900}}>
      <ThemeToggleBtn darkMode={darkMode} toggleTheme={toggleTheme}/>

      <div style={{marginBottom:24,animation:"fadeUp 0.4s ease both"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
          <SVG d={ICONS.trophy} size={28} stroke={T.amber}/>
          <h1 style={{fontFamily:T.serif,fontSize:36,fontWeight:900,color:T.text}}>Weekly Leaderboard</h1>
        </div>
        <p style={{color:T.text3,fontSize:15}}>
          Top readers this week. Names are hidden unless a reader opts in —
          you're always ranked, whoever you are.
        </p>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20,animation:"fadeUp 0.4s 0.05s ease both"}}>
        {[["words","By Words Read"],["comprehension","By Comprehension"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSortBy(k)}
            style={{padding:"9px 16px",borderRadius:8,border:`1px solid ${sortBy===k?T.amber:T.border}`,
              background:sortBy===k?T.amberGlow:"transparent",color:sortBy===k?T.amber:T.text3,
              cursor:"pointer",fontSize:13,fontWeight:sortBy===k?600:400,transition:"all 0.15s"}}>
            {l}
          </button>
        ))}
      </div>

      {myRow && (
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",marginBottom:20,
          background:`${T.teal}11`,border:`1px solid ${T.teal}33`,borderRadius:12,
          animation:"fadeUp 0.4s 0.08s ease both"}}>
          <div style={{fontFamily:T.mono,fontSize:22,fontWeight:900,color:T.teal,minWidth:36,textAlign:"center"}}>
            #{sorted.indexOf(myRow)+1}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:T.text}}>Your position this week</div>
            <div style={{fontSize:12,color:T.text3}}>
              {myRow.totalWords.toLocaleString()} words · {myRow.avgComprehension}% avg comprehension
            </div>
          </div>
          {!user?.leaderboardVisible && (
            <button onClick={()=>setView && setView("settings")}
              style={{fontSize:12,color:T.teal,background:"none",border:"none",cursor:"pointer",
                textDecoration:"underline",whiteSpace:"nowrap"}}>
              Show my name →
            </button>
          )}
        </div>
      )}

      {error && (
        <div style={{padding:"14px 18px",background:`${T.red}11`,border:`1px solid ${T.red}33`,
          borderRadius:10,marginBottom:20,color:T.red,fontSize:14}}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"60px 0",flexDirection:"column",
          alignItems:"center",gap:12}}>
          <span style={{fontSize:28,animation:"spin 1.2s linear infinite",display:"inline-block"}}>✦</span>
          <span style={{fontSize:14,color:T.text3}}>Loading leaderboard…</span>
        </div>
      ) : sorted.length === 0 ? (
        <div style={{textAlign:"center",padding:"80px 40px",background:T.card,
          border:`1px solid ${T.border}`,borderRadius:16}}>
          <div style={{fontSize:48,marginBottom:12}}>🏆</div>
          <div style={{fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.text,marginBottom:8}}>
            No readers ranked yet this week
          </div>
          <div style={{fontSize:14,color:T.text3}}>Complete a reading session to appear on the board.</div>
        </div>
      ) : (
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",
          animation:"fadeUp 0.4s 0.1s ease both"}}>
          <div style={{display:"grid",gridTemplateColumns:"56px 1fr 110px 110px",
            borderBottom:`1px solid ${T.border}`,background:T.surface}}>
            {["Rank","Reader","Words","Score"].map(h=>(
              <div key={h} style={{padding:"11px 14px",fontSize:11,color:T.text3,fontWeight:600,
                letterSpacing:.5,textTransform:"uppercase"}}>{h}</div>
            ))}
          </div>
          {sorted.map((r, i) => (
            <div key={i}
              style={{display:"grid",gridTemplateColumns:"56px 1fr 110px 110px",
                borderBottom:i<sorted.length-1?`1px solid ${T.border}`:"none",
                background:r.isMe?T.amberGlow:"transparent"}}>
              <div style={{padding:"13px 14px",fontSize:15,fontWeight:700,color:T.text3,
                fontFamily:T.mono,display:"flex",alignItems:"center",gap:4}}>
                {medalFor(i) || `#${i+1}`}
              </div>
              <div style={{padding:"13px 14px",fontSize:14,color:r.isAnonymous?T.text3:T.text,
                fontStyle:r.isAnonymous?"italic":"normal",display:"flex",alignItems:"center",gap:8}}>
                {r.displayName}
                {r.isMe && <span style={{fontSize:10,color:T.amber,background:`${T.amber}22`,
                  padding:"2px 7px",borderRadius:20,fontWeight:700}}>You</span>}
              </div>
              <div style={{padding:"13px 14px",fontSize:14,color:T.amber,fontWeight:700,fontFamily:T.mono}}>
                {r.totalWords.toLocaleString()}
              </div>
              <div style={{padding:"13px 14px",fontSize:14,fontFamily:T.mono,
                color:r.avgComprehension>=70?T.teal:r.avgComprehension>=50?T.amber:T.red}}>
                {r.avgComprehension}%
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{marginTop:24,padding:"12px 16px",background:T.amberGlow,
        border:`1px solid ${T.amber}33`,borderRadius:10,fontSize:12,color:T.text3}}>
        🔒 Your identity is hidden by default. Opt in from Settings to display your name — everyone is
        ranked either way, based only on aggregated reading activity.
      </div>
    </div>
  );
}
