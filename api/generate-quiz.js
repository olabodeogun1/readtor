// Vercel serverless function — generates 5 quiz questions for a passage with Groq.
//
// Runs on the server; the frontend calls this same-origin endpoint, so there is
// no CORS problem and GROQ_API_KEY never reaches the browser.
//
// Same self-healing model selection as generate-passage.js. Groq retires models
// regularly (llama-3.1-8b-instant and llama-3.3-70b-versatile stopped being served
// to free/developer keys on 16 Aug 2026), so instead of trusting one hardcoded name
// this function asks Groq which models exist, ranks them (models served today first,
// retired names last) and tries them in order until one returns a usable quiz.
// It also repairs common JSON slips from models (answer given as "B" or "2",
// "options" instead of "choices", reasoning text before the JSON, …).
//
// CHECK WHICH VERSION IS LIVE: open  https://<your-site>/api/generate-quiz
// in a browser. This code answers with JSON that contains "version";
// the older code answers {"error":"Method not allowed"}.

const VERSION = "generate-quiz v4 · 2026-10-16";
const GROQ = "https://api.groq.com/openai/v1";

// Time limits in ms. Kept under 10 s so the function always answers with JSON,
// even on an older Vercel project limited to 10 s. Raise them if your plan
// allows more (Hobby projects on Fluid compute allow up to 300 s).
const TOTAL_BUDGET_MS    = 9500;  // whole request
const MODELS_TIMEOUT_MS  = 2500;  // GET /models
const ATTEMPT_TIMEOUT_MS = 7500;  // one chat call
const MIN_ATTEMPT_MS     = 1200;  // don't start another model with less time left than this
const MAX_ATTEMPTS       = 8;
const CACHE_MS           = 10 * 60 * 1000;
const MAX_PASSAGE_CHARS  = 4000;  // how much of the passage the model sees (~700 words)
const WANTED             = 5;     // questions per quiz
const MIN_ACCEPTABLE     = 3;     // fewer valid questions than this = failure

// Served to free/developer keys as of Oct 2026 (console.groq.com/docs/models), best first.
const CURRENT = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
];

// Retired for free/developer keys (console.groq.com/docs/deprecations).
// Tried last, in case an enterprise key still has them.
const LEGACY = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.1-70b-versatile",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];

// Never used for text generation: speech, transcription, safety classifiers…
const NOT_CHAT = /whisper|guard|tts|audio|orpheus|playai|embed|transcri|speech|moderation|rerank/i;
// Unusual or very slow models: allowed, but only after everything else.
const ODD = /compound|muse|minimax|allam/i;

const SYSTEM = "You are a quiz creator. Return only raw JSON, no markdown, no commentary.";

// Server-side memory that survives between requests while this instance stays warm.
const cache = { models: null, at: 0, source: null, dead: new Set() };

// ─── model selection ───────────────────────────────────────────────────────

function rank(id) {
  const c = CURRENT.indexOf(id);
  if (c !== -1) return c;               // models served today
  const l = LEGACY.indexOf(id);
  if (l !== -1) return 300 + l;         // retired names
  if (ODD.test(id)) return 500;         // odd / slow
  return 100;                           // unknown new models (kept in the order Groq lists them)
}

async function groqFetch(path, apiKey, init, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(GROQ + path, {
      ...init,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      signal: ctrl.signal,
    });
    const raw = await r.text();         // read the body inside the timeout window too
    return { ok: r.ok, status: r.status, raw };
  } finally {
    clearTimeout(timer);
  }
}

async function discoverModels(apiKey) {
  try {
    const r = await groqFetch("/models", apiKey, { method: "GET" }, MODELS_TIMEOUT_MS);
    if (!r.ok) return [];
    const list = JSON.parse(r.raw)?.data;
    if (!Array.isArray(list)) return [];
    const ids = list
      .filter(m => m && typeof m.id === "string" && m.active !== false)
      .filter(m => !(m.context_window && m.context_window < 4096))
      .map(m => m.id)
      .filter(id => !NOT_CHAT.test(id));
    return [...new Set(ids)].sort((a, b) => rank(a) - rank(b));   // stable sort
  } catch {
    return [];
  }
}

async function getCandidates(apiKey) {
  const fresh = cache.models && Date.now() - cache.at < CACHE_MS;
  let models = fresh ? cache.models : null;
  let source = cache.source;
  if (!models) {
    models = await discoverModels(apiKey);
    if (models.length) {
      Object.assign(cache, { models, at: Date.now(), source: "groq-live" });
      cache.dead.clear();
      source = "groq-live";
    } else {
      models = [...CURRENT, ...LEGACY];   // Groq's list is unreachable → best guesses
      source = "fallback-guess";
    }
  }
  let live = models.filter(m => !cache.dead.has(m));
  if (!live.length) { cache.dead.clear(); live = models; }
  return { models: live.slice(0, MAX_ATTEMPTS), source };
}

