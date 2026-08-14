import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireNonEmpty, sanitizeStr } from "./helpers";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function resolveUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new Error("User not found");
  return user;
}

async function requireTravelAccess(
  ctx: QueryCtx | MutationCtx,
  artistId: Id<"artists">
): Promise<{ role: "artist" | "manager" }> {
  const user = await resolveUser(ctx);
  if (user.artistId === artistId) return { role: "artist" };
  if (user.managerProfileId) {
    const invites = await ctx.db
      .query("rosterInvites")
      .withIndex("by_manager", (q) => q.eq("managerId", user.managerProfileId!))
      .take(100);
    if (invites.some((i) => i.artistId === artistId && i.status === "accepted")) {
      return { role: "manager" };
    }
  }
  throw new Error("Access denied");
}

// ─── Tour Parties ─────────────────────────────────────────────────────────────

export const createTourParty = mutation({
  args: {
    artistId: v.id("artists"),
    name: v.string(),
    showId: v.optional(v.id("shows")),
    departureDate: v.optional(v.number()),
    returnDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireTravelAccess(ctx, args.artistId);
    return ctx.db.insert("tourParties", {
      artistId: args.artistId,
      name: requireNonEmpty(args.name, "Tour party name"),
      showId: args.showId,
      status: "planning",
      departureDate: args.departureDate,
      returnDate: args.returnDate,
      notes: sanitizeStr(args.notes, 1000),
    });
  },
});

export const listTourParties = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    await requireTravelAccess(ctx, args.artistId);
    return ctx.db
      .query("tourParties")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .order("desc")
      .take(50);
  },
});

export const listMyTourParties = query({
  args: {},
  handler: async (ctx) => {
    const user = await resolveUser(ctx);
    if (!user.artistId) return [];
    return ctx.db
      .query("tourParties")
      .withIndex("by_artist", (q) => q.eq("artistId", user.artistId!))
      .order("desc")
      .take(20);
  },
});

export const listManagerTourParties = query({
  args: {},
  handler: async (ctx) => {
    const user = await resolveUser(ctx);
    if (!user.managerProfileId) return [];
    const invites = await ctx.db
      .query("rosterInvites")
      .withIndex("by_manager", (q) => q.eq("managerId", user.managerProfileId!))
      .take(100);
    const acceptedArtistIds = invites
      .filter((i) => i.status === "accepted")
      .map((i) => i.artistId);
    const results: Array<{ artist: any; parties: any[] }> = [];
    for (const artistId of acceptedArtistIds) {
      const artist = await ctx.db.get(artistId);
      const parties = await ctx.db
        .query("tourParties")
        .withIndex("by_artist", (q) => q.eq("artistId", artistId))
        .order("desc")
        .take(10);
      results.push({ artist, parties });
    }
    return results;
  },
});

export const getTourParty = query({
  args: { id: v.id("tourParties") },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.id);
    if (!party) return null;
    await requireTravelAccess(ctx, party.artistId);
    return party;
  },
});

export const updateTourParty = mutation({
  args: {
    id: v.id("tourParties"),
    name: v.optional(v.string()),
    status: v.optional(v.string()),
    showId: v.optional(v.id("shows")),
    departureDate: v.optional(v.number()),
    returnDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.id);
    if (!party) throw new Error("Tour party not found");
    await requireTravelAccess(ctx, party.artistId);
    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = requireNonEmpty(args.name, "Name");
    if (args.status !== undefined) updates.status = args.status;
    if (args.showId !== undefined) updates.showId = args.showId;
    if (args.departureDate !== undefined) updates.departureDate = args.departureDate;
    if (args.returnDate !== undefined) updates.returnDate = args.returnDate;
    if (args.notes !== undefined) updates.notes = sanitizeStr(args.notes, 1000);
    await ctx.db.patch(args.id, updates);
  },
});

// ─── Travelers ────────────────────────────────────────────────────────────────

