# BOLD DIMENSIONS — PROJECT OPERATING CONTRACT

## 1. Source of truth and workflow
- Product owner/final reviewer: user. Technical navigator/implementer: assistant.
- Sources of truth: latest user brief, this repository's actual code, this file, approved Iteration 13 governance/visual references.
- Work in this repository in place. It was cloned from John The Stylist BW because its customer/account/admin and PWA foundations were useful; do not carry salon business data or copy unrelated JTS functionality into this product.
- Inspect only the files and flows relevant to the task. Preserve working systems. Unexpected result = stop, inspect actual state, repair the smallest failing layer, verify.
- Build and verify working software, not plans. Do not claim tests, visual QA, pushes or deployment that did not happen.
- Do not deploy to Vercel unless the user delegates it.

## 2. Product identity and verified scope
Customer-facing identity: **Bold Dimensions**. App positioning: **Service & Equipment Hub**.

The current business scope is three service areas, in customer-facing priority order:
1. Solar water heating (lead service).
2. Air conditioning (lead service).
3. Agricultural machinery and Massey Ferguson spares (secondary service).

The app is a service-request and customer follow-up tool. It is not currently a confirmed ecommerce catalogue, machinery dealership, parts inventory, online payment platform or appointment calendar.

Do not claim authorised Massey Ferguson dealer status, equipment stock, guaranteed coverage, technician availability, response times, published prices, warranties or service guarantees unless the owner verifies them.

Use only the supplied logo at `public/brand/bold-dimensions-logo.jpg`. Its visible identity uses navy/blue, cyan, purple and orange. Keep the original asset intact. `public/jts.jpg` is a compatibility path containing the supplied full logo. `public/jts-logo.svg` is a compatibility path for the simplified Bold Dimensions app mark; neither may contain JTS branding.

Known public contact details are retained for private business operations only. Do not publish phone, WhatsApp or email links in the customer-facing app. Customers should use in-app service requests and private request conversations.

Do not assume the domain is the production app URL. `NEXT_PUBLIC_BASE_URL` must be set to the actual approved host when known; local default is `http://localhost:3000`.

## 3. Customer journey
The primary journey is:
**Choose service area → choose request type → describe equipment/system and location → provide name and contact → submit request → track status and follow up.**

Customer requests do not require account creation. Use Firebase Anonymous Auth under the hood to create a private customer identity. Google linking may be offered as an optional way to preserve the same request history across devices; it must not block the first request.

The request form should collect:
- service area and request type;
- equipment/system and make/model when known;
- site/town/location;
- a useful description of the issue or work required;
- standard/urgent priority (do not imply emergency dispatch);
- customer name and mobile number for operational coordination;
- optional email; customer follow-up is through the in-app conversation.

Do not collect payment before the business has assessed and quoted the work. Do not invent a price, appointment time or service availability. A submitted request is not a confirmed visit or booking.

Customer request history is private and scoped to the signed-in Firebase UID. Every request creates a matching private `conversations/{requestId}` record with a `messages` subcollection. Tracking and the admin request record both expose that private thread; message records are visible only to the customer and authorized staff. UploadThing attachment URLs are separately hosted links and must not be described as Firebase-private files. Tracking must not expose another customer's request. A local copy may help recover the reference on the same device, but it must never be presented as live backend status.

## 4. Service request data model
The public service data is in `src/lib/bold-dimensions-config.ts`; Firebase request operations are in `src/lib/bold-dimensions.ts`. Primary Firestore collection: `serviceRequests`. Public promotional content is seeded from `DEFAULT_PROMOTIONS` in `src/lib/bold-dimensions-promotions.ts` and admin-managed in the `servicePromotions` Firestore collection. The two supplied local assets are `public/images/bold.jpg` (solar and air conditioning, lead) and `public/images/bold1.jpg` (agricultural machinery, secondary).

Fields:
- `customerId`, `customerName`, `phone`, optional `email`;
- `areaId`, `serviceType`, optional `equipment`, `makeModel`;
- `location`, `description`, `urgency`, `preferredContact`;
- `status`, `createdAt`, `updatedAt`;
- optional admin-managed `scheduledFor`, `quoteAmount`, `quoteNote`, `internalNote`.

Conversation records use the matching service request ID, a customer UID, status/unread metadata and message subcollection. Message attachments use UploadThing endpoints `customerServiceMedia` and `adminBusinessMedia`; never open Firebase Storage rules for uploads.

Status progression:
`New → Reviewing → Quote prepared → Awaiting customer → Scheduled → In progress → Completed`, with `Cancelled` available.
Only authorized staff can change status, publish a quote or add internal notes. Do not expose `internalNote` in customer views. A quote is not a payment receipt or a confirmed visit.