// ─── calling Groq ──────────────────────────────────────────────────────────

const isGptOss = (m) => /gpt-oss/i.test(m);
const isQwen   = (m) => /qwen/i.test(m);
const needsThinkingRoom = (m) => isGptOss(m) || /muse|minimax|compound|r1|qwq/i.test(m);

// Optional settings that keep "thinking" models short and their answers clean.
// If a model rejects them (HTTP 400) the call is retried once without them.
function reasoningParams(model) {
  if (isGptOss(model)) return { reasoning_effort: "low", include_reasoning: false };
  if (isQwen(model))   return { reasoning_effort: "none" };
  return {};
}

// Thinking models spend part of the token limit on reasoning, so leave room for it.
const maxTokensFor = (model) => (needsThinkingRoom(model) ? 2000 : 1200);

async function chatOnce(apiKey, model, messages, temperature, maxTokens, deadline) {
  const send = (extra) => {
    const ms = Math.min(ATTEMPT_TIMEOUT_MS, deadline - Date.now());
    if (ms < 300) throw new Error("out of time");
    return groqFetch("/chat/completions", apiKey, {
      method: "POST",
      body: JSON.stringify({ model, messages, temperature, ...extra }),
    }, ms);
  };
  let r = await send({ max_completion_tokens: maxTokens, ...reasoningParams(model) });
  if (r.status === 400) r = await send({ max_tokens: maxTokens });   // plain retry, legacy parameter name
  return r;
}

// ─── the quiz itself ───────────────────────────────────────────────────────

function buildPrompt(passageText) {
  return "Return ONLY a raw JSON array — no markdown, no explanation, no code fences.\n\n"
    + `Create exactly ${WANTED} quiz questions for this passage:\n\n`
    + passageText.slice(0, MAX_PASSAGE_CHARS) + "\n\n"
    + `JSON array of ${WANTED} objects: { "id":"q1", "type":"mc", "q":"question", `
    + '"choices":["A","B","C","D"], "correct":0, "exp":"explanation" }\n'
    + '"correct" is the 0-based index of the right choice.\n'
    + 'For true/false: type "tf", choices ["True","False"].\n'
    + "Output ONLY the JSON array starting with [";
}

// Turns one question object from the model into the exact shape the app expects,
// or returns null if it is unusable.
function normaliseQuestion(q) {
  if (!q || typeof q !== "object") return null;
  const text = String(q.q ?? q.question ?? "").trim();
  if (!text) return null;

  const isTF = /^(tf|true|bool)/i.test(String(q.type || ""));
  const rawChoices = q.choices ?? q.options;
  let choices = Array.isArray(rawChoices) ? rawChoices.map(c => String(c).trim()).filter(Boolean) : [];
  if (isTF && choices.length !== 2) choices = ["True", "False"];
  if (choices.length < 2) return null;

  const c = q.correct ?? q.answer ?? q.correct_answer ?? q.correctAnswer ?? q.correctIndex;
  let idx = -1;
  if (typeof c === "boolean")      idx = isTF ? (c ? 0 : 1) : -1;
  else if (typeof c === "number")  idx = Number.isInteger(c) ? c : -1;
  else if (typeof c === "string") {
    const s = c.trim();
    if (/^[A-Za-z]$/.test(s))      idx = s.toUpperCase().charCodeAt(0) - 65;   // "B" → 1
    else if (/^\d+$/.test(s))      idx = parseInt(s, 10);                       // "2" → 2 (0-based, as requested)
    else                           idx = choices.findIndex(ch => ch.toLowerCase() === s.toLowerCase());
  }
  if (!(idx >= 0 && idx < choices.length)) return null;

  const exp = String(q.exp ?? q.explanation ?? "").trim() || "See the passage.";
  return { type: isTF ? "tf" : "mc", q: text, choices, correct: idx, exp };
}

// Index of the "]" that closes the "[" at `start` (ignores brackets inside strings), or -1.
function balancedArrayEnd(t, start) {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "[") depth++;
    else if (ch === "]") { depth--; if (depth === 0) return i; }
  }
  return -1;
}