export const addTraveler = mutation({
  args: {
    tourPartyId: v.id("tourParties"),
    role: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.tourPartyId);
    if (!party) throw new Error("Tour party not found");
    await requireTravelAccess(ctx, party.artistId);
    return ctx.db.insert("travelers", {
      tourPartyId: args.tourPartyId,
      artistId: party.artistId,
      role: args.role,
      name: requireNonEmpty(args.name, "Name"),
      email: sanitizeStr(args.email),
      phone: sanitizeStr(args.phone),
      emergencyContact: sanitizeStr(args.emergencyContact, 500),
      clerkUserId: args.clerkUserId,
    });
  },
});

export const listTravelers = query({
  args: { tourPartyId: v.id("tourParties") },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.tourPartyId);
    if (!party) return [];
    await requireTravelAccess(ctx, party.artistId);
    return ctx.db
      .query("travelers")
      .withIndex("by_tour_party", (q) => q.eq("tourPartyId", args.tourPartyId))
      .take(100);
  },
});

export const updateTraveler = mutation({
  args: {
    id: v.id("travelers"),
    role: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const traveler = await ctx.db.get(args.id);
    if (!traveler) throw new Error("Traveler not found");
    await requireTravelAccess(ctx, traveler.artistId);
    const updates: Record<string, unknown> = {};
    if (args.role !== undefined) updates.role = args.role;
    if (args.name !== undefined) updates.name = requireNonEmpty(args.name, "Name");
    if (args.email !== undefined) updates.email = sanitizeStr(args.email);
    if (args.phone !== undefined) updates.phone = sanitizeStr(args.phone);
    if (args.emergencyContact !== undefined) updates.emergencyContact = sanitizeStr(args.emergencyContact, 500);
    await ctx.db.patch(args.id, updates);
  },
});

export const removeTraveler = mutation({
  args: { id: v.id("travelers") },
  handler: async (ctx, args) => {
    const traveler = await ctx.db.get(args.id);
    if (!traveler) throw new Error("Traveler not found");
    await requireTravelAccess(ctx, traveler.artistId);
    await ctx.db.delete(args.id);
  },
});

// ─── Travel Documents ─────────────────────────────────────────────────────────

export const addTravelDocument = mutation({
  args: {
    travelerId: v.id("travelers"),
    type: v.string(),
    issuingCountry: v.string(),
    nationality: v.string(),
    numberLast4: v.string(),
    numberEncrypted: v.string(),
    expiresAt: v.number(),
    storageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const traveler = await ctx.db.get(args.travelerId);
    if (!traveler) throw new Error("Traveler not found");
    await requireTravelAccess(ctx, traveler.artistId);
    return ctx.db.insert("travelDocuments", {
      travelerId: args.travelerId,
      artistId: traveler.artistId,
      type: args.type,
      issuingCountry: requireNonEmpty(args.issuingCountry, "Issuing country"),
      nationality: requireNonEmpty(args.nationality, "Nationality"),
      numberLast4: args.numberLast4,
      numberEncrypted: args.numberEncrypted,
      expiresAt: args.expiresAt,
      storageId: args.storageId,
      verified: false,
      notes: sanitizeStr(args.notes, 500),
    });
  },
});

export const listTravelDocuments = query({
  args: { travelerId: v.id("travelers") },
  handler: async (ctx, args) => {
    const traveler = await ctx.db.get(args.travelerId);
    if (!traveler) return [];
    await requireTravelAccess(ctx, traveler.artistId);
    return ctx.db
      .query("travelDocuments")
      .withIndex("by_traveler", (q) => q.eq("travelerId", args.travelerId))
      .take(20);
  },
});

export const verifyDocument = mutation({
  args: { id: v.id("travelDocuments"), verified: v.boolean() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document not found");
    await requireTravelAccess(ctx, doc.artistId);
    await ctx.db.patch(args.id, { verified: args.verified });
  },
});

export const removeTravelDocument = mutation({
  args: { id: v.id("travelDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document not found");
    await requireTravelAccess(ctx, doc.artistId);
    if (doc.storageId) await ctx.storage.delete(doc.storageId);
    await ctx.db.delete(args.id);
  },
});

// ─── Visa Cases ───────────────────────────────────────────────────────────────

