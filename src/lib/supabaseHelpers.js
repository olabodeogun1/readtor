import { supabase } from "../supabaseClient";
import { getProfile } from "../auth";


// ── Sessions ─────────────────────────────────────────────────────────────

export async function fetchSessions(userId) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({
    id:          row.id,
    passage:     { title: row.passage_title, id: "db", wordCount: row.words_read },
    wpm:         row.wpm,
    comp:        row.comprehension,
    wordsRead:   row.words_read,
    timeSeconds: row.time_seconds,
    ts:          new Date(row.created_at).getTime(),
  }));
}

export async function saveSession(userId, { passage, wpm, comp, wordsRead, timeSeconds }) {
  const { error } = await supabase.from("sessions").insert({
    user_id:       userId,
    passage_title: passage.title,
    wpm,
    words_read:    wordsRead,
    comprehension: comp || 0,
    time_seconds:  timeSeconds,
  });
  if (error) throw error;
}

// ── Profile / streak / shields ──────────────────────────────────────────

export async function incrementProfile(userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_sessions, streak, streak_shields, last_session_date")
    .eq("id", userId)
    .single();
  if (!profile) return;

  const today     = new Date().toISOString().slice(0, 10);
  const lastDate  = profile.last_session_date || "";
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let newStreak  = profile.streak || 0;
  let newShields = profile.streak_shields || 0;

  if (lastDate === today) {
    // Already read today — no streak change
  } else if (lastDate === yesterday || lastDate === "") {
    // Consecutive day — increment streak
    newStreak += 1;
    // Award a shield every 7 days
    if (newStreak > 0 && newStreak % 7 === 0) newShields += 1;
  } else {
    // Missed a day — use shield if available, else reset
    if (newShields > 0) {
      newShields -= 1;
      newStreak += 1; // shield preserved the streak
    } else {
      newStreak = 1; // reset
    }
  }

  await supabase.from("profiles").update({
    total_sessions:    (profile.total_sessions || 0) + 1,
    streak:            newStreak,
    streak_shields:    newShields,
    last_session_date: today,
  }).eq("id", userId);

  return { newStreak, newShields };
}

export async function refreshUserProfile(userId, setUser) {
  const profile = await getProfile(userId);
  setUser(prev => ({
    ...prev,
    totalSessions:  profile.total_sessions,
    streak:         profile.streak,
    streakShields:  profile.streak_shields || 0,
    difficultyLock: profile.difficulty_locked || false,
  }));
}

export async function setDifficultyLock(userId, locked) {
  const { error } = await supabase
    .from("profiles")
    .update({ difficulty_locked: locked })
    .eq("id", userId);
  if (error) throw error;
}

// ★ Saved uploads ──────────────────────────────────────────────────────

export async function fetchUploads(userId) {
  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({
    id:        row.id,
    title:     row.title,
    text:      row.text,
    wordCount: row.word_count,
    createdAt: new Date(row.created_at).getTime(),
    // shape it as a passage object so startReading works directly
    genre:     "Uploaded",
    level:     5,
    tags:      ["uploaded"],
    isUpload:  true,
  }));
}

export async function saveUpload(userId, { title, text, wordCount }) {
  const { data, error } = await supabase.from("uploads").insert({
    user_id:    userId,
    title,
    text,
    word_count: wordCount,
  }).select().single();
  if (error) throw error;
  return {
    id:        data.id,
    title:     data.title,
    text:      data.text,
    wordCount: data.word_count,
    createdAt: new Date(data.created_at).getTime(),
    genre:     "Uploaded",
    level:     5,
    tags:      ["uploaded"],
    isUpload:  true,
  };
}

export async function deleteUpload(uploadId) {
  const { error } = await supabase.from("uploads").delete().eq("id", uploadId);
  if (error) throw error;
}

// ★ Daily Drop — one shared AI passage per calendar day ────────────────

export async function fetchDailyPassage(dateKey) {
  const { data, error } = await supabase
    .from("daily_passages")
    .select("*")
    .eq("date_key", dateKey)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id:        `daily-${data.date_key}`,
    title:     data.title,
    genre:     data.genre,
    level:     data.level,
    wordCount: data.word_count,
    text:      data.text,
    quizJson:  typeof data.quiz_json === "string" ? JSON.parse(data.quiz_json) : data.quiz_json,
    tags:      ["daily-drop"],
    isDaily:   true,
  };
}

export async function saveDailyPassage(dateKey, { title, genre, level, wordCount, text, quizJson }) {
  const { data, error } = await supabase.from("daily_passages").insert({
    date_key:   dateKey,
    title, genre, level,
    word_count: wordCount,
    text,
    quiz_json:  JSON.stringify(quizJson),
  }).select().single();
  if (error) throw error;
  return {
    id: `daily-${dateKey}`, title: data.title, genre: data.genre, level: data.level,
    wordCount: data.word_count, text: data.text, quizJson,
    tags: ["daily-drop"], isDaily: true,
  };
}

// ★ AI Passages — shared community library ──────────────────────────────

export async function fetchAIPassages() {
  const { data, error } = await supabase
    .from("ai_passages")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToAIPassage);
}

function rowToAIPassage(row) {
  return {
    id:           row.id,
    title:        row.title,
    genre:        row.genre,
    level:        row.level,
    wordCount:    row.word_count,
    text:         row.text,
    quizJson:     typeof row.quiz_json === "string" ? JSON.parse(row.quiz_json) : row.quiz_json,
    createdBy:    row.created_by,
    creatorName:  row.creator_name || "Anonymous",
    isPublic:     row.is_public,
    createdAt:    new Date(row.created_at).getTime(),
    tags:         ["ai-generated"],
    isAIPassage:  true,
  };
}

export async function saveAIPassage(userId, creatorName, { title, genre, level, wordCount, text, quizJson }) {
  const { data, error } = await supabase.from("ai_passages").insert({
    created_by:   userId,
    creator_name: creatorName,
    title,
    genre,
    level,
    word_count:   wordCount,
    text,
    quiz_json:    JSON.stringify(quizJson),
    is_public:    false,   // private by default; user publishes manually
  }).select().single();
  if (error) throw error;
  return rowToAIPassage(data);
}

export async function fetchMyAIPassages(userId) {
  const { data, error } = await supabase
    .from("ai_passages")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToAIPassage);
}

export async function publishAIPassage(passageId) {
  const { error } = await supabase
    .from("ai_passages")
    .update({ is_public: true })
    .eq("id", passageId);
  if (error) throw error;
}

export async function unpublishAIPassage(passageId) {
  const { error } = await supabase
    .from("ai_passages")
    .update({ is_public: false })
    .eq("id", passageId);
  if (error) throw error;
}

export async function deleteAIPassage(passageId) {
  const { error } = await supabase.from("ai_passages").delete().eq("id", passageId);
  if (error) throw error;
}

export async function updateAIPassageQuiz(passageId, quizJson) {
  const { error } = await supabase
    .from("ai_passages")
    .update({ quiz_json: JSON.stringify(quizJson) })
    .eq("id", passageId);
  if (error) throw error;
}
