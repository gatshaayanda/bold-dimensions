# John The Stylist Bw

**JTS Styles — hairstyling, colour, cuts and barbering in G West, Gaborone.**

Customer-first appointment PWA for John The Stylist Bw. The current site is a **demo operation** while the business prepares its paid live launch.

## Customer flow
Home → Services → Book appointment → Date/time → Name + WhatsApp → 50% deposit instructions → Appointment request

Customers do not need an account or password to request an appointment.

## Current supplied services
The public catalogue is grouped into four customer-facing categories: Haircuts, Bleach Services, S Curls & Curl Styles, and Bobs & Pixie Cuts. The live catalogue in the application is the source of truth for the complete service names and prices; do not maintain a second, shortened price list here.

## Business
- G West shops
- Upstairs at Star Tattoos parlor and boutique, inside the salon with the purple door labelled “miss Emma”
- 08:00–18:00
- +267 78 053 564
- 50% deposit via Orange Money: 75720306
- Account name: John SHUMBA

## PWA
- Installable standalone web app with 192px and 512px icons.
- Home-screen shortcuts for Book appointment and My appointments.
- Chromium install prompt when supported.
- iOS/iPadOS Safari Add to Home Screen guidance.
- Service-worker cached public shell and static assets.
- Offline page and offline status messaging.
- Firestore persistent offline cache/queued writes for previously established guest sessions.
- Background Firebase Cloud Messaging handled by the JTS service worker.
- Customer-facing offline requests are never described as confirmed appointments or paid.

## Operations
/admin is protected by Firebase Authentication plus admins/{uid} with role owner/staff.

## Development
npm install
npm run dev

Quality gates:
npx tsc --noEmit
npm run lint
npm run build

See AGENTS.md for the implementation contract.

## Public service catalogue media
- The public Services section groups the catalogue into four visual categories.
- Upload representative category imagery or a short video through Admin → Services & prices by attaching media to a service in that category.
- The public category card uses the first available media item within its category; media does not need to be duplicated across every service.
- Keep service names and prices complete and readable. Customer-facing video playback is controlled by the visitor.