export const addVisaCase = mutation({
  args: {
    travelerId: v.id("travelers"),
    showId: v.optional(v.id("shows")),
    destinationCountry: v.string(),
    visaType: v.optional(v.string()),
    status: v.string(),
    workPermitRequired: v.optional(v.boolean()),
    invitationLetterRequired: v.optional(v.boolean()),
    immigrationContact: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const traveler = await ctx.db.get(args.travelerId);
    if (!traveler) throw new Error("Traveler not found");
    await requireTravelAccess(ctx, traveler.artistId);
    return ctx.db.insert("visaCases", {
      travelerId: args.travelerId,
      artistId: traveler.artistId,
      showId: args.showId,
      destinationCountry: requireNonEmpty(args.destinationCountry, "Destination country"),
      visaType: sanitizeStr(args.visaType),
      status: args.status,
      workPermitRequired: args.workPermitRequired,
      invitationLetterRequired: args.invitationLetterRequired,
      immigrationContact: sanitizeStr(args.immigrationContact, 300),
      notes: sanitizeStr(args.notes, 1000),
    });
  },
});

export const listVisaCases = query({
  args: { travelerId: v.id("travelers") },
  handler: async (ctx, args) => {
    const traveler = await ctx.db.get(args.travelerId);
    if (!traveler) return [];
    await requireTravelAccess(ctx, traveler.artistId);
    return ctx.db
      .query("visaCases")
      .withIndex("by_traveler", (q) => q.eq("travelerId", args.travelerId))
      .take(50);
  },
});

export const listVisaCasesByArtist = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    await requireTravelAccess(ctx, args.artistId);
    return ctx.db
      .query("visaCases")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .take(100);
  },
});

export const updateVisaCase = mutation({
  args: {
    id: v.id("visaCases"),
    status: v.optional(v.string()),
    visaType: v.optional(v.string()),
    applicationDate: v.optional(v.number()),
    appointmentDate: v.optional(v.number()),
    decisionDate: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    workPermitRequired: v.optional(v.boolean()),
    workPermitStatus: v.optional(v.string()),
    workPermitSponsor: v.optional(v.string()),
    workPermitDeadline: v.optional(v.number()),
    invitationLetterRequired: v.optional(v.boolean()),
    immigrationContact: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const visa = await ctx.db.get(args.id);
    if (!visa) throw new Error("Visa case not found");
    await requireTravelAccess(ctx, visa.artistId);
    const updates: Record<string, unknown> = {};
    const { id: _id, ...fields } = args;
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    await ctx.db.patch(args.id, updates);
  },
});

export const removeVisaCase = mutation({
  args: { id: v.id("visaCases") },
  handler: async (ctx, args) => {
    const visa = await ctx.db.get(args.id);
    if (!visa) throw new Error("Visa case not found");
    await requireTravelAccess(ctx, visa.artistId);
    await ctx.db.delete(args.id);
  },
});

// ─── Warnings Dashboard ───────────────────────────────────────────────────────

export const getVisaWarnings = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    await requireTravelAccess(ctx, args.artistId);
    const now = Date.now();
    const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const docs = await ctx.db
      .query("travelDocuments")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .take(200);

    const passportWarnings = docs
      .filter((d) => d.type === "passport" && d.expiresAt < now + sixMonthsMs)
      .map((d) => ({
        type: "passport_expiring" as const,
        travelerId: d.travelerId,
        message: `Passport expires ${new Date(d.expiresAt).toLocaleDateString()}`,
        severity: d.expiresAt < now ? "expired" : d.expiresAt < now + thirtyDaysMs ? "critical" : "warning",
      }));

    const visas = await ctx.db
      .query("visaCases")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .take(200);

    const unresolvedVisas = visas
      .filter((vc) => !["approved", "not_required"].includes(vc.status))
      .map((vc) => ({
        type: "visa_unresolved" as const,
        travelerId: vc.travelerId,
        message: `${vc.destinationCountry} visa — ${vc.status.replace(/_/g, " ")}`,
        severity: "warning" as const,
      }));

    return { passportWarnings, unresolvedVisas };
  },
});

// ─── Flight Bookings ──────────────────────────────────────────────────────────

