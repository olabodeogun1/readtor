import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../theme";
import { SVG, ICONS } from "../icons";
import { Btn } from "./common";

export default function ReadingView({ passage, onFinish, onExit }) {
  const T = useTheme();
    const [mode,      setMode]      = useState("highlight");
  const [wpm,       setWpm]       = useState(250);
  const [playing,   setPlaying]   = useState(false);
  const [wordIdx,   setWordIdx]   = useState(0);
  const [elapsed,   setElapsed]   = useState(0);
  const [startTs,   setStartTs]   = useState(null);
  const [fontSize,  setFontSize]  = useState(18);
  const [countdown, setCountdown] = useState(null);  // 3,2,1,null = playing
  const [focusMode, setFocusMode] = useState(false); // RSVP bionic focus
  const [audioOn,   setAudioOn]   = useState(false); // TTS audio
  const timerRef    = useRef(null);
  const clockRef    = useRef(null);
  const utterRef    = useRef(null);
  const words       = passage.text.split(/\s+/);
  const progress    = words.length > 1 ? (wordIdx / (words.length - 1)) * 100 : 0;
  const liveWpm     = elapsed > 4 ? Math.round((wordIdx / elapsed) * 60) : wpm;

  // ── Focus mode: highlight middle character of each word in amber ──────────
  function renderFocusWord(word) {
    if (word.length === 0) return <span>{word}</span>;
    const midIdx = Math.floor(word.length / 2);
    const before = word.slice(0, midIdx);
    const mid    = word.slice(midIdx, midIdx + 1);
    const after  = word.slice(midIdx + 1);
    return (
      <span>
        <span style={{color: T.text}}>{before}</span>
        <span style={{color: T.amber, fontWeight: 900, fontSize:"1.1em"}}>{mid}</span>
        <span style={{color: T.text}}>{after}</span>
      </span>
    );
  }

  // ── Audio (TTS) ───────────────────────────────────────────────────────────
  const toggleAudio = () => {
    if (audioOn) {
      window.speechSynthesis.cancel();
      setAudioOn(false);
    } else {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(passage.text);
      utt.rate  = Math.min(2, Math.max(0.5, wpm / 180));
      utt.onend = () => setAudioOn(false);
      utterRef.current = utt;
      window.speechSynthesis.speak(utt);
      setAudioOn(true);
    }
  };

  // Stop audio when leaving
  useEffect(() => () => window.speechSynthesis.cancel(), []);

  // ── RSVP tick ─────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    setWordIdx(prev => {
      if (prev + 1 >= words.length) { setPlaying(false); return words.length - 1; }
      return prev + 1;
    });
  }, [words.length]);

  useEffect(() => {
    if (playing) { const ms = (60/wpm)*1000; timerRef.current = setInterval(tick, ms); }
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [playing, wpm, tick]);

  useEffect(() => {
    if (playing) {
      if (!startTs) setStartTs(Date.now());
      clockRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else clearInterval(clockRef.current);
    return () => clearInterval(clockRef.current);
  }, [playing]);

  // ── 3-second RSVP countdown ───────────────────────────────────────────────
  const startRSVP = () => {
    if (mode !== "rsvp") { setPlaying(p => !p); return; }
    if (playing) { setPlaying(false); return; }
    setCountdown(3);
    let count = 3;
    const id = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(id);
        setCountdown(null);
        setPlaying(true);
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const finish = () => {
    window.speechSynthesis.cancel();
    const t = Math.max(elapsed, 1);
    onFinish({ passage, wpm: Math.round((wordIdx/t)*60)||wpm, comp:0, wordsRead:wordIdx, timeSeconds:t, ts:Date.now() });
  };

  const CHUNK = 6; const chunks = [];
  for (let i = 0; i < words.length; i += CHUNK)
    chunks.push({ words: words.slice(i, i+CHUNK), start:i, active: wordIdx >= i && wordIdx < i+CHUNK });

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.bg}}>
      {/* Top bar */}
      <div style={{padding:"14px 32px",borderBottom:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",gap:20,flexShrink:0}}>
        <button onClick={onExit} style={{background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:13,display:"flex",alignItems:"center",gap:6}}
          onMouseEnter={e=>e.currentTarget.style.color=T.red} onMouseLeave={e=>e.currentTarget.style.color=T.text3}>
          <SVG d={ICONS.x} size={16} stroke="currentColor"/> Exit
        </button>
        <div style={{fontFamily:T.serif,fontSize:17,fontWeight:700,color:T.text,flex:1,textAlign:"center"}}>{passage.title}</div>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          {/* Audio button */}
          <button onClick={toggleAudio} title={audioOn?"Stop audio":"Read aloud"}
            style={{background:audioOn?`${T.teal}22`:"none",border:`1px solid ${audioOn?T.teal:T.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:audioOn?T.teal:T.text3,transition:"all 0.15s"}}>
            <SVG d={audioOn?ICONS.volumeOff:ICONS.volume} size={15} stroke="currentColor"/>
            <span style={{fontSize:11}}>{audioOn?"Stop":"Audio"}</span>
          </button>
          <div style={{textAlign:"right"}}><div style={{fontFamily:T.mono,fontSize:22,fontWeight:700,color:T.amber}}>{liveWpm}</div><div style={{fontSize:10,color:T.text3,letterSpacing:.5}}>WPM</div></div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:T.mono,fontSize:18,color:T.teal}}>{Math.round(progress)}%</div><div style={{fontSize:10,color:T.text3,letterSpacing:.5}}>done</div></div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{height:3,background:T.card,flexShrink:0}}>
        <div style={{height:"100%",background:`linear-gradient(90deg,${T.amber},${T.amber2})`,width:`${progress}%`,transition:"width 0.2s"}}/>
      </div>

      {/* Controls */}
      <div style={{padding:"12px 32px",borderBottom:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",gap:16,flexShrink:0,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:4}}>
          {[["highlight","Highlight"],["rsvp","RSVP"],["scroll","Scroll"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setPlaying(false);setWordIdx(0);setCountdown(null);}}
              style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${mode===m?T.amber:T.border}`,background:mode===m?T.amberGlow:"transparent",color:mode===m?T.amber:T.text3,cursor:"pointer",fontSize:13,fontWeight:mode===m?600:400,transition:"all 0.15s"}}>{l}</button>
          ))}
        </div>

        {/* Focus mode toggle — only for RSVP */}
        {mode === "rsvp" && (
          <button onClick={()=>setFocusMode(f=>!f)}
            style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${focusMode?T.teal:T.border}`,background:focusMode?`${T.teal}18`:"transparent",color:focusMode?T.teal:T.text3,cursor:"pointer",fontSize:12,fontWeight:focusMode?600:400,transition:"all 0.15s"}}>
            👁 Focus
          </button>
        )}

        <div style={{height:20,width:1,background:T.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
          <span style={{fontSize:12,color:T.text3,whiteSpace:"nowrap"}}>Speed</span>
          <input type="range" min={80} max={900} step={10} value={wpm} onChange={e=>setWpm(+e.target.value)} style={{flex:1,maxWidth:220,accentColor:T.amber}}/>
          <span style={{fontFamily:T.mono,fontSize:14,color:T.text2,minWidth:70}}>{wpm} wpm</span>
        </div>
        <div style={{height:20,width:1,background:T.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:T.text3}}>Font</span>
          <button onClick={()=>setFontSize(f=>Math.max(14,f-2))} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:4,width:28,height:28,cursor:"pointer",color:T.text2,fontSize:14}}>−</button>
          <button onClick={()=>setFontSize(f=>Math.min(32,f+2))} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:4,width:28,height:28,cursor:"pointer",color:T.text2,fontSize:14}}>+</button>
        </div>
        <div style={{height:20,width:1,background:T.border}}/>
        <div style={{display:"flex",gap:8}}>
          {mode !== "scroll" && (
            <Btn onClick={startRSVP} variant={playing?"secondary":"primary"} size="sm" disabled={countdown!==null}>
              {countdown !== null ? `Starting in ${countdown}…` : playing ? <>⏸ Pause</> : <>▶ Play</>}
            </Btn>
          )}
          <Btn onClick={finish} variant="teal" size="sm">Finish & Quiz →</Btn>
        </div>
      </div>

      {/* Reading area */}
      <div style={{flex:1,overflow:"auto",display:"flex",alignItems:mode==="rsvp"?"center":"flex-start",justifyContent:"center",position:"relative"}}>

        {/* RSVP mode */}
        {mode === "rsvp" && (
          <div style={{textAlign:"center",padding:40}}>
            {/* Countdown overlay */}
            {countdown !== null && (
              <div style={{position:"fixed",inset:0,background:"rgba(7,8,15,0.85)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:100}}>
                <div style={{fontFamily:T.serif,fontSize:120,fontWeight:900,color:T.amber,lineHeight:1,animation:"fadeIn 0.3s ease both"}}>{countdown}</div>
                <div style={{fontSize:18,color:T.text2,marginTop:16}}>Get ready to read…</div>
              </div>
            )}
            <div style={{fontFamily:T.serif,fontSize:Math.max(48,fontSize*2.5),color:T.text,minHeight:100,display:"flex",alignItems:"center",justifyContent:"center",animation:"rsvpIn 0.25s ease both",letterSpacing:-0.5}} key={wordIdx}>
              {focusMode ? renderFocusWord(words[wordIdx]) : <span style={{color:T.amber}}>{words[wordIdx]}</span>}
            </div>
            <div style={{fontSize:13,color:T.text3,marginTop:24,fontFamily:T.mono}}>{wordIdx+1} / {words.length} words</div>
            {focusMode && (
              <div style={{marginTop:12,fontSize:11,color:T.text3}}>
                <span style={{color:T.amber,fontWeight:700}}>Bold</span> = focus anchor · white = rest of word
              </div>
            )}
          </div>
        )}

        {/* Highlight mode */}
        {mode === "highlight" && (
          <div style={{maxWidth:760,padding:"48px 64px",lineHeight:2.2,fontSize:fontSize,color:T.text,fontFamily:T.serif}}>
            {chunks.map((c,i)=>(
              <span key={i} style={{background:c.active?`${T.amber}2a`:"transparent",borderRadius:4,padding:"2px 0",transition:"background 0.15s"}}>
                {c.words.join(" ")}{" "}
              </span>
            ))}
          </div>
        )}

        {/* Scroll mode */}
        {mode === "scroll" && (
          <div style={{maxWidth:720,padding:"48px 64px",fontSize:fontSize,fontFamily:T.serif,lineHeight:2.2,color:T.text}}>
            {passage.text.split("\n\n").map((para,i)=><p key={i} style={{marginBottom:"1.8em"}}>{para}</p>)}
            <div style={{marginTop:40,paddingTop:24,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end"}}>
              <Btn onClick={finish} variant="teal">Finished — Take Quiz →</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
