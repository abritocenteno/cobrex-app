/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alerts from "../alerts.js";
import type * as artists from "../artists.js";
import type * as assets from "../assets.js";
import type * as checklist from "../checklist.js";
import type * as contacts from "../contacts.js";
import type * as deals from "../deals.js";
import type * as manager from "../manager.js";
import type * as metrics from "../metrics.js";
import type * as notifications from "../notifications.js";
import type * as pushTokens from "../pushTokens.js";
import type * as setlist from "../setlist.js";
import type * as shows from "../shows.js";
import type * as timeline from "../timeline.js";
import type * as users from "../users.js";
import type * as venue from "../venue.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  artists: typeof artists;
  assets: typeof assets;
  checklist: typeof checklist;
  contacts: typeof contacts;
  deals: typeof deals;
  manager: typeof manager;
  metrics: typeof metrics;
  notifications: typeof notifications;
  pushTokens: typeof pushTokens;
  setlist: typeof setlist;
  shows: typeof shows;
  timeline: typeof timeline;
  users: typeof users;
  venue: typeof venue;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
