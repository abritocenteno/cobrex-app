import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireArtist, requireAuth, requireNonEmpty, requireSafeUrl, sanitizeStr } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user?.artistId) return [];
    const artist = await ctx.db.get(user.artistId);
    return artist ? [artist] : [];
  },
});

export const get = query({
  args: { id: v.id("artists") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return ctx.db.get(args.id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("artists")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const upcomingPublic = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    return ctx.db
      .query("shows")
      .withIndex("by_artist_and_date", (q) =>
        q.eq("artistId", args.artistId).gte("showDate", today)
      )
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .take(10);
  },
});

export const update = mutation({
  args: {
    id: v.id("artists"),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    country: v.optional(v.string()),
    genre: v.optional(v.string()),
    subGenre: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    coverImageUrl: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    websiteUrl: v.optional(v.string()),
    instagramHandle: v.optional(v.string()),
    spotifyArtistId: v.optional(v.string()),
    tiktokHandle: v.optional(v.string()),
    youtubeHandle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    if (args.id !== myArtistId) throw new Error("Unauthorized");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = requireNonEmpty(args.name, "Name");
    if (args.bio !== undefined) updates.bio = sanitizeStr(args.bio, 2000);
    if (args.location !== undefined) updates.location = sanitizeStr(args.location, 100);
    if (args.country !== undefined) updates.country = sanitizeStr(args.country, 100);
    if (args.genre !== undefined) updates.genre = sanitizeStr(args.genre, 100);
    if (args.subGenre !== undefined) updates.subGenre = sanitizeStr(args.subGenre, 100);
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl ? requireSafeUrl(args.avatarUrl, "Avatar URL") : undefined;
    if (args.avatarStorageId !== undefined) updates.avatarStorageId = args.avatarStorageId;
    if (args.coverImageUrl !== undefined) updates.coverImageUrl = args.coverImageUrl ? requireSafeUrl(args.coverImageUrl, "Cover image URL") : undefined;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.websiteUrl !== undefined) updates.websiteUrl = args.websiteUrl ? requireSafeUrl(args.websiteUrl, "Website URL") : undefined;
    if (args.instagramHandle !== undefined) updates.instagramHandle = sanitizeStr(args.instagramHandle, 60);
    if (args.spotifyArtistId !== undefined) updates.spotifyArtistId = sanitizeStr(args.spotifyArtistId, 100);
    if (args.tiktokHandle !== undefined) updates.tiktokHandle = sanitizeStr(args.tiktokHandle, 60);
    if (args.youtubeHandle !== undefined) updates.youtubeHandle = sanitizeStr(args.youtubeHandle, 60);

    await ctx.db.patch(args.id, updates);
  },
});

export const search = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    if (!args.name.trim()) return [];
    const lower = args.name.toLowerCase();
    const artists = await ctx.db.query("artists").take(200);
    return artists
      .filter((a) => a.name.toLowerCase().includes(lower))
      .slice(0, 15);
  },
});

export const getStorageUrl = query({
  args: { storageId: v.optional(v.id("_storage")) },
  handler: async (ctx, args) => {
    if (!args.storageId) return null;
    return ctx.storage.getUrl(args.storageId);
  },
});