The customer and admin screens now use `serviceRequests`. Firestore rules must be updated to match this model only after the customer, tracking, admin and auth workflows have been reviewed. Until then, Firebase requests may be denied by the inherited rules; do not weaken rules ad hoc or deploy a permissive ruleset.

## 5. Admin and authorization
- Admin route is `/admin`.
- Access is through the server-side `ADMIN_PASSWORD` check at `/api/admin/login`, which issues a Firebase custom token for the fixed Bold Dimensions admin identity with the `admin: true` custom claim.
- No `admins/{uid}` Firestore collection or manual role document is required. Firestore rules and UploadThing staff endpoints authorize the Firebase ID token's `admin` claim.
- Keep `ADMIN_PASSWORD` server-only; never expose it through a `NEXT_PUBLIC_` variable, client bundle, Firestore document or log. Do not add a hard-coded password, email allowlist or inherited JTS UID.
- Admin can review service requests, reveal private customer details only when needed, update status, prepare a quote and maintain private work notes.
- Sensitive customer details are masked until an authorized operator reveals them.
- Keep admin sections compact but separated enough to scan. Do not cram all operational details into one dense card.
- Do not create fake analytics, inventory, staff assignment, financial reconciliation, customer chat or appointment availability features unless their workflows and data are implemented end to end.

## 6. Firebase and integrations
Dedicated Firebase project:
- projectId: `the-wall-ab746`
- authDomain: `the-wall-ab746.firebaseapp.com`
- storageBucket: `the-wall-ab746.firebasestorage.app`
- messagingSenderId: `591554003595`
- appId: `1:591554003595:web:e0bcf57ec06ab196638a8e`
- measurementId: `G-RHX7RR8CWF`

Browser config belongs in `NEXT_PUBLIC_FIREBASE_*` variables and is public client configuration. Do not commit Firebase Admin service-account JSON or private keys. Server-only `FIREBASE_ADMIN_KEY` must be configured separately if required.

`.firebaserc` points to `the-wall-ab746`. Never deploy rules to another Firebase project.

Use UploadThing for required app media uploads. Do not introduce Firebase Storage uploads or loosen Storage rules by assumption. UploadThing endpoints must verify the Firebase UID and admin role for staff-only uploads.

## 7. PWA installation and offline — protected
Preserve the inherited PWA installation mechanism and event lifecycle. Only change identity, logo, copy, colours and required project configuration unless the owner explicitly approves a functional change.

Protected behavior:
- branded, dismissible, non-blocking install entry;
- capture and retain the real `beforeinstallprompt` event;
- invoke native prompt only from the user's explicit click;
- clear consumed prompt and handle `appinstalled`;
- no fake native prompt or dead control;
- truthful iOS/iPadOS Share → Add to Home Screen guidance;
- embedded-browser handoff to the normal browser, preserving the original URL;
- keep service-worker registration at `/sw-jts.js` unless a verified migration is approved;
- preserve offline/reconnect messaging and waiting-worker update lifecycle;
- preserve FCM registration, per-user notification preferences and foreground/background delivery. Use only `NEXT_PUBLIC_FIREBASE_VAPID_KEY` from the new Bold Dimensions Firebase project; never reuse the inherited JTS VAPID key.
- do not cache private customer/admin data or API responses.

The worker's Firebase Messaging config must match `the-wall-ab746`. The cache namespace must match `brand.serviceWorkerCache` in `src/config/brand.ts`. Increment the cache version for shell changes. Legacy `jts` filenames and event names may remain as technical compatibility identifiers; customer-visible text must say Bold Dimensions.

PWA icons are generated by `scripts/generate-pwa-icons.mjs` from the supplied Bold Dimensions logo. Verify PNG format and 192x192 / 512x512 dimensions after generation.

## 8. Chatbot and existing foundation
Preserve inherited chatbot behavior, features, entry points and integrations. Change branding and Bold Dimensions-specific content only unless the user explicitly authorizes a functional change. Do not remove or replace it during identity cleanup.

Preserve working Firebase Auth foundations, customer-scoped access, UploadThing authorization, analytics privacy boundaries, service-worker behavior and embedded-browser handoff unless a change is required for the new request model and is reviewed.

## 9. Visual standard
- Iteration 13 is the governing visual reference. Inspect the actual image `docs/assets/washride-home-reference.jpeg` in `gatshaayanda/iteration13` and the relevant `VISUAL-DIRECTION-STANDARD.md` before claiming visual QA.
- Apply its compactness, typography, hierarchy, clarity, utility and polish across homepage, service discovery, request form, customer account, tracking and admin. Homepage quality alone is not acceptance.
- Mobile-first is primary; desktop must remain responsive.
- Avoid generic oversized cards, excessive whitespace, long marketing copy, dense clusters and oversized headings.
- Use clear section separation, compact rows, concise labels, readable forms, touch-friendly controls and visible focus/error states.
- The supplied logo palette is the brand source. Do not retain salon black/gold/plum styles or add unrelated decorative colours.
- Do not claim visual completion without inspecting actual rendered screenshots at mobile and desktop widths.

