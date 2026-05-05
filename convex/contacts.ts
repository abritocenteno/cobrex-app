import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireArtist,
  requireAuth,
  requireNonEmpty,
  requireEnum,
  requireRange,
  sanitizeStr,
  CONTACT_TYPES,
} from "./helpers";

export const list = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return ctx.db
      .query("contacts")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .take(200);
  },
});

export const get = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    artistId: v.id("artists"),
    displayName: v.string(),
    contactType: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    if (args.artistId !== myArtistId) throw new Error("Unauthorized");

    const displayName = requireNonEmpty(args.displayName, "Name");
    const contactType = requireEnum(args.contactType, CONTACT_TYPES, "Contact type");
    const rating = args.rating !== undefined ? requireRange(args.rating, 1, 5, "Rating") : undefined;

    const email = sanitizeStr(args.email, 254);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email address");
    }

    return ctx.db.insert("contacts", {
      artistId: myArtistId,
      displayName,
      contactType,
      email,
      phone: sanitizeStr(args.phone, 30),
      company: sanitizeStr(args.company, 200),
      city: sanitizeStr(args.city, 100),
      country: sanitizeStr(args.country, 100),
      notes: sanitizeStr(args.notes, 2000),
      rating,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    displayName: v.optional(v.string()),
    contactType: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const contact = await ctx.db.get(args.id);
    if (!contact) throw new Error("Contact not found");
    if (contact.artistId !== myArtistId) throw new Error("Unauthorized");

    const updates: Record<string, unknown> = {};
    if (args.displayName !== undefined) updates.displayName = requireNonEmpty(args.displayName, "Name");
    if (args.contactType !== undefined) updates.contactType = requireEnum(args.contactType, CONTACT_TYPES, "Contact type");
    if (args.rating !== undefined) updates.rating = requireRange(args.rating, 1, 5, "Rating");
    if (args.email !== undefined) {
      const email = sanitizeStr(args.email, 254);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email address");
      updates.email = email;
    }
    if (args.phone !== undefined) updates.phone = sanitizeStr(args.phone, 30);
    if (args.company !== undefined) updates.company = sanitizeStr(args.company, 200);
    if (args.city !== undefined) updates.city = sanitizeStr(args.city, 100);
    if (args.country !== undefined) updates.country = sanitizeStr(args.country, 100);
    if (args.notes !== undefined) updates.notes = sanitizeStr(args.notes, 2000);

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const myArtistId = await requireArtist(ctx);
    const contact = await ctx.db.get(args.id);
    if (!contact) throw new Error("Contact not found");
    if (contact.artistId !== myArtistId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});
