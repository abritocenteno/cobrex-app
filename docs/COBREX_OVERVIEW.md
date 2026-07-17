# Cobrex — Product Overview

## What Is Cobrex?

Cobrex is a collaboration platform for the live music industry. It gives artists, managers, and venues a single shared workspace — replacing the fragmented mix of spreadsheets, WhatsApp threads, email chains, and separate tools that the industry currently runs on.

Where most tools focus on one slice of the industry (Spotify for Artists for streaming data, Bandsintown for show discovery, generic CRM tools for contacts), Cobrex connects all three parties in one place. An artist books a show, their manager tracks the deal, and the venue confirms logistics — all in real time, all in the same app.

**Headquartered in the Netherlands. Built for global adoption.**

---

## Who Is It For?

| Role | Who |
|---|---|
| **Artist** | Independent artists, bands, solo performers at any career stage |
| **Manager** | Independent managers, mid-size agencies managing multiple artists |
| **Venue** | Small clubs, mid-size venues, established concert halls |

Each role gets a purpose-built portal within the same app. You sign up once, pick your role, and the app reorganises itself around your workflow.

---

## The Problem It Solves

Running a music career — even a modest one — involves three parties who each have different tools, different priorities, and almost no shared infrastructure:

- An **artist** tracks their shows in a calendar, their deals in a notes app, their tech rider in a Google Drive, and waits for a venue to email confirmation
- A **manager** juggles WhatsApp for roster updates, a spreadsheet for YTD financials, and email for every venue negotiation
- A **venue** receives rider documents over email, confirms shows through a back-and-forth thread, and records settlements in a separate accounting tool

Cobrex collapses all of this into one platform with real-time sync between all three parties.

---

## Features by Role

### Artist Portal

**Dashboard**
- Personalised greeting with role badge
- Stat cards: upcoming shows, confirmed shows, active alerts, all-time total
- Active alert banner with one-tap navigation
- Upcoming shows feed (next 5, tap to drill in)
- Draft restore prompt if a form was interrupted mid-fill

**Shows**
- Full show management: create, edit, cancel, mark completed
- Show detail: name, date, load-in, soundcheck, doors, show time, set length, venue, notes
- Status workflow: Draft → Confirmed → Completed (or Cancelled/Postponed)
- Payment status tracking: Unpaid → Deposit Paid → Paid in Full
- Venue confirmation badge — shows whether the linked venue has confirmed
- Show checklist: pre-show prep items with completion tracking
- Show timeline: in-show event tracking with status per event (Pending / In Progress / Completed / Skipped)

**Setlist Builder**
- Personal song library with title, key signature, BPM, duration
- Attach a setlist to any show
- Reorder and remove songs; running total duration calculated automatically

**Deals**
- Deal types: Live performance, Session, Sync, Sponsorship, Other
- Financial fields: agreed total, deposit amount, payment status
- Filter by deal type
- Total value displayed across filtered view

**Contacts**
- Contact types: Promoter, Venue, Agent, Label, PR, Tour Manager, Other
- Per-contact detail with notes

**Assets**
- Asset types: Tech Rider, Stage Plot, Input List, Hospitality Rider, Press Kit, Press Photo, Contract, Invoice, Setlist, Other
- File upload (PDF, Word, PNG, JPEG, SVG — up to 1 MB)
- SoundCloud import: paste a SoundCloud track URL and the app fetches the description, then runs it through Claude AI to extract and summarise technical and performance information
- Filter by asset type (wrapped chip grid)

**Metrics**
- Platform support: Spotify, Apple Music, YouTube, Instagram, TikTok, SoundCloud
- Metric types per platform: Monthly Listeners, Followers, Streams, Views, Saves, Playlist Adds
- Latest value per metric prominently displayed, grouped by platform
- Historical log of all recorded entries

**Alerts**
- Severity levels: Critical, High, Medium, Low — each with distinct colour and icon
- Status workflow: Active → Acknowledged → Resolved
- Dismiss option with confirmation dialog
- Filter tabs: All / Active / Acknowledged / Resolved
- Active alert count surfaced on dashboard banner

**My Manager**
- View current manager relationship (agency name, territory, commission rate)
- Browse all registered managers on the platform with search
- Send a representation request with an optional message
- Accept or decline incoming manager invites
- Cancel pending outgoing requests
- All actions trigger real-time in-app + push notifications to the other party

