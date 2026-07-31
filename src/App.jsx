import { useState, useEffect } from "react";
import "./globalStyles";
import { signUp, signIn, signInWithGoogle, signOut, getSession, getProfile, ensureProfile } from "./auth";

import { ThemeCtx, DARK, LIGHT, T } from "./theme";
import { LEVELS, QUIZZES } from "./constants";
import { SVG, ICONS } from "./icons";
import { useMobile } from "./lib/useMobile";

import {
  fetchSessions, saveSession, incrementProfile,
  fetchUploads, saveUpload, deleteUpload,
  fetchAIPassages, saveAIPassage, fetchMyAIPassages,
  publishAIPassage, unpublishAIPassage, deleteAIPassage, updateAIPassageQuiz,
  updateMilestones,
} from "./lib/supabaseHelpers";
import { generateQuizForPassage } from "./lib/aiApi";
import { checkNewMilestones } from "./lib/milestones";

import { SplashScreen, MilestoneCelebration } from "./components/common";
import AuthPage         from "./components/AuthPage";
import DashboardView    from "./components/DashboardView";
import LibraryView      from "./components/LibraryView";
import ReadingView      from "./components/ReadingView";
import QuizView         from "./components/QuizView";
import ResultsView      from "./components/ResultsView";
import GenerateView     from "./components/GenerateView";
import FlashcardsView   from "./components/FlashcardsView";
import UploadView       from "./components/UploadView";
import ReadingTipsView  from "./components/ReadingTipsView";
import VaultView        from "./components/VaultView";
import SettingsView     from "./components/SettingsView";
import LeaderboardView  from "./components/LeaderboardView";

