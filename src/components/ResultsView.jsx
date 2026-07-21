import { useTheme } from "../theme";
import { Btn } from "./common";

export default function ResultsView({ results, onDone, onFlashcards }) {
  const T = useTheme();
    const {score,correct,total,missed,passage,sessionData}=results;
  const grade=score>=85?["🏆","Exceptional!",T.amber]:score>=70?["⭐","Great work!",T.teal]:score>=50?["📈","Keep going!","#ffa500"]:["💪","Room to grow","#a78bfa"];
  return (
    <div style={{padding:"48px 64px",maxWidth:1000,animation:"fadeUp 0.4s ease both"}}>
      <div style={{display:"flex",gap:48,marginBottom:48}}>
        <div style={{flex:1}}>
          <div style={{fontSize:56,marginBottom:16}}>{grade[0]}</div>
          <div style={{fontFamily:T.serif,fontSize:40,fontWeight:900,color:grade[2],letterSpacing:-1,marginBottom:8}}>{grade[1]}</div>
          <div style={{fontSize:16,color:T.text2,marginBottom:32}}>You answered {correct} of {total} questions correctly on <em>{passage.title}</em>.</div>
          <div style={{display:"flex",gap:16}}>
            <Btn size="lg" onClick={onDone}>Back to Dashboard</Btn>
            {missed.length>0&&<Btn variant="secondary" size="lg" onClick={onFlashcards}>📇 Add {missed.length} to Flashcards</Btn>}
          </div>
        </div>
        <div style={{width:200,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:32}}>
          <div style={{fontFamily:T.serif,fontSize:72,fontWeight:900,color:grade[2],lineHeight:1}}>{score}</div>
          <div style={{fontSize:16,color:T.text3,marginTop:4}}>out of 100</div>
          {sessionData&&<div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${T.border}`,width:"100%",textAlign:"center"}}><div style={{fontFamily:T.mono,fontSize:24,color:T.amber,fontWeight:700}}>{sessionData.wpm}</div><div style={{fontSize:11,color:T.text3}}>words per minute</div></div>}
        </div>
      </div>
      {missed.length>0&&<div><div style={{fontFamily:T.serif,fontSize:22,fontWeight:700,color:T.text,marginBottom:16}}>Review Missed Questions</div><div style={{display:"flex",flexDirection:"column",gap:14}}>{missed.map(q=><div key={q.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px 24px"}}><div style={{fontSize:15,color:T.text,marginBottom:10,fontFamily:T.serif}}>{q.q}</div><div style={{display:"flex",gap:8,alignItems:"flex-start"}}><span style={{color:T.teal,fontSize:16}}>✓</span><div style={{fontSize:14,color:T.teal}}>{q.choices[q.correct]}</div></div><div style={{fontSize:13,color:T.text3,marginTop:8,lineHeight:1.6}}>{q.exp}</div></div>)}</div></div>}
      <div style={{marginTop:40,padding:"20px 24px",background:T.amberGlow,border:`1px solid ${T.amber}33`,borderRadius:12}}>
        <div style={{fontFamily:T.serif,fontSize:16,fontStyle:"italic",color:T.text2,lineHeight:1.7}}>{score>=70?`Excellent session! You read ${passage.wordCount} words${sessionData?` at ${sessionData.wpm} WPM`:""}.`:`Every passage you read builds your vocabulary and comprehension. Consistency beats intensity.`}</div>
      </div>
    </div>
  );
}
