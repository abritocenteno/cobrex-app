import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireArtist,
  requireAuth,
  requireNonEmpty,
  requireSafeUrl,
  requireEnum,
  requirePositive,
  requireRange,
  requireDateFormat,
  sanitizeStr,
  SHOW_STATUSES,
  PAYMENT_STATUSES,
} from "./helpers";

export const list = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return ctx.db
      .query("shows")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .order("desc")
      .take(100);
  },
});

export const get = query({
  args: { id: v.id("shows") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    artistId: v.id("artists"),
    name: v.string(),
    showDate: v.string(),
    showTime: v.optional(v.string()),
    loadInTime: v.optional(v.string()),
    soundcheckTime: v.optional(v.string()),
    doorsTime: v.optional(v.string()),
    setLengthMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    ticketUrl: v.optional(v.string()),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    if (args.artistId !== myArtistId) throw new Error("Unauthorized");

    const name = requireNonEmpty(args.name, "Show name");
    const showDate = requireDateFormat(args.showDate, "Show date");
    const ticketUrl = args.ticketUrl ? requireSafeUrl(args.ticketUrl, "Ticket URL") : undefined;
    const setLengthMinutes = args.setLengthMinutes !== undefined
      ? requireRange(args.setLengthMinutes, 1, 480, "Set length")
      : undefined;
    const capacity = args.capacity !== undefined
      ? requirePositive(args.capacity, "Capacity")
      : undefined;

    return ctx.db.insert("shows", {
      artistId: myArtistId,
      name,
      showDate,
      showTime: sanitizeStr(args.showTime, 10),
      loadInTime: sanitizeStr(args.loadInTime, 10),
      soundcheckTime: sanitizeStr(args.soundcheckTime, 10),
      doorsTime: sanitizeStr(args.doorsTime, 10),
      setLengthMinutes,
      notes: sanitizeStr(args.notes, 5000),
      venueName: sanitizeStr(args.venueName, 200),
      venueAddress: sanitizeStr(args.venueAddress, 400),
      ticketUrl,
      capacity,
      status: "draft",
      paymentStatus: "unpaid",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("shows"),
    name: v.optional(v.string()),
    showDate: v.optional(v.string()),
    showTime: v.optional(v.string()),
    loadInTime: v.optional(v.string()),
    soundcheckTime: v.optional(v.string()),
    doorsTime: v.optional(v.string()),
    setLengthMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    ticketUrl: v.optional(v.string()),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const show = await ctx.db.get(args.id);
    if (!show) throw new Error("Show not found");
    if (show.artistId !== myArtistId) throw new Error("Unauthorized");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = requireNonEmpty(args.name, "Show name");
    if (args.showDate !== undefined) updates.showDate = requireDateFormat(args.showDate, "Show date");
    if (args.status !== undefined) updates.status = requireEnum(args.status, SHOW_STATUSES, "Status");
    if (args.paymentStatus !== undefined) updates.paymentStatus = requireEnum(args.paymentStatus, PAYMENT_STATUSES, "Payment status");
    if (args.ticketUrl !== undefined) updates.ticketUrl = args.ticketUrl ? requireSafeUrl(args.ticketUrl, "Ticket URL") : undefined;
    if (args.setLengthMinutes !== undefined) updates.setLengthMinutes = requireRange(args.setLengthMinutes, 1, 480, "Set length");
    if (args.capacity !== undefined) updates.capacity = requirePositive(args.capacity, "Capacity");
    if (args.showTime !== undefined) updates.showTime = sanitizeStr(args.showTime, 10);
    if (args.loadInTime !== undefined) updates.loadInTime = sanitizeStr(args.loadInTime, 10);
    if (args.soundcheckTime !== undefined) updates.soundcheckTime = sanitizeStr(args.soundcheckTime, 10);
    if (args.doorsTime !== undefined) updates.doorsTime = sanitizeStr(args.doorsTime, 10);
    if (args.notes !== undefined) updates.notes = sanitizeStr(args.notes, 5000);
    if (args.venueName !== undefined) updates.venueName = sanitizeStr(args.venueName, 200);
    if (args.venueAddress !== undefined) updates.venueAddress = sanitizeStr(args.venueAddress, 400);

    await ctx.db.patch(args.id, updates);
  },
});
