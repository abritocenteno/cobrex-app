import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const songs = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("songs")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .take(200);
  },
});

export const createSong = mutation({
  args: {
    artistId: v.id("artists"),
    title: v.string(),
    subtitle: v.optional(v.string()),
    keySignature: v.optional(v.string()),
    bpm: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    energyLevel: v.optional(v.number()),
    hasBackingTrack: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("songs", args);
  },
});

export const getVersionForShow = query({
  args: { showId: v.id("shows") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("setlistVersions")
      .withIndex("by_show", (q) => q.eq("showId", args.showId))
      .unique();
  },
});

export const createVersionForShow = mutation({
  args: {
    showId: v.id("shows"),
    artistId: v.id("artists"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("setlistVersions")
      .withIndex("by_show", (q) => q.eq("showId", args.showId))
      .unique();
    if (existing) return existing._id;
    return ctx.db.insert("setlistVersions", args);
  },
});

export const items = query({
  args: { setlistVersionId: v.id("setlistVersions") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("setlistItems")
      .withIndex("by_version", (q) => q.eq("setlistVersionId", args.setlistVersionId))
      .take(100);
    rows.sort((a, b) => a.position - b.position);
    const enriched = await Promise.all(
      rows.map(async (item) => {
        const song = await ctx.db.get(item.songId);
        return { ...item, song };
      })
    );
    return enriched;
  },
});

export const addItem = mutation({
  args: {
    setlistVersionId: v.id("setlistVersions"),
    songId: v.id("songs"),
    position: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("setlistItems", args);
  },
});

export const removeItem = mutation({
  args: { id: v.id("setlistItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
