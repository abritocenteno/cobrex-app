"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";

export const analyze = action({
  args: {
    title: v.string(),
    description: v.string(),
  },
  handler: async (_ctx, args): Promise<{
    bpm: number | null;
    keySignature: string | null;
    energyLevel: number | null;
    genre: string | null;
  }> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const prompt = `You are a music metadata extractor. From the track title and description below, extract the following fields if present. Return ONLY valid JSON with these exact keys:
- "bpm": integer between 20-300, or null
- "keySignature": one of ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B","Cm","C#m","Dm","D#m","Em","Fm","F#m","Gm","G#m","Am","A#m","Bm"], or null
- "energyLevel": integer 1-5 inferred from genre/mood/description (1=calm, 5=intense), or null
- "genre": short genre string (max 30 chars), or null

Track title: ${args.title}
Description: ${args.description.slice(0, 1500)}

Respond with JSON only, no explanation.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = await res.json() as { content: { type: string; text: string }[] };
    const text = data.content?.[0]?.type === "text" ? data.content[0].text : "{}";

    try {
      const parsed = JSON.parse(text.trim());
      return {
        bpm: typeof parsed.bpm === "number" ? Math.round(parsed.bpm) : null,
        keySignature: typeof parsed.keySignature === "string" ? parsed.keySignature : null,
        energyLevel: typeof parsed.energyLevel === "number" ? Math.min(5, Math.max(1, Math.round(parsed.energyLevel))) : null,
        genre: typeof parsed.genre === "string" ? parsed.genre.slice(0, 30) : null,
      };
    } catch {
      return { bpm: null, keySignature: null, energyLevel: null, genre: null };
    }
  },
});
