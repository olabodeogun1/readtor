import { PASSAGES } from "../constants";

// ── Reader Rank & Title — computed from reading patterns, not just speed ────
// Tiers are checked in order; the LAST one the reader qualifies for wins,
// so more demanding titles (further down the list) override earlier ones.
export const TITLES = [
  { id:"newcomer",    name:"Newcomer",        icon:"🌱", desc:"Just getting started",
    check: () => true },
  { id:"explorer",    name:"The Explorer",    icon:"🧭", desc:"Read across 3+ genres",
    check: s => s.genresRead >= 3 },
  { id:"consistent",  name:"The Consistent",  icon:"📅", desc:"14-day reading streak",
    check: s => s.streak >= 14 },
  { id:"analyst",     name:"The Analyst",     icon:"🔍", desc:"80%+ avg comprehension over 10+ sessions",
    check: s => s.avgComp >= 80 && s.sessionCount >= 10 },
  { id:"sprinter",    name:"The Sprinter",    icon:"⚡", desc:"400+ average WPM",
    check: s => s.avgWpm >= 400 },
  { id:"philosopher", name:"The Philosopher", icon:"🦉", desc:"4+ genres with 75%+ comprehension",
    check: s => s.genresRead >= 4 && s.avgComp >= 75 },
  { id:"marathoner",  name:"The Marathoner",  icon:"🏃", desc:"30-day reading streak",
    check: s => s.streak >= 30 },
  { id:"polymath",    name:"The Polymath",    icon:"👑", desc:"Elite across every dimension",
    check: s => s.genresRead >= 4 && s.avgComp >= 85 && s.avgWpm >= 300 && s.streak >= 21 },
];

// Derive the stats object titles are evaluated against, from raw session history
export function computeReaderStats(sessions, streak) {
  const list = sessions || [];
  const scored = list.filter(s => s.comp > 0);
  const readTitles = new Set(list.map(s => s.passage?.title));
  const genresRead = new Set(
    PASSAGES.filter(p => readTitles.has(p.title)).map(p => p.genre)
  ).size;

  const avgComp = scored.length
    ? Math.round(scored.reduce((a, b) => a + (b.comp || 0), 0) / scored.length)
    : 0;
  const avgWpm = list.length
    ? Math.round(list.reduce((a, b) => a + (b.wpm || 0), 0) / list.length)
    : 0;

  return {
    genresRead,
    avgComp,
    avgWpm,
    sessionCount: list.length,
    streak: streak || 0,
  };
}

// Returns the highest title currently earned
export function computeTitle(stats) {
  let earned = TITLES[0];
  for (const t of TITLES) {
    if (t.check(stats)) earned = t;
  }
  return earned;
}

// Returns the next title to aim for (first one not yet earned, in list order)
export function nextTitle(stats, currentTitleId) {
  const currentIdx = TITLES.findIndex(t => t.id === currentTitleId);
  for (let i = currentIdx + 1; i < TITLES.length; i++) {
    if (!TITLES[i].check(stats)) return TITLES[i];
  }
  return null; // already at the top tier
}
