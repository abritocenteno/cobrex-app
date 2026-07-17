import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireArtist, requireAuth, requireNonEmpty, sanitizeStr } from "./helpers";

export const items = query({
  args: { showId: v.id("shows") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const rows = await ctx.db
      .query("checklistItems")
      .withIndex("by_show", (q) => q.eq("showId", args.showId))
      .take(100);
    rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return rows;
  },
});

export const toggle = mutation({
  args: {
    id: v.id("checklistItems"),
    checkedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    if (item.artistId !== myArtistId) throw new Error("Unauthorized");
    const nowDone = !item.isDone;
    await ctx.db.patch(args.id, {
      isDone: nowDone,
      isChecked: nowDone,
      checkedByName: nowDone ? (args.checkedByName ?? undefined) : undefined,
      checkedAt: nowDone ? Date.now() : undefined,
    });
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
    const myArtistId = await requireArtist(ctx);
    if (args.artistId !== myArtistId) throw new Error("Unauthorized");

    return ctx.db.insert("checklistItems", {
      showId: args.showId,
      artistId: myArtistId,
      label: requireNonEmpty(args.label, "Label"),
      category: sanitizeStr(args.category, 100),
      isCritical: args.isCritical,
      sortOrder: args.sortOrder,
      isDone: false,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("checklistItems") },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    if (item.artistId !== myArtistId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});
