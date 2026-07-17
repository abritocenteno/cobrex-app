"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Anthropic from "@anthropic-ai/sdk";

const ROLE_PROMPTS: Record<string, string> = {
  artist: `You are extracting performance logistics from a document for a performing artist.
Focus on extracting:
- Performance slot: set start time, set end time, set length in minutes, stage name
- Load-in time, soundcheck time, doors time
- Key contacts: stage manager (name + phone), FOH engineer, production coordinator
- Hospitality: catering details, dressing room number/location, backstage access info
- Any artist-specific notes or special instructions

Return ONLY a JSON object with these exact keys (use null for any missing field):
{
  "setTime": string | null,
  "setEndTime": string | null,
  "setLengthMinutes": number | null,
  "stage": string | null,
  "loadInTime": string | null,
  "soundcheckTime": string | null,
  "doorsTime": string | null,
  "stageManager": string | null,
  "fohEngineer": string | null,
  "productionContact": string | null,
  "cateringInfo": string | null,
  "dressingRoom": string | null,
  "notes": string | null
}`,

  manager: `You are extracting deal terms and financial information from a document for an artist manager.
Focus on extracting:
- Financial terms: total fee/guarantee, deposit amount, balance, currency
- Deal structure: guarantee, percentage, door deal, or hybrid
- Payment schedule: deposit due date, balance due date, settlement timing
- Contract parties: promoter/buyer name, venue name, agency or booking agent
- Key dates: show date, contract signing date, settlement date
- Cancellation policy, force majeure clauses, penalties
- Any special financial conditions or riders

Return ONLY a JSON object with these exact keys (use null for any missing field):
{
  "totalFee": string | null,
  "depositAmount": string | null,
  "currency": string | null,
  "dealType": string | null,
  "depositDueDate": string | null,
  "balanceDueDate": string | null,
  "settlementTiming": string | null,
  "promoterName": string | null,
  "venueName": string | null,
  "showDate": string | null,
  "cancellationPolicy": string | null,
  "paymentTerms": string | null,
  "notes": string | null
}`,

  venue: `You are extracting the full production timeline and logistics from a document for a venue or production team.
Focus on extracting:
- Complete day timeline: every scheduled time (load-in, soundchecks, doors, sets, curfew, load-out)
- All performing artists with their stage, set start time, set end time
- Stage and technical specifications (dimensions, PA, monitors, backline)
- Crew and staffing requirements per artist or overall
- Catering and hospitality requirements
- Load-in and load-out schedule per artist
- Any important production notes or instructions

Return ONLY a JSON object with these exact keys (use null for missing scalar fields, empty arrays for missing lists):
{
  "timeline": [{ "time": string, "event": string, "artist": string | null, "notes": string | null }],
  "artists": [{ "name": string, "stage": string | null, "setTime": string | null, "setEndTime": string | null }],
  "loadIn": string | null,
  "loadOut": string | null,
  "doorsTime": string | null,
  "curfew": string | null,
  "stageSpecs": string | null,
  "paSystem": string | null,
  "crewRequirements": string | null,
  "cateringNotes": string | null,
  "notes": string | null
}`,
};

export const extractFromAsset = action({
  args: {
    assetId: v.id("assets"),
    userRole: v.union(v.literal("artist"), v.literal("manager"), v.literal("venue")),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    await ctx.runMutation(internal.assets.saveExtraction, {
      id: args.assetId,
      status: "pending",
    });

    try {
      const asset = await ctx.runQuery(internal.assets.getAssetInternal, { id: args.assetId });
      if (!asset) throw new Error("Asset not found");
      if (!asset.storageId) throw new Error("Only uploaded files can be analyzed — link-only assets are not supported");

      const fileUrl = await ctx.storage.getUrl(asset.storageId);
      if (!fileUrl) throw new Error("Could not retrieve file URL from storage");

      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      const mimeType = asset.mimeType ?? "application/pdf";
      const prompt = ROLE_PROMPTS[args.userRole];

      type ContentBlock = Anthropic.DocumentBlockParam | Anthropic.ImageBlockParam | Anthropic.TextBlockParam;
      let fileBlock: ContentBlock;

      if (mimeType === "application/pdf") {
        fileBlock = {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        };
      } else if (mimeType === "image/png" || mimeType === "image/jpeg") {
        fileBlock = {
          type: "image",
          source: { type: "base64", media_type: mimeType as "image/png" | "image/jpeg", data: base64 },
        };
      } else {
        throw new Error(`File type '${mimeType}' cannot be analyzed. Please use PDF or image files.`);
      }

      const client = new Anthropic({ apiKey });
      const stream = client.messages.stream({
        model: "claude-opus-4-8",
        max_tokens: 2048,
        thinking: { type: "adaptive" },
        messages: [
          {
            role: "user",
            content: [
              fileBlock,
              {
                type: "text",
                text: prompt + "\n\nRespond with valid JSON only. No markdown fences, no explanation.",
              },
            ],
          },
        ],
      });

      const message = await stream.finalMessage();
      const textBlock = message.content.find((b) => b.type === "text");
      const rawText = textBlock?.type === "text" ? textBlock.text.trim() : "{}";
      const jsonStr = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

      let extractedData: unknown;
      try {
        extractedData = JSON.parse(jsonStr);
      } catch {
        extractedData = { raw: rawText };
      }

      await ctx.runMutation(internal.assets.saveExtraction, {
        id: args.assetId,
        status: "done",
        extractedData,
      });

      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await ctx.runMutation(internal.assets.saveExtraction, {
        id: args.assetId,
        status: "error",
        extractionError: message,
      });
      throw err;
    }
  },
});
