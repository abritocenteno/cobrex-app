import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireVenue } from "./helpers";

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
        const artist = await ctx.db.get(show.artistId);
        return { ...vs, show: { ...show, artistName: artist?.name ?? null } };
      })
    );

    return enriched
      .filter(Boolean)
      .sort((a: any, b: any) => a.show.showDate.localeCompare(b.show.showDate));
  },
});

export const pastShows = query({
  args: { venueProfileId: v.id("venueProfiles") },
  handler: async (ctx, args) => {
    const venueShows = await ctx.db
      .query("venueShows")
      .withIndex("by_venue", (q) => q.eq("venueProfileId", args.venueProfileId))
      .take(100);

    const today = new Date().toISOString().split("T")[0];
    const enriched = await Promise.all(
      venueShows.map(async (vs) => {
        const show = await ctx.db.get(vs.showId);
        if (!show || show.showDate >= today) return null;
        const artist = await ctx.db.get(show.artistId);
        return { ...vs, show: { ...show, artistName: artist?.name ?? null } };
      })
    );

    return enriched
      .filter(Boolean)
      .sort((a: any, b: any) => b.show.showDate.localeCompare(a.show.showDate));
  },
});

export const showDetail = query({
  args: { id: v.id("venueShows") },
  handler: async (ctx, args) => {
    const vs = await ctx.db.get(args.id);
    if (!vs) return null;
    const show = await ctx.db.get(vs.showId);
    if (!show) return null;
    const artist = await ctx.db.get(show.artistId);
    return { ...vs, show: { ...show, artistName: artist?.name ?? null } };
  },
});

export const statusForShow = query({
  args: { showId: v.id("shows") },
  handler: async (ctx, args) => {
    const vs = await ctx.db
      .query("venueShows")
      .withIndex("by_show", (q) => q.eq("showId", args.showId))
      .unique();
    if (!vs) return null;
    const venue = await ctx.db.get(vs.venueProfileId);
    return {
      venueProfileId: vs.venueProfileId,
      confirmedByVenue: vs.confirmedByVenue,
      venueName: venue?.name ?? null,
      venueCity: venue?.city ?? (venue as any)?.location ?? null,
    };
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const q = args.query.trim().toLowerCase();
    if (!q) return [];
    const venues = await ctx.db.query("venueProfiles").take(300);
    return venues
      .filter((v) =>
        v.name?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((v) => ({ _id: v._id, name: v.name ?? null, city: v.city ?? null, capacity: v.capacity ?? null }));
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
    const venueId = await requireVenue(ctx);
    if (venueId !== args.id) throw new Error("Not authorized");
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
    const venueId = await requireVenue(ctx);
    const vs = await ctx.db.get(args.id);
    if (!vs || vs.venueProfileId !== venueId) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { confirmedByVenue: true });

    const show = await ctx.db.get(vs.showId);
    if (show) {
      const artistUser = await ctx.db
        .query("users")
        .withIndex("by_artist", (q) => q.eq("artistId", show.artistId))
        .unique();
      if (artistUser) {
        const venue = await ctx.db.get(venueId);
        const title = "Show Confirmed";
        const body = `${venue?.name ?? "The venue"} confirmed your show: ${show.name}`;
        await ctx.db.insert("notifications", {
          userId: artistUser.tokenIdentifier,
          title, body, type: "venue_confirm", isRead: false, relatedId: vs.showId,
        });
        await ctx.scheduler.runAfter(0, internal.pushNotifications.sendPush, {
          userId: artistUser.tokenIdentifier, title, body,
        });
      }
    }
  },
});

export const unconfirmShow = mutation({
  args: { id: v.id("venueShows") },
  handler: async (ctx, args) => {
    const venueId = await requireVenue(ctx);
    const vs = await ctx.db.get(args.id);
    if (!vs || vs.venueProfileId !== venueId) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { confirmedByVenue: false });
  },
});

const RIDER_FIELDS = new Set([
  "techRiderReceived",
  "stagePlotReceived",
  "inputListReceived",
  "hospitalityRiderReceived",
  "cateringConfirmed",
  "accessibilitiesConfirmed",
]);

export const updateRiderStatus = mutation({
  args: {
    id: v.id("venueShows"),
    field: v.union(
      v.literal("techRiderReceived"),
      v.literal("stagePlotReceived"),
      v.literal("inputListReceived"),
      v.literal("hospitalityRiderReceived"),
      v.literal("cateringConfirmed"),
      v.literal("accessibilitiesConfirmed")
    ),
    value: v.boolean(),
  },
  handler: async (ctx, args) => {
    const venueId = await requireVenue(ctx);
    const vs = await ctx.db.get(args.id);
    if (!vs || vs.venueProfileId !== venueId) throw new Error("Not authorized");
    if (!RIDER_FIELDS.has(args.field)) throw new Error("Invalid field");
    await ctx.db.patch(args.id, { [args.field]: args.value });
  },
});

export const recordSettlement = mutation({
  args: {
    id: v.id("venueShows"),
    amount: v.number(),
    ticketsSold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const venueId = await requireVenue(ctx);
    const vs = await ctx.db.get(args.id);
    if (!vs || vs.venueProfileId !== venueId) throw new Error("Not authorized");
    if (args.amount < 0) throw new Error("Amount must be positive");
    await ctx.db.patch(args.id, {
      settlementAmount: args.amount,
      ticketsSold: args.ticketsSold,
      settlementPaid: true,
    });

    const show = await ctx.db.get(vs.showId);
    if (show) {
      const artistUser = await ctx.db
        .query("users")
        .withIndex("by_artist", (q) => q.eq("artistId", show.artistId))
        .unique();
      if (artistUser) {
        const venue = await ctx.db.get(venueId);
        const displayAmount = (args.amount / 100).toLocaleString("en-US", { style: "currency", currency: "EUR" });
        const title = "Settlement Recorded";
        const body = `${venue?.name ?? "The venue"} recorded a settlement of ${displayAmount} for ${show.name}`;
        await ctx.db.insert("notifications", {
          userId: artistUser.tokenIdentifier,
          title, body, type: "venue_settlement", isRead: false, relatedId: vs.showId,
        });
        await ctx.scheduler.runAfter(0, internal.pushNotifications.sendPush, {
          userId: artistUser.tokenIdentifier, title, body,
        });
      }
    }
  },
});

export const linkShow = mutation({
  args: {
    venueProfileId: v.id("venueProfiles"),
    showId: v.id("shows"),
  },
  handler: async (ctx, args) => {
    const venueId = await requireVenue(ctx);
    if (venueId !== args.venueProfileId) throw new Error("Not authorized");
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
