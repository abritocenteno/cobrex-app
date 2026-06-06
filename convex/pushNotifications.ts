import { v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

export const getTokensForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(10);
    return rows.map((r) => r.token);
  },
});

export const sendPush = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const tokens: string[] = await ctx.runQuery(
      internal.pushNotifications.getTokensForUser,
      { userId: args.userId }
    );
    if (!tokens.length) return;

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title: args.title,
      body: args.body,
    }));

    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        console.warn("[push] Expo API error:", await res.text());
      }
    } catch (err) {
      console.warn("[push] Network error:", err);
    }
  },
});
