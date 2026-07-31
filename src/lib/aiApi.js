// ── AI passage / quiz generation ──────────────────────────────────────────
// Calls our own Vercel serverless functions (/api/generate-passage,
// /api/generate-quiz) instead of a third-party AI API directly from the
// browser. This avoids CORS entirely (same-origin request) and keeps the
// Groq API key secret on the server — it never reaches client code.

async function callApi(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error
      ? data.error + (data.details ? ": " + data.details : "")
      : "Request failed (" + res.status + ")";
    throw new Error(msg);
  }
  return data;
}

// Passage generation
export async function generateWithAI(prompt) {
  try {
    const { text } = await callApi("/api/generate-passage", { prompt });
    if (!text) throw new Error("Empty response from server");
    return text;
  } catch(e) {
    console.error("Passage generation failed:", e.message);
    throw new Error("Generation failed — please try again in a moment.");
  }
}

// Generates 5 comprehension questions for a passage
export async function generateQuizForPassage(passageText, passageTitle) {
  try {
    const { questions } = await callApi("/api/generate-quiz", { passageText });
    if (!Array.isArray(questions) || questions.length === 0) throw new Error("Empty quiz response");
    return questions.slice(0, 5).map((q, i) => ({
      id:      q.id      || "q" + (i + 1),
      type:    q.type    || "mc",
      q:       q.q       || q.question || "Question",
      choices: Array.isArray(q.choices) ? q.choices : ["True", "False"],
      correct: typeof q.correct === "number" ? q.correct : 0,
      exp:     q.exp     || q.explanation || "See passage.",
    }));
  } catch(e) {
    console.error("Quiz generation failed:", e.message);
    throw new Error("Quiz generation failed — please try again.");
  }
}
