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

The current business scope is three service areas:
1. Agricultural machinery support.
2. Air conditioning.
3. Solar water heating.

The app is a service-request and customer follow-up tool. It is not currently a confirmed ecommerce catalogue, machinery dealership, parts inventory, online payment platform or appointment calendar.

Do not claim authorised Massey Ferguson dealer status, equipment stock, guaranteed coverage, technician availability, response times, published prices, warranties or service guarantees unless the owner verifies them.

Use only the supplied logo at `public/brand/bold-dimensions-logo.jpg`. Its visible identity uses navy/blue, cyan, purple and orange. Keep the original asset intact. `public/jts.jpg` is a compatibility path containing the supplied full logo. `public/jts-logo.svg` is a compatibility path for the simplified Bold Dimensions app mark; neither may contain JTS branding.

Known public contact details from business research:
- +267 73 207 038
- +267 396 1158
- sales@bolddimensions.co.bw

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
- customer name and phone/WhatsApp;
- optional email and preferred contact method.

Do not collect payment before the business has assessed and quoted the work. Do not invent a price, appointment time or service availability. A submitted request is not a confirmed visit or booking.

Customer request history is private and scoped to the signed-in Firebase UID. Tracking must not expose another customer's request. A local copy may help recover the reference on the same device, but it must never be presented as live backend status.

## 4. Service request data model
The current client model is in `src/lib/bold-dimensions.ts`. Primary Firestore collection: `serviceRequests`.

Fields:
- `customerId`, `customerName`, `phone`, optional `email`;
- `areaId`, `serviceType`, optional `equipment`, `makeModel`;
- `location`, `description`, `urgency`, `preferredContact`;
- `status`, `createdAt`, `updatedAt`;
- optional admin-managed `quoteAmount`, `quoteNote`, `internalNote`.

Status progression:
`New → Reviewing → Quote prepared → Awaiting customer → Scheduled → In progress → Completed`, with `Cancelled` available.
Only authorized staff can change status, publish a quote or add internal notes. Do not expose `internalNote` in customer views. A quote is not a payment receipt or a confirmed visit.

The customer and admin screens now use `serviceRequests`. Firestore rules must be updated to match this model only after the customer, tracking, admin and auth workflows have been reviewed. Until then, Firebase requests may be denied by the inherited rules; do not weaken rules ad hoc or deploy a permissive ruleset.

## 5. Admin and authorization
- Admin route is `/admin`.
- Access is through Firebase Authentication and the signed-in user's `admins/{uid}` document with role `owner` or `staff`.
- No hard-coded email allowlists, inherited JTS UIDs, synthetic one-word admin account or public admin access.
- The role record must be provisioned deliberately in the dedicated Bold Dimensions Firebase project.
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

## 10. Verification and delivery
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
