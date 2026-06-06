import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireManager } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("managerProfiles").take(100);
  },
});

export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query("managerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique();
  },
});

export const roster = query({
  args: { managerId: v.id("managerProfiles") },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("managerProfileId"), args.managerId))
      .take(50);

    const artists = await Promise.all(
      users
        .filter((u) => u.artistId)
        .map(async (u) => {
          const artist = await ctx.db.get(u.artistId!);
          if (!artist) return null;
          const today = new Date().toISOString().split("T")[0];
          const upcoming = await ctx.db
            .query("shows")
            .withIndex("by_artist_and_date", (q) =>
              q.eq("artistId", artist._id).gte("showDate", today)
            )
            .filter((q) => q.neq(q.field("status"), "cancelled"))
            .take(20);

          const deals = await ctx.db
            .query("deals")
            .withIndex("by_artist", (q) => q.eq("artistId", artist._id))
            .collect();

          let ytd = 0;
          let outstanding = 0;
          for (const deal of deals) {
            if (deal.paymentStatus === "paid_in_full") {
              ytd += deal.actualReceived ?? deal.agreedTotal;
            } else if (deal.paymentStatus !== "refunded") {
              outstanding += deal.agreedTotal - (deal.actualReceived ?? 0);
            }
          }

          return {
            ...artist,
            role: u.role,
            isActive: true,
            upcomingShowCount: upcoming.length,
            ytd,
            outstanding,
          };
        })
    );

    return artists.filter(Boolean);
  },
});

export const artistDetail = query({
  args: { managerId: v.id("managerProfiles"), artistId: v.id("artists") },
  handler: async (ctx, args) => {
    // Verify this artist is on this manager's roster
    const rosterUser = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("managerProfileId"), args.managerId),
          q.eq(q.field("artistId"), args.artistId)
        )
      )
      .first();
    if (!rosterUser) return null;

    const artist = await ctx.db.get(args.artistId);
    if (!artist) return null;

    const today = new Date().toISOString().split("T")[0];
    const upcomingShows = await ctx.db
      .query("shows")
      .withIndex("by_artist_and_date", (q) =>
        q.eq("artistId", args.artistId).gte("showDate", today)
      )
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .take(20);

    const allDeals = await ctx.db
      .query("deals")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .order("desc")
      .take(20);

    let ytd = 0;
    let outstanding = 0;
    for (const deal of allDeals) {
      if (deal.paymentStatus === "paid_in_full") {
        ytd += deal.actualReceived ?? deal.agreedTotal;
      } else if (deal.paymentStatus !== "refunded") {
        outstanding += deal.agreedTotal - (deal.actualReceived ?? 0);
      }
    }

    return {
      artist,
      upcomingShows: upcomingShows.sort((a, b) => a.showDate.localeCompare(b.showDate)),
      recentDeals: allDeals,
      ytd,
      outstanding,
    };
  },
});

export const removeArtist = mutation({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    const managerId = await requireManager(ctx);

    const rosterUser = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("managerProfileId"), managerId),
          q.eq(q.field("artistId"), args.artistId)
        )
      )
      .first();

    if (!rosterUser) throw new Error("Artist not on your roster");

    await ctx.db.patch(rosterUser._id, { managerProfileId: undefined });
  },
});

export const financialSummary = query({
  args: { managerId: v.id("managerProfiles") },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("managerProfileId"), args.managerId))
      .take(50);

    const artistIds = users.filter((u) => u.artistId).map((u) => u.artistId!);

    let ytd = 0;
    let outstanding = 0;

    for (const artistId of artistIds) {
      const deals = await ctx.db
        .query("deals")
        .withIndex("by_artist", (q) => q.eq("artistId", artistId))
        .collect();

      for (const deal of deals) {
        if (deal.paymentStatus === "paid_in_full") {
          ytd += deal.actualReceived ?? deal.agreedTotal;
        } else if (deal.paymentStatus !== "refunded") {
          outstanding += deal.agreedTotal - (deal.actualReceived ?? 0);
        }
      }
    }

    return { ytd, outstanding };
  },
});

export const allShows = query({
  args: { managerId: v.id("managerProfiles") },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("managerProfileId"), args.managerId))
      .take(50);

    const artistIds = users.filter((u) => u.artistId).map((u) => u.artistId!);

    const showGroups = await Promise.all(
      artistIds.map((artistId) => {
        const today = new Date().toISOString().split("T")[0];
        return ctx.db
          .query("shows")
          .withIndex("by_artist_and_date", (q) =>
            q.eq("artistId", artistId).gte("showDate", today)
          )
          .filter((q) => q.neq(q.field("status"), "cancelled"))
          .take(20);
      })
    );

    return showGroups.flat().sort((a, b) => a.showDate.localeCompare(b.showDate));
  },
});

export const update = mutation({
  args: {
    id: v.id("managerProfiles"),
    agencyName: v.optional(v.string()),
    territory: v.optional(v.string()),
    commissionRate: v.optional(v.number()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const managerId = await requireManager(ctx);
    if (managerId !== args.id) throw new Error("Not authorized");
    const { id, agencyName, ...rest } = args;
    const updates: Record<string, unknown> = {};
    if (agencyName !== undefined) updates.companyName = agencyName;
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) updates[k] = v;
    }
    await ctx.db.patch(id, updates);
  },
});