export const addFlight = mutation({
  args: {
    tourPartyId: v.id("tourParties"),
    travelerId: v.id("travelers"),
    airline: v.string(),
    flightNumber: v.string(),
    departureAirport: v.string(),
    arrivalAirport: v.string(),
    departureAt: v.number(),
    arrivalAt: v.number(),
    bookingRef: v.optional(v.string()),
    terminal: v.optional(v.string()),
    seat: v.optional(v.string()),
    baggageAllowance: v.optional(v.string()),
    oversizedBaggage: v.optional(v.boolean()),
    costAmount: v.optional(v.number()),
    costCurrency: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.tourPartyId);
    if (!party) throw new Error("Tour party not found");
    await requireTravelAccess(ctx, party.artistId);
    return ctx.db.insert("flightBookings", {
      travelerId: args.travelerId,
      tourPartyId: args.tourPartyId,
      artistId: party.artistId,
      airline: requireNonEmpty(args.airline, "Airline"),
      flightNumber: requireNonEmpty(args.flightNumber, "Flight number"),
      departureAirport: requireNonEmpty(args.departureAirport, "Departure airport"),
      arrivalAirport: requireNonEmpty(args.arrivalAirport, "Arrival airport"),
      departureAt: args.departureAt,
      arrivalAt: args.arrivalAt,
      bookingRef: sanitizeStr(args.bookingRef),
      terminal: sanitizeStr(args.terminal),
      seat: sanitizeStr(args.seat),
      baggageAllowance: sanitizeStr(args.baggageAllowance),
      oversizedBaggage: args.oversizedBaggage,
      status: "booked",
      costAmount: args.costAmount,
      costCurrency: args.costCurrency,
      notes: sanitizeStr(args.notes, 500),
    });
  },
});

export const listFlights = query({
  args: { tourPartyId: v.id("tourParties") },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.tourPartyId);
    if (!party) return [];
    await requireTravelAccess(ctx, party.artistId);
    return ctx.db
      .query("flightBookings")
      .withIndex("by_tour_party", (q) => q.eq("tourPartyId", args.tourPartyId))
      .take(100);
  },
});

export const updateFlight = mutation({
  args: {
    id: v.id("flightBookings"),
    airline: v.optional(v.string()),
    flightNumber: v.optional(v.string()),
    departureAirport: v.optional(v.string()),
    arrivalAirport: v.optional(v.string()),
    departureAt: v.optional(v.number()),
    arrivalAt: v.optional(v.number()),
    bookingRef: v.optional(v.string()),
    terminal: v.optional(v.string()),
    seat: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.id);
    if (!flight) throw new Error("Flight not found");
    await requireTravelAccess(ctx, flight.artistId);
    const { id: _id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    await ctx.db.patch(args.id, updates);
  },
});

export const removeFlight = mutation({
  args: { id: v.id("flightBookings") },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.id);
    if (!flight) throw new Error("Flight not found");
    await requireTravelAccess(ctx, flight.artistId);
    await ctx.db.delete(args.id);
  },
});

// ─── Hotel Bookings ───────────────────────────────────────────────────────────

export const addHotelBooking = mutation({
  args: {
    tourPartyId: v.id("tourParties"),
    hotelName: v.string(),
    checkInDate: v.number(),
    checkOutDate: v.number(),
    showId: v.optional(v.id("shows")),
    address: v.optional(v.string()),
    reservationNumber: v.optional(v.string()),
    hotelPhone: v.optional(v.string()),
    paymentResponsibility: v.optional(v.string()),
    totalCost: v.optional(v.number()),
    costCurrency: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.tourPartyId);
    if (!party) throw new Error("Tour party not found");
    await requireTravelAccess(ctx, party.artistId);
    return ctx.db.insert("hotelBookings", {
      artistId: party.artistId,
      tourPartyId: args.tourPartyId,
      showId: args.showId,
      hotelName: requireNonEmpty(args.hotelName, "Hotel name"),
      checkInDate: args.checkInDate,
      checkOutDate: args.checkOutDate,
      address: sanitizeStr(args.address, 300),
      reservationNumber: sanitizeStr(args.reservationNumber),
      hotelPhone: sanitizeStr(args.hotelPhone),
      paymentResponsibility: sanitizeStr(args.paymentResponsibility),
      roomingListStatus: "pending",
      totalCost: args.totalCost,
      costCurrency: args.costCurrency,
      notes: sanitizeStr(args.notes, 500),
    });
  },
});

