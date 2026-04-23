import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const items = query({
  args: { showId: v.id("shows") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("checklistItems")
      .withIndex("by_show", (q) => q.eq("showId", args.showId))
      .take(100);
    rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return rows;
  },
});

export const toggle = mutation({
  args: { id: v.id("checklistItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    await ctx.db.patch(args.id, { isDone: !item.isDone });
  },
});

export const add = mutation({
  args: {
    showId: v.id("shows"),
    artistId: v.id("artists"),
    label: v.string(),
    category: v.optional(v.string()),
    isCritical: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("checklistItems", {
      ...args,
      isDone: false,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("checklistItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
