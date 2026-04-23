import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query("venueProfiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique();
  },
});

export const upcomingShows = query({
  args: { venueProfileId: v.id("venueProfiles") },
  handler: async (ctx, args) => {
    const venueShows = await ctx.db
      .query("venueShows")
      .withIndex("by_venue", (q) => q.eq("venueProfileId", args.venueProfileId))
      .take(50);

    const today = new Date().toISOString().split("T")[0];
    const enriched = await Promise.all(
      venueShows.map(async (vs) => {
        const show = await ctx.db.get(vs.showId);
        if (!show || show.showDate < today) return null;
        return { ...vs, show };
      })
    );

    return enriched
      .filter(Boolean)
      .sort((a: any, b: any) => a.show.showDate.localeCompare(b.show.showDate));
  },
});

export const update = mutation({
  args: {
    id: v.id("venueProfiles"),
    name: v.optional(v.string()),
    capacity: v.optional(v.number()),
    location: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) updates[k] = v;
    }
    await ctx.db.patch(id, updates);
  },
});

export const confirmShow = mutation({
  args: { id: v.id("venueShows") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { confirmedByVenue: true });
  },
});

export const linkShow = mutation({
  args: {
    venueProfileId: v.id("venueProfiles"),
    showId: v.id("shows"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("venueShows")
      .withIndex("by_show", (q) => q.eq("showId", args.showId))
      .unique();
    if (existing) return existing._id;
    return ctx.db.insert("venueShows", {
      ...args,
      confirmedByVenue: false,
    });
  },
});