export const listHotelBookings = query({
  args: { tourPartyId: v.id("tourParties") },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.tourPartyId);
    if (!party) return [];
    await requireTravelAccess(ctx, party.artistId);
    return ctx.db
      .query("hotelBookings")
      .withIndex("by_tour_party", (q) => q.eq("tourPartyId", args.tourPartyId))
      .take(50);
  },
});

export const updateHotelBooking = mutation({
  args: {
    id: v.id("hotelBookings"),
    hotelName: v.optional(v.string()),
    checkInDate: v.optional(v.number()),
    checkOutDate: v.optional(v.number()),
    address: v.optional(v.string()),
    reservationNumber: v.optional(v.string()),
    hotelPhone: v.optional(v.string()),
    paymentResponsibility: v.optional(v.string()),
    roomingListStatus: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const hotel = await ctx.db.get(args.id);
    if (!hotel) throw new Error("Hotel booking not found");
    await requireTravelAccess(ctx, hotel.artistId);
    const { id: _id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    await ctx.db.patch(args.id, updates);
  },
});

export const removeHotelBooking = mutation({
  args: { id: v.id("hotelBookings") },
  handler: async (ctx, args) => {
    const hotel = await ctx.db.get(args.id);
    if (!hotel) throw new Error("Hotel booking not found");
    await requireTravelAccess(ctx, hotel.artistId);
    await ctx.db.delete(args.id);
  },
});

// ─── Room Assignments ─────────────────────────────────────────────────────────

export const assignRoom = mutation({
  args: {
    hotelBookingId: v.id("hotelBookings"),
    travelerId: v.id("travelers"),
    roomType: v.optional(v.string()),
    roomNumber: v.optional(v.string()),
    breakfastIncluded: v.optional(v.boolean()),
    lateCheckIn: v.optional(v.boolean()),
    accessibilityNotes: v.optional(v.string()),
    dietaryNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const hotel = await ctx.db.get(args.hotelBookingId);
    if (!hotel) throw new Error("Hotel booking not found");
    await requireTravelAccess(ctx, hotel.artistId);
    return ctx.db.insert("roomAssignments", {
      hotelBookingId: args.hotelBookingId,
      travelerId: args.travelerId,
      artistId: hotel.artistId,
      roomType: sanitizeStr(args.roomType),
      roomNumber: sanitizeStr(args.roomNumber),
      breakfastIncluded: args.breakfastIncluded,
      lateCheckIn: args.lateCheckIn,
      accessibilityNotes: sanitizeStr(args.accessibilityNotes, 300),
      dietaryNotes: sanitizeStr(args.dietaryNotes, 300),
    });
  },
});

export const listRoomAssignments = query({
  args: { hotelBookingId: v.id("hotelBookings") },
  handler: async (ctx, args) => {
    const hotel = await ctx.db.get(args.hotelBookingId);
    if (!hotel) return [];
    await requireTravelAccess(ctx, hotel.artistId);
    return ctx.db
      .query("roomAssignments")
      .withIndex("by_hotel_booking", (q) => q.eq("hotelBookingId", args.hotelBookingId))
      .take(50);
  },
});

export const updateRoomAssignment = mutation({
  args: {
    id: v.id("roomAssignments"),
    roomType: v.optional(v.string()),
    roomNumber: v.optional(v.string()),
    breakfastIncluded: v.optional(v.boolean()),
    lateCheckIn: v.optional(v.boolean()),
    accessibilityNotes: v.optional(v.string()),
    dietaryNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.id);
    if (!room) throw new Error("Room assignment not found");
    await requireTravelAccess(ctx, room.artistId);
    const { id: _id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    await ctx.db.patch(args.id, updates);
  },
});

export const removeRoomAssignment = mutation({
  args: { id: v.id("roomAssignments") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.id);
    if (!room) throw new Error("Room assignment not found");
    await requireTravelAccess(ctx, room.artistId);
    await ctx.db.delete(args.id);
  },
});