## 10. Customer content and service hierarchy — 2026-11-05\n\n- Solar water heating and air conditioning lead the homepage, service discovery and request choices. Agricultural machinery is a secondary offering. Keep this order in all new customer-facing surfaces.\n- Do not expose public telephone, WhatsApp or email contact links. Customers should submit service requests and communicate through their private in-app conversation. Customer phone/email may still be collected for operational follow-up and shown only in authorized admin workflows.\n- Promotional assets are seeded from `DEFAULT_PROMOTIONS` and admin-managed in Firestore `servicePromotions`; the admin can edit copy, replace images through UploadThing, reorder, hide and remove promotions. Firestore rules must allow public read and admin-claim-only writes for this collection.\n- Supplied assets: `public/images/bold.jpg` (lead solar water heating and air conditioning), `public/images/bold1.jpg` (secondary agricultural machinery).\n\n## 11. Visible work, loading and operational transparency — 2026-11-05

The interface must make important work visible. Customers and operators should understand what is loading, what has been saved, what is still pending, what failed and what action is available next. Do not use decorative spinners, vague success messages or silent disabled controls as substitutes for truthful state.

### Shared interaction principles
- Every asynchronous action with a meaningful wait has a local, independent pending state. Disable only the action that is currently being submitted; do not freeze unrelated controls or the whole page.
- Use compact skeletons when the shape of content is known and a real loading state when it is not. Avoid layout shifts and large blank placeholders.
- Preserve entered form data when validation or network errors occur. Put actionable errors beside the relevant field or action and explain how to recover.
- Distinguish loading, saving, saved, queued/offline, synchronizing, synchronized, failed and retry-required states. Never present an optimistic UI update as server-confirmed persistence.
- Confirm destructive or consequential actions clearly. After success, show the actual result and update the relevant view; do not show success before the underlying operation succeeds.
- Keep feedback concise, accessible and consistent with Bold Dimensions branding. Provide visible focus, readable status text and touch-friendly retry/close controls.

### Customer service requests and tracking
- The primary flow is a service request, not an instant booking or confirmed appointment. Communicate each stage truthfully: preparing/submitting, submitted and reference issued, awaiting business review, quote prepared, awaiting customer, scheduled, in progress, completed or cancelled.
- Show submission progress on the form's primary action and prevent accidental duplicate submissions while the same request is in flight.
- If the network fails, retain the customer's entered details and explain whether the request was actually saved, locally queued or not submitted. Do not invent a reference number or imply the business has received a request that has not reached Firestore.
- Firestore offline persistence may queue supported writes locally. A queued write is not a server-confirmed request; the UI must not wait indefinitely for acknowledgement or claim synchronization before it is confirmed. Verify the actual Firebase persistence configuration and write behavior before promising offline submission.
- Local request recovery is a convenience for the same device only. Label locally recovered information as such and never present it as live backend status. Reconcile it with the server after connectivity returns.
- Tracking must distinguish cached/stale information from refreshed server state. Show a last-updated or reconnect cue when useful; do not fabricate progress or response-time promises.

### Private customer ↔ admin communication and media
- Keep conversation threads private to the owning customer and authorized staff. Never expose another customer's messages, contact details or request history through public feeds, analytics or cache behavior.
- Sending a message has its own progress and outcome state. Distinguish message submission from notification delivery: a notification failure must not discard or misrepresent a message that was saved.
- Show unread/read state only when supported by persisted conversation metadata. Update unread indicators consistently for the customer and admin without leaking private content.
- For attachments, show the selected file, type/size validation, upload progress where the UploadThing client exposes it, upload failure and retry guidance. Do not show an attachment as sent until the message record containing its uploaded URL has been saved.
- Customer uploads must use the existing `customerServiceMedia` UploadThing route and customer Firebase identity. Staff uploads must use `adminBusinessMedia` and verify the Firebase `admin` claim. Do not bypass these checks or switch uploads to Firebase Storage.
- UploadThing media is separately hosted and accessible to anyone who has the URL; do not describe attachment URLs as Firebase-private files. Keep the conversation/message authorization boundary intact and avoid placing attachment URLs in public analytics or logs.
- Uploading media requires a working network connection. Offline messaging/attachment behavior must be described according to verified implementation, not assumed from Firestore persistence.

