import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("metrics")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .order("desc")
      .take(200);
  },
});

export const record = mutation({
  args: {
    artistId: v.id("artists"),
    platform: v.string(),
    metricType: v.string(),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("metrics", {
      ...args,
      recordedAt: Date.now(),
    });
  },
});
