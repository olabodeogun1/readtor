// ── Milestone Celebrations — one-time full-screen moments, not badges ───────
export const MILESTONES = [
  {
    id:    "words_1000",
    title: "Word Explorer",
    desc:  "You've read over 1,000 words in Readtor. Every word is a step toward faster, deeper reading.",
    icon:  "📖",
    color: "#3ecfb0",
    check: s => s.totalWords >= 1000,
  },
  {
    id:    "perfect_quiz",
    title: "Perfect Score",
    desc:  "You scored 100% on a comprehension quiz. Total understanding — that's the goal every time.",
    icon:  "🎯",
    color: "#e8a838",
    check: s => s.hasPerfectQuiz,
  },
  {
    id:    "streak_30",
    title: "30-Day Devotion",
    desc:  "You've shown up to read for 30 days straight. That's not luck — that's a habit.",
    icon:  "🔥",
    color: "#ff7043",
    check: s => s.streak >= 30,
  },
];

// Given current stats and the list of milestone ids already achieved,
// return any NEW milestones just crossed (in definition order)
export function checkNewMilestones(stats, achieved = []) {
  return MILESTONES.filter(m => m.check(stats) && !achieved.includes(m.id));
}