### Public service discovery and recovery
- Public service-area content should have compact loading placeholders, useful empty states and recoverable errors. Keep the service request CTA usable and do not let a secondary feed or media request block the core service journey.
- If public content fails to load, retain useful static service information where possible and offer a clear retry. Do not fabricate service availability, equipment stock, prices, testimonials or response-time claims.
- Media should preserve aspect ratio and avoid layout shifts. Provide a branded fallback when optional media is absent or fails.

### Admin operations and confirmations
- Give each independent admin action its own pending state: status change, quote save, internal-note save, customer reply, attachment upload and other mutations must not share one page-wide loading flag.
- Confirm the actual persisted result. If a status/quote/note update fails, retain the previous truthful state, show the error and allow retry; never silently display an unsaved value as committed.
- Keep admin request lists useful while refreshing. Preserve filters/selection where safe and avoid blanking the whole workspace for a small background refresh.
- Mask customer contact details by default as already required. Reveal only on deliberate authorized action; do not include revealed values in analytics, telemetry or error messages.
- Keep sections separated enough to scan on mobile. Operational density must not become visual clustering; prioritize the next action and concise status over decorative dashboards.

### Analytics and privacy
- Analytics must be aggregate and purpose-limited. Do not send names, phone numbers, email addresses, message bodies, attachment URLs, request descriptions, exact customer locations or other direct identifiers to public analytics.
- Do not expose customer-level request, conversation or contact data to other customers or public visitors. Public-facing metrics must be based on genuinely public/aggregated information and must not imply business performance that is not measured.
- Admin-only operational reporting must respect the existing Firebase authorization boundary. Never treat client-side hiding as access control.
- Do not add fake counters, engagement claims or synthetic business metrics. Document what each metric measures and its source before displaying it.

### Branding, errors and service recovery
- Loading, empty, success, warning and error states must use the Bold Dimensions identity and established visual system; do not introduce unrelated inherited salon styles.
- Error messages should state what failed, whether user data was retained, and the next safe action. Avoid exposing stack traces, credentials, tokens, private URLs or internal notes.
- Retry must repeat only the failed operation and must not create duplicate requests/messages or repeat already completed side effects.
- Keep offline/reconnect messaging truthful and consistent across customer, tracking and admin surfaces.

### PWA and service-worker protection
- Preserve the approved install prompt lifecycle, embedded-browser handoff, iOS instructions, notification behavior and waiting-worker update flow. Do not combine ordinary loading/feedback work with a service-worker lifecycle rewrite.
- Never cache private customer/admin records, conversation messages, UploadThing URLs or authenticated API responses in the service-worker shell cache.
- Cached route HTML is only an application shell; it is not proof that private data or actions are available offline.
- Offline UI must distinguish cached shell access from Firestore data availability and from actions that require a live network (including UploadThing uploads, fresh authentication and push delivery).
- A new waiting service worker must not silently interrupt an active request or conversation. Preserve the explicit update/refresh interaction.

### Implementation and release QA
- For every affected flow, test the loading, success, empty, validation-error, network-error, retry and offline/reconnect states that are applicable. Check duplicate-submit protection and ensure unrelated controls remain usable.
- Exercise customer request submission and tracking, customer messaging, admin replies, status/quote/note updates and media upload authorization end to end where credentials and a deployed environment permit.
- Verify customer and admin privacy boundaries with both authorized and unauthorized identities. A successful UI render is not proof of Firestore or UploadThing authorization.
- Verify offline shell access separately from Firestore persistence/synchronization. Test with an existing authenticated session and a first-time session; do not assume they behave identically.
- Check mobile-first layouts and desktop responsiveness. Confirm loading placeholders, error messages and confirmations remain compact, readable and non-clustered.
- If live Firebase, UploadThing, notification or device testing is unavailable, report the exact limitation and leave the behavior explicitly unverified. Source inspection or a passing build is not end-to-end QA.

## 11. Verification and delivery
Before a meaningful checkpoint:
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run verify:identity`

End-to-end QA:
1. Homepage and service-area links.
2. Guest request flow, validation and preserved input on errors.
3. New request persistence in `serviceRequests`.
4. Customer account privacy and request history.
5. Request detail ownership, local fallback and live status.
6. Admin sign-in and role denial for non-admins.
7. Admin request queue, private-detail reveal, status changes, quote and internal-note persistence.
8. UploadThing authorization if media upload is enabled.
9. PWA install prompt, iOS guidance, embedded-browser handoff, offline shell and notification config.
10. Mobile-first layout and desktop responsiveness across all major screens.

Report code/commit, GitHub push, checks, visual QA, outstanding Firebase configuration and deployment separately. A push is not a deployment. Do not claim tests or device checks that were not run.
