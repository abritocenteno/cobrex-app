import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

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
        const title = "Manager Invite";
        const body = `${managerProfile?.companyName ?? "A manager"} wants to represent you`;
        await ctx.db.insert("notifications", {
          userId: artistUser.tokenIdentifier,
          title, body, type: "roster_invite", isRead: false, relatedId: args.managerId,
        });
        await ctx.scheduler.runAfter(0, internal.pushNotifications.sendPush, {
          userId: artistUser.tokenIdentifier, title, body,
        });
      }
    } else {
      // Artist requested manager — tell the manager
      if (managerProfile) {
        const artist = await ctx.db.get(args.artistId);
        const title = "Artist Request";
        const body = `${artist?.name ?? "An artist"} wants you to represent them`;
        await ctx.db.insert("notifications", {
          userId: managerProfile.userId,
          title, body, type: "roster_request", isRead: false, relatedId: args.artistId,
        });
        await ctx.scheduler.runAfter(0, internal.pushNotifications.sendPush, {
          userId: managerProfile.userId, title, body,
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
        const title = args.accept ? "Invite Accepted" : "Invite Declined";
        const body = `${artist?.name ?? "Artist"} has ${verb} your invite`;
        await ctx.db.insert("notifications", {
          userId: managerProfile.userId,
          title, body, type: "roster_response", isRead: false, relatedId: invite.artistId,
        });
        await ctx.scheduler.runAfter(0, internal.pushNotifications.sendPush, {
          userId: managerProfile.userId, title, body,
        });
      }
    } else {
      // Manager responded to artist's request — tell the artist
      const artistUser = await ctx.db
        .query("users")
        .withIndex("by_artist", (q) => q.eq("artistId", invite.artistId))
        .unique();
      if (artistUser) {
        const title = args.accept ? "Request Accepted" : "Request Declined";
        const body = `${managerProfile?.companyName ?? "The manager"} has ${verb} your request`;
        await ctx.db.insert("notifications", {
          userId: artistUser.tokenIdentifier,
          title, body, type: "roster_response", isRead: false, relatedId: invite.managerId,
        });
        await ctx.scheduler.runAfter(0, internal.pushNotifications.sendPush, {
          userId: artistUser.tokenIdentifier, title, body,
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
