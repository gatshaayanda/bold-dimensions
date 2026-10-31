# JOHN THE STYLIST BW — Agent Operating Contract

## Product
John The Stylist Bw is a real customer-facing appointment PWA for a hairstylist/barber business in G West, Gaborone. It is a real customer-facing demo operation for John The Stylist Bw while the business prepares its paid live launch. It is not generic SaaS.

Business:
- John The Stylist Bw
- G West shops, upstairs at Star Tattoos parlor and boutique, inside the salon with the purple door labelled “miss Emma”
- Hours: 08:00–18:00
- Phone/WhatsApp: +267 78 053 564
- Appointment requests must be made at least one day in advance.
- A 50% deposit is required to secure an appointment.
- Deposit method: Orange Money 75720306
- Account name: John SHUMBA

## Roles
- Product owner / final reviewer: user
- Technical navigator + implementation: ChatGPT through repository tooling
- GitHub is the source of truth

## Workflow
START → INSPECT → BUILD → VERIFY → CHECKPOINT → CONTINUE/RECOVER.
Golden rule: **Unexpected result = STOP → inspect reality → then act.**

Before changing code:
1. Read this AGENTS.md.
2. Inspect actual repository/Git state and the relevant live/deployed state when applicable.
3. Compare the requested change against current implementation and current official guidance.
4. Make the smallest controlled change that solves the actual requirement.
5. Preserve working functionality unless the user explicitly asks to replace it.

After meaningful implementation:
- verify the actual result;
- run typecheck, lint and build;
- inspect the final diff;
- commit a meaningful checkpoint;
- push the intended branch;
- report commit, changed areas and verification honestly.

## Customer-first product principle
The first customer task is not account creation. It is:
**discover a service → understand the price/expectation → choose a date/time → provide name + WhatsApp/phone → understand the 50% deposit → submit an appointment request → contact John / await confirmation.**

Do not require Google, email/password or profile setup before an appointment request.

The booking UI must clearly distinguish:
- appointment request submitted;
- deposit required;
- appointment confirmed.

Submitting a request does NOT mean the appointment is confirmed. Confirmation depends on John confirming the requested slot and receiving the required deposit.

## First-flow UX rules
The customer experience should be mobile-first and deliberately low-friction:
- show the primary booking action early;
- keep the initial choice set small and understandable;
- use progressive disclosure for secondary information;
- show prices before asking for personal information;
- use labels above fields rather than relying on placeholders;
- group related fields;
- keep important payment/deposit information visible near the commitment point;
- preserve entered information when correcting errors;
- use specific, local error messages;
- never force account creation merely to request an appointment;
- do not hide the primary booking CTA below secondary navigation on mobile;
- keep touch targets comfortable and keyboard-friendly.

Research basis:
- Nielsen Norman Group progressive disclosure and cognitive-load/form guidance.
- Baymard mobile checkout research: reduce unnecessary account creation, make required information visible, keep order/price context available and make errors recoverable.
- NN/g error guidance: place actionable errors near their source and prevent errors where possible.

## Current supplied services/prices
The owner-supplied bookable catalogue is the 17-service list in `src/lib/jts/public-services.ts`. It is the source of truth for customer-facing service names and prices. Keep the homepage finder, booking selector and admin catalogue aligned with this list:
- Haircuts: Kids Cut P100; Fade P100; Fade + Tint P200; Ladies Cut Only P120; Ladies Cut + Tint P200; Ladies Cut + Enecto Tint P200.
- Bleach services: Blonde P250; Pure White + Cut P300; Grey P350.
- S Curls & Curl Styles: Cut + S Curl P200; Cut + S Curl + Tint P280; Cut + Finger Coils P300; Cut + Ice Curls P250.
- Bobs & Pixie Cuts: Bob/Pixie Cut (Without Tint) P350; Bob/Pixie Cut (With Tint) P400; Pixie Cut with Colors P450; Pixie Cut with Queen Cazard Hair Relaxer P450.

All prices are BWP. Do not invent additional catalogue prices. For unlisted styles, provide an enquiry route and make clear that John must confirm the price before the customer commits.

## Public category media presentation — current approved QA slice
- Present the 17 owner-supplied services as four customer-understandable categories: Haircuts, Bleach Services, S Curls & Curl Styles, and Bobs & Pixie Cuts.
- The public homepage uses one shared representative photo or video per category rather than requiring 17 separate images. For the first rollout, an authorized owner can attach the category's representative media to any one service in that category using the existing Services & prices editor; the public category card selects the first available media in that category. The remaining services do not need duplicate media.
- Keep all individual service names, exact prices and direct booking links visible within their category. Keep the full price list modal available. Do not add filters, search fields, counters or decorative accent colours.
- Category media is genuine owner-uploaded work only. A missing category image uses a restrained branded fallback; never use generated or stock imagery as if it were John's work.
- Videos remain customer-controlled with visible playback controls and play inline; do not autoplay with sound. Crop photos consistently without hiding the hairstyle.
- Category descriptions and secondary captions may be shortened, but never truncate service names, prices, booking instructions or other decision-critical information.
- This public-page-first release does not redesign the booking form or alter calendar, availability, customer details, deposit, account, Style Studio, admin authorization, PWA installation or service-worker behavior. Those are separate protected workflows and must remain intact.
- QA this public category presentation first with no media, then with one representative photo per category, then with a video in at least one category. Confirm media displays on the public page after the owner saves it in admin, category links and all 17 service links remain correct, and mobile layouts remain readable.

## Service presentation — protected customer experience
- The supplied 17-service catalogue in `src/lib/jts/public-services.ts` is the customer-facing source of truth for names, prices, service selection and booking.
- The homepage may retain the three editorial featured cards (THE CUT, THE COLOUR and THE CHANGE) as the concise first presentation. Preserve their approved content, descriptions, prices, order, layout and owner-uploaded media.
- The “View full price list” modal must show all 17 services in the four supplied categories. Every service row is a real booking link; selecting one navigates to `/order?service=<service-id>` and preselects that exact service.
- The booking form must always offer all 17 supplied services, whether opened from a homepage card, the full price list, or directly. A stale or partial Firestore publicServices document must never silently remove bookable services from the booking selector.
- The selected service must remain selected while the customer chooses date/time and enters their details; the booking summary and 50% deposit calculation must reflect that exact service and price.
- Keep the homepage first view concise using progressive disclosure, but never make the full catalogue a dead-end reference list.
- Do not add search fields, category filters, result counters or a colour-coded catalogue UI. Group the full list under the supplied categories only.
- Preserve owner-uploaded service image/video support on the featured cards. Do not replace real salon imagery with generated placeholders or decorative glyphs when media is supplied.
- Keep all text high-contrast and readable on the black, white/silver and restrained gold JTS palette. No decorative plum, purple, lime, neon-blue, pink or orange text treatments. Use text and borders—not colour alone—to communicate selection and status.
- Keep the booking date/time/customer-details flow intact. Do not weaken availability checks, deposit rules, guest booking or request-vs-confirmation language.
- This is one coherent task: choose a service → see its price and deposit → choose date/time → provide contact details → submit an appointment request.

