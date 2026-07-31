// Vercel serverless function — generates a reading passage via Groq.
// Runs server-side, so the Groq API key never reaches the browser and
// there is no CORS restriction (the frontend calls this same-origin endpoint).

const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server not configured — missing GROQ_API_KEY" });
    return;
  }

  const system = "You are a reading education assistant. Generate high-quality engaging "
    + "passages for reading practice. Return ONLY the passage text itself — no title, "
    + "no preamble, no word count, no commentary. Start immediately with the first sentence.";

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
            { role: "system", content: system },
            { role: "user",   content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 1000,
        }),
      });

      if (!groqRes.ok) {
        lastError = `Groq ${model} HTTP ${groqRes.status}: ${(await groqRes.text()).slice(0, 200)}`;
        continue;
      }

      const data = await groqRes.json();
      const text = data.choices?.[0]?.message?.content?.trim();

      if (!text || text.length < 80) {
        lastError = `Groq ${model}: empty or too-short response`;
        continue;
      }

      res.status(200).json({ text, model });
      return;
    } catch (e) {
      lastError = `Groq ${model}: ${String(e).slice(0, 200)}`;
    }
  }

  console.error("generate-passage failed:", lastError);
  res.status(502).json({ error: "AI generation failed", details: lastError });
}
