import { useState } from "react";
import { useTheme } from "../theme";
import { Btn, ThemeToggleBtn } from "./common";

export default function FlashcardsView({ flashcards, setFlashcards, darkMode, toggleTheme }) {
  const T = useTheme();
    const [idx,     setIdx]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const due = flashcards.filter(f=>f.due<=Date.now());

  const review = easy => {
    const card=due[idx%due.length];
    setFlashcards(prev=>prev.map(f=>f.id===card.id?{...f,interval:easy?f.interval*2:1,due:Date.now()+(easy?f.interval*2:1)*86400000}:f));
    setFlipped(false); setIdx(i=>i+1);
  };

  return (
    <div style={{padding:"40px 48px"}}>
      <div style={{marginBottom:32}}>
        <ThemeToggleBtn darkMode={darkMode} toggleTheme={toggleTheme}/>
      <h1 style={{fontFamily:T.serif,fontSize:36,fontWeight:900,color:T.text,marginBottom:6}}>Flashcards</h1>
        <p style={{color:T.text3,fontSize:15}}>Spaced repetition for long-term retention. {due.length} card{due.length!==1?"s":""} due for review.</p>
      </div>
      {due.length===0?(
        <div style={{textAlign:"center",padding:"80px 40px",background:T.card,border:`1px solid ${T.border}`,borderRadius:20}}>
          <div style={{fontSize:56,marginBottom:16}}>🎉</div>
          <div style={{fontFamily:T.serif,fontSize:28,fontWeight:900,color:T.text,marginBottom:8}}>All caught up!</div>
          <div style={{fontSize:15,color:T.text3}}>No flashcards due. Complete quizzes to add more.</div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:40,maxWidth:900}}>
          <div style={{display:"flex",flexDirection:"column"}}>
            <div onClick={()=>setFlipped(f=>!f)} style={{background:T.card,border:`2px solid ${flipped?T.amber:T.border}`,borderRadius:20,padding:"48px 40px",minHeight:280,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.25s",textAlign:"center"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.amber+"55"} onMouseLeave={e=>e.currentTarget.style.borderColor=flipped?T.amber:T.border}>
              <div style={{fontSize:11,color:flipped?T.amber:T.text3,letterSpacing:1,textTransform:"uppercase",fontWeight:700,marginBottom:20}}>{flipped?"Answer":"Question"}</div>
              <div style={{fontFamily:T.serif,fontSize:18,lineHeight:1.7,color:T.text}}>{flipped?due[idx%due.length]?.answer:due[idx%due.length]?.question}</div>
              {!flipped&&<div style={{fontSize:12,color:T.text3,marginTop:24}}>Click to reveal answer</div>}
            </div>
            {flipped&&<div style={{display:"flex",gap:12,marginTop:16,animation:"fadeUp 0.2s ease both"}}>
              <Btn variant="danger" onClick={()=>review(false)} style={{flex:1,justifyContent:"center"}}>😕 Forgot</Btn>
              <Btn variant="teal"   onClick={()=>review(true)}  style={{flex:1,justifyContent:"center"}}>✓ Got it</Btn>
            </div>}
          </div>
          <div>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px",marginBottom:16}}>
              <div style={{fontSize:12,color:T.text3,letterSpacing:.5,textTransform:"uppercase",marginBottom:16,fontWeight:600}}>Queue</div>
              <div style={{fontFamily:T.serif,fontSize:44,fontWeight:900,color:T.amber,marginBottom:4}}>{due.length}</div>
              <div style={{fontSize:14,color:T.text3}}>cards due for review</div>
            </div>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px"}}>
              <div style={{fontSize:12,color:T.text3,letterSpacing:.5,textTransform:"uppercase",marginBottom:16,fontWeight:600}}>Spaced Repetition</div>
              <div style={{fontSize:14,color:T.text2,lineHeight:1.8}}>Cards you answer correctly are shown less frequently.<br/><br/>Cards you forget are shown again sooner.<br/><br/>Based on the SM-2 algorithm.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