## Deposit/payment
The customer is instructed to pay the 50% deposit through Orange Money:
- 75720306
- John SHUMBA

The application must not claim that payment was received merely because the customer submitted the form. Payment confirmation remains a business/admin responsibility until a verified payment workflow is implemented.

If a deposit is shown for a price range, show the range or make clear the displayed amount is based on the selected supplied price. Do not fabricate an exact final price for an unpriced service.

## Location/trust information
Keep the supplied location wording intact unless the owner changes it:
“G West shops, Star Tattoos parlor and boutique upstairs, inside the salon with a purple door labelled ‘miss Emma’.”

The app should expose:
- business name;
- service categories;
- hours;
- phone/WhatsApp;
- location instructions;
- deposit requirement;
- Orange Money number/account name;
- clear request-vs-confirmation language.

Do not invent testimonials, guarantees, availability, reviews, cancellation policy, refund policy, exact slot availability, or payment receipts.

## Firebase
Dedicated Firebase project:
- projectId: stylist-36204
- authDomain: stylist-36204.firebaseapp.com
- storageBucket: stylist-36204.firebasestorage.app
- messagingSenderId: 622468889009
- appId: 1:622468889009:web:0579e49d766c6e81a1a590
- measurementId: G-5LDNFHCC53

Firebase browser configuration belongs in NEXT_PUBLIC_FIREBASE_* environment variables. Public Firebase client configuration is not a server secret.

Never commit Firebase Admin service-account JSON, private keys, or other server credentials. If server-side Admin credentials are needed, they must be provided/configured separately in Vercel/Firebase/GitHub secrets.

The production base URL is intended to be:
https://john-the-stylist-bw.vercel.app

## Authentication
Anonymous Firebase Auth may be used under the hood so a guest booking has a private customer UID. This is an implementation detail, not a customer sign-in requirement.

Google account connection can later become an optional upgrade for:
- booking history;
- saved details;
- repeat booking;
- private customer communication.

Never make Google connection a prerequisite for the first booking.

## Booking data architecture
The current repository was cloned from a proven BOEMO operating foundation. During the transition, preserve its Firestore security boundary and guest-auth mechanism while refactoring the domain from food orders into appointment requests.

Do not weaken Firestore rules to make the new UI work.

The target domain model should eventually represent:
- appointments/booking requests;
- services and owner-controlled prices;
- customer profile;
- deposit/payment status;
- appointment status;
- private customer conversations;
- admin availability/operating settings.

Until that refactor is complete, compatibility code must be treated as transitional and clearly documented.

## Appointment states
Preferred business state model:
Requested → Deposit pending → Confirmed → In service → Completed
with Cancelled available.

Do not expose a state as confirmed unless the owner workflow has actually confirmed it.

## Admin
The admin surface is for John/authorized staff to:
- review appointment requests;
- confirm or reject requested slots;
- record deposit/payment status;
- manage services/prices;
- manage customer communication;
- manage business hours/location notes.

Do not build a generic CRM/ERP/accounting product.

Admin access must remain role-controlled by Firebase security rules. Never hard-code an admin UID.

## Customer communication
The existing private customer conversation architecture may be retained and adapted:
- customer messages are private to the customer and authorized staff;
- optional image/PDF support is useful for hairstyle references, screenshots and receipts;
- notification failure must never discard an already-saved message;
- do not weaken Storage/Firestore rules to make the UI work.

## PWA/offline
The customer app is an installable PWA and should behave like a real app across supported browsers.

Installability:
- manifest has a stable id and scope, standalone display, 192px + 512px PNG icons, shortcuts and install metadata;
- production must be served over HTTPS;
- Chromium browsers may expose the in-app install prompt through beforeinstallprompt;
- iOS/iPadOS Safari does not expose beforeinstallprompt, so provide truthful Share → Add to Home Screen guidance;
- service-worker shell changes require the cache version to be bumped;
- app updates must support a waiting worker and an explicit refresh action rather than silently disrupting a customer.

Offline:
- Firebase Firestore uses persistent local cache/multi-tab persistence;
- previously established guest sessions remain available offline through Firebase Auth persistence;
- appointment writes are cached locally by Firestore and synchronize when connectivity returns;
- do not await an offline Firestore write indefinitely in the customer UI;
- save a private local booking copy so the tracking page can reopen the request on the same device;
- service worker caches the public app shell, manifest, icons and static Next assets;
- navigation uses network-first with /offline fallback;
- API calls and private admin/customer data are not blindly cached;
- a first-time visitor who has never established the guest Firebase session must reconnect once before a private backend booking can be created;
- payment cannot be claimed offline;
- live appointment status requires synchronized backend data.

Push notifications:
- /sw-jts.js is the Firebase Messaging + PWA service worker;
- it uses the dedicated stylist-36204 Firebase configuration;
- background notification clicks return to JTS customer/admin routes;
- notification failure must never invalidate a saved booking or message;
- the old BOEMO service worker is removed.

Do not reintroduce BOEMO food/kitchen/pickup language into customer-facing PWA, offline or notification surfaces.

## Media/design
Canonical visual reference: the owner-supplied `public/jts.jpg` logo. Its palette is **black, metallic gold, white and silver**. The logo contains white/silver script, gold hairline accents and gold “STYLES” lettering on black.

