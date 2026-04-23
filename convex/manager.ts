import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
          return {
            ...artist,
            role: u.role,
            isActive: true,
            upcomingShowCount: upcoming.length,
          };
        })
    );

    return artists.filter(Boolean);
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
    const { id, agencyName, ...rest } = args;
    const updates: Record<string, unknown> = {};
    if (agencyName !== undefined) updates.companyName = agencyName;
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) updates[k] = v;
    }
    await ctx.db.patch(id, updates);
  },
});
