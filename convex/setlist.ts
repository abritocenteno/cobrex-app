import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireArtist,
  requireAuth,
  requireNonEmpty,
  requireRange,
  sanitizeStr,
} from "./helpers";

export const songs = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
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
    const myArtistId = await requireArtist(ctx);
    if (args.artistId !== myArtistId) throw new Error("Unauthorized");

    const title = requireNonEmpty(args.title, "Title");
    const bpm = args.bpm !== undefined ? requireRange(args.bpm, 20, 300, "BPM") : undefined;
    const energyLevel = args.energyLevel !== undefined
      ? requireRange(args.energyLevel, 1, 5, "Energy level")
      : undefined;
    const durationSeconds = args.durationSeconds !== undefined
      ? requireRange(args.durationSeconds, 1, 7200, "Duration")
      : undefined;

    return ctx.db.insert("songs", {
      artistId: myArtistId,
      title,
      subtitle: sanitizeStr(args.subtitle),
      keySignature: sanitizeStr(args.keySignature, 10),
      bpm,
      durationSeconds,
      energyLevel,
      hasBackingTrack: args.hasBackingTrack,
      notes: sanitizeStr(args.notes, 2000),
    });
  },
});

export const getVersionForShow = query({
  args: { showId: v.id("shows") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
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
    const myArtistId = await requireArtist(ctx);
    if (args.artistId !== myArtistId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("setlistVersions")
      .withIndex("by_show", (q) => q.eq("showId", args.showId))
      .unique();
    if (existing) return existing._id;

    return ctx.db.insert("setlistVersions", {
      showId: args.showId,
      artistId: myArtistId,
      name: requireNonEmpty(args.name, "Setlist name"),
    });
  },
});

export const items = query({
  args: { setlistVersionId: v.id("setlistVersions") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const rows = await ctx.db
      .query("setlistItems")
      .withIndex("by_version", (q) => q.eq("setlistVersionId", args.setlistVersionId))
      .take(100);
    rows.sort((a, b) => a.position - b.position);
    return Promise.all(
      rows.map(async (item) => ({ ...item, song: await ctx.db.get(item.songId) }))
    );
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
    const myArtistId = await requireArtist(ctx);
    const version = await ctx.db.get(args.setlistVersionId);
    if (!version || version.artistId !== myArtistId) throw new Error("Unauthorized");

    return ctx.db.insert("setlistItems", {
      setlistVersionId: args.setlistVersionId,
      songId: args.songId,
      position: args.position,
      notes: sanitizeStr(args.notes, 500),
    });
  },
});

export const removeItem = mutation({
  args: { id: v.id("setlistItems") },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    const version = await ctx.db.get(item.setlistVersionId);
    if (!version || version.artistId !== myArtistId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});