- Keep `public/jts.jpg` as the canonical logo. Do not redraw, recolour, crop destructively or replace it with a text monogram.
- Style every route—homepage, booking, booking history/detail, admin, install panel, embedded-browser gate and offline recovery—as one JTS product using the same logo-led palette.
- Use black/near-black foundations, readable white, silver/neutral secondary surfaces and restrained metallic-gold accents. Remove inherited plum/purple, lime-green, neon-blue, pink and orange styling where it is decorative rather than semantic.
- Maintain readable contrast, visible focus, error/status distinction, responsive spacing and touch-friendly actions. Keep the booking CTA primary; installation stays secondary and non-blocking.
- Keep genuine supplied salon imagery only. Do not invent client results or use unrelated stock photography.
- Use `brand.logo` and `brand.iconSvg` for canonical brand references. Do not assume a JPEG is a valid PNG. Verify icon file signatures, dimensions and rendered appearance before calling PWA icons correct.
- Brand metadata/theme color, manifest, browser handoff, install panel, offline UI, favicon/share assets and notification imagery must agree with the canonical logo.

## Accessibility and form quality
- visible labels;
- keyboard-compatible controls;
- meaningful focus states;
- text plus visual error indicators;
- no placeholder-only labels;
- clear date/time constraints;
- no color-only status communication;
- accessible button names;
- mobile-first layouts;
- preserve input during validation errors.

## Security/data integrity
- Never expose customer profiles publicly.
- Customer reads must remain scoped to the authenticated customer UID.
- Never treat client-submitted price/payment fields as authoritative financial proof.
- Never make an appointment confirmed merely because a customer submitted a form.
- Never weaken Firestore/Storage rules to hide application errors.
- Never commit private credentials.

## Verification
Before a meaningful checkpoint:
- npx tsc --noEmit
- npm run lint
- npm run build

Also verify the actual customer flow:
1. landing page;
2. service selection;
3. date constrained to at least tomorrow;
4. time constrained to 08:00–18:00;
5. name + WhatsApp/phone;
6. optional desired-style note;
7. 50% deposit calculation/display;
8. appointment request submission;
9. confirmation wording;
10. contact/next-step action;
11. account/order history remains private.

## Recovery
If an unexpected result appears:
**STOP → inspect reality → compare against the last known-good checkpoint → repair the smallest necessary layer → verify again.**

Do not rebuild the foundation merely because the product domain is changing. Reuse proven authentication, Firestore, PWA, customer communication and deployment patterns while replacing the business semantics carefully.


### Install UX checkpoint
- The customer-facing install action is a normal JTS header control, not a fixed floating button that can cover content or compete with booking actions.
- Chromium installation uses one retained `beforeinstallprompt` event and calls `prompt()` directly from the explicit Install app button user gesture; the consumed event is cleared and `appinstalled` removes the control.
- iPhone/iPad Safari does not receive a fake native prompt; the Install app control opens concise Share → Add to Home Screen guidance.
- Unsupported browsers do not receive a dead install control.


### Historical install recovery checkpoint (superseded by Golden PWA journey below)
- At that checkpoint, `public/sw-jts.js` cache version was `jts-shell-v4` and its navigation handler must keep the response callback async because it awaits cache writes.
- The install control remains visible on mobile browsers even before `beforeinstallprompt` arrives; when no native prompt is available it gives browser-specific truthful installation guidance instead of disappearing.
- iOS installation guidance applies to iOS browsers generally: Share → Add to Home Screen; Chromium-based Android browsers use the native retained prompt when `beforeinstallprompt` is available.
- Do not hide the mobile install control merely because the browser has not yet delivered `beforeinstallprompt`.


## Clone identity rule
When this repository is cloned from another application, inherited application identity is unsafe until explicitly verified. Before feature work, identify the parent, establish the JTS identity, verify browser/PWA metadata and canonical icons, remove inherited branded assets, and bump the JTS service-worker cache namespace. The identity verification script must pass before a checkpoint. Compatibility architecture inherited from BOEMO may remain where it is intentionally used; that is not permission to retain BOEMO customer-facing branding, assets, metadata, cache names or generated documents.


## GOLDEN SYSTEM — WhatsApp → Normal Browser → PWA Install (current contract)

This section supersedes conflicting older install UX notes above. Do not remove or duplicate the root controller or add a second install-event listener without first inspecting this implementation.

### Required journey
1. **Embedded browser = escape stage.** Match The Plug’s architecture: `src/app/layout.tsx` reads `headers()` and detects WhatsApp/social in-app browsers server-side (User-Agent plus `x-requested-with`) and passes the initial context to `src/app/jts-browser-gate.tsx`. Render the branded gate in the first HTML response; do not wait for a client `useEffect` before showing it. The gate is mounted once globally, so it applies identically to homepage, service deep links, `/order`, and other booking/account routes. It preserves the current destination path and query (and the full URL as the fallback), and presents one branded primary “OPEN IN CHROME” / “OPEN IN BROWSER” action. Android Chrome intent URLs are attempted where supported; other platforms use a new-tab handoff with explicit in-app-menu/copy-link recovery because an embedded host may refuse external-browser launches.
2. **Normal browser = continue the task.** After handoff, a normal browser must show the originally requested JTS route; booking remains usable without installation. The gate and install panel are separate UI/state. The gate covers the embedded journey; do not show competing install prompts or add auto-opening install modals.
3. **One root controller, early capture.** The `beforeInteractive` capture script in `src/app/layout.tsx` retains `beforeinstallprompt` before hydration can miss it and dispatches `jts-install-available`; `src/app/pwa-register.tsx` owns the retained-event install function, service-worker registration, `appinstalled`, and the `jts-install-consumed` / `jts-install-complete` contract. This is one root-level system, not permission to add more listeners. Do not add page-specific listeners for the native browser event.
4. **Native prompt first.** `src/app/jts-install-button.tsx` calls the retained prompt controller directly from the explicit button click. Do not insert another confirmation or instruction modal before invoking an available native prompt. If the controller reports unavailable or throws, show the fallback panel.
5. **No silent failure.** The install action remains available on the public home route while not installed, including desktop when no native event is available. Android fallback explains Chrome's Install app/Add to Home screen menu; iPhone/iPad explains Safari Share → Add to Home Screen; desktop explains Chrome/Edge installation where offered. Never claim that a native prompt opened unless the browser actually exposed it.
6. **Installed state.** Standalone/display-mode detection suppresses the install control and embedded gate; `appinstalled` clears the retained event and closes installation help. Do not block private/account routes with installation promotion.
7. **Installability diagnosis.** If `beforeinstallprompt` is absent, inspect HTTPS, manifest response and metadata, declared 192/512 PNG icons and URLs, service-worker registration/scope, controller timing, browser support and installability diagnostics. JavaScript cannot force an OS/browser prompt.
8. **Service worker/cache.** Actual current cache namespace is `jts-shell-v8` in `src/config/brand.ts` and `public/sw-jts.js`. Bump both consistently whenever shell assets or install-critical identity/metadata changes. Preserve network-first navigation and do not cache private account/admin responses.
9. **Verification checklist.** Verify direct browser entry and embedded entry independently; gate detection and primary action; path/query/hash preservation; fallback/copy recovery; no redirect loop; native prompt direct from click when the event exists; useful platform fallback when absent; standalone/appinstalled suppression; manifest output and icons; SW scope/controller/cache; identity check, typecheck, lint and production build. For Vercel, only declare QA-ready after the exact intended commit's deployment reaches READY. Do not claim device-level WhatsApp/Safari/Chrome behavior was tested unless actually tested on those platforms.

