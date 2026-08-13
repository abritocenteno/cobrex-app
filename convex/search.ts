import { query } from "./_generated/server";
import { v } from "convex/values";

export const globalSearch = query({
  args: {
    artistId: v.id("artists"),
    q: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { artistId, q } = args;

    const [shows, contacts, songs, assets, parties] = await Promise.all([
      ctx.db
        .query("shows")
        .withSearchIndex("search_name", (s) => s.search("name", q).eq("artistId", artistId))
        .take(5),
      ctx.db
        .query("contacts")
        .withSearchIndex("search_displayName", (s) =>
          s.search("displayName", q).eq("artistId", artistId)
        )
        .take(5),
      ctx.db
        .query("songs")
        .withSearchIndex("search_title", (s) => s.search("title", q).eq("artistId", artistId))
        .take(5),
      ctx.db
        .query("assets")
        .withSearchIndex("search_name", (s) => s.search("name", q).eq("artistId", artistId))
        .take(5),
      ctx.db
        .query("tourParties")
        .withSearchIndex("search_name", (s) => s.search("name", q).eq("artistId", artistId))
        .take(5),
    ]);

    return { shows, contacts, songs, assets, parties };
  },
});