// ─── Transport Jobs ───────────────────────────────────────────────────────────

export const addTransportJob = mutation({
  args: {
    tourPartyId: v.id("tourParties"),
    type: v.string(),
    pickupLocation: v.string(),
    dropoffLocation: v.string(),
    scheduledPickupAt: v.number(),
    showId: v.optional(v.id("shows")),
    driverName: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    vehicleDescription: v.optional(v.string()),
    licensePlate: v.optional(v.string()),
    passengerCount: v.optional(v.number()),
    luggageCount: v.optional(v.number()),
    costAmount: v.optional(v.number()),
    costCurrency: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.tourPartyId);
    if (!party) throw new Error("Tour party not found");
    await requireTravelAccess(ctx, party.artistId);
    return ctx.db.insert("transportJobs", {
      tourPartyId: args.tourPartyId,
      artistId: party.artistId,
      showId: args.showId,
      type: args.type,
      pickupLocation: requireNonEmpty(args.pickupLocation, "Pickup location"),
      dropoffLocation: requireNonEmpty(args.dropoffLocation, "Dropoff location"),
      scheduledPickupAt: args.scheduledPickupAt,
      driverName: sanitizeStr(args.driverName),
      driverPhone: sanitizeStr(args.driverPhone),
      vehicleDescription: sanitizeStr(args.vehicleDescription),
      licensePlate: sanitizeStr(args.licensePlate),
      passengerCount: args.passengerCount,
      luggageCount: args.luggageCount,
      status: "scheduled",
      costAmount: args.costAmount,
      costCurrency: args.costCurrency,
      notes: sanitizeStr(args.notes, 500),
    });
  },
});

export const listTransportJobs = query({
  args: { tourPartyId: v.id("tourParties") },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.tourPartyId);
    if (!party) return [];
    await requireTravelAccess(ctx, party.artistId);
    return ctx.db
      .query("transportJobs")
      .withIndex("by_tour_party", (q) => q.eq("tourPartyId", args.tourPartyId))
      .take(100);
  },
});

export const updateTransportJob = mutation({
  args: {
    id: v.id("transportJobs"),
    type: v.optional(v.string()),
    pickupLocation: v.optional(v.string()),
    dropoffLocation: v.optional(v.string()),
    scheduledPickupAt: v.optional(v.number()),
    driverName: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    vehicleDescription: v.optional(v.string()),
    licensePlate: v.optional(v.string()),
    passengerCount: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Transport job not found");
    await requireTravelAccess(ctx, job.artistId);
    const { id: _id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    await ctx.db.patch(args.id, updates);
  },
});

export const removeTransportJob = mutation({
  args: { id: v.id("transportJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Transport job not found");
    await requireTravelAccess(ctx, job.artistId);
    await ctx.db.delete(args.id);
  },
});

// ─── Itinerary ────────────────────────────────────────────────────────────────

export const listItinerary = query({
  args: { tourPartyId: v.id("tourParties") },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.tourPartyId);
    if (!party) return [];
    await requireTravelAccess(ctx, party.artistId);
    const items = await ctx.db
      .query("itineraryItems")
      .withIndex("by_tour_party", (q) => q.eq("tourPartyId", args.tourPartyId))
      .take(500);
    return items.sort((a, b) => a.scheduledAt - b.scheduledAt);
  },
});