export default function App() {
  const [view,          setView]          = useState("auth");
  const [loading,       setLoading]       = useState(true);  // show splash while checking session
  const [user,          setUser]          = useState(null);
  const [isGuest,       setIsGuest]       = useState(false);
  const [sessions,      setSessions]      = useState([]);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('readtor_theme') !== 'light'
  );
  // Derive the active theme object — new reference on every toggle
  const theme = darkMode ? DARK : LIGHT;
  // Keep module-level T in sync for non-context consumers (SVG helpers etc.)
  Object.assign(T, theme);
  const toggleTheme = () => {
    setDarkMode(d => {
      const next = !d;
      localStorage.setItem('readtor_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const [uploads,       setUploads]       = useState([]);   // ★ saved uploads
  const [aiPassages,    setAIPassages]    = useState([]);   // ★ public community AI passages
  const [myAIPassages,  setMyAIPassages]  = useState([]);   // ★ current user's own AI passages (all)
  const [flashcards,    setFlashcards]    = useState([]);
  const [activePassage, setActivePassage] = useState(null);
  const [quizSession,   setQuizSession]   = useState(null);
  const [lastResults,   setLastResults]   = useState(null);
  const [toast,         setToast]         = useState(null);
  // ★ dynamic quiz questions (null = use static QUIZZES lookup)
  const [pendingQuiz,   setPendingQuiz]   = useState(null);
  // ★ milestone celebration queue — shown one at a time, full-screen
  const [celebrationQueue, setCelebrationQueue] = useState([]);

  const notify = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };

  // ── Load user + sessions + uploads on mount ───────────────────────────────
  useEffect(() => {
    getSession().then(async session => {
      if (session) {
        try {
          await ensureProfile(
            session.user.id,
            session.user.user_metadata?.name || session.user.user_metadata?.full_name,
            session.user.email
          );
          const profile = await getProfile(session.user.id);
          setUser({
            id: session.user.id,
            name: profile.name,
            email: session.user.email,
            level: profile.level,
            streak: profile.streak,
            totalSessions: profile.total_sessions,
            streakShields:  profile.streak_shields  || 0,
            difficultyLock: profile.difficulty_locked || false,
            leaderboardVisible: profile.leaderboard_visible || false,
            milestones: profile.milestones
              ? (typeof profile.milestones === "string" ? JSON.parse(profile.milestones) : profile.milestones)
              : [],
          });
          const [past, savedUploads, aiP, myAIP] = await Promise.all([
            fetchSessions(session.user.id),
            fetchUploads(session.user.id),
            fetchAIPassages(),
            fetchMyAIPassages(session.user.id),
          ]);
          setSessions(past);
          setUploads(savedUploads);
          setAIPassages(aiP);
          setMyAIPassages(myAIP);
          setView("dashboard");
        } catch(e) { setView("auth"); }
        finally { setLoading(false); }
      } else {
        setLoading(false);
      }
    });
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const data    = await signIn(email, password);
      const profile = await getProfile(data.user.id);
      setUser({
        id: data.user.id, name: profile.name, email: data.user.email,
        level: profile.level, streak: profile.streak, totalSessions: profile.total_sessions,
        streakShields:  profile.streak_shields  || 0,
        difficultyLock: profile.difficulty_locked || false,
        leaderboardVisible: profile.leaderboard_visible || false,
        milestones: profile.milestones
          ? (typeof profile.milestones === "string" ? JSON.parse(profile.milestones) : profile.milestones)
          : [],
      });
      const [past, savedUploads, aiP, myAIP] = await Promise.all([
        fetchSessions(data.user.id),
        fetchUploads(data.user.id),
        fetchAIPassages(),
        fetchMyAIPassages(data.user.id),
      ]);
      setSessions(past);
      setUploads(savedUploads);
      setAIPassages(aiP);
      setMyAIPassages(myAIP);
      setView("dashboard");
      notify("Welcome back! Ready to read faster?");
    } catch(e) { notify(e.message || "Login failed — check your email and password", "err"); }
  };

  const signup = async (email, password, name) => {
    try { await signUp(email, password, name); return { success:true, message:"Account created! Sign in to get started." }; }
    catch(e) { return { success:false, message:e.message || "Signup failed — please try again" }; }
  };

  const googleLogin = async () => {
    try { await signInWithGoogle(); } catch(e) { notify("Google login failed — please try again", "err"); }
  };

  const guestLogin = () => {
    setIsGuest(true);
    setUser({ id:"guest", name:"Guest Reader", level:1, streak:0, totalSessions:0,
      streakShields:0, difficultyLock:false, leaderboardVisible:false, milestones:[] });
    setView("dashboard");
  };

  const logout = async () => {
    await signOut();
    setUser(null); setIsGuest(false); setSessions([]); setUploads([]); setAIPassages([]); setMyAIPassages([]); setView("auth");
  };

  // ── Reading / quiz flow ───────────────────────────────────────────────────
  const startReading = passage => { setActivePassage(passage); setView("reading"); };

  const finishReading = async (sessionData) => {
    const p = sessionData.passage;
    // If the passage already carries quizJson (saved AI passage), use it directly
    if (p.quizJson) {
      setPendingQuiz(null); // QuizView will read p.quizJson
    } else if (!QUIZZES[p.id]) {
      // Upload or unsaved AI passage — generate quiz now
      notify("Generating quiz from your text… ✨");
      try {
        const qs = await generateQuizForPassage(p.text, p.title);
        setPendingQuiz(qs);
      } catch(e) {
        console.error("Quiz generation failed:", e);
        setPendingQuiz(null);
      }
    } else {
      setPendingQuiz(null); // curated passage — static quiz
    }
    setQuizSession({ passage: p, sessionData });
    setView("quiz");
  };

  const submitQuiz = async (results) => {
    setLastResults(results);
    setPendingQuiz(null);

    if (results.missed.length > 0) {
      const cards = results.missed.map(q => ({
        id:`${Date.now()}-${Math.random()}`, question:q.q, answer:q.exp, due:Date.now(), interval:1,
      }));
      setFlashcards(prev => [...prev, ...cards]);
    }

    if (!isGuest && user?.id) {
      try {
        await saveSession(user.id, { ...results.sessionData, comp: results.score });
        await incrementProfile(user.id);
        const [past, profile] = await Promise.all([
          fetchSessions(user.id),
          getProfile(user.id),
        ]);
        setSessions(past);
        const currentMilestones = profile.milestones
          ? (typeof profile.milestones === "string" ? JSON.parse(profile.milestones) : profile.milestones)
          : [];
        setUser(prev => ({
          ...prev,
          totalSessions:  profile.total_sessions,
          streak:         profile.streak,
          streakShields:  profile.streak_shields  || 0,
          difficultyLock: profile.difficulty_locked || false,
          milestones:     currentMilestones,
        }));

        // ★ Milestone Celebrations — check for newly crossed thresholds
        const totalWords = past.reduce((a, b) => a + (b.wordsRead || 0), 0);
        const milestoneStats = {
          totalWords,
          hasPerfectQuiz: results.score === 100,
          streak: profile.streak || 0,
        };
        const newMilestones = checkNewMilestones(milestoneStats, currentMilestones);
        if (newMilestones.length > 0) {
          setCelebrationQueue(newMilestones);
          const merged = [...currentMilestones, ...newMilestones.map(m => m.id)];
          updateMilestones(user.id, merged).catch(e => console.error("Milestone save failed:", e));
          setUser(prev => ({ ...prev, milestones: merged }));
        }
      } catch(e) {
        console.error("Failed to save session:", e);
        notify("Session couldn't be saved — check your connection.", "err");
      }
    } else {
      setSessions(prev => [results.sessionData, ...prev]);
      setUser(prev => prev ? { ...prev, totalSessions:(prev.totalSessions||0)+1, streak:(prev.streak||0)+1 } : prev);
    }
    setView("results");
  };

  // ★ Save a new upload to Supabase and add to local state
  const handleSaveUpload = async (uploadData) => {
    if (isGuest || !user?.id) return null;
    try {
      const saved = await saveUpload(user.id, uploadData);
      setUploads(prev => [saved, ...prev]);
      return saved;
    } catch(e) {
      notify("Couldn't save — check your connection.", "err");
      return null;
    }
  };

  // ★ Save a newly generated AI passage + quiz to DB (private by default)
  const handleSaveAIPassage = async (passageData) => {
    if (isGuest || !user?.id) return null;
    try {
      const saved = await saveAIPassage(user.id, user.name, passageData);
      // Goes into myAIPassages (private); not in public aiPassages yet
      setMyAIPassages(prev => [saved, ...prev]);
      return saved;
    } catch(e) {
      console.error("Failed to save AI passage:", e);
      return null;
    }
  };

  // ★ Publish / unpublish an AI passage
  const handlePublishAIPassage = async (passageId, publish) => {
    try {
      if (publish) await publishAIPassage(passageId);
      else await unpublishAIPassage(passageId);
      setMyAIPassages(prev => prev.map(p => p.id === passageId ? { ...p, isPublic: publish } : p));
      // Refresh public list
      const pub = await fetchAIPassages();
      setAIPassages(pub);
    } catch(e) { console.error("Publish failed:", e); }
  };

  // ★ Delete an AI passage (owner only)
  const handleDeleteAIPassage = async (passageId) => {
    try {
      await deleteAIPassage(passageId);
      setMyAIPassages(prev => prev.filter(p => p.id !== passageId));
      setAIPassages(prev => prev.filter(p => p.id !== passageId));
    } catch(e) { console.error("Delete failed:", e); }
  };

  // ★ Regenerate quiz for an AI passage (original generator only)
  const handleRegenerateQuiz = async (passageId, passageText, passageTitle) => {
    try {
      const qs = await generateQuizForPassage(passageText, passageTitle);
      await updateAIPassageQuiz(passageId, qs);
      setAIPassages(prev => prev.map(p =>
        p.id === passageId ? { ...p, quizJson: qs } : p
      ));
      return qs;
    } catch(e) {
      throw e;
    }
  };

  // ★ Delete a saved upload
  const handleDeleteUpload = async (uploadId) => {
    try {
      await deleteUpload(uploadId);
      setUploads(prev => prev.filter(u => u.id !== uploadId));
      notify("Upload deleted.");
    } catch(e) {
      notify("Couldn't delete — try again.", "err");
    }
  };

  const mobile    = useMobile();
  const dueCards = flashcards.filter(f=>f.due<=Date.now()).length;

  // Show splash while checking existing session
  if (loading) return (
    <ThemeCtx.Provider value={theme}>
      <SplashScreen/>
    </ThemeCtx.Provider>
  );

  if (view==="auth") return (
    <ThemeCtx.Provider value={theme}>
      <AuthPage onLogin={login} onSignup={signup} onGuest={guestLogin} onGoogle={googleLogin} loadingUser={false}/>
    </ThemeCtx.Provider>
  );

  const NAV = [
    { id:"dashboard",    label:"Dashboard",     icon:"home"     },
    { id:"library",      label:"Library",       icon:"library"  },
    { id:"generate",     label:"AI Generate",   icon:"generate" },
    { id:"flashcards",   label:"Flashcards",    icon:"cards",   badge:dueCards },
    { id:"upload",       label:"Upload",        icon:"upload"   },
    { id:"vault",        label:"My Vault",      icon:"vault"    },
    { id:"leaderboard",  label:"Leaderboard",   icon:"trophy"   },
    { id:"readingtips",  label:"Reading Tips",  icon:"tips"     },
    { id:"settings",     label:"Settings",      icon:"settings" },
  ];

  return (
    <ThemeCtx.Provider value={theme}>
    <div style={{display:"flex",minHeight:"100vh",background:T.bg}}>
      {!["reading","quiz","results"].includes(view) && (<>
        {/* ── Desktop sidebar ── */}
        <aside style={{width:220,flexShrink:0,background:T.surface,borderRight:`1px solid ${T.border}`,
          display:"flex",flexDirection:"column",position:"fixed",left:0,top:0,bottom:0,zIndex:50,
          ...(mobile && {display:"none"})}}>
          <div style={{padding:"28px 20px 24px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{fontFamily:T.serif,fontSize:26,fontWeight:900,color:T.amber,letterSpacing:-0.5}}>Readtor</div>
            <div style={{fontSize:11,color:T.text3,marginTop:2,letterSpacing:.5}}>Read · Absorb · Remember</div>
          </div>
          <nav style={{flex:1,padding:"16px 10px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
            {NAV.map(n=>{
              const active=view===n.id;
              return (
                <button key={n.id} onClick={()=>setView(n.id)} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 12px",borderRadius:8,border:"none",background:active?T.amberGlow:"transparent",color:active?T.amber:T.text2,cursor:"pointer",fontSize:14,fontWeight:active?600:400,textAlign:"left",position:"relative",transition:"all 0.15s"}}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.background=T.card;}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}>
                  <SVG d={ICONS[n.icon]} size={17} stroke={active?T.amber:T.text3}/>
                  {n.label}
                  {n.badge>0 && <span style={{marginLeft:"auto",background:T.red,color:"#fff",fontSize:10,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{n.badge}</span>}
                  {active && <div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:3,height:20,background:T.amber,borderRadius:"0 2px 2px 0"}}/>}
                </button>
              );
            })}
          </nav>
          <div style={{padding:"12px 10px 16px",borderTop:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${T.amber},${T.amber2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:T.bg,flexShrink:0}}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</div>
                <div style={{fontSize:11,color:T.text3}}>Level {user?.level} · {LEVELS[(user?.level||1)-1].title}</div>
              </div>
            </div>
            <button onClick={logout} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",width:"100%",background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:13,borderRadius:6}}
              onMouseEnter={e=>e.currentTarget.style.color=T.red} onMouseLeave={e=>e.currentTarget.style.color=T.text3}>
              <SVG d={ICONS.logout} size={15} stroke="currentColor"/> Sign Out
            </button>
          </div>
        </aside>

        {/* ── Mobile top header ── */}
        {mobile && (
          <div style={{position:"fixed",top:0,left:0,right:0,zIndex:50,background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",height:52}}>
            <div style={{fontFamily:T.serif,fontSize:22,fontWeight:900,color:T.amber}}>Readtor</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${T.amber},${T.amber2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:T.bg}}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* ── Mobile bottom nav ── */}
        {mobile && (
          <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-around",height:60,paddingBottom:"env(safe-area-inset-bottom)"}}>
            {NAV.slice(0,6).map(n=>{
              const active=view===n.id;
              return (
                <button key={n.id} onClick={()=>setView(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 4px",background:"none",border:"none",cursor:"pointer",color:active?T.amber:T.text3,minWidth:44,position:"relative"}}>
                  <SVG d={ICONS[n.icon]} size={20} stroke={active?T.amber:T.text3}/>
                  <span style={{fontSize:9,fontWeight:active?700:400,letterSpacing:.3}}>{n.label.split(" ")[0]}</span>
                  {n.badge>0 && <span style={{position:"absolute",top:2,right:2,background:T.red,color:"#fff",fontSize:9,width:15,height:15,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{n.badge}</span>}
                </button>
              );
            })}
            <button onClick={logout} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 4px",background:"none",border:"none",cursor:"pointer",color:T.text3,minWidth:44}}>
              <SVG d={ICONS.logout} size={20} stroke={T.text3}/>
              <span style={{fontSize:9,letterSpacing:.3}}>Logout</span>
            </button>
          </nav>
        )}
      </>)}

      <main style={{flex:1,marginLeft:(!mobile && !["reading","quiz","results"].includes(view))?220:0,minHeight:"100vh",overflow:"auto",paddingTop:mobile&&!["reading","quiz","results"].includes(view)?52:0,paddingBottom:mobile&&!["reading","quiz","results"].includes(view)?60:0}}>
        {view==="dashboard"  && <DashboardView  user={user} isGuest={isGuest} sessions={sessions} onStart={startReading} flashcards={flashcards} setView={setView} darkMode={darkMode} toggleTheme={toggleTheme}/>}
        {view==="library"    && <LibraryView    onStart={startReading} aiPassages={aiPassages} myAIPassages={myAIPassages} userId={user?.id} onPublish={handlePublishAIPassage} onDeleteAI={handleDeleteAIPassage} onRegenerateQuiz={handleRegenerateQuiz} notify={notify} darkMode={darkMode} toggleTheme={toggleTheme}/>}
        {view==="generate"   && <GenerateView   user={user} isGuest={isGuest} onStart={startReading} notify={notify} onSaveAIPassage={handleSaveAIPassage} onRegenerateQuiz={handleRegenerateQuiz} darkMode={darkMode} toggleTheme={toggleTheme} difficultyLock={user?.difficultyLock}/>}
        {view==="flashcards" && <FlashcardsView flashcards={flashcards} setFlashcards={setFlashcards} darkMode={darkMode} toggleTheme={toggleTheme}/>}
        {view==="upload"     && <UploadView     onStart={startReading} notify={notify} uploads={uploads} isGuest={isGuest} userId={user?.id} onSave={handleSaveUpload} onDelete={handleDeleteUpload} darkMode={darkMode} toggleTheme={toggleTheme}/>}
        {view==="reading"    && activePassage && <ReadingView  passage={activePassage} onFinish={finishReading} onExit={()=>setView("dashboard")}/>}
        {view==="quiz"       && quizSession   && <QuizView     passage={quizSession.passage} sessionData={quizSession.sessionData} onSubmit={submitQuiz} onExit={()=>setView("dashboard")} dynamicQuestions={pendingQuiz} userSessions={sessions}/>}
        {view==="results"    && lastResults   && <ResultsView  results={lastResults} onDone={()=>setView("dashboard")} onFlashcards={()=>setView("flashcards")}/>}
        {view==="readingtips" && <ReadingTipsView darkMode={darkMode} toggleTheme={toggleTheme}/>}
        {view==="vault"       && <VaultView sessions={sessions} onStart={startReading} darkMode={darkMode} toggleTheme={toggleTheme}/>}
        {view==="leaderboard" && <LeaderboardView user={user} darkMode={darkMode} toggleTheme={toggleTheme} setView={setView}/>}
        {view==="settings"    && <SettingsView user={user} setUser={setUser} notify={notify} darkMode={darkMode} toggleTheme={toggleTheme} isGuest={isGuest} sessions={sessions}/>}
      </main>

      {toast && (
        <div style={{position:"fixed",bottom:28,right:28,background:toast.type==="ok"?T.card2:`${T.red}22`,border:`1px solid ${toast.type==="ok"?T.amber+"55":T.red+"55"}`,color:toast.type==="ok"?T.text:T.red,padding:"12px 20px",borderRadius:10,fontSize:14,zIndex:999,animation:"fadeUp 0.3s ease both",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",maxWidth:340}}>
          {toast.msg}
        </div>
      )}

      {/* ★ Milestone celebration — shows one at a time from the queue */}
      {celebrationQueue.length > 0 && (
        <MilestoneCelebration
          milestone={celebrationQueue[0]}
          onDismiss={() => setCelebrationQueue(q => q.slice(1))}
        />
      )}
    </div>
    </ThemeCtx.Provider>
  );
}
