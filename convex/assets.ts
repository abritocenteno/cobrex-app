import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import {
  requireArtist,
  requireAuth,
  requireNonEmpty,
  requireSafeUrl,
  requireEnum,
  requireMimeType,
  sanitizeStr,
  ASSET_TYPES,
} from "./helpers";

export const list = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return ctx.db
      .query("assets")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .order("desc")
      .take(100);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const saveFile = mutation({
  args: {
    artistId: v.id("artists"),
    name: v.string(),
    assetType: v.string(),
    storageId: v.id("_storage"),
    mimeType: v.optional(v.string()),
    fileSizeBytes: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    if (args.artistId !== myArtistId) throw new Error("Unauthorized");

    const name = requireNonEmpty(args.name, "Name");
    const assetType = requireEnum(args.assetType, ASSET_TYPES, "Asset type");
    requireMimeType(args.mimeType);

    return ctx.db.insert("assets", {
      artistId: myArtistId,
      name,
      assetType,
      storageId: args.storageId,
      mimeType: args.mimeType,
      fileSizeBytes: args.fileSizeBytes,
      notes: sanitizeStr(args.notes, 2000),
      versionNumber: 1,
    });
  },
});

export const saveLink = mutation({
  args: {
    artistId: v.id("artists"),
    name: v.string(),
    assetType: v.string(),
    fileUrl: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    if (args.artistId !== myArtistId) throw new Error("Unauthorized");

    const name = requireNonEmpty(args.name, "Name");
    const assetType = requireEnum(args.assetType, ASSET_TYPES, "Asset type");
    const fileUrl = requireSafeUrl(args.fileUrl, "URL");

    return ctx.db.insert("assets", {
      artistId: myArtistId,
      name,
      assetType,
      fileUrl,
      notes: sanitizeStr(args.notes, 2000),
      versionNumber: 1,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const asset = await ctx.db.get(args.id);
    if (!asset) throw new Error("Asset not found");
    if (asset.artistId !== myArtistId) throw new Error("Unauthorized");

    if (asset.storageId) await ctx.storage.delete(asset.storageId);
    await ctx.db.delete(args.id);
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return ctx.storage.getUrl(args.storageId);
  },
});

export const createShareLink = mutation({
  args: { id: v.id("assets"), expiryDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const asset = await ctx.db.get(args.id);
    if (!asset) throw new Error("Asset not found");
    if (asset.artistId !== myArtistId) throw new Error("Unauthorized");

    const days = Math.min(args.expiryDays ?? 30, 365);
    const token = crypto.randomUUID();
    const shareExpiresAt = Date.now() + days * 24 * 60 * 60 * 1000;

    // Resolve storage URL into fileUrl so the share page can display it
    let fileUrl = asset.fileUrl;
    if (!fileUrl && asset.storageId) {
      fileUrl = (await ctx.storage.getUrl(asset.storageId)) ?? undefined;
    }

    await ctx.db.patch(args.id, { shareToken: token, shareExpiresAt, isPublic: true, fileUrl });
    return token;
  },
});

export const revokeShareLink = mutation({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const asset = await ctx.db.get(args.id);
    if (!asset) throw new Error("Asset not found");
    if (asset.artistId !== myArtistId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { shareToken: undefined, shareExpiresAt: undefined, isPublic: false });
  },
});

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const asset = await ctx.db
      .query("assets")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.token))
      .unique();
    if (!asset) return null;
    if (asset.shareExpiresAt && asset.shareExpiresAt < Date.now()) return null;
    return asset;
  },
});

export const getAssetInternal = internalQuery({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const saveExtraction = internalMutation({
  args: {
    id: v.id("assets"),
    status: v.string(),
    extractedData: v.optional(v.any()),
    extractionError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      extractionStatus: args.status,
      extractedData: args.extractedData,
      extractionError: args.extractionError,
    });
  },
});