### Current implementation paths
- Root mount: `src/app/layout.tsx`
- Embedded-browser gate: `src/app/jts-browser-gate.tsx`
- Single PWA/install controller: `src/app/pwa-register.tsx`
- Public install action/fallback: `src/app/jts-install-button.tsx`
- Install/gate styling: `src/app/pwa.css`
- Manifest: `src/app/manifest.ts`
- Canonical identity/cache namespace: `src/config/brand.ts`
- Service worker and install shell: `public/sw-jts.js`
- Identity verification: `npm run verify:identity`


## JTS editorial product direction — current customer-facing contract

The public experience should follow The Plug's editorial discipline without copying its retail model. The Plug is a curated storefront and customer relationship loop; JTS is a stylist-led service and appointment relationship. Translate the principles, not the features.

### Brand and positioning
- Position JTS Styles as a distinctive professional hairstyling/barbering service in G West, Gaborone, Botswana. The known differentiators are John's supplied service list, precision cuts/colour/bleach and statement styles, the purple-door location landmark, clear appointment rules, and direct contact.
- Do not infer John's nationality, ethnicity, biography, client base, or reputation from his name or from unrelated search results. Public research reviewed for this revamp did not establish a reliable source for his country of origin. Keep the experience locally grounded in the verified business facts without making claims about John's personal background.
- Use an editorial, mobile-first art direction: warm paper, deep plum, violet and a sharp lime accent; concise copy; confident typography; clear service and booking hierarchy. Do not retain BOEMO's food-brand identity or default black/gold/cyan treatment as the defining JTS brand.
- Never fabricate portfolio photography, client transformations, reviews, ratings, demand, testimonials, discounts, availability, or prices. Add real portfolio work only when the owner supplies authentic images and has permission to publish them.

### Required homepage journey
1. A compact Gaborone/G West identity line and clear JTS brand.
2. Editorial hero with one primary appointment action and one secondary route to services.
3. Service edit showing only the four supplied priced services: Pixie Cut P350–P400; Cut + Pixie Cut P200; Pure White P300; Cut + Bleach P250.
4. Unpriced services (fades, bobs, tinting and special-event looks) are enquiry-only until John supplies prices; do not make them look like priced bookable catalogue items.
5. Explain the actual booking sequence: choose service, request a date/time at least one day ahead within 08:00–18:00, then follow the 50% Orange Money deposit instructions. A request is not a confirmed appointment and is not proof of payment.
6. Prominent local directions, supplied purple-door landmark, hours, phone/WhatsApp, Orange Money number/account name.
7. Optional install prompt appears in a contextual “Keep JTS close” section after service, booking and visit information. It must not occupy the primary header or compete with booking. Installation is never required to browse, request an appointment, or view booking history.
8. Mobile booking action may remain sticky because it supports the primary task; install must remain secondary and non-blocking.

### Customer relationship loop
- Map The Plug's ongoing relationship model to JTS with private appointment history, clear status changes, useful reminders/updates where configured, and a low-friction repeat booking path.
- Do not add retail-style points, lotteries, deals, membership promises, or notification pressure to a stylist business without an explicit owner-approved policy and reliable supporting data.
- Keep guest-first booking. Google/account linking and installation are optional conveniences, never prerequisites.
- Use real appointment records as the source of truth. Never present a requested slot as available/confirmed until John's workflow confirms it.

### Legacy BOEMO boundary
- JTS still has transitional BOEMO-shaped Firestore types and admin/menu code. These are implementation debt, not customer-facing product language. Do not surface food/menu/BOEMO wording or food-seeded catalogue items on JTS public pages. A domain-model/admin refactor must inspect Firestore rules and existing records first; do not perform a blind collection rename or weaken security rules.
- The public homepage must not read the legacy food menu just to render salon services. Salon service prices above are supplied, explicit content; the admin's legacy menu is not an authoritative salon catalogue.

### Research basis
- Nielsen Norman Group, “Few Guesses, More Success: 4 Principles to Reduce Cognitive Load in Forms” (2025): logical structure, transparent expectations, plain language and timely support.
- Nielsen Norman Group, “Progressive Disclosure” (2006): foreground frequent primary tasks and defer secondary choices.
- Kaluza, Voigt & Paetz, “Empirical studies on the impact of booking status on customers’ choice behavior in online appointment systems” (2024): availability displays can signal quality or scarcity; never fake booking activity or show false availability.
- Apply research as a design guide, not as proof that a specific layout will increase JTS conversions. Validate the live journey with real users and real appointment operations.


## Official JTS logo asset contract (2026-10-11)
- Canonical source: `public/jts.jpg`, supplied by the owner. Do not redraw, regenerate, crop destructively, recolour, or replace it with a text monogram.
- Self-contained scalable icon: `public/jts-logo.svg`, which embeds the canonical JPEG. Use `brand.logo` and `brand.iconSvg` rather than hard-coding alternate logo paths in metadata.
- Visible brand placements: homepage header and footer; contextual Keep JTS Close section; WhatsApp/social embedded-browser handoff gate; install button; offline recovery; Open Graph/Twitter preview; notification icon/badge where supported; manifest/favicon. Keep booking as the primary action and install as optional.
- `public/icon-192.png` and `public/icon-512.png` are retained as PNG compatibility fallbacks until proper PNG derivatives from the official source are generated and visually verified. Never copy JPEG bytes into a .png file or claim PNG derivatives exist when they do not.
- If replacing the PNGs later, generate true 192×192 and 512×512 PNG files from `public/jts.jpg`, inspect them visually, update manifest and shortcuts, then run `npm run verify:identity`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
- Any change to install-critical assets must bump `serviceWorkerCache` in `src/config/brand.ts` and `CACHE_VERSION` in `public/sw-jts.js` together. Current value: `jts-shell-v10`.
- Verify the deployed favicon/share image and the install flow separately. Do not claim Android/iOS icon or WhatsApp handoff QA without testing on those actual platforms.


