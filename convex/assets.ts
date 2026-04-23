import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
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
    fileSize: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("assets", args);
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
    return ctx.db.insert("assets", args);
  },
});

export const remove = mutation({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (asset?.storageId) {
      await ctx.storage.delete(asset.storageId);
    }
    await ctx.db.delete(args.id);
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return ctx.storage.getUrl(args.storageId);
  },
});