export const buildItinerary = mutation({
  args: { tourPartyId: v.id("tourParties") },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.tourPartyId);
    if (!party) throw new Error("Tour party not found");
    await requireTravelAccess(ctx, party.artistId);

    // Clear existing generated items
    const existing = await ctx.db
      .query("itineraryItems")
      .withIndex("by_tour_party", (q) => q.eq("tourPartyId", args.tourPartyId))
      .take(500);
    await Promise.all(existing.map((item) => ctx.db.delete(item._id)));

    const flights = await ctx.db
      .query("flightBookings")
      .withIndex("by_tour_party", (q) => q.eq("tourPartyId", args.tourPartyId))
      .take(100);

    const hotels = await ctx.db
      .query("hotelBookings")
      .withIndex("by_tour_party", (q) => q.eq("tourPartyId", args.tourPartyId))
      .take(50);

    const transports = await ctx.db
      .query("transportJobs")
      .withIndex("by_tour_party", (q) => q.eq("tourPartyId", args.tourPartyId))
      .take(100);

    // Build a timeline of events keyed by time for conflict checking
    const arrivals = flights
      .filter((f) => f.status !== "cancelled")
      .map((f) => ({ at: f.arrivalAt, airport: f.arrivalAirport }));

    const checkouts = hotels.map((h) => ({ at: h.checkOutDate }));

    const TWO_HOURS = 2 * 60 * 60 * 1000;

    const insertItem = (
      type: string,
      title: string,
      scheduledAt: number,
      linkedEntityType: string,
      linkedEntityId: string,
      conflictDetected: boolean,
      conflictNote: string | undefined
    ) =>
      ctx.db.insert("itineraryItems", {
        artistId: party.artistId,
        tourPartyId: args.tourPartyId,
        showId: party.showId,
        type,
        title,
        scheduledAt,
        linkedEntityType,
        linkedEntityId: String(linkedEntityId),
        conflictDetected: conflictDetected || undefined,
        conflictNote: conflictNote || undefined,
      });

    // Flights
    for (const f of flights) {
      if (f.status === "cancelled") continue;
      const traveler = await ctx.db.get(f.travelerId);
      const name = traveler?.name ?? "Traveler";

      await insertItem(
        "flight_departure",
        `${name} departs ${f.departureAirport} → ${f.arrivalAirport} (${f.airline} ${f.flightNumber})`,
        f.departureAt,
        "flightBookings",
        f._id,
        false,
        undefined
      );

      // Check: does flight arrive within 2h of a transport pickup?
      const hasCloseTransport = transports.some(
        (t) => Math.abs(t.scheduledPickupAt - f.arrivalAt) < TWO_HOURS && t.scheduledPickupAt < f.arrivalAt
      );

      await insertItem(
        "flight_arrival",
        `${name} arrives ${f.arrivalAirport} (${f.airline} ${f.flightNumber})`,
        f.arrivalAt,
        "flightBookings",
        f._id,
        hasCloseTransport,
        hasCloseTransport ? "FLIGHT_LATE: Transport pickup scheduled before flight lands" : undefined
      );
    }

    // Hotels
    for (const h of hotels) {
      // Check: is a flight arriving after check-in time?
      const lateArrival = arrivals.some((a) => a.at > h.checkInDate && a.at < h.checkInDate + TWO_HOURS * 2);

      await insertItem(
        "hotel_checkin",
        `Check-in: ${h.hotelName}`,
        h.checkInDate,
        "hotelBookings",
        h._id,
        lateArrival,
        lateArrival ? "FLIGHT_LATE: Flight arrives after check-in time" : undefined
      );

      const earlyCheckout = h.checkOutDate < h.checkInDate + 12 * 60 * 60 * 1000; // less than 12h stay
      await insertItem(
        "hotel_checkout",
        `Check-out: ${h.hotelName}`,
        h.checkOutDate,
        "hotelBookings",
        h._id,
        earlyCheckout,
        earlyCheckout ? "CHECKOUT_EARLY: Check-out unusually soon after check-in" : undefined
      );
    }

    // Transport
    for (const t of transports) {
      if (t.status === "cancelled") continue;
      const typeLabel =
        t.type === "airport_transfer"
          ? "Airport Transfer"
          : t.type === "hotel_to_venue"
          ? "Hotel → Venue"
          : t.type === "venue_to_hotel"
          ? "Venue → Hotel"
          : "Transfer";

      // Check: is pickup before a flight lands at the origin?
      const conflictingFlight = arrivals.some(
        (a) => a.at > t.scheduledPickupAt && a.at - t.scheduledPickupAt < TWO_HOURS
      );

      await insertItem(
        "transport",
        `${typeLabel}: ${t.pickupLocation} → ${t.dropoffLocation}`,
        t.scheduledPickupAt,
        "transportJobs",
        t._id,
        conflictingFlight,
        conflictingFlight ? "FLIGHT_LATE: Transport pickup may conflict with arriving flight" : undefined
      );
    }

    return { itemCount: flights.length * 2 + hotels.length * 2 + transports.length };
  },
});