## Handoff parity checkpoint — 2026-10-11
- Treat The Plug's server-first embedded-browser handoff as the architectural reference. JTS content and visual styling remain JTS-specific; browser detection, initial server-rendered gate, URL-preserving escape action, keyboard/scroll lock and fallback pattern should stay structurally aligned.
- Do not ship a client-effect-only gate: WhatsApp customers must see “Open JTS in your browser” and one “OPEN IN CHROME” (Android) / “OPEN IN BROWSER” (other embedded browsers) action in the first HTML response, before the homepage/booking page can be mistaken for the intended destination.
- Detection includes WhatsApp, Instagram, Facebook, Messenger, LinkedIn, Line, Twitter, TikTok, Snapchat, Android WebView and known app package IDs via `x-requested-with`. Do not gate Chrome/Safari merely because the referrer originated in WhatsApp.
- The root layout applies the same gate on every route. Android attempts Chrome intent with the current path/query and an exact full-URL fallback; iOS/other platforms open the current URL in a new tab and explain the host-app menu/copy-link recovery if blocked.
- Keep booking as the primary customer task and install as optional after handoff. Never add a blocking install modal to normal-browser entry.
- Handoff implementation changes require cache namespace bump in both `src/config/brand.ts` and `public/sw-jts.js`, identity verification, typecheck, lint, build, and deployed-commit READY confirmation before asking the owner to QA.

### Deployment retry checkpoint — 2026-10-11
- The embedded-browser client detection fix is already on `main` at `fdb4219285fa44f78f4ff0c0c1a2a6197ba0a44c`; it preserves a server-detected embedded-browser context when the client User-Agent differs.
- The last confirmed production deployment was older commit `d8cb477a536ef321cc75630b038a830831c9de36`; do not ask the owner to QA the live WhatsApp journey until a deployment containing the fix is confirmed `READY`.
- If a documentation-only chore commit is used to retrigger Vercel after a rate-limit failure, do not mistake the commit itself for deployment success. Verify the exact new `main` SHA and its production deployment state first.


## Product-use rule — no self-defeating install or detour copy (2026-10-11)
- The product exists to be used. Customer-facing copy must invite customers into the app and make the next in-app action clear; do not add apologetic lines such as “you can book without installing anything”, “no install needed”, or language that talks customers out of using/installing the app.
- Do not send customers to WhatsApp, a phone call, another website, or an external browser as the default path when the app can complete the task itself. External contact is a useful fallback for genuine exceptions, not the main product journey.
- PWA installation should be offered as a direct, working app action with honest platform-specific handling. Do not falsely claim installation is technically mandatory, but do not foreground caveats about not needing the app.
- Embedded-browser handoff is the explicit exception: use the branded gate to get a WhatsApp/social in-app visit into the normal browser when detected, preserve the requested route, and avoid rendering the full app underneath or flashing it before the gate.
- Before changing customer copy, check whether it encourages completion inside the product or unnecessarily redirects the customer away from it. This principle applies to future projects and must be carried into their AGENTS.md when creating or updating them.


## Browser install parity with The Plug — 2026-10-11
- In a normal browser, JTS must offer a persistent, branded “Install JTS Styles” entry point, matching The Plug's working pattern: call the native browser install prompt directly from a user click when available; otherwise show a concise, platform-specific install guide.
- The install panel is secondary and dismissible; it must never block browsing or booking, and it must not replace the server-first embedded-browser handoff gate.
- Hide the persistent install entry when the app is already running in standalone/installed mode. Keep the contextual “Keep JTS close” section and its button in the homepage.
- Preserve the captured `beforeinstallprompt` event and the existing `window.jtsInstallApp` action. Never show a dead install button.
- Verify the normal-browser install CTA and the embedded-browser handoff as separate flows. Do not claim actual device installation without a real Android/iOS browser test.


### Native install prompt reliability — 2026-10-11
- The normal-browser install CTA invokes the retained `beforeinstallprompt` event synchronously from the user's click; await the returned prompt promise and then await `userChoice`.
- Treat `beforeinstallprompt` as one-shot. Clear it after invocation and never restore a stale/consumed event after an error. If the browser did not expose the event, JavaScript cannot force the native install UI; keep the existing platform fallback for that case.
- The current service-worker cache namespace is `jts-shell-v10` in both `src/config/brand.ts` and `public/sw-jts.js`.


### Chore checkpoint — 2026-10-11 install deployment retry
- The current install-capture implementation and matching service-worker shell cache are present on `main`; the cache version in both `src/config/brand.ts` and `public/sw-jts.js` is `jts-shell-v11`.
- A deployment marked READY for the earlier commit `87f616b80c01242da467e4555cb8763a51f2b81a` does not prove the later install-controller/cache commits are deployed. Confirm the deployment's exact Git SHA before device QA.
- Do not create extra commits to tidy documentation or code after this checkpoint. Bundle any remaining changes into one intentional chore commit to conserve Vercel Hobby deployments.
- Device-level native install and WhatsApp handoff remain unverified until tested on the actual phone/browser.


## Customer booking flow hardening — 2026-10-11
- Keep the first appointment request guest-first; reuse an existing Firebase Auth session and create anonymous auth only when there is no current session.
- Validate a plausible phone/WhatsApp number before submission without rejecting common international formats.
- The post-submit WhatsApp handoff should carry the customer's entered name, requested service/date/time, reference, optional style note, supplied price range and 50% deposit instructions. It must state that the appointment remains a request until John confirms it.
- Do not migrate the legacy `orders` collection or rewrite the admin schema as part of customer-flow hardening. Admin replacement is a separate phase after the booking lifecycle is verified.


## Top-down styling and operations roadmap — 2026-10-16

This is the active work plan. It supersedes earlier conflicting decorative colour guidance above and older install/cache checkpoint values. Preserve working behavior first; keep visual styling and operational refactors as separate, reviewable slices.

