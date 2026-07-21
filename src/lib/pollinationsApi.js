// ── Pollinations AI helpers ────────────────────────────────────────────────
// Pollinations sometimes returns a reasoning JSON blob instead of plain text:
//   {"role":"assistant","reasoning_content":"...thinking...draft...","tool_calls":[]}
// The actual passage is buried inside reasoning_content after "Draft:" or
// "Let's write:". extractPassageFromPollinations() extracts it reliably.

function extractPassageFromPollinations(raw) {
  const trimmed = raw.trim();

  // Case A: plain text response (no JSON wrapping) — use directly
  if (!trimmed.startsWith("{")) {
    const clean = trimmed.replace(/^```[\w]*\n?|```$/gm, "").trim();
    if (clean.length >= 80) return clean;
  }

  // Case B: JSON response — parse out reasoning_content
  let reasoning = "";
  try {
    const parsed = JSON.parse(trimmed);
    // If there's a direct content field with a real passage, use it
    const direct = parsed.content || parsed.text ||
      (Array.isArray(parsed.choices) && parsed.choices[0]?.message?.content);
    if (direct && typeof direct === "string" && direct.length >= 80 &&
        !direct.includes("reasoning_content")) {
      return direct.trim();
    }
    reasoning = parsed.reasoning_content || "";
  } catch(e) {
    // Truncated JSON — extract reasoning_content with regex
    const rcMatch = trimmed.match(/"reasoning_content"\s*:\s*"([\s\S]+?)(?:",\s*"tool_calls"|"\s*}|$)/);
    if (rcMatch) reasoning = rcMatch[1];
  }

  if (!reasoning) return null;

  // Unescape JSON string escapes so we can read the content
  reasoning = reasoning
    .replace(/\\n/g, "\n").replace(/\\t/g, "\t")
    .replace(/\\"/g, '"').replace(/\\\\/g, "\\");

  // Strategy 1: passage sits in quotes after "Draft:" / "Let's write:" markers
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

  // Strategy 2: longest quoted block in reasoning that isn't meta-commentary
  const quotedBlocks = [...reasoning.matchAll(/"([\s\S]{100,})"/g)];
  if (quotedBlocks.length > 0) {
    const longest = quotedBlocks.reduce((a, b) => a[1].length > b[1].length ? a : b);
    const candidate = longest[1].trim();
    if (!candidate.includes("reasoning_content") && !candidate.includes("Let's")) {
      return candidate;
    }
  }

  // Strategy 3: first prose paragraph that doesn't look like meta-commentary
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

// Passage generation using Pollinations AI (free, no key needed)
export async function generateWithAI(prompt) {
  const body = "Write a reading passage. Output ONLY the passage text — no title, no preamble, "
    + "no word count, no commentary. Start immediately with the first sentence.\n\n" + prompt;
  const encoded = encodeURIComponent(body);
  try {
    const res = await fetch("https://text.pollinations.ai/" + encoded);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const raw  = await res.text();
    const text = extractPassageFromPollinations(raw);
    if (text && text.length >= 80) return text;
    throw new Error("Response too short or unparseable");
  } catch(e) {
    throw new Error("Generation failed — Pollinations AI may be busy. Please try again.");
  }
}

// Generates 5 comprehension questions using Pollinations AI.
export async function generateQuizForPassage(passageText, passageTitle) {
  const body = "Return ONLY a raw JSON array — no markdown, no explanation, no code fences.\n\n"
    + "Create exactly 5 quiz questions for this passage:\n\n"
    + passageText.slice(0, 2500) + "\n\n"
    + 'JSON array of 5 objects: { "id":"q1", "type":"mc", "q":"question", '
    + '"choices":["A","B","C","D"], "correct":0, "exp":"explanation" }\n'
    + 'For true/false: type "tf", choices ["True","False"].\n'
    + "Output ONLY the JSON array starting with [";

  const encoded = encodeURIComponent(body);
  const res = await fetch("https://text.pollinations.ai/" + encoded);
  if (!res.ok) throw new Error("Quiz generation failed — HTTP " + res.status);
  const raw = await res.text();

  // Extract JSON — response may be wrapped in a reasoning blob
  let jsonStr = raw.trim();
  if (jsonStr.startsWith("{")) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.reasoning_content) {
        jsonStr = parsed.reasoning_content
          .replace(/\\n/g, "\n").replace(/\\"/g, '"');
      }
    } catch(e) {
      const rcMatch = jsonStr.match(/"reasoning_content"\s*:\s*"([\s\S]+?)(?:",\s*"tool_calls"|$)/);
      if (rcMatch) jsonStr = rcMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
  }

  // Strip markdown fences and find the JSON array
  jsonStr = jsonStr.replace(/```json|```/g, "").trim();
  const arrStart = jsonStr.indexOf("[");
  const arrEnd   = jsonStr.lastIndexOf("]");
  if (arrStart === -1 || arrEnd === -1) throw new Error("No JSON array in quiz response");

  const parsed = JSON.parse(jsonStr.slice(arrStart, arrEnd + 1));
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Invalid quiz array");

  return parsed.slice(0, 5).map((q, i) => ({
    id:      q.id      || "q" + (i + 1),
    type:    q.type    || "mc",
    q:       q.q       || q.question || "Question",
    choices: Array.isArray(q.choices) ? q.choices : ["True", "False"],
    correct: typeof q.correct === "number" ? q.correct : 0,
    exp:     q.exp     || q.explanation || "See passage.",
  }));
}
