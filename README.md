# Bold Dimensions

**Bold Dimensions — Service & Equipment Hub**

A mobile-first customer and operations app for requesting support across agricultural machinery, air conditioning and solar water heating.

## Customer experience
- Discover the relevant service area.
- Submit a service or installation request with equipment and location details.
- Track requests and communicate with the Bold Dimensions team.
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
- Firestore and Storage rules will be finalized after the customer, request and admin data workflows are reviewed.

## Operations
- Admin access remains protected by Firebase Authentication and the Firestore admin-role boundary.
- Do not weaken Firestore or UploadThing authorization to make a screen work.
- Customer records and conversations must remain scoped to the authenticated customer and authorized staff.

## Development
```bash
npm install
npm run dev
npx tsc --noEmit
npm run lint
npm run build
npm run verify:identity
``

See `AGENTS.md` for the implementation contract and protected flows.