### Audit baseline — inspected on `main`

- Canonical brand image: `public/jts.jpg`; visual palette is black, metallic gold, white and silver.
- Public homepage: `src/app/page.tsx`; currently has four supplied priced services, an enquiry path for unpriced styles, booking guidance, location/visit details, and an optional install section. Preserve those paths and their supplied prices.
- Customer booking: `src/app/order/order-form.tsx`; guest-first form, service selection, requested date/time, name/phone, optional style note, deposit information, local booking copy and explicit request-vs-confirmation language. It currently accepts a typed time within the configured 08:00–18:00 window; that is a **requested time, not live verified availability**.
- Customer history/detail: `src/app/account/page.tsx`, `src/app/orders/[id]/page.tsx`; history is associated with the current guest session/device, with Google linking and local/offline tracking behavior in the existing flow. Do not remove these behaviors during styling.
- Admin: `src/app/admin/admin-gate.tsx` and `src/app/admin/page.tsx`; role-gated Firebase access exists, but the screen still identifies itself as BOEMO Kitchen and operates on food orders, food menu, kitchen location and food-sale reconciliation. This is the highest-priority domain mismatch.
- Data/security: `src/lib/firebase/data.ts` and `firestore.rules` still use legacy `orders`, `menu`, `businessSettings`, pickup/delivery fields and customer UID ownership. Rules constrain customer-created records and reserve admin writes for owner/staff. Do not blindly rename collections, overwrite live records or loosen rules.
- PWA/handoff: `src/app/layout.tsx`, `src/app/jts-browser-gate.tsx`, `src/app/pwa-register.tsx`, `src/app/jts-install-button.tsx`, `src/app/pwa.css`, `src/app/manifest.ts`, `src/config/brand.ts`, and `public/sw-jts.js`. Preserve the one root install controller, server-first embedded-browser gate and current user journeys. Native prompt behavior and real-device handoff must be reported as unverified unless tested on the device/browser.

### Tripple S patterns inspected and approved for adaptation

Use the Tripple S implementation as a **workflow reference, not a code/schema/branding clone**:

- **Customer flow:** service discovery and published price/duration first; guest-first request; real server-generated availability; server revalidation when submitted; clear request receipt/reference; separate staff confirmation and payment state; optional post-request account linking for cross-device history. The Spa uses `GET /api/availability`, `POST /api/bookings`, and a transaction-backed `slotReservations` model. JTS does not yet have an equivalent verified live calendar, so do not pretend its free-form requested time is an available/held slot.
- **Admin flow:** a searchable/filterable request queue with new/confirmed/payment-pending counts; distinct appointment requests versus general enquiries; direct status/payment updates with honest save/error feedback; owner-managed service/category catalogue; owner-managed operating hours/announcements; related calendar/client/follow-up tools only where JTS has an approved operational need.
- **Access/security:** Tripple S checks individual Firebase identities against `admins/{uid}` owner/staff roles, uses validated server routes and the Admin SDK for booking writes, and denies direct client writes to booking requests/slot reservations in Firestore rules. Adopt those boundaries gradually for JTS after inspecting the configured Firebase project, live data and current access rules. Do not copy the Spa's access word, credentials, project IDs, clinical/wellness features, customer data or schema.
- **Account onboarding:** retain guest-first booking; invite account linking after the request to improve recoverable appointment history. Handle existing-account collisions explicitly and never silently merge customer identities.
- **Truth and usability:** distinguish request received, under review, confirmed, deposit pending/received and completed; no success message unless persistence is confirmed; recoverable field errors; concise mobile-first layouts; reduced-motion support; no fabricated availability or customer outcomes.

### Delivery roadmap

**P0 — Complete the logo-led visual consistency pass**
1. Apply black/gold/white/silver styling to the homepage, service cards, booking form/summary, confirmation, account/history/detail, admin shell, install panel, embedded-browser gate, offline/update UI and form controls.
2. Preserve current page structure, routes, text/data behavior, booking flow, guest sessions, WhatsApp links, auth/rules, and install/handoff logic during this styling-only slice.
3. Verify responsive behavior and contrast at mobile and desktop widths. Ensure the canonical logo remains unchanged and the manifest/theme colours match it.
4. Bump the service-worker shell cache namespace in `src/config/brand.ts` and `public/sw-jts.js` together when shell styling changes.

**P0 — Make Admin represent John the Stylist**
1. Replace BOEMO/Kitchen/food-order wording with JTS appointment and customer language.
2. Map the useful existing admin foundation to JTS tasks: appointment request queue, requested date/time and service, customer contact, clear lifecycle status, deposit record, private customer communication, service/pricing management and operating information.
3. Do not simply relabel food CRUD or financial reconciliation and call it done. Inspect legacy records and security rules, then plan the smallest safe domain migration with backward compatibility where necessary.
4. Keep admin separate from customers, owner/staff role-gated, and never introduce self-service admin registration or hard-coded UIDs.

**P1 — Make the appointment lifecycle dependable**
1. Keep guest-first discovery and submission; published prices must precede personal details.
2. Clearly label the selected date/time as a request until a verified calendar exists. Maintain the minimum one-day notice and 08:00–18:00 business constraints unless John explicitly changes them.
3. Design a validated server-side booking write and availability/slot-reservation layer only after confirming the real operating calendar and data source. Recheck conflicts on submission; never fabricate open slots or call a request confirmed.
4. Separate appointment status from deposit/payment status. The 50% Orange Money instructions remain guidance, not proof of payment; only an authorized, evidence-backed admin action may record receipt.
5. Verify status changes, request ownership, duplicate/conflicting requests, error recovery and customer-visible next steps before adding automation.

**P1 — Improve customer continuity without adding first-booking friction**
1. Preserve anonymous/guest booking and existing same-device history.
2. After a successful request, offer optional account linking for recoverable history; preserve the same UID/records when linking and handle account collisions explicitly.
3. Never require installation, Google, email/password or profile completion before the first request. Never imply device-local history is automatically recoverable across devices.
4. Keep appointment communication useful and truthful; do not add marketing/reminder automation without owner approval.

**P2 — Harden and measure after the core flow works**
1. Review direct Firestore writes, status mutation permissions, server validation, admin least privilege, offline/local-copy wording and cache boundaries against actual deployed behavior.
2. Add only owner-useful, privacy-minimised analytics after booking and status data are trustworthy.
3. Consider calendar, customer follow-up and richer service management only when they solve a confirmed JTS operating need.

