import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (user) return user;

    // Legacy: find artist created by old backend using Clerk subject as ownerUserId
    const legacyArtist = await ctx.db
      .query("artists")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", identity.subject))
      .unique();
    if (legacyArtist) {
      return {
        _id: "legacy" as any,
        _creationTime: 0,
        tokenIdentifier: identity.tokenIdentifier,
        email: identity.email,
        name: identity.name,
        role: "artist" as const,
        artistId: legacyArtist._id,
        onboardingDone: true,
        onboardingDismissed: true,
      };
    }

    return null;
  },
});

export const createProfile = mutation({
  args: {
    role: v.union(v.literal("artist"), v.literal("manager"), v.literal("venue")),
    displayName: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (existing) return existing._id;

    // Legacy: if artist already exists via old ownerUserId, link it
    const legacyArtist = await ctx.db
      .query("artists")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", identity.subject))
      .unique();

    let artistId = legacyArtist?._id;
    let managerProfileId = undefined;
    let venueProfileId = undefined;

    if (args.role === "artist" && !artistId) {
      const slug =
        args.displayName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
        "-" +
        Date.now().toString(36);
      artistId = await ctx.db.insert("artists", {
        name: args.displayName,
        slug,
        ownerUserId: identity.subject,
      });
    } else if (args.role === "manager") {
      managerProfileId = await ctx.db.insert("managerProfiles", {
        userId: identity.tokenIdentifier,
        email: args.email,
      });
    } else if (args.role === "venue") {
      venueProfileId = await ctx.db.insert("venueProfiles", {
        userId: identity.tokenIdentifier,
        name: args.displayName,
        email: args.email,
      });
    }

    return ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email: args.email,
      name: args.displayName,
      role: args.role,
      artistId,
      managerProfileId,
      venueProfileId,
    });
  },
});

export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (existing) return existing._id;

    // Auto-migrate legacy artist user
    const legacyArtist = await ctx.db
      .query("artists")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", identity.subject))
      .unique();

    return ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email,
      name: identity.name,
      role: legacyArtist ? "artist" : undefined,
      artistId: legacyArtist?._id,
      onboardingDone: legacyArtist ? true : undefined,
    });
  },
});

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) {
      // Legacy user — create the record properly
      const legacyArtist = await ctx.db
        .query("artists")
        .withIndex("by_owner", (q) => q.eq("ownerUserId", identity.subject))
        .unique();
      await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        email: identity.email,
        name: identity.name,
        role: "artist",
        artistId: legacyArtist?._id,
        onboardingDone: true,
      });
      return;
    }
    await ctx.db.patch(user._id, { onboardingDone: true });
  },
});

export const dismissOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) {
      const legacyArtist = await ctx.db
        .query("artists")
        .withIndex("by_owner", (q) => q.eq("ownerUserId", identity.subject))
        .unique();
      await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        email: identity.email,
        name: identity.name,
        role: "artist",
        artistId: legacyArtist?._id,
        onboardingDone: true,
        onboardingDismissed: true,
      });
      return;
    }
    await ctx.db.patch(user._id, { onboardingDismissed: true, onboardingDone: true });
  },
});