**Notifications**
- Inbox for all platform events (roster invites, venue confirmations, settlements, etc.)
- Unread count badge
- Mark all read, dismiss individual notifications

---

### Manager Portal

**Dashboard**
- Stat cards: Roster size, upcoming shows across all artists, YTD earnings (paid in full), outstanding payments
- Roster preview with per-artist upcoming show count and outstanding amount
- Upcoming shows feed across entire roster
- Quick-links to Roster, Deals, Shows

**Roster**
- Full artist list with per-artist stats: upcoming shows, YTD, outstanding, next show date
- Tap an artist to drill into their detail: bio, location, upcoming shows, recent deals, financial summary
- Remove artist from roster with confirmation
- Invite artists by browsing the platform directory (search by name)
- Pending outgoing invites listed with cancel option
- Incoming artist requests listed with accept/decline
- All invite actions trigger push notifications to the artist

**Manager Profile Editor**
- Fields: Agency Name, Territory, Bio, Commission Rate (%), Contact Email, Phone
- Editable from the roster screen via pencil icon

**Shows**
- View all shows across the entire roster in one feed

**Deals**
- View all deals across all roster artists

**Metrics / Financial Summary**
- YTD earnings and outstanding balance aggregated across the roster

---

### Venue Portal

**Dashboard**
- Stat cards: Upcoming shows, Confirmed, Awaiting Confirmation, Riders Pending
- Venue identity card (name, city, capacity)
- Upcoming shows feed with confirmation status and rider chip indicators
- Quick-link to Requests screen

**Requests (Show Management)**
- All upcoming shows linked to the venue
- Per-show: artist name, date, show time, doors time
- One-tap confirm / unconfirm — confirmation sends a push notification to the artist
- Document tracking chips (tappable toggle, per-chip loading state):
  - Tech Rider, Stage Plot, Input List, Hospitality Rider, Catering, Accessibility
- Settlement recording: amount (stored in cents, displayed in €), tickets sold — sends push notification to artist on save
- Edit settlement after the fact
- "Details →" link to full show detail screen
- Past Shows archive: collapsible section, shows sorted most-recent-first, with settlement amounts

**Venue Show Detail**
- Full schedule (load-in, soundcheck, doors, show time, set length)
- Document status chips (read-only view)
- Settlement summary (amount + tickets sold)
- Show notes

**Venue Settings**
- Editable profile: venue name, capacity, city, country, address, contact email, phone, description

---

## How the Roles Connect

```
           ┌─────────────┐
           │   MANAGER   │
           │  (Agency)   │
           └──────┬──────┘
      invite ↕ accept/decline
           ┌──────┴──────┐
           │   ARTIST    │◄──── creates shows
           │             │      manages deals
           └──────┬──────┘      uploads assets
     links show   │
      to venue    ▼
           ┌─────────────┐
           │    VENUE    │
           │             │──── confirms show ──► notification to artist
           └─────────────┘──── records settlement ──► notification to artist
```

**Artist ↔ Manager**
The relationship is bidirectional. A manager can invite an artist, or an artist can request a manager. Either party can initiate; the other must accept. Once connected, the manager gains read access to the artist's shows and deals across their dashboard. The artist sees their manager's agency name, territory, and commission rate in their My Manager screen.

