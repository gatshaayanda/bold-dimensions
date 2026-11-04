# Bold Dimensions

**Bold Dimensions — Service & Equipment Hub**

A mobile-first customer and operations app for requesting support across agricultural machinery, air conditioning and solar water heating.

## Customer experience
- Discover the relevant service area.
- Submit a service or installation request with equipment and location details.
- Track requests, exchange private messages with the Bold Dimensions team and share relevant photos/videos.
- Access the app from a supported mobile browser or install it as a PWA.

## PWA
- Branded standalone app using a Bold Dimensions app mark derived from the supplied identity; the full supplied logo is used in the customer interface.
- Home-screen install prompt when the browser supports it.
- Truthful iOS/iPadOS Share → Add to Home Screen guidance.
- Existing embedded-browser handoff preserved.
- Public app shell and static assets cached by the service worker.
- Offline page explains what is and is not available offline.
- Firebase Cloud Messaging remains in the existing service worker.

## Firebase
- Dedicated project: `the-wall-ab746`.
- Browser configuration is supplied through `NEXT_PUBLIC_FIREBASE_*` environment variables.
- The service worker uses the same public Firebase web-app configuration.
- Never commit Firebase Admin service-account JSON, private keys or other server credentials.
- Firestore and Storage rules are defined in `firestore.rules` and `storage.rules`; Firebase deployment is manual and project-specific.

## Operations
- Admin access uses the server-only `ADMIN_PASSWORD` environment variable. `/api/admin/login` verifies it server-side and exchanges it for a Firebase custom token carrying the `admin: true` claim. No `admins/{uid}` Firestore collection or manual role document is required. Keep `ADMIN_PASSWORD` strong and server-only.
- Do not weaken Firestore or UploadThing authorization to make a screen work.
- Customer records and conversations must remain scoped to the authenticated customer and authorized staff. Each service request has a matching private conversation and messages subcollection. Attachments use `customerServiceMedia` / `adminBusinessMedia` through UploadThing.

## Development
```bash
npm install
npm run dev
npx tsc --noEmit
npm run lint
npm run build
npm run verify:identity
```

## First Firebase setup
1. Enable **Anonymous** sign-in in Firebase Authentication for customer request identities. Enable Google sign-in only if account linking is being offered.
2. Configure `ADMIN_PASSWORD` as a server-only environment variable in the deployment environment. The admin password flow signs in with a Firebase custom token and requires no admin collection.
3. Apply `firestore.rules` and `storage.rules` to project `the-wall-ab746` only after customer, tracking and admin workflows have been reviewed and the owner approves deployment.
4. For push notifications, set `NEXT_PUBLIC_FIREBASE_VAPID_KEY` from this Firebase project's Cloud Messaging settings.
5. For server notifications and UploadThing attachments, configure `FIREBASE_ADMIN_KEY` from a service account in `the-wall-ab746` and a new Bold Dimensions `UPLOADTHING_TOKEN`. Do not reuse JTS credentials.
6. If scheduled reminders are enabled, set `BOLD_DIMENSIONS_REMINDER_CRON_SECRET` and send it as a Bearer token to the reminders endpoint.
7. Set `NEXT_PUBLIC_BASE_URL` to the approved production URL when one is assigned.

See `AGENTS.md` for the implementation contract and protected flows.
