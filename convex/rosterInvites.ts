import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const forManager = query({
  args: { managerId: v.id("managerProfiles") },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("rosterInvites")
      .withIndex("by_manager", (q) => q.eq("managerId", args.managerId))
      .collect();
    return Promise.all(
      invites.map(async (inv) => ({ ...inv, artist: await ctx.db.get(inv.artistId) }))
    );
  },
});

export const forArtist = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("rosterInvites")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .collect();
    return Promise.all(
      invites.map(async (inv) => ({ ...inv, managerProfile: await ctx.db.get(inv.managerId) }))
    );
  },
});

export const send = mutation({
  args: {
    managerId: v.id("managerProfiles"),
    artistId: v.id("artists"),
    direction: v.union(v.literal("manager_to_artist"), v.literal("artist_to_manager")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("rosterInvites")
      .withIndex("by_manager", (q) => q.eq("managerId", args.managerId))
      .filter((q) =>
        q.and(
          q.eq(q.field("artistId"), args.artistId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();
    if (existing) throw new Error("A pending invite already exists for this artist");

    const artistUser = await ctx.db
      .query("users")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .unique();
    if (artistUser?.managerProfileId === args.managerId) {
      throw new Error("Artist is already on your roster");
    }

    await ctx.db.insert("rosterInvites", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const respond = mutation({
  args: {
    inviteId: v.id("rosterInvites"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") throw new Error("Already responded to this invite");

    await ctx.db.patch(args.inviteId, { status: args.accept ? "accepted" : "declined" });

    if (args.accept) {
      const artistUser = await ctx.db
        .query("users")
        .withIndex("by_artist", (q) => q.eq("artistId", invite.artistId))
        .unique();
      if (artistUser) {
        await ctx.db.patch(artistUser._id, { managerProfileId: invite.managerId });
      }
    }
  },
});
