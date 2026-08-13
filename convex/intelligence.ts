import { query } from "./_generated/server";
import { v } from "convex/values";

export const artistInsights = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];
    const in30Days = new Date(now + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const in90DaysMs = now + 90 * 24 * 60 * 60 * 1000;

    const [allShows, allDeals, allDocs, allVisas] = await Promise.all([
      ctx.db
        .query("shows")
        .withIndex("by_artist_and_date", (q) =>
          q.eq("artistId", args.artistId).gte("showDate", today)
        )
        .collect(),
      ctx.db
        .query("deals")
        .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
        .collect(),
      ctx.db
        .query("travelDocuments")
        .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
        .collect(),
      ctx.db
        .query("visaCases")
        .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
        .collect(),
    ]);

    const upcoming = allShows.filter((s) => s.status !== "cancelled");

    // Shows in next 30 days with unpaid status
    const unpaidUpcomingShows = upcoming.filter(
      (s) => s.showDate <= in30Days && s.paymentStatus === "unpaid"
    );

    // Date conflicts: multiple non-cancelled shows on the same date
    const byDate: Record<string, typeof upcoming> = {};
    for (const s of upcoming) {
      byDate[s.showDate] = byDate[s.showDate] ?? [];
      byDate[s.showDate].push(s);
    }
    const conflictDates = Object.entries(byDate)
      .filter(([, group]) => group.length > 1)
      .map(([date, group]) => ({ date, shows: group }));

    // Deals that haven't been paid in full
    const unpaidDeals = allDeals.filter(
      (d) => d.paymentStatus !== "paid_in_full"
    );

    // Travel docs (passports, IDs) expiring within 90 days (not already expired)
    const expiringDocs = allDocs.filter(
      (d) => d.expiresAt > now && d.expiresAt <= in90DaysMs
    );

    // Visa cases requiring attention
    const PROBLEM_VISA_STATUSES = [
      "refused",
      "expired",
      "review_required",
      "documents_requested",
    ];
    const problemVisas = allVisas.filter((vc) =>
      PROBLEM_VISA_STATUSES.includes(vc.status)
    );

    return {
      unpaidUpcomingShows,
      conflictDates,
      unpaidDeals,
      expiringDocs,
      problemVisas,
    };
  },
});
