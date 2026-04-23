import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { showId: v.id("shows") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("timelineEvents")
      .withIndex("by_show", (q) => q.eq("showId", args.showId))
      .take(50);
    events.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return events;
  },
});

export const create = mutation({
  args: {
    showId: v.id("shows"),
    artistId: v.id("artists"),
    title: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    description: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("timelineEvents", {
      ...args,
      status: "pending",
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("timelineEvents"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: { id: v.id("timelineEvents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
