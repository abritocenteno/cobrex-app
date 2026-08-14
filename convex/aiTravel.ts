"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import Anthropic from "@anthropic-ai/sdk";

export const extractPassportData = action({
  args: {
    storageId: v.id("_storage"),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) throw new Error("Could not retrieve file from storage");

    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    let fileBlock: Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam;

    if (args.mimeType === "application/pdf") {
      fileBlock = {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      };
    } else {
      fileBlock = {
        type: "image",
        source: {
          type: "base64",
          media_type: args.mimeType as ImageMediaType,
          data: base64,
        },
      };
    }

    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            fileBlock,
            {
              type: "text",
              text: `Extract the following fields from this travel document. Return ONLY valid JSON with these exact keys (null for any missing field):
{
  "docType": "passport" | "national_id" | "driving_license" | "other",
  "holderName": string | null,
  "nationality": string | null,
  "issuingCountry": string | null,
  "docNumber": string | null,
  "dateOfBirth": "YYYY-MM-DD" | null,
  "expiryDate": "YYYY-MM-DD" | null,
  "gender": "M" | "F" | null
}
JSON only. No markdown fences, no explanation.`,
            },
          ],
        },
      ],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text.trim() : "{}";
    const clean = raw
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    try {
      return { ok: true, data: JSON.parse(clean) };
    } catch {
      return { ok: false, data: null, raw };
    }
  },
});

export const optimizeItinerary = action({
  args: {
    tourPartyId: v.id("tourParties"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const [party, items, flights, hotels, transport] = await Promise.all([
      ctx.runQuery(api.travel.getTourParty, { id: args.tourPartyId }),
      ctx.runQuery(api.travel.listItinerary, { tourPartyId: args.tourPartyId }),
      ctx.runQuery(api.travel.listFlights, { tourPartyId: args.tourPartyId }),
      ctx.runQuery(api.travel.listHotelBookings, {
        tourPartyId: args.tourPartyId,
      }),
      ctx.runQuery(api.travel.listTransportJobs, {
        tourPartyId: args.tourPartyId,
      }),
    ]);

    const fmt = (ts: number) => new Date(ts).toISOString();

    const payload = {
      party: { name: party?.name, status: party?.status },
      itinerary: (items ?? []).map((i) => ({
        title: i.title,
        type: i.type,
        scheduledAt: fmt(i.scheduledAt),
        conflict: i.conflictDetected ? i.conflictNote : null,
      })),
      flights: (flights ?? []).map((f) => ({
        label: `${f.airline} ${f.flightNumber}`,
        from: f.departureAirport,
        to: f.arrivalAirport,
        departs: fmt(f.departureAt),
        arrives: fmt(f.arrivalAt),
        status: f.status,
      })),
      hotels: (hotels ?? []).map((h) => ({
        name: h.hotelName,
        checkIn: fmt(h.checkInDate),
        checkOut: fmt(h.checkOutDate),
      })),
      transport: (transport ?? []).map((t) => ({
        type: t.type,
        from: t.pickupLocation,
        to: t.dropoffLocation,
        scheduledAt: fmt(t.scheduledPickupAt),
        passengers: t.passengerCount,
        status: t.status,
      })),
    };

    const client = new Anthropic({ apiKey });
    const stream = client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 1500,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: `You are an expert travel and logistics coordinator for touring music artists. Analyze this tour party itinerary and return specific, actionable optimization suggestions.

${JSON.stringify(payload, null, 2)}

Return ONLY a JSON array (max 6 items). Each item must have:
{
  "severity": "critical" | "warning" | "info",
  "category": "conflict" | "timing" | "logistics" | "risk",
  "title": "<60 chars",
  "detail": "1-2 sentences, specific and actionable"
}

Focus on real operational risks: tight connections, hotel gaps, missing transport, conflict windows. JSON array only — no markdown fences.`,
        },
      ],
    });

    const message = await stream.finalMessage();
    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text.trim() : "[]";
    const clean = raw
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    try {
      const suggestions = JSON.parse(clean);
      return { suggestions: Array.isArray(suggestions) ? suggestions : [] };
    } catch {
      return { suggestions: [] };
    }
  },
});