// Finds the quiz array inside whatever the model wrote around it
// (a "[Note]" before it, "(see [1])" after it, pretty-printed or not, trailing commas…).
function findJsonArray(t) {
  let from = 0, lastErr = null;
  for (let tries = 0; tries < 12; tries++) {
    const s = t.indexOf("[", from);
    if (s === -1) break;
    from = s + 1;
    const e = balancedArrayEnd(t, s);
    if (e === -1) continue;
    const chunk = t.slice(s, e + 1);
    for (const candidate of [chunk, chunk.replace(/,\s*([}\]])/g, "$1")]) {   // 2nd try: drop trailing commas
      try {
        const arr = JSON.parse(candidate);
        if (Array.isArray(arr) && arr.some(x => x && typeof x === "object")) return arr;
      } catch (err) { lastErr = err; }
    }
  }
  throw lastErr || new Error("no JSON array in answer");
}

function parseQuiz(raw) {
  let t = String(raw ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "");   // finished "thinking" block
  if (/<think>/i.test(t)) throw new Error("unfinished reasoning in answer");
  t = t.replace(/```(?:json)?/gi, "").trim();                             // code fences
  return findJsonArray(t).map(normaliseQuestion).filter(Boolean).map((q, i) => ({ id: "q" + (i + 1), ...q }));
}

function groqMessage(raw) {
  try {
    const m = JSON.parse(raw)?.error?.message;
    if (m) return String(m).slice(0, 220);
  } catch { /* not JSON */ }
  return String(raw || "").replace(/\s+/g, " ").slice(0, 220);
}

function hintFor(attempts) {
  if (attempts.some(a => a.status === 401 || a.status === 403))
    return "Groq refused the request (401/403). Check that GROQ_API_KEY in Vercel is correct and active (console.groq.com/keys), then redeploy.";
  if (attempts.length && attempts.every(a => a.status === 404))
    return "Groq says this key can use none of the models tried. Check your Groq organisation's model access, or create a fresh API key.";
  if (attempts.some(a => a.status === 429))
    return "Groq rate limit reached. Wait a minute and try again (free keys have small daily token limits).";
  return undefined;
}

// ─── the endpoint ──────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const apiKey = process.env.GROQ_API_KEY;

  // Health check: open /api/generate-quiz in a browser to see which version is live.
  if (req.method === "GET") {
    const out = { ok: true, endpoint: "generate-quiz", version: VERSION, hasKey: Boolean(apiKey) };
    if (apiKey) {
      const { models, source } = await getCandidates(apiKey);
      out.modelSource = source;
      out.models = models;
    }
    res.status(200).json(out);
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  const passageText = typeof body?.passageText === "string" ? body.passageText.trim() : "";
  if (!passageText) { res.status(400).json({ error: "Missing passageText" }); return; }

  if (!apiKey) {
    res.status(500).json({ error: "Server not configured — missing GROQ_API_KEY", version: VERSION });
    return;
  }

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const { models: candidates } = await getCandidates(apiKey);
  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user",   content: buildPrompt(passageText) },
  ];
  const attempts = [];
  let best = null;   // the best incomplete quiz so far (3–4 valid questions), used only if no model gives all 5

  for (const model of candidates) {
    if (deadline - Date.now() < MIN_ATTEMPT_MS) {
      attempts.push({ model, error: "skipped — out of time" });
      break;
    }
    try {
      const r = await chatOnce(apiKey, model, messages, 0.5, maxTokensFor(model), deadline);
      if (!r.ok) {
        if (r.status === 404) cache.dead.add(model);
        attempts.push({ model, status: r.status, error: groqMessage(r.raw) });
        continue;
      }
      const choice = JSON.parse(r.raw)?.choices?.[0];
      const questions = parseQuiz(choice?.message?.content);

      if (questions.length >= WANTED) {
        res.status(200).json({ questions: questions.slice(0, WANTED), model, version: VERSION });
        return;
      }
      if (questions.length >= MIN_ACCEPTABLE && (!best || questions.length > best.questions.length)) {
        best = { questions, model };
      }
      attempts.push({ model, status: 200, error: `only ${questions.length} usable question(s)` });
    } catch (e) {
      attempts.push({ model, error: e?.name === "AbortError" ? "timed out" : String(e?.message || e).slice(0, 160) });
    }
  }

  if (best) {   // no model produced all 5 — a shorter quiz is better than none
    res.status(200).json({ questions: best.questions, model: best.model, partial: true, version: VERSION });
    return;
  }

  cache.models = null;   // look the model list up again on the next request
  const last = attempts[attempts.length - 1];
  const details = last
    ? `Groq ${last.model}${last.status ? " HTTP " + last.status : ""}: ${last.error}`
    : "no models available";
  console.error("generate-quiz failed", JSON.stringify(attempts));
  res.status(502).json({
    error: "Quiz generation failed",
    details,
    triedModels: candidates,
    attempts,
    hint: hintFor(attempts),
    version: VERSION,
  });
}
