import { useState } from "react";
import { useTheme } from "../theme";
import { LEVELS } from "../constants";
import { SVG, ICONS } from "../icons";
import { ThemeToggleBtn } from "./common";
import { setDifficultyLock } from "../lib/supabaseHelpers";
import { getWeeklyThemeOptIn, setWeeklyThemeOptIn, currentWeeklyTheme } from "../lib/variety";

export default function SettingsView({ user, setUser, notify, darkMode, toggleTheme, isGuest }) {
  const T = useTheme();
  const [saving,       setSaving]       = useState(false);
  const [themeOptIn,   setThemeOptIn]   = useState(getWeeklyThemeOptIn());

  const toggleLock = async () => {
    if (isGuest) { notify("Sign in to use Settings","err"); return; }
    const next = !user?.difficultyLock;
    setSaving(true);
    try {
      await setDifficultyLock(user.id, next);
      setUser(prev => ({...prev, difficultyLock: next}));
      notify(next ? "Difficulty locked to Level "+user.level : "Difficulty lock removed");
    } catch(e) { notify("Couldn't save — try again","err"); }
    setSaving(false);
  };

  const toggleWeeklyTheme = () => {
    const next = !themeOptIn;
    setWeeklyThemeOptIn(next);
    setThemeOptIn(next);
    notify(next ? `Weekly theme "${currentWeeklyTheme()}" will shape your AI passages` : "Weekly theme opt-in removed");
  };

  const Section = ({title, children}) => (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
      padding:"24px 28px",marginBottom:20,animation:"fadeUp 0.4s ease both"}}>
      <div style={{fontFamily:T.serif,fontSize:17,fontWeight:700,color:T.text,marginBottom:18,
        paddingBottom:12,borderBottom:`1px solid ${T.border}`}}>{title}</div>
      {children}
    </div>
  );

  const Row = ({label, desc, right}) => (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
      gap:20,padding:"12px 0",borderBottom:`1px solid ${T.border}`}}>
      <div>
        <div style={{fontSize:14,fontWeight:600,color:T.text}}>{label}</div>
        {desc && <div style={{fontSize:12,color:T.text3,marginTop:3}}>{desc}</div>}
      </div>
      {right}
    </div>
  );

  const Toggle = ({on, onToggle, disabled}) => (
    <button onClick={onToggle} disabled={disabled}
      style={{width:46,height:26,borderRadius:13,border:"none",cursor:disabled?"not-allowed":"pointer",
        background:on?T.amber:T.border2,position:"relative",transition:"background 0.2s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:on?23:3,width:20,height:20,borderRadius:"50%",
        background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
    </button>
  );

  return (
    <div style={{padding:"clamp(16px,4vw,40px) clamp(16px,4vw,48px)",maxWidth:700}}>
      <ThemeToggleBtn darkMode={darkMode} toggleTheme={toggleTheme}/>

      <div style={{marginBottom:28,animation:"fadeUp 0.4s ease both"}}>
        <h1 style={{fontFamily:T.serif,fontSize:36,fontWeight:900,color:T.text,marginBottom:6}}>Settings</h1>
        <p style={{color:T.text3,fontSize:15}}>Manage your reading preferences and account.</p>
      </div>

      {/* Account */}
      <Section title="Account">
        <Row label="Name"  right={<span style={{fontSize:14,color:T.text2}}>{user?.name||"—"}</span>}/>
        <Row label="Email" right={<span style={{fontSize:13,color:T.text2,fontFamily:T.mono}}>{user?.email||"—"}</span>}/>
        <Row label="Reading Level" right={
          <span style={{fontSize:13,color:T.amber,fontWeight:600}}>
            Level {user?.level} — {LEVELS[(user?.level||1)-1].title}
          </span>
        }/>
        <Row label="Streak Shields"
          desc="Earned every 7-day streak. Automatically used when you miss a day."
          right={
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:22}}>🛡️</span>
              <span style={{fontFamily:T.mono,fontSize:18,fontWeight:700,color:T.teal}}>{user?.streakShields||0}</span>
            </div>
          }/>
      </Section>

      {/* Reading Preferences */}
      <Section title="Reading Preferences">
        <Row
          label="Difficulty Lock"
          desc={user?.difficultyLock
            ? `Locked to Level ${user?.level} — AI generation and recommendations stay at your current level.`
            : "Off — the app will suggest passages across all levels."}
          right={<Toggle on={!!user?.difficultyLock} onToggle={toggleLock} disabled={saving||isGuest}/>}
        />
        <Row
          label="Weekly Theme Prompts"
          desc={`This week: "${currentWeeklyTheme()}". ${themeOptIn ? "Applied to your AI Generate topic by default." : "Off — pick your own topics freely."}`}
          right={<Toggle on={themeOptIn} onToggle={toggleWeeklyTheme}/>}
        />
        <Row
          label="Appearance"
          desc="Toggle between dark and light reading mode."
          right={
            <button onClick={toggleTheme}
              style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",borderRadius:8,
                border:`1px solid ${T.border2}`,background:T.surface,color:T.text2,cursor:"pointer",fontSize:13}}>
              <SVG d={darkMode?ICONS.sun:ICONS.moon} size={14} stroke="currentColor"/>
              {darkMode?"Switch to Light":"Switch to Dark"}
            </button>
          }
        />
      </Section>

      {/* Security — streak shield info */}
      <Section title="Security & Progress Protection">
        <div style={{fontSize:14,color:T.text2,lineHeight:1.8}}>
          <p style={{marginBottom:12}}>
            <strong style={{color:T.text}}>Streak Shield</strong> — Earn one shield for every 7-day reading streak completed.
            If you miss a day, a shield is automatically spent to preserve your streak. You currently
            have <strong style={{color:T.teal}}>{user?.streakShields||0} shield{user?.streakShields!==1?"s":""}</strong>.
          </p>
          <p style={{marginBottom:12}}>
            <strong style={{color:T.text}}>Difficulty Lock</strong> — When enabled, AI-generated passages
            are pinned to your current reading level. Recommended passages on the dashboard also stay within
            your level. Turn this on if you want consistent, manageable practice without the app pushing
            you to harder material.
          </p>
          <p>
            <strong style={{color:T.text}}>My Reading Vault</strong> — Every session you complete is
            permanently saved to your account. Visit the Vault from the sidebar to browse your full
            reading history, sort by WPM or comprehension score, and re-read any curated passage.
          </p>
        </div>
      </Section>

      {isGuest && (
        <div style={{padding:"14px 18px",background:`${T.amber}11`,border:`1px solid ${T.amber}33`,
          borderRadius:10,fontSize:14,color:T.amber}}>
          ⚠️ You're in guest mode. Sign up to save settings permanently.
        </div>
      )}
    </div>
  );
}
