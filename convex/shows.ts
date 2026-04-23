import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("shows")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .order("desc")
      .take(100);
  },
});

export const get = query({
  args: { id: v.id("shows") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    artistId: v.id("artists"),
    name: v.string(),
    showDate: v.string(),
    showTime: v.optional(v.string()),
    loadInTime: v.optional(v.string()),
    soundcheckTime: v.optional(v.string()),
    doorsTime: v.optional(v.string()),
    setLengthMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    ticketUrl: v.optional(v.string()),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("shows", {
      ...args,
      status: "draft",
      paymentStatus: "unpaid",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("shows"),
    name: v.optional(v.string()),
    showDate: v.optional(v.string()),
    showTime: v.optional(v.string()),
    loadInTime: v.optional(v.string()),
    soundcheckTime: v.optional(v.string()),
    doorsTime: v.optional(v.string()),
    setLengthMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    ticketUrl: v.optional(v.string()),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) updates[k] = v;
    }
    await ctx.db.patch(id, updates);
  },
});
