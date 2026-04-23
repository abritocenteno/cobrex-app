import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("artist"), v.literal("manager"), v.literal("venue"))),
    artistId: v.optional(v.id("artists")),
    managerProfileId: v.optional(v.id("managerProfiles")),
    venueProfileId: v.optional(v.id("venueProfiles")),
    onboardingDone: v.optional(v.boolean()),
    onboardingDismissed: v.optional(v.boolean()),
  }).index("by_token", ["tokenIdentifier"]),

  artists: defineTable({
    name: v.string(),
    slug: v.string(),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    country: v.optional(v.string()),
    genre: v.optional(v.string()),
    subGenre: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    coverImageUrl: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    websiteUrl: v.optional(v.string()),
    memberCount: v.optional(v.number()),
    instagramHandle: v.optional(v.string()),
    spotifyArtistId: v.optional(v.string()),
    tiktokHandle: v.optional(v.string()),
    youtubeHandle: v.optional(v.string()),
    ownerUserId: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerUserId"]),

  shows: defineTable({
    artistId: v.id("artists"),
    name: v.string(),
    showDate: v.string(),
    showTime: v.optional(v.string()),
    loadInTime: v.optional(v.string()),
    soundcheckTime: v.optional(v.string()),
    doorsTime: v.optional(v.string()),
    setLengthMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.string(),
    paymentStatus: v.string(),
    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    ticketUrl: v.optional(v.string()),
    capacity: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_artist", ["artistId"])
    .index("by_artist_and_date", ["artistId", "showDate"]),

  songs: defineTable({
    artistId: v.id("artists"),
    title: v.string(),
    subtitle: v.optional(v.string()),
    keySignature: v.optional(v.string()),
    bpm: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    energyLevel: v.optional(v.number()),
    hasBackingTrack: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  }).index("by_artist", ["artistId"]),

  setlistVersions: defineTable({
    artistId: v.id("artists"),
    showId: v.optional(v.id("shows")),
    name: v.string(),
  })
    .index("by_artist", ["artistId"])
    .index("by_show", ["showId"]),

  setlistItems: defineTable({
    setlistVersionId: v.id("setlistVersions"),
    songId: v.id("songs"),
    position: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_version", ["setlistVersionId"])
    .index("by_version_and_position", ["setlistVersionId", "position"]),

  checklistItems: defineTable({
    showId: v.id("shows"),
    artistId: v.id("artists"),
    label: v.string(),
    isDone: v.boolean(),
    category: v.optional(v.string()),
    isCritical: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  }).index("by_show", ["showId"]),

  timelineEvents: defineTable({
    showId: v.id("shows"),
    artistId: v.id("artists"),
    title: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    status: v.string(),
    sortOrder: v.optional(v.number()),
    description: v.optional(v.string()),
  }).index("by_show", ["showId"]),

  deals: defineTable({
    artistId: v.id("artists"),
    dealType: v.string(),
    agreedTotal: v.number(),
    depositAmount: v.optional(v.number()),
    currency: v.string(),
    showId: v.optional(v.id("shows")),
    promoterId: v.optional(v.id("contacts")),
    contractUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    paymentStatus: v.string(),
    actualReceived: v.optional(v.number()),
    depositReceivedAt: v.optional(v.number()),
    fullyPaidAt: v.optional(v.number()),
  }).index("by_artist", ["artistId"]),

  contacts: defineTable({
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
  })
    .index("by_artist", ["artistId"])
    .index("by_artist_and_type", ["artistId", "contactType"]),

  assets: defineTable({
    artistId: v.id("artists"),
    name: v.string(),
    assetType: v.string(),
    fileUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  }).index("by_artist", ["artistId"]),

  alerts: defineTable({
    artistId: v.id("artists"),
    title: v.string(),
    message: v.string(),
    severity: v.string(),
    status: v.string(),
    category: v.optional(v.string()),
    alertType: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
  })
    .index("by_artist", ["artistId"])
    .index("by_artist_and_status", ["artistId", "status"]),

  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    type: v.string(),
    isRead: v.boolean(),
    isDismissed: v.optional(v.boolean()),
    relatedId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "isRead"]),

  metrics: defineTable({
    artistId: v.id("artists"),
    platform: v.string(),
    metricType: v.string(),
    value: v.number(),
    recordedAt: v.number(),
  })
    .index("by_artist", ["artistId"])
    .index("by_artist_and_platform", ["artistId", "platform"]),

  managerProfiles: defineTable({
    userId: v.string(),
    companyName: v.optional(v.string()),
    territory: v.optional(v.string()),
    commissionRate: v.optional(v.number()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  venueProfiles: defineTable({
    userId: v.string(),
    name: v.optional(v.string()),
    capacity: v.optional(v.number()),
    location: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    description: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  venueShows: defineTable({
    venueProfileId: v.id("venueProfiles"),
    showId: v.id("shows"),
    confirmedByVenue: v.boolean(),
    techRiderReceived: v.optional(v.boolean()),
    stagePlotReceived: v.optional(v.boolean()),
    cateringConfirmed: v.optional(v.boolean()),
    accessibilitiesConfirmed: v.optional(v.boolean()),
  })
    .index("by_venue", ["venueProfileId"])
    .index("by_show", ["showId"]),

  pushTokens: defineTable({
    userId: v.string(),
    token: v.string(),
    platform: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
