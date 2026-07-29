import { PASSAGES } from "../constants";


// ── Daily Drop — deterministic day-of-year topic rotation ──────────────

export function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff  = d - start;
  return Math.floor(diff / 86400000);
}

export function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
}

export const DAILY_TOPICS = [
  "a scientific breakthrough", "a historical turning point", "a philosophical question about identity",
  "an economic trend shaping the world", "a discovery in space exploration", "a psychological phenomenon",
  "an environmental challenge", "a technological innovation", "a cultural tradition from around the world",
  "a mathematical curiosity", "an act of human courage", "a mystery in nature",
];

export const DAILY_GENRES = ["academic", "fiction", "vocabulary"];

export function todaysTopic()  { return DAILY_TOPICS[dayOfYear() % DAILY_TOPICS.length]; }

export function todaysGenre()  { return DAILY_GENRES[dayOfYear() % DAILY_GENRES.length]; }

export function todayKey()     { return new Date().toISOString().slice(0, 10); }

// ── Weekly Theme — rotates every Monday via ISO week number ────────────

export const WEEKLY_THEMES = [
  "Space & Astronomy", "Ancient Civilizations", "The Human Mind", "Climate & Nature",
  "Money & Economics", "Art & Creativity", "Great Inventions", "Ocean Mysteries",
  "War & Peace", "Love & Relationships", "The Future of Technology", "Myths & Legends",
];

export function currentWeeklyTheme() { return WEEKLY_THEMES[isoWeek() % WEEKLY_THEMES.length]; }

export function getWeeklyThemeOptIn() { return localStorage.getItem("readtor_weekly_theme_optin") === "true"; }

export function setWeeklyThemeOptIn(v) { localStorage.setItem("readtor_weekly_theme_optin", v ? "true" : "false"); }

// ── Genre Roulette — pick a genre the user hasn't read yet ─────────────

export const ROULETTE_GENRES = ["Science Fiction", "Academic", "Fiction", "Literary Fiction"];

export function pickRoulettePassage(sessions) {
  const readTitles = new Set((sessions || []).map(s => s.passage?.title));
  const readGenres = new Set(
    PASSAGES.filter(p => readTitles.has(p.title)).map(p => p.genre)
  );
  const untried = ROULETTE_GENRES.filter(g => !readGenres.has(g));
  const pool    = untried.length > 0 ? untried : ROULETTE_GENRES;
  const genre   = pool[Math.floor(Math.random() * pool.length)];
  const candidates = PASSAGES.filter(p => p.genre === genre);
  return candidates[Math.floor(Math.random() * candidates.length)] || PASSAGES[0];
}

// ── Reading Mood Selector — match a passage to how the user feels ──────

export const MOODS = [
  { id:"curious",    label:"Curious",    icon:"🔍", desc:"Something to make you think" },
  { id:"focused",    label:"Focused",    icon:"🎯", desc:"Short, structured, no fluff"   },
  { id:"relaxed",    label:"Relaxed",    icon:"🌙", desc:"Easy, calm, low pressure"      },
  { id:"challenged", label:"Challenged", icon:"🔥", desc:"Push your limits"              },
];

export function pickPassageByMood(mood, userLevel = 3) {
  let pool;
  switch (mood) {
    case "curious":
      pool = PASSAGES.filter(p => ["Academic","Science Fiction"].includes(p.genre) && p.level >= 6);
      break;
    case "focused":
      pool = PASSAGES.filter(p => p.wordCount <= 265 && p.genre === "Academic");
      break;
    case "relaxed":
      pool = PASSAGES.filter(p => ["Fiction","Literary Fiction"].includes(p.genre) && p.level <= 5);
      break;
    case "challenged":
      pool = PASSAGES.filter(p => p.level >= 8);
      break;
    default:
      pool = PASSAGES;
  }
  if (pool.length === 0) pool = PASSAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}
