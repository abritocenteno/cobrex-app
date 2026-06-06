import { MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── Auth helpers ────────────────────────────────────────────────────────────

export async function requireArtist(ctx: QueryCtx | MutationCtx): Promise<Id<"artists">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user?.artistId) throw new Error("Artist profile required");
  return user.artistId;
}

export async function requireManager(ctx: QueryCtx | MutationCtx): Promise<Id<"managerProfiles">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user?.managerProfileId) throw new Error("Manager profile required");
  return user.managerProfileId;
}

export async function requireVenue(ctx: QueryCtx | MutationCtx): Promise<Id<"venueProfiles">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user?.venueProfileId) throw new Error("Venue profile required");
  return user.venueProfileId;
}

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity;
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export const SHOW_STATUSES = new Set(["draft", "confirmed", "completed", "cancelled", "postponed"]);
export const PAYMENT_STATUSES = new Set(["unpaid", "deposit_paid", "paid_in_full", "overpaid", "refunded"]);
export const DEAL_TYPES = new Set(["flat_fee", "percentage", "guarantee_plus_percentage", "merchandise", "live", "other"]);
export const ASSET_TYPES = new Set(["tech_rider", "stage_plot", "input_list", "hospitality_rider", "press_kit", "press_photo", "contract", "invoice", "setlist", "other"]);
export const CONTACT_TYPES = new Set(["promoter", "venue", "agent", "label", "pr", "tour_manager", "other"]);
export const ALERT_SEVERITIES = new Set(["info", "warning", "critical"]);
export const TIMELINE_STATUSES = new Set(["pending", "in_progress", "done", "cancelled"]);
export const CURRENCIES = new Set(["EUR", "USD", "GBP", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF"]);

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
  "image/svg+xml",
]);

// ─── Validation ───────────────────────────────────────────────────────────────

export function requireEnum(value: string, allowed: Set<string>, field: string): string {
  if (!allowed.has(value)) throw new Error(`Invalid ${field}: "${value}"`);
  return value;
}

export function requireNonEmpty(str: string, field: string, maxLen = 200): string {
  const trimmed = str.trim();
  if (!trimmed) throw new Error(`${field} is required`);
  if (trimmed.length > maxLen) throw new Error(`${field} must be under ${maxLen} characters`);
  return trimmed;
}

export function sanitizeStr(str: string | undefined, maxLen = 200): string | undefined {
  if (str === undefined || str === null) return undefined;
  const trimmed = str.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

export function requireSafeUrl(url: string, field: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error(`${field} must be an http or https URL`);
    }
    if (trimmed.length > 2048) throw new Error(`${field} URL is too long`);
    return trimmed;
  } catch {
    throw new Error(`${field} is not a valid URL`);
  }
}

export function requirePositive(n: number, field: string): number {
  if (n < 0) throw new Error(`${field} must be a positive number`);
  return n;
}

export function requireRange(n: number, min: number, max: number, field: string): number {
  if (n < min || n > max) throw new Error(`${field} must be between ${min} and ${max}`);
  return n;
}

export function requireDateFormat(date: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${field} must be in YYYY-MM-DD format`);
  return date;
}

export function requireMimeType(mime: string | undefined | null): string {
  if (!mime || !ALLOWED_MIME_TYPES.has(mime)) {
    throw new Error("File type not allowed. Accepted: PDF, Word, PNG, JPEG, SVG");
  }
  return mime;
}
