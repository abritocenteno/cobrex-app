import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireArtist,
  requireAuth,
  requireNonEmpty,
  requireEnum,
  sanitizeStr,
  ALERT_SEVERITIES,
} from "./helpers";

export const list = query({
  args: { artistId: v.id("artists"), activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
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
    const myArtistId = await requireArtist(ctx);
    const alert = await ctx.db.get(args.id);
    if (!alert) throw new Error("Alert not found");
    if (alert.artistId !== myArtistId) throw new Error("Unauthorized");
    await ctx.db.patch(args.id, { status: "acknowledged" });
  },
});

export const resolve = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const alert = await ctx.db.get(args.id);
    if (!alert) throw new Error("Alert not found");
    if (alert.artistId !== myArtistId) throw new Error("Unauthorized");
    await ctx.db.patch(args.id, { status: "resolved" });
  },
});

export const dismiss = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const alert = await ctx.db.get(args.id);
    if (!alert) throw new Error("Alert not found");
    if (alert.artistId !== myArtistId) throw new Error("Unauthorized");
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
    const myArtistId = await requireArtist(ctx);
    if (args.artistId !== myArtistId) throw new Error("Unauthorized");

    return ctx.db.insert("alerts", {
      artistId: myArtistId,
      title: requireNonEmpty(args.title, "Title"),
      message: requireNonEmpty(args.message, "Message", 1000),
      severity: requireEnum(args.severity, ALERT_SEVERITIES, "Severity"),
      category: sanitizeStr(args.category, 100),
      status: "active",
    });
  },
});
