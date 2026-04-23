import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
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
    return ctx.db.insert("deals", {
      ...args,
      paymentStatus: "unpaid",
      actualReceived: 0,
    });
  },
});

export const markDepositReceived = mutation({
  args: {
    id: v.id("deals"),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.id);
    if (!deal) throw new Error("Deal not found");
    const amount = args.amount ?? deal.depositAmount ?? 0;
    await ctx.db.patch(args.id, {
      paymentStatus: "deposit_paid",
      actualReceived: (deal.actualReceived ?? 0) + amount,
      depositReceivedAt: Date.now(),
    });
  },
});

export const markFullyPaid = mutation({
  args: {
    id: v.id("deals"),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.id);
    if (!deal) throw new Error("Deal not found");
    const amount = args.amount ?? deal.agreedTotal;
    await ctx.db.patch(args.id, {
      paymentStatus: "paid_in_full",
      actualReceived: amount,
      fullyPaidAt: Date.now(),
    });
  },
});