### Required acceptance gates

- Inspect `AGENTS.md`, Git state, current production commit, Firebase project/rules and relevant route before implementation.
- Styling-only work must not alter business logic or remove working controls/routes.
- Run `npm run verify:identity`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` when available.
- Inspect the final diff; confirm the canonical logo, manifest metadata and matching service-worker cache version.
- Verify homepage → service selection → booking request → receipt/reference → history/detail; separately verify admin access and each authorized state/payment change.
- Check the exact Vercel deployment SHA and READY state before describing a change as deployed. Device-level Chrome/Safari/WhatsApp install behavior remains NOT RUN unless physically tested.
- Record every gate as PASS / FAIL / NOT RUN / BLOCKED. Do not call a source audit, build, or READY deployment a complete customer-flow QA.


## NON-NEGOTIABLE PWA INSTALLATION STANDARD — DO NOT REGRESS

The product-owner-approved Africhiko installation standard is mandatory for this repository. Read [docs/PWA-INSTALLATION-STANDARD.md](./docs/PWA-INSTALLATION-STANDARD.md) before any PWA/install work. It is the permanent installation-behavior contract for JTS and applies to every developer, AI coding agent, automated tool, dependency update and future feature implementation.

- Treat the current approved installation implementation as protected infrastructure. Do not redesign, rewrite, replace, simplify, refactor or remove its behavior unless the product owner explicitly authorizes that specific change.
- Preserve the retained `beforeinstallprompt` event and direct native prompt invocation from the user's branded install click; keep the JTS-specific embedded-browser handoff and existing root install controller intact.
- Preserve the compact, branded, dismissible install experience and accurate iPhone/iPad Safari Share → Add to Home Screen pathway. Do not introduce duplicate prompts, fake native prompts, dead buttons, generic fallback screens that contradict the standard, or JavaScript alerts.
- For routine branding work, change only genuine JTS identity/assets/metadata; do not modify protected install runtime, event handling, lifecycle, manifest behavior, service-worker registration/cache behavior or platform handling as a side effect.
- Before any authorized install-mechanics change, explain the specific need and obtain explicit product-owner authorization. Then make the smallest isolated change, compare against the approved baseline, run identity/type/lint/build checks, inspect manifest/assets/cache behavior, and report device QA honestly.
- Report source commit, checks, deployment state and physical-device QA separately. A commit or successful build does not prove the Vercel deployment or native prompt was tested.

## Account utility dashboard — current approved behavior
- The account page is a practical utility first: Google/account connection at the top, in-app booking updates immediately after it, next appointment, compact booking history, then inspiration.
- Google connection is optional and must never be required to request an appointment.
- If Firebase Auth already has an anonymous guest, use `linkWithPopup` to connect Google to that exact identity; do not silently switch accounts or split that guest's booking history. A signed-out customer may use `signInWithPopup` to establish a Google account for future bookings.
- Handle Firebase Auth error codes with specific, actionable customer guidance. Log only the error code for diagnostics; never log tokens, credentials, email addresses, or profile data. A credential conflict must not automatically merge or discard booking records.
- The account activity panel may show only customer-scoped booking status updates supported by the current data layer. Do not label this panel as push delivery or claim push notifications are enabled unless actual delivery is verified.
- Booking history defaults to the three most recent entries, with an explicit control to reveal the full list. Keep reference IDs, dates, statuses and booking detail links intact.
- Style Studio is optional enrichment, not the account's primary task. Keep it after account access, updates, next booking, booking history and other practical actions; do not let it compete with booking or account controls.
- Preserve appointment truth: a request is not confirmed until John confirms the slot and deposit. Preserve customer privacy and existing Firestore rules.
- Do not change the protected PWA install flow as part of account utility work.



## NON-NEGOTIABLE — service catalogue media CRUD and customer visibility

The service catalogue is a single connected content workflow, not text-only price records plus a disconnected portfolio.

- In Admin → **Services & prices**, each service record must support full CRUD of its service fields **and multiple attached photos/videos**. An authorized owner/staff member must be able to upload, preview, remove, edit and save service-specific media in the same service editor. Do not require them to discover a separate “style feed” tab just to add media to Pixie cut, Pure white or another catalogue service.
- Use the existing authenticated UploadThing `adminStyleMedia` route for media binaries. Keep server-side Firebase ID-token/admin authorization; do not weaken Firestore rules or expose upload credentials. Respect the configured size/type limits and show upload errors and progress honestly.
- Store service media metadata alongside the corresponding service in `businessSettings/publicServices.services[]` using a backward-compatible optional `media` array (`url`, `type: image|video`, optional `alt`). Existing services without media remain valid and must not disappear.
- Public home service cards must visibly render the service's own media (including playable video), with a fallback design only when the service has no media. The public `/feed` must render owner photos **and videos**, not silently treat video posts as images.
- The customer `/account` page must also provide a responsive, usable view of public service examples and John’s published style posts, with working links to discuss/request the selected look. It must only read public published owner media and public catalogue data; never expose another customer’s private profile, drafts or unpublished content.
- Editing service details or media must update the public catalogue, booking service choices and account inspiration from the same source of truth. Deleting a service removes it from the public catalogue and booking choices. Removing one media item must not delete unrelated media or alter the service price/identity.
- Preserve the existing separate owner style feed CRUD and customer-submitted look/review moderation; they complement service media and must not be used as a substitute for it.
- Keep the experience mobile-first, keyboard accessible and overflow-safe. Give upload controls visible labels, previews, per-item remove actions, empty states, save/error feedback and no hidden media-management requirement.
- Do not seed or fabricate customer photos, before/after results, reviews or stylist portfolio assets. Only media deliberately uploaded by authorized staff should appear as John’s work.
- Before completion, verify legacy service records normalize without media; add/edit/delete a service and its media; render photos and videos on homepage, full feed and customer account; confirm a customer cannot see drafts/unpublished media; confirm service selection in booking remains correct; run identity verification, TypeScript, lint and production build; inspect the final diff and exact Vercel commit/deployment state. Report physical-device QA separately.


## Contextual customer accounts, forecast cues and engagement signals

The account should feel like a personal JTS style studio, not a generic dashboard. Add useful context without replacing or interrupting booking, customer identity, appointment history, reviews, service CRUD, PWA installation, or notifications.

### Customer account experience
- Use a restrained, time-aware greeting and a first name only when Firebase Auth actually supplies a non-anonymous display name. Never infer a name from email, invent a customer history, or overuse their name.
- Give one useful next step based on real state: existing upcoming request, existing booking history, or no bookings yet. Keep booking primary but allow customers to browse inspiration or continue as guests.
- Use Gaborone weather and a short daily forecast as a planning cue. The forecast may say conditions look clearer, but must never imply that a date/time is available, reserve a slot, or promise weather. Always state that customers must request a date at least one day ahead and John separately confirms the slot and deposit.
- The weather widget must have loading, failure/retry, timestamp/timezone, units, provider attribution and responsive behavior. If weather is unavailable, booking and account features remain usable.
- Adapt the contextual guide pattern from Africhiko: a small dismissible/closable scripted helper with useful links and page-aware responses. It must clearly say it is scripted, not a live person/AI, and cannot send messages or change booking status. All shortcuts must lead to a real page/action. Do not create a second chatbot or fake AI service.
- Keep the JTS editorial identity: black, metallic gold, white and silver. The guide must not cover booking controls or the protected installation UI. No auto-open modal or forced account creation.

### Admin experience
- Address authorized staff warmly as “Boss” by default, with time-aware morning/afternoon/evening wording. A verified non-anonymous display name may be used where appropriate.
- Prioritize real Firestore-backed work: number of new appointment requests needing review and direct shortcuts to the appointment queue, unavailable dates, services/prices and style-feed publishing.
- Do not invent urgency, booking availability, popularity or customer counts. Keep the request-vs-confirmation and deposit rules intact.

### Weather API and licensing
- The current demo implementation uses Open-Meteo's standard no-key forecast endpoint for Gaborone coordinates (-24.6282, 25.9231), timezone Africa/Gaborone, current temperature/apparent temperature/humidity/wind/weather code and a seven-day daily forecast.
- Cache server responses for 30 minutes; never let forecast failures block booking.
- Attribute the provider as “Weather data by Open-Meteo (CC BY 4.0)” and link users to the provider where appropriate. Official API documentation: https://open-meteo.com/en/docs and https://open-meteo.com/.
- IMPORTANT LICENSING CHECKPOINT: Open-Meteo's standard no-key API is offered for non-commercial use. JTS is a real salon business and may be commercially operated; before using this no-key endpoint for commercial/live business use, confirm the licence is appropriate or switch the route to the licensed customer API with a server-only API key. Never imply the free non-commercial endpoint is cleared for commercial use.
- Do not store precise customer location or ask for location permission just to show Gaborone salon weather. This is the salon-area forecast, not a customer/device or appointment-site forecast.

### Engagement analytics and research-informed design
- Reuse the existing Vercel Analytics integration. Track only coarse, non-identifying events such as account view (session category only), Google account connection method, weather booking CTA click, guide opened/shortcut selected, admin priority shortcut, and successfully updated appointment status.
- Never send names, emails, phone numbers, auth UIDs, appointment IDs, free-text notes, media URLs, or any private customer data to analytics. Tracking must never block account, auth, booking or admin operations. Do not add an analytics vendor.
- Research basis: Self-Determination Theory supports autonomy, competence and relatedness; use choice and helpful information rather than pressure or guilt. The digital behaviour-change research review warns against optimizing app engagement for its own sake. Action-planning research supports timely, relevant cues paired with a concrete next step, but does not guarantee that any one UI feature increases bookings.
- References: Ryan & Deci, Self-Determination Theory (https://pubmed.ncbi.nlm.nih.gov/11392867/); Designing for Sustained Motivation: A Review of Self-Determination Theory in Behaviour Change Technologies (https://academic.oup.com/iwc/article/38/3/447/7760010); Gollwitzer & Sheeran, implementation intentions overview (https://www.socmot.uni-konstanz.de/publications/implementation-intentions-health-behavior-constructs-theory-measurement-and-research).

### Protected behavior and verification
- Preserve the existing PWA installation flow, embedded-browser gate, service-worker/cache behavior, Firebase Auth/session/linking, Firestore ownership/rules, appointment status semantics, deposit wording, service CRUD and customer media moderation. Do not refactor these as part of account engagement work.
- Test weather route success, provider failure and retry; forecast dates use Gaborone local time and exclude today from future-day suggestions; CTA does not imply availability.
- Test anonymous, connected Google customer, no-bookings, existing-history, upcoming-request and authorized admin states. Confirm only real names/data appear, guide links work, analytics properties contain no PII, and narrow mobile widths do not overflow.
- Run npx tsc --noEmit, npm run lint, npm run verify:identity and npm run build. Report deployment readiness separately from code checks and report physical-device QA only when performed.

## Operations admin usability and authorization consistency
- Keep the one-word **Enter** sign-in available through the existing server-side `ADMIN_PASSWORD` environment variable; never hard-code or expose its value.
- Approved Google admin sessions must have a matching `admins/{uid}` owner/staff record before the dashboard mounts, so the client gate and Firestore rules agree on authorization.
- Service edits use a compact, keyboard-dismissable modal. Service-specific photo/video uploads stay in that editor, support multiple files with per-file progress/errors, and only publish after saving the service record.
- Confirm destructive service, portfolio-post and customer-look deletions. Provide visible, dismissible status feedback; errors must explain the next useful step.
- Keep the public catalogue, booking choices and customer account inspiration reading the same `businessSettings/publicServices.services[]` source of truth. Do not change protected PWA install/handoff behavior.

## App-like JTS public homepage — approved visual direction
- The homepage lead visual reads the first available authorized image/video attached to the public service catalogue. If none exists, it uses a restrained JTS typographic fallback; never fabricate portfolio work.
- Keep one dominant booking action, followed by shortcuts for My appointments, Services & prices, Style Studio and salon location.
- On mobile, keep the quick dock limited to Home, Book, Account and Studio. Keep admin discreet in the footer only.
- Preserve all booking, account, service-media, owner style-feed, install, offline and admin behavior. Homepage visual work must not alter appointment truth, authentication, Firestore permissions or customer data visibility.
- When changing the homepage shell, increment the service-worker cache namespace in `src/config/brand.ts` and `public/sw-jts.js` together.
