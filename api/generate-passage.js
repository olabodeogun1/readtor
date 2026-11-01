// Vercel serverless function — generates a reading passage with Groq.
//
// Runs on the server, so GROQ_API_KEY never reaches the browser and there is
// no CORS problem (the frontend calls this same-origin endpoint).
//
// WHY IT IS BUILT THIS WAY
// Groq retires models regularly. On 16 Aug 2026 it stopped serving
// llama-3.1-8b-instant and llama-3.3-70b-versatile to free/developer keys, so
// any request naming them now fails with
//   404 model_not_found: "The model `…` does not exist or you do not have access to it."
// Instead of trusting one hardcoded name, this function:
//   1. asks Groq which models exist (GET /models) and drops non-chat ones,
//   2. ranks them: models Groq serves to free keys today first, unknown new
//      models next, retired Llama/Gemma/Mixtral names last,
//   3. tries them in order until one returns a clean passage (a 404, 429,
//      timeout or empty answer simply moves on to the next model),
//   4. strips "thinking" text that reasoning models can emit,
//   5. remembers models that 404 so later requests skip them.
//
// CHECK WHICH VERSION IS LIVE: open  https://<your-site>/api/generate-passage
// in a browser. This code answers with JSON that contains "version";
// the older code answers {"error":"Method not allowed"}.

const VERSION = "generate-passage v4 · 2026-10-16";
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
const MAX_PROMPT_CHARS   = 4000;

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

const SYSTEM = "You are a reading education assistant. Write engaging, high-quality passages for "
  + "reading practice, suitable for readers aged 13 and over: no sexual content, graphic violence, "
  + "hate speech or profanity. Return ONLY the passage text itself — no title, no preamble, "
  + "no word count, no commentary. Start immediately with the first sentence.";

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
function maxTokensFor(prompt, model) {
  const m = prompt.match(/(\d{2,4})\s*-?\s*words?/i);
  const words = Math.min(m ? parseInt(m[1], 10) : 400, 1200);
  const room = needsThinkingRoom(model) ? 800 : 150;
  return Math.max(600, Math.min(3000, Math.ceil(words * 1.5) + room));
}

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

// ─── cleaning the model's answer ───────────────────────────────────────────

function cleanPassage(raw, finishReason) {
  let t = String(raw ?? "");
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, "");          // finished "thinking" block
  if (/<think>/i.test(t)) return "";                         // unfinished thinking → unusable
  t = t.replace(/^\s*```[a-z]*\s*\n?|\n?```\s*$/gi, "").trim();   // stray code fences
  // chatty lead-in such as "Here is a 300-word passage for level 3:"
  t = t.replace(/^(?:here(?:'|’)?s|here is|here are|sure|certainly|of course|okay)\b[^\n]{0,160}\b(?:passage|story|text|essay|piece|version|fiction|summary)\b[^\n]{0,80}:\s*\n+/i, "");
  // trailing "(Word count: 300)"
  t = t.replace(/\n+\s*[(\[]?\s*word\s*count\s*[:=]?\s*\d+\s*(?:words)?\s*[)\]]?\.?\s*$/i, "");
  t = t.trim();
  // Hit the token limit mid-sentence? Keep everything up to the last complete sentence.
  if (finishReason === "length") {
    const m = t.match(/^[\s\S]*[.!?]["”’)]*(?=\s|$)/);
    if (m) t = m[0].trim();
  }
  return t;
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

  // Health check: open /api/generate-passage in a browser to see which version is live.
  if (req.method === "GET") {
    const out = { ok: true, endpoint: "generate-passage", version: VERSION, hasKey: Boolean(apiKey) };
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
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) { res.status(400).json({ error: "Missing prompt" }); return; }
  if (prompt.length > MAX_PROMPT_CHARS) { res.status(400).json({ error: "Prompt too long" }); return; }

  if (!apiKey) {
    res.status(500).json({ error: "Server not configured — missing GROQ_API_KEY", version: VERSION });
    return;
  }

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const { models: candidates } = await getCandidates(apiKey);
  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user",   content: prompt },
  ];
  const attempts = [];

  for (const model of candidates) {
    if (deadline - Date.now() < MIN_ATTEMPT_MS) {
      attempts.push({ model, error: "skipped — out of time" });
      break;
    }
    try {
      const r = await chatOnce(apiKey, model, messages, 0.8, maxTokensFor(prompt, model), deadline);
      if (!r.ok) {
        if (r.status === 404) cache.dead.add(model);
        attempts.push({ model, status: r.status, error: groqMessage(r.raw) });
        continue;
      }
      const choice = JSON.parse(r.raw)?.choices?.[0];
      const text = cleanPassage(choice?.message?.content, choice?.finish_reason);
      if (text.length < 80) {
        attempts.push({ model, status: 200, error: `empty or unusable answer (finish_reason: ${choice?.finish_reason || "n/a"})` });
        continue;
      }
      res.status(200).json({ text, model, version: VERSION });
      return;
    } catch (e) {
      attempts.push({ model, error: e?.name === "AbortError" ? "timed out" : String(e?.message || e).slice(0, 160) });
    }
  }

  cache.models = null;   // look the model list up again on the next request
  const last = attempts[attempts.length - 1];
  const details = last
    ? `Groq ${last.model}${last.status ? " HTTP " + last.status : ""}: ${last.error}`
    : "no models available";
  console.error("generate-passage failed", JSON.stringify(attempts));
  res.status(502).json({
    error: "AI generation failed",
    details,
    triedModels: candidates,
    attempts,
    hint: hintFor(attempts),
    version: VERSION,
  });
}
