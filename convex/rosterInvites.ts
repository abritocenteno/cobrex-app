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

    // Notify the recipient
    const managerProfile = await ctx.db.get(args.managerId);
    if (args.direction === "manager_to_artist") {
      // Manager invited artist — tell the artist
      if (artistUser) {
        await ctx.db.insert("notifications", {
          userId: artistUser.tokenIdentifier,
          title: "Manager Invite",
          body: `${managerProfile?.companyName ?? "A manager"} wants to represent you`,
          type: "roster_invite",
          isRead: false,
          relatedId: args.managerId,
        });
      }
    } else {
      // Artist requested manager — tell the manager
      if (managerProfile) {
        const artist = await ctx.db.get(args.artistId);
        await ctx.db.insert("notifications", {
          userId: managerProfile.userId,
          title: "Artist Request",
          body: `${artist?.name ?? "An artist"} wants you to represent them`,
          type: "roster_request",
          isRead: false,
          relatedId: args.artistId,
        });
      }
    }
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

    // Notify the other party
    const managerProfile = await ctx.db.get(invite.managerId);
    const artist = await ctx.db.get(invite.artistId);
    const verb = args.accept ? "accepted" : "declined";

    if (invite.direction === "manager_to_artist") {
      // Artist responded to manager's invite — tell the manager
      if (managerProfile) {
        await ctx.db.insert("notifications", {
          userId: managerProfile.userId,
          title: args.accept ? "Invite Accepted" : "Invite Declined",
          body: `${artist?.name ?? "Artist"} has ${verb} your invite`,
          type: "roster_response",
          isRead: false,
          relatedId: invite.artistId,
        });
      }
    } else {
      // Manager responded to artist's request — tell the artist
      const artistUser = await ctx.db
        .query("users")
        .withIndex("by_artist", (q) => q.eq("artistId", invite.artistId))
        .unique();
      if (artistUser) {
        await ctx.db.insert("notifications", {
          userId: artistUser.tokenIdentifier,
          title: args.accept ? "Request Accepted" : "Request Declined",
          body: `${managerProfile?.companyName ?? "The manager"} has ${verb} your request`,
          type: "roster_response",
          isRead: false,
          relatedId: invite.managerId,
        });
      }
    }
  },
});

export const retract = mutation({
  args: { inviteId: v.id("rosterInvites") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") throw new Error("Can only retract pending invites");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (invite.direction === "manager_to_artist") {
      if (!user?.managerProfileId || user.managerProfileId !== invite.managerId) {
        throw new Error("Not authorized");
      }
    } else {
      if (!user?.artistId || user.artistId !== invite.artistId) {
        throw new Error("Not authorized");
      }
    }

    await ctx.db.patch(args.inviteId, { status: "declined" });
  },
});