// ─── Travel Cost Summary ──────────────────────────────────────────────────────

export const travelCostSummary = query({
  args: { tourPartyId: v.id("tourParties") },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.tourPartyId);
    if (!party) return null;
    await requireTravelAccess(ctx, party.artistId);

    const [flights, hotels, transport] = await Promise.all([
      ctx.db
        .query("flightBookings")
        .withIndex("by_tour_party", (q) => q.eq("tourPartyId", args.tourPartyId))
        .take(100),
      ctx.db
        .query("hotelBookings")
        .withIndex("by_tour_party", (q) => q.eq("tourPartyId", args.tourPartyId))
        .take(50),
      ctx.db
        .query("transportJobs")
        .withIndex("by_tour_party", (q) => q.eq("tourPartyId", args.tourPartyId))
        .take(100),
    ]);

    const allCurrencies = [
      ...flights.map((f) => f.costCurrency).filter(Boolean),
      ...hotels.map((h) => h.costCurrency).filter(Boolean),
      ...transport.map((t) => t.costCurrency).filter(Boolean),
    ] as string[];
    const freq: Record<string, number> = {};
    for (const c of allCurrencies) freq[c] = (freq[c] ?? 0) + 1;
    const primaryCurrency =
      Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";

    const flightTotal = flights.reduce((s, f) => s + (f.costAmount ?? 0), 0);
    const hotelTotal = hotels.reduce((s, h) => s + (h.totalCost ?? 0), 0);
    const transportTotal = transport.reduce((s, t) => s + (t.costAmount ?? 0), 0);

    return {
      primaryCurrency,
      grandTotal: flightTotal + hotelTotal + transportTotal,
      flights: {
        total: flightTotal,
        items: flights.map((f) => ({
          _id: f._id,
          label: `${f.airline} ${f.flightNumber}`,
          cost: f.costAmount ?? 0,
          currency: f.costCurrency ?? primaryCurrency,
        })),
      },
      hotels: {
        total: hotelTotal,
        items: hotels.map((h) => ({
          _id: h._id,
          label: h.hotelName,
          cost: h.totalCost ?? 0,
          currency: h.costCurrency ?? primaryCurrency,
        })),
      },
      transport: {
        total: transportTotal,
        items: transport.map((t) => ({
          _id: t._id,
          label: `${t.type.replace(/_/g, " ")} — ${t.pickupLocation}`,
          cost: t.costAmount ?? 0,
          currency: t.costCurrency ?? primaryCurrency,
        })),
      },
    };
  },
});

// ─── Document upload + share ──────────────────────────────────────────────────

export const generateDocUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return ctx.storage.generateUploadUrl();
  },
});

export const createItineraryShare = mutation({
  args: { tourPartyId: v.id("tourParties") },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.tourPartyId);
    if (!party) throw new Error("Tour party not found");
    await requireTravelAccess(ctx, party.artistId);
    const token =
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2) +
      Date.now().toString(36);
    const shareExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await ctx.db.patch(args.tourPartyId, { shareToken: token, shareExpiresAt });
    return { token, shareExpiresAt };
  },
});

export const getItineraryByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const party = await ctx.db
      .query("tourParties")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.token))
      .take(1);
    const p = party[0];
    if (!p) return null;
    if (p.shareExpiresAt && p.shareExpiresAt < Date.now()) return null;

    const items = await ctx.db
      .query("itineraryItems")
      .withIndex("by_tour_party", (q) => q.eq("tourPartyId", p._id))
      .order("asc")
      .take(200);

    return {
      party: {
        name: p.name,
        status: p.status,
        departureDate: p.departureDate,
        returnDate: p.returnDate,
        shareExpiresAt: p.shareExpiresAt,
      },
      items,
    };
  },
});
