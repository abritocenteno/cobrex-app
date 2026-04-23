import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    artistId: v.id("artists"),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return ctx.db
        .query("alerts")
        .withIndex("by_artist_and_status", (q) =>
          q.eq("artistId", args.artistId).eq("status", "active")
        )
        .take(50);
    }
    return ctx.db
      .query("alerts")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .order("desc")
      .take(100);
  },
});

export const acknowledge = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "acknowledged" });
  },
});

export const resolve = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "resolved" });
  },
});

export const dismiss = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "dismissed" });
  },
});

export const create = mutation({
  args: {
    artistId: v.id("artists"),
    title: v.string(),
    message: v.string(),
    severity: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("alerts", {
      ...args,
      status: "active",
    });
  },
});
