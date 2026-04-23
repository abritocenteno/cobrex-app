import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const register = mutation({
  args: {
    token: v.string(),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
      .take(10);

    const alreadyRegistered = existing.find((t) => t.token === args.token);
    if (alreadyRegistered) return alreadyRegistered._id;

    return ctx.db.insert("pushTokens", {
      userId: identity.tokenIdentifier,
      token: args.token,
      platform: args.platform,
    });
  },
});
