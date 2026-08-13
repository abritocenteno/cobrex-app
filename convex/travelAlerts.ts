import { v } from "convex/values";
import { internalQuery, internalAction, mutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

type ExpiringDocItem = {
  artistId: Id<"artists">;
  travelerId: Id<"travelers">;
  travelerName: string;
  docType: string;
  expiresAt: number;
  urgency: "critical" | "warning";
  notifTitle: string;
  notifBody: string;
};

export const scanExpiringItems = internalQuery({
  args: {},
  handler: async (ctx): Promise<ExpiringDocItem[]> => {
    const now = Date.now();
    const warn90 = now + 90 * 24 * 60 * 60 * 1000;

    const docs = await ctx.db.query("travelDocuments").take(1000);
    const issues: ExpiringDocItem[] = [];

    for (const doc of docs) {
      if (doc.expiresAt <= now) continue;
      if (doc.expiresAt > warn90) continue;

      const traveler = await ctx.db.get(doc.travelerId);
      if (!traveler) continue;

      const daysLeft = Math.ceil((doc.expiresAt - now) / (24 * 60 * 60 * 1000));
      const urgency = daysLeft <= 30 ? "critical" : "warning";
      const docLabel =
        doc.type === "passport"
          ? "Passport"
          : doc.type === "national_id"
          ? "National ID"
          : "ID Document";

      issues.push({
        artistId: doc.artistId,
        travelerId: doc.travelerId,
        travelerName: traveler.name,
        docType: doc.type,
        expiresAt: doc.expiresAt,
        urgency,
        notifTitle:
          urgency === "critical"
            ? `${docLabel} Expiring in ${daysLeft} Days`
            : `${docLabel} Expires in ${daysLeft} Days`,
        notifBody: `${traveler.name}'s ${docLabel.toLowerCase()} expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`,
      });
    }

    return issues;
  },
});

export const getArtistOwnerToken = internalQuery({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args): Promise<string | null> => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .take(1);
    return users[0]?.tokenIdentifier ?? null;
  },
});

export const checkTravelAlerts = internalAction({
  args: {},
  handler: async (ctx) => {
    const issues: ExpiringDocItem[] = await ctx.runQuery(
      internal.travelAlerts.scanExpiringItems,
      {}
    );

    if (issues.length === 0) return { notified: 0 };

    // Cache artistId → owner token to avoid duplicate lookups
    const tokenCache = new Map<string, string | null>();

    for (const issue of issues) {
      const artistKey = String(issue.artistId);
      if (!tokenCache.has(artistKey)) {
        const token: string | null = await ctx.runQuery(
          internal.travelAlerts.getArtistOwnerToken,
          { artistId: issue.artistId }
        );
        tokenCache.set(artistKey, token);
      }

      const ownerToken = tokenCache.get(artistKey);
      if (!ownerToken) continue;

      // In-app notification
      await ctx.runMutation(api.notifications.create, {
        userId: ownerToken,
        title: issue.notifTitle,
        body: issue.notifBody,
        type: "travel_alert",
        relatedId: String(issue.travelerId),
      });

      // Push notification — inline to avoid cross-action call
      const tokens: string[] = await ctx.runQuery(
        internal.pushNotifications.getTokensForUser,
        { userId: ownerToken }
      );
      if (tokens.length > 0) {
        try {
          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Accept-Encoding": "gzip, deflate",
            },
            body: JSON.stringify(
              tokens.map((token) => ({
                to: token,
                sound: "default",
                title: issue.notifTitle,
                body: issue.notifBody,
              }))
            ),
          });
        } catch (err) {
          console.warn("[travelAlerts] Push error:", err);
        }
      }
    }

    return { notified: issues.length };
  },
});

export const triggerTravelAlerts = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.scheduler.runAfter(0, internal.travelAlerts.checkTravelAlerts, {});
  },
});
