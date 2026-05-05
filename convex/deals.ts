import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireArtist,
  requireAuth,
  requireNonEmpty,
  requireSafeUrl,
  requireEnum,
  requirePositive,
  sanitizeStr,
  DEAL_TYPES,
  CURRENCIES,
} from "./helpers";

export const list = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return ctx.db
      .query("deals")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .order("desc")
      .take(100);
  },
});

export const get = query({
  args: { id: v.id("deals") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    artistId: v.id("artists"),
    dealType: v.string(),
    agreedTotal: v.number(),
    depositAmount: v.optional(v.number()),
    currency: v.string(),
    showId: v.optional(v.id("shows")),
    promoterId: v.optional(v.id("contacts")),
    contractUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    if (args.artistId !== myArtistId) throw new Error("Unauthorized");

    const dealType = requireEnum(args.dealType, DEAL_TYPES, "Deal type");
    const currency = requireEnum(args.currency, CURRENCIES, "Currency");
    const agreedTotal = requirePositive(args.agreedTotal, "Agreed total");
    const depositAmount = args.depositAmount !== undefined
      ? requirePositive(args.depositAmount, "Deposit amount")
      : undefined;
    const contractUrl = args.contractUrl ? requireSafeUrl(args.contractUrl, "Contract URL") : undefined;

    return ctx.db.insert("deals", {
      artistId: myArtistId,
      dealType,
      agreedTotal,
      depositAmount,
      currency,
      showId: args.showId,
      promoterId: args.promoterId,
      contractUrl,
      notes: sanitizeStr(args.notes, 5000),
      paymentStatus: "unpaid",
      actualReceived: 0,
    });
  },
});

export const markDepositReceived = mutation({
  args: { id: v.id("deals"), amount: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const deal = await ctx.db.get(args.id);
    if (!deal) throw new Error("Deal not found");
    if (deal.artistId !== myArtistId) throw new Error("Unauthorized");

    const amount = args.amount ?? deal.depositAmount ?? 0;
    await ctx.db.patch(args.id, {
      paymentStatus: "deposit_paid",
      actualReceived: (deal.actualReceived ?? 0) + amount,
      depositReceivedAt: Date.now(),
    });
  },
});

export const markFullyPaid = mutation({
  args: { id: v.id("deals"), amount: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const deal = await ctx.db.get(args.id);
    if (!deal) throw new Error("Deal not found");
    if (deal.artistId !== myArtistId) throw new Error("Unauthorized");

    const amount = args.amount ?? deal.agreedTotal;
    await ctx.db.patch(args.id, {
      paymentStatus: "paid_in_full",
      actualReceived: amount,
      fullyPaidAt: Date.now(),
    });
  },
});
