// Vercel serverless function — generates 5 quiz questions for a passage via Groq.
// Runs server-side; the frontend calls this same-origin endpoint (no CORS issue).

const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

function buildPrompt(passageText) {
  return "Return ONLY a raw JSON array — no markdown, no explanation, no code fences.\n\n"
    + "Create exactly 5 quiz questions for this passage:\n\n"
    + passageText.slice(0, 2500) + "\n\n"
    + 'JSON array of 5 objects: { "id":"q1", "type":"mc", "q":"question", '
    + '"choices":["A","B","C","D"], "correct":0, "exp":"explanation" }\n'
    + 'For true/false: type "tf", choices ["True","False"].\n'
    + "Output ONLY the JSON array starting with [";
}

function extractJsonArray(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end   = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found in model response");
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Invalid quiz array");
  return parsed;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { passageText } = req.body || {};
  if (!passageText || typeof passageText !== "string") {
    res.status(400).json({ error: "Missing passageText" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server not configured — missing GROQ_API_KEY" });
    return;
  }

  const prompt = buildPrompt(passageText);
  let lastError = null;

  for (const model of MODELS) {
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a quiz creator. Return only raw JSON, no markdown, no commentary." },
            { role: "user",   content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 1200,
        }),
      });

      if (!groqRes.ok) {
        lastError = `Groq ${model} HTTP ${groqRes.status}: ${(await groqRes.text()).slice(0, 200)}`;
        continue;
      }

      const data = await groqRes.json();
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) { lastError = `Groq ${model}: empty response`; continue; }

      const questions = extractJsonArray(raw);
      res.status(200).json({ questions, model });
      return;
    } catch (e) {
      lastError = `Groq ${model}: ${String(e).slice(0, 200)}`;
    }
  }

  console.error("generate-quiz failed:", lastError);
  res.status(502).json({ error: "Quiz generation failed", details: lastError });
}