**Artist → Venue**
An artist creates a show and can link it to a venue (via the venue's profile ID). Once linked, the show appears in the venue's Requests screen. The artist's show detail screen then shows a live venue confirmation badge — orange "Awaiting venue" or green "Venue name ✓".

**Venue → Artist**
The venue works entirely reactively. They see shows linked to them, confirm or unconfirm, track document delivery, and record settlement. Every consequential action (confirm, settlement) fires a push notification directly to the artist.

**Manager → Venue**
Currently indirect — managers see venue confirmation status on their roster artists' shows. Direct manager-venue communication is a natural next step.

---

## Technical Architecture

| Layer | Technology |
|---|---|
| **Mobile / Web** | React Native + Expo SDK 55, Expo Router (file-based routing) |
| **Backend** | Convex (real-time database, serverless mutations/queries/actions) |
| **Authentication** | Clerk (JWT-based, token stored in Expo SecureStore) |
| **Push Notifications** | Expo Push API → FCM (Android) / APNs (iOS) |
| **AI** | Anthropic Claude (asset analysis via SoundCloud import) |
| **Build System** | EAS (Expo Application Services) |
| **Current Hosting** | Vercel (web) |
| **Target Platforms** | Android (primary), iOS (next), Web (current) |

**Real-time by default.** Every screen uses Convex's live query subscriptions — data updates propagate to all connected clients instantly without polling or manual refresh.

**Role-gated backend.** Every mutation verifies the caller's role and ownership before executing. An artist cannot modify another artist's data; a venue cannot confirm a show that isn't linked to them.

**Offline-resilient forms.** Draft saving is built into Show, Deal, Contact, and Asset creation forms — if the app is closed mid-fill, a restore prompt appears on the next dashboard load.

---

## Suggested Future Features

These aren't on the roadmap yet but are natural extensions of the current architecture:

- **In-app contract signing** — Attach and e-sign deal contracts without leaving the platform
- **Integrated payments** — Stripe-based settlement processing so the "Record Settlement" flow becomes an actual payment, not just a record
- **Automatic metric sync** — Scheduled Convex actions that pull Spotify/YouTube data via their APIs, removing manual metric entry
- **Tour planning** — Multi-show routing view for managers to plan tour legs across their roster
- **Invoice generation** — Export deal data as a PDF invoice from within the deals screen
- **Manager financial reporting** — Exportable YTD statements per artist for accounting
- **Promoter role** — A fourth role type that sits between artist and venue, managing show logistics on behalf of both

---

## Testing Flows by Role

All flows start from the onboarding screen after account creation.

---

### Artist — Testing Flow

**1. Account creation & onboarding**
1. Sign up via the app (email or social via Clerk)
2. Select **Artist** on the role selection screen
3. The onboarding wizard launches:
   - **Profile**: enter artist name, bio, location/country
   - **Genre**: select genre and sub-genre (from the approved genre list)
   - **Social links**: add Spotify artist ID, Instagram handle, TikTok, YouTube
   - **First show**: add an upcoming show with date and time (optional, skippable)
   - **First asset**: upload a tech rider PDF (optional, skippable)
4. Land on the Artist Dashboard

**2. Show management**
1. Tap "+" or "Add your first show →" on the dashboard
2. Fill in show name and date
3. In the **Venue** field, type 2+ characters to search registered venues — results appear as a dropdown with name, city, and capacity. Select one to link the show, or leave it as free text if the venue isn't on Cobrex yet
4. Fill in show time, load-in, soundcheck, doors, set length, notes
5. Save — show appears on dashboard and in Shows list
4. Open the show detail → update status to "Confirmed"
5. Open the Show Checklist → tick off preparation items
6. Open the timeline → mark events as In Progress / Completed during the show

**3. Setlist**
1. Navigate to Setlist → add songs to your library (title, key, BPM, duration)
2. Open a show detail → scroll to Setlist → "Create one"
3. Tap "+ Add Song" → select songs from library
4. Verify running total duration updates

**4. Deals**
1. Tap Deals → "+" → fill in deal name, type (Live), agreed total (e.g. €500), deposit (€150), link to a show
2. Set payment status to "Deposit Paid"
3. Verify the deal appears with orange payment badge

**5. Assets / SoundCloud import**
1. Tap Assets → "+" → upload a PDF tech rider
2. Filter by "Tech Rider" — verify it appears
3. Tap "+" again → paste a SoundCloud track URL → tap Import
4. Verify the AI-generated summary appears on the asset

**6. Metrics**
1. Navigate to Metrics → "+" → select platform (Spotify), metric type (Monthly Listeners), enter a value
2. Add a second metric for a different platform
3. Verify grouped display with "latest" value highlighted

**7. Manager relationship (initiate from artist side)**
1. Navigate to My Manager
2. Search for an existing manager account (requires a manager test account — see Manager flow)
3. Tap "Request" → optionally add a message → send
4. Verify the pending request appears with a "Cancel" option
5. Have the manager accept (on the manager device) → verify the manager name appears on this screen
6. Verify a push notification arrives (on physical device)

**8. Venue confirmation (after venue links a show)**
1. Have a venue account link one of your shows (see Venue flow step 3)
2. Open that show's detail screen
3. Verify the venue confirmation badge appears: orange "Awaiting venue" → green "Venue name ✓" after venue confirms

---

### Manager — Testing Flow

**1. Account creation & onboarding**
1. Sign up → select **Manager** on role selection
2. Onboarding for managers:
   - Agency name, territory, commission rate, bio, contact email, phone
3. Land on the Manager Dashboard (empty state: no roster, no shows, no financials)

**2. Invite an artist**
1. Navigate to Roster → "Invite Artist"
2. Search for an artist by name (requires an artist test account)
3. Tap "Invite" → verify pending invite appears under "Pending Outgoing"
4. Have the artist accept on their device
5. Verify the artist appears on the Roster with their stats (upcoming shows, outstanding)

**3. Artist detail drill-down**
1. Tap the artist card on the Roster screen
2. Verify: artist bio, location, upcoming shows list, recent deals list, YTD and Outstanding stats
3. Tap "Remove from Roster" → confirm → verify artist is removed

**4. Accept an artist's request**
1. Have an artist send a representation request (My Manager flow above)
2. On the Manager device: navigate to Roster → scroll to "Incoming Requests"
3. Tap "Accept" → verify the artist is added to the roster
4. Verify push notification fires on the artist's device

**5. Dashboard financials**
1. Once an artist has deals in "Paid in Full" status, return to the Manager Dashboard
2. Verify YTD figure reflects the sum of paid deals across the roster
3. Verify Outstanding reflects unpaid/deposit-only deals

**6. Edit manager profile**
1. On the Roster screen, tap the pencil icon on the agency card
2. Update agency name, commission rate → Save
3. Verify changes reflect on the Roster screen and in the artist's My Manager view

**7. Cross-roster show view**
1. With 2+ artists on the roster, each having upcoming shows
2. Navigate to Shows → verify shows from all roster artists appear in one feed

---

### Venue — Testing Flow

**1. Account creation & onboarding**
1. Sign up → select **Venue** on role selection
2. Onboarding:
   - Venue name, capacity, city, country, address, contact email, phone, description
3. Land on the Venue Dashboard (empty state)

**2. Edit venue profile**
1. Navigate to Settings (building icon in nav)
2. Update capacity, city, description → Save
3. Return to Dashboard → verify updated info in the venue identity card

**3. Link a show (requires an artist account with a show)**
1. Have the artist create a show and search for the venue by name in the Venue picker — selecting the venue from the dropdown automatically links the show
2. Navigate to the Requests screen
3. Verify the show card appears with artist name, date, show time

**4. Confirm a show**
1. On the Requests screen, tap "Confirm" on a show card
2. Verify the button changes to a green "Confirmed ✓" badge
3. Verify the artist receives a push notification: "The venue confirmed your show: [show name]"
4. On the Venue Dashboard, verify the Confirmed stat increments

**5. Document tracking**
1. On the Requests screen, tap the "Tech Rider" chip for a show
2. Verify it toggles to green with a checkmark
3. Tap through all 6 document chips: Tech Rider, Stage Plot, Input List, Hospitality, Catering, Accessibility
4. On the Dashboard, verify the "Riders Pending" count decrements

**6. Record a settlement**
1. Tap "Record Settlement" on a confirmed show
2. Enter an amount (e.g. 850.00) and tickets sold (e.g. 312)
3. Tap "Save Settlement"
4. Verify it displays as "€850 · 312 tickets · Edit"
5. Verify the artist receives a push notification: "recorded a settlement of €850.00 for [show name]"

**7. Show detail**
1. Tap "Details →" on any show card
2. Verify the full detail screen: schedule (load-in, soundcheck, doors, show time), document chips, settlement block, notes

**8. Past shows**
1. Once a linked show's date has passed, navigate to Requests
2. Scroll to "Past Shows (N)" → tap to expand
3. Verify past shows appear with artist name and settlement amount
4. Tap a past show → verify detail screen loads correctly

---

## Role Interaction Test (End-to-End)

This is the full cross-role scenario that exercises every connection point:

1. **Create three accounts**: one Artist, one Manager, one Venue
2. **Manager invites Artist** → Artist accepts → verify both see each other
3. **Artist creates a show** with a future date
4. **Venue links the show** → show appears in Venue Requests
5. **Venue confirms the show** → Artist gets push notification; show badge turns green on Artist's show detail
6. **Artist uploads a tech rider asset**; Venue marks "Tech Rider" chip as received
7. **Artist adds a deal** for the show (€600 Live, Deposit Paid)
8. **Manager checks dashboard**: sees artist on roster, upcoming show, €0 YTD (deposit doesn't count as paid in full)
9. **Venue records settlement** (€600, 280 tickets) → Artist gets push notification
10. **Artist updates deal** to "Paid in Full" → Manager's YTD updates to €600

---

*Document generated: June 2026*
