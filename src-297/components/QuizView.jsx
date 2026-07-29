import { useState } from "react";
import { useTheme } from "../theme";
import { QUIZZES } from "../constants";
import { Btn } from "./common";

export default function QuizView({ passage, sessionData, onSubmit, onExit, dynamicQuestions, userSessions }) {
  const T = useTheme();
    // Priority: 1) passage already has quizJson (saved AI passage) — zero API call
  //           2) dynamicQuestions generated after reading (upload / unsaved AI)
  //           3) static QUIZZES lookup for curated passages
  //           4) fallback loading state (generates on-the-fly)
  const questions = passage.quizJson || dynamicQuestions || QUIZZES[passage.id] || null;
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);

  const isLoading = !questions;
  const q = questions ? questions[current] : null;

  const isAIQuiz = !!(passage.quizJson || dynamicQuestions);

  const submit = () => {
    const missed = []; let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct) correct++;
      else missed.push(q);
    });
    onSubmit({ score: Math.round((correct/questions.length)*100), correct, total: questions.length, missed, passage, sessionData });
  };

  if (isLoading) {
    return (
      <div style={{display:"flex",height:"100vh",background:T.bg,alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <span style={{fontSize:32,animation:"spin 1.5s linear infinite",display:"inline-block"}}>✦</span>
        <div style={{fontSize:16,color:T.text2}}>Generating quiz from your text…</div>
        <div style={{fontSize:13,color:T.text3}}>This takes about 10 seconds</div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",height:"100vh",background:T.bg}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"48px 56px",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:40}}>
          <div>
            <div style={{fontFamily:T.serif,fontSize:28,fontWeight:900,color:T.text}}>Comprehension Quiz</div>
            <div style={{fontSize:14,color:T.text3,marginTop:4,display:"flex",alignItems:"center",gap:8}}>
              {passage.title}
              {isAIQuiz && (
                <span style={{fontSize:11,color:T.teal,background:`${T.teal}18`,padding:"2px 8px",borderRadius:20}}>
                  AI-generated quiz
                </span>
              )}
            </div>
          </div>
          <button onClick={onExit} style={{background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:13}}
            onMouseEnter={e=>e.currentTarget.style.color=T.red} onMouseLeave={e=>e.currentTarget.style.color=T.text3}>
            Skip quiz
          </button>
        </div>

        {/* Comprehension Safety Net */}
        {(() => {
          const genre = passage.genre;
          const similar = (userSessions||[]).filter(s => s.passage?.title && s.comp > 0);
          if (similar.length < 2) return null;
          const avg = Math.round(similar.reduce((a,b)=>a+(b.comp||0),0)/similar.length);
          const color = avg >= 70 ? T.teal : avg >= 50 ? T.amber : T.red;
          return (
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",
              background:`${color}11`,border:`1px solid ${color}33`,borderRadius:10,marginBottom:20,fontSize:13}}>
              <span style={{fontSize:16}}>📊</span>
              <span style={{color:T.text2}}>Your average comprehension across all sessions:</span>
              <span style={{color,fontWeight:700,fontFamily:T.mono}}>{avg}%</span>
            </div>
          );
        })()}

        {/* Progress dots */}
        <div style={{display:"flex",gap:8,marginBottom:36}}>
          {questions.map((_,i) => (
            <div key={i} onClick={()=>setCurrent(i)} style={{flex:1,height:5,borderRadius:3,cursor:"pointer",background:answers[questions[i].id]!==undefined?T.amber:i===current?T.teal:T.card2,transition:"background 0.2s"}}/>
          ))}
        </div>

        {/* Question */}
        <div style={{animation:"fadeIn 0.25s ease both"}} key={q.id}>
          <div style={{fontSize:11,color:T.amber,letterSpacing:1,fontWeight:700,textTransform:"uppercase",marginBottom:12}}>
            Question {current+1} of {questions.length} · {q.type==="tf"?"True / False":"Multiple Choice"}
          </div>
          <div style={{fontFamily:T.serif,fontSize:22,lineHeight:1.6,color:T.text,marginBottom:32}}>{q.q}</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {q.choices.map((c,i) => {
              const sel = answers[q.id] === i;
              return (
                <button key={i} onClick={()=>setAnswers(prev=>({...prev,[q.id]:i}))}
                  style={{padding:"16px 20px",borderRadius:10,border:`2px solid ${sel?T.amber:T.border}`,background:sel?T.amberGlow:T.card,color:T.text,textAlign:"left",cursor:"pointer",fontSize:15,transition:"all 0.15s",display:"flex",alignItems:"center",gap:14}}
                  onMouseEnter={e=>{if(!sel){e.currentTarget.style.borderColor=T.amber+"44";e.currentTarget.style.background=T.card2;}}}
                  onMouseLeave={e=>{if(!sel){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;}}}>
                  <span style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${sel?T.amber:T.border2}`,background:sel?T.amber:"transparent",color:sel?T.bg:T.text3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>
                    {sel?"✓":String.fromCharCode(65+i)}
                  </span>
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{display:"flex",gap:12,marginTop:40}}>
          {current > 0 && <Btn variant="secondary" onClick={()=>setCurrent(c=>c-1)}>← Previous</Btn>}
          {current < questions.length-1
            ? <Btn onClick={()=>setCurrent(c=>c+1)}>Next →</Btn>
            : <Btn onClick={submit} disabled={Object.keys(answers).length<questions.length} variant="teal">Submit Quiz ✓</Btn>
          }
        </div>
      </div>

      {/* Side panel */}
      <div style={{width:380,flexShrink:0,borderLeft:`1px solid ${T.border}`,padding:"48px 32px",overflowY:"auto",background:T.surface}}>
        <div style={{fontSize:13,color:T.text3,marginBottom:16,fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>Passage Reference</div>
        <div style={{fontFamily:T.serif,fontSize:15,lineHeight:1.9,color:T.text2}}>{passage.text.slice(0,600)}<span style={{color:T.text3}}>…</span></div>
        {sessionData && (
          <div style={{marginTop:24,padding:"14px 16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:11,color:T.text3,marginBottom:8,letterSpacing:.5,textTransform:"uppercase"}}>Your Session</div>
            <div style={{display:"flex",gap:20}}>
              <div><div style={{fontFamily:T.mono,fontSize:20,color:T.amber,fontWeight:700}}>{sessionData.wpm}</div><div style={{fontSize:11,color:T.text3}}>WPM</div></div>
              <div><div style={{fontFamily:T.mono,fontSize:20,color:T.teal,fontWeight:700}}>{sessionData.wordsRead}</div><div style={{fontSize:11,color:T.text3}}>words</div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
