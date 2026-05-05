import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireArtist,
  requireAuth,
  requireNonEmpty,
  requireEnum,
  sanitizeStr,
  TIMELINE_STATUSES,
} from "./helpers";

export const list = query({
  args: { showId: v.id("shows") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const events = await ctx.db
      .query("timelineEvents")
      .withIndex("by_show", (q) => q.eq("showId", args.showId))
      .take(50);
    events.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return events;
  },
});

export const create = mutation({
  args: {
    showId: v.id("shows"),
    artistId: v.id("artists"),
    title: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    description: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    if (args.artistId !== myArtistId) throw new Error("Unauthorized");

    return ctx.db.insert("timelineEvents", {
      showId: args.showId,
      artistId: myArtistId,
      title: requireNonEmpty(args.title, "Title"),
      startTime: sanitizeStr(args.startTime, 10),
      endTime: sanitizeStr(args.endTime, 10),
      description: sanitizeStr(args.description, 500),
      sortOrder: args.sortOrder,
      status: "pending",
    });
  },
});

export const updateStatus = mutation({
  args: { id: v.id("timelineEvents"), status: v.string() },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");
    if (event.artistId !== myArtistId) throw new Error("Unauthorized");
    await ctx.db.patch(args.id, { status: requireEnum(args.status, TIMELINE_STATUSES, "Status") });
  },
});

export const remove = mutation({
  args: { id: v.id("timelineEvents") },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");
    if (event.artistId !== myArtistId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});
