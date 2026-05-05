import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireArtist, requireAuth, requireNonEmpty } from "./helpers";

const SEED_GENRES = [
  "Electronic","Hip-Hop","Pop","Rock","Jazz","Classical","R&B","Folk",
  "Metal","Reggae","Country","Latin","Afrobeat","Punk","Soul","Indie",
  "Dance","Ambient","World","House","Techno","Drum & Bass","Trance",
  "Dubstep","EDM","Lo-fi","Trap","Boom Bap","Drill","Synth Pop",
  "Indie Pop","K-Pop","Dream Pop","Alternative","Garage","Psychedelic",
  "Post-Rock","Fusion","Bebop","Nu-Jazz","Smooth Jazz",
];

export const listApproved = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const approved = await ctx.db
      .query("genres")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();
    if (approved.length === 0) {
      // Return seed list before first admin seed
      return SEED_GENRES.map((name) => ({ _id: null as any, name, status: "approved" as const }));
    }
    return approved.map((g) => ({ _id: g._id, name: g.name, status: g.status }));
  },
});

export const submit = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const name = requireNonEmpty(args.name, "Genre name", 60);

    // Check if already exists
    const existing = await ctx.db
      .query("genres")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    if (existing) return { id: existing._id, status: existing.status };

    const id = await ctx.db.insert("genres", {
      name,
      status: "pending",
      submittedByArtistId: myArtistId,
      createdAt: Date.now(),
    });
    return { id, status: "pending" as const };
  },
});

export const myPending = query({
  args: {},
  handler: async (ctx) => {
    const myArtistId = await requireArtist(ctx);
    const pending = await ctx.db
      .query("genres")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return pending.filter((g) => g.submittedByArtistId === myArtistId);
  },
});

// Admin operations

async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user?.isAdmin) throw new Error("Admin access required");
  return user;
}

export const adminListPending = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user?.isAdmin) return [];
    return ctx.db
      .query("genres")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const adminReview = mutation({
  args: { id: v.id("genres"), approve: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const genre = await ctx.db.get(args.id);
    if (!genre) throw new Error("Genre not found");
    await ctx.db.patch(args.id, {
      status: args.approve ? "approved" : "rejected",
      reviewedAt: Date.now(),
    });
  },
});

export const adminSeed = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    let seeded = 0;
    for (const name of SEED_GENRES) {
      const existing = await ctx.db
        .query("genres")
        .withIndex("by_name", (q) => q.eq("name", name))
        .first();
      if (!existing) {
        await ctx.db.insert("genres", { name, status: "approved", createdAt: Date.now() });
        seeded++;
      }
    }
    return { seeded };
  },
});
