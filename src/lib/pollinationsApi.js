// ── AI passage / quiz generation ──────────────────────────────────────────
// Two free, no-key providers are tried in sequence:
//   1. Pollinations AI  (text.pollinations.ai)
//   2. HackClub AI      (ai.hackclub.com) — OpenAI-compatible, free, no key
// Each request has a timeout so a hung provider fails fast instead of
// leaving the user staring at a spinner forever.

const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url, options = {}, ms = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// ── Pollinations response cleaner ─────────────────────────────────────────
// Pollinations sometimes returns a reasoning JSON blob instead of plain text:
//   {"role":"assistant","reasoning_content":"...thinking...draft...","tool_calls":[]}
// The actual passage is buried inside reasoning_content after "Draft:" or
// "Let's write:". extractPassageFromPollinations() extracts it reliably.
function extractPassageFromPollinations(raw) {
  const trimmed = raw.trim();

  if (!trimmed.startsWith("{")) {
    const clean = trimmed.replace(/^```[\w]*\n?|```$/gm, "").trim();
    if (clean.length >= 80) return clean;
  }

  let reasoning = "";
  try {
    const parsed = JSON.parse(trimmed);
    const direct = parsed.content || parsed.text ||
      (Array.isArray(parsed.choices) && parsed.choices[0]?.message?.content);
    if (direct && typeof direct === "string" && direct.length >= 80 &&
        !direct.includes("reasoning_content")) {
      return direct.trim();
    }
    reasoning = parsed.reasoning_content || "";
  } catch(e) {
    const rcMatch = trimmed.match(/"reasoning_content"\s*:\s*"([\s\S]+?)(?:",\s*"tool_calls"|"\s*}|$)/);
    if (rcMatch) reasoning = rcMatch[1];
  }

  if (!reasoning) return null;

  reasoning = reasoning
    .replace(/\\n/g, "\n").replace(/\\t/g, "\t")
    .replace(/\\"/g, '"').replace(/\\\\/g, "\\");

  const draftPatterns = [
    /(?:Draft:|Let's write:|Let me write:|Here(?:'s| is)(?: the)? passage:)\s*\n+["\u201c]?([\s\S]+?)["\u201d]?\s*\n+(?:Now count|Let's count|We have|Word count|Count:|\d+\s*words?\.)/i,
    /(?:Draft:|Let's write:)\s*\n+"([\s\S]+?)"\s*\n/i,
    /(?:Draft:|Let's write:)\s*\n\n([\s\S]+?)\n\nNow/i,
  ];
  for (const pattern of draftPatterns) {
    const m = reasoning.match(pattern);
    if (m && m[1] && m[1].trim().length >= 80) {
      return m[1].trim().replace(/^["\u201c]|["\u201d]$/g, "").trim();
    }
  }

  const quotedBlocks = [...reasoning.matchAll(/"([\s\S]{100,})"/g)];
  if (quotedBlocks.length > 0) {
    const longest = quotedBlocks.reduce((a, b) => a[1].length > b[1].length ? a : b);
    const candidate = longest[1].trim();
    if (!candidate.includes("reasoning_content") && !candidate.includes("Let's")) {
      return candidate;
    }
  }

  const paragraphs = reasoning.split(/\n{2,}/);
  const metaMarkers = ["Let's", "I'll ", "We need", "We'll", "Now count",
    "Word count", "Let me", "Draft:", "Count:", "words.\n", "I will "];
  for (const para of paragraphs) {
    const p = para.trim().replace(/^["\u201c]|["\u201d]$/g, "");
    const isMeta = metaMarkers.some(m => p.includes(m)) ||
      /^\d+\.\s/.test(p) || p.startsWith("{") || p.startsWith("[");
    if (!isMeta && p.length >= 80 && /^[A-Z"'\u201c\u2018]/.test(p)) {
      return p;
    }
  }
  return null;
}

// ── Provider 1: Pollinations AI (text.pollinations.ai) ────────────────────
async function tryPollinationsPassage(prompt) {
  const body = "Write a reading passage. Output ONLY the passage text — no title, no preamble, "
    + "no word count, no commentary. Start immediately with the first sentence.\n\n" + prompt;
  const encoded = encodeURIComponent(body);
  const res = await fetchWithTimeout("https://text.pollinations.ai/" + encoded);
  if (!res.ok) throw new Error("Pollinations HTTP " + res.status);
  const raw  = await res.text();
  const text = extractPassageFromPollinations(raw);
  if (!text || text.length < 80) throw new Error("Pollinations: unparseable or too short");
  return text;
}

// ── Provider 2: HackClub AI (ai.hackclub.com) ──────────────────────────────
// Free, no API key required, OpenAI-compatible chat completions format.
async function tryHackClubPassage(prompt) {
  const system = "You are a reading education assistant. Generate high-quality engaging "
    + "passages for reading practice. Return ONLY the passage text itself — no title, "
    + "no preamble, no word count, no commentary. Start immediately with the first sentence.";
  const res = await fetchWithTimeout("https://ai.hackclub.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: system },
        { role: "user",   content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error("HackClub AI HTTP " + res.status);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text || text.length < 80) throw new Error("HackClub AI: empty or too short");
  return text;
}

// Passage generation — tries Pollinations first, falls back to HackClub AI
export async function generateWithAI(prompt) {
  const providers = [tryPollinationsPassage, tryHackClubPassage];
  const failures = [];
  for (const provider of providers) {
    try {
      return await provider(prompt);
    } catch(e) {
      failures.push(e.message);
    }
  }
  console.error("All AI providers failed:", failures.join(" | "));
  throw new Error("Generation failed — our free AI providers are busy right now. Please try again in a moment.");
}

// ── Quiz generation — same two-provider fallback pattern ──────────────────
function buildQuizPrompt(passageText) {
  return "Return ONLY a raw JSON array — no markdown, no explanation, no code fences.\n\n"
    + "Create exactly 5 quiz questions for this passage:\n\n"
    + passageText.slice(0, 2500) + "\n\n"
    + 'JSON array of 5 objects: { "id":"q1", "type":"mc", "q":"question", '
    + '"choices":["A","B","C","D"], "correct":0, "exp":"explanation" }\n'
    + 'For true/false: type "tf", choices ["True","False"].\n'
    + "Output ONLY the JSON array starting with [";
}

function extractQuizJson(rawText) {
  let jsonStr = rawText.trim();
  // Response may be wrapped in a Pollinations reasoning blob
  if (jsonStr.startsWith("{")) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.reasoning_content) {
        jsonStr = parsed.reasoning_content.replace(/\\n/g, "\n").replace(/\\"/g, '"');
      } else if (parsed.choices?.[0]?.message?.content) {
        // OpenAI-style wrapper (shouldn't normally hit this path, but just in case)
        jsonStr = parsed.choices[0].message.content;
      }
    } catch(e) {
      const rcMatch = jsonStr.match(/"reasoning_content"\s*:\s*"([\s\S]+?)(?:",\s*"tool_calls"|$)/);
      if (rcMatch) jsonStr = rcMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
  }
  jsonStr = jsonStr.replace(/```json|```/g, "").trim();
  const arrStart = jsonStr.indexOf("[");
  const arrEnd   = jsonStr.lastIndexOf("]");
  if (arrStart === -1 || arrEnd === -1) throw new Error("No JSON array found");
  const parsed = JSON.parse(jsonStr.slice(arrStart, arrEnd + 1));
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Invalid quiz array");
  return parsed;
}

function normaliseQuiz(parsed) {
  return parsed.slice(0, 5).map((q, i) => ({
    id:      q.id      || "q" + (i + 1),
    type:    q.type    || "mc",
    q:       q.q       || q.question || "Question",
    choices: Array.isArray(q.choices) ? q.choices : ["True", "False"],
    correct: typeof q.correct === "number" ? q.correct : 0,
    exp:     q.exp     || q.explanation || "See passage.",
  }));
}

async function tryPollinationsQuiz(passageText) {
  const encoded = encodeURIComponent(buildQuizPrompt(passageText));
  const res = await fetchWithTimeout("https://text.pollinations.ai/" + encoded);
  if (!res.ok) throw new Error("Pollinations HTTP " + res.status);
  const raw = await res.text();
  return normaliseQuiz(extractQuizJson(raw));
}

async function tryHackClubQuiz(passageText) {
  const res = await fetchWithTimeout("https://ai.hackclub.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are a quiz creator. Return only raw JSON, no markdown." },
        { role: "user",   content: buildQuizPrompt(passageText) },
      ],
    }),
  });
  if (!res.ok) throw new Error("HackClub AI HTTP " + res.status);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("HackClub AI: empty response");
  return normaliseQuiz(extractQuizJson(text));
}

// Generates 5 comprehension questions — Pollinations first, HackClub AI fallback
export async function generateQuizForPassage(passageText, passageTitle) {
  const providers = [tryPollinationsQuiz, tryHackClubQuiz];
  const failures = [];
  for (const provider of providers) {
    try {
      return await provider(passageText);
    } catch(e) {
      failures.push(e.message);
    }
  }
  console.error("All quiz providers failed:", failures.join(" | "));
  throw new Error("Quiz generation failed — please try again.");
}
