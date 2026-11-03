# JTS Analytics & Measurement Plan

**Status:** measurement specification; implementation is staged behind data-integrity and privacy checks.  
**Product:** John The Stylist Bw  
**Production:** https://john-the-stylist-bw.vercel.app/

## 1. Purpose

Measure whether the product helps real people discover the salon, submit appointment requests, receive accurate responses, complete appointments and return. Do not optimize page views, time-on-site or notification opens as goals by themselves.

The source of truth for business activity is the authorized JTS booking/admin data, not website analytics. Vercel Analytics is for coarse website usage and performance. Never infer bookings, customers, deposits or revenue from page views.

## 2. Current baseline (owner-provided Vercel snapshot, last 7 days)

- 54 visitors; 362 page views; 22% bounce rate.
- 89% mobile / 11% desktop.
- 98% Botswana / 2% Zambia.
- Route views: / 48, /admin 28, /order 26, /account 17, /services 7, /studio 4, /feed 2.
- Vercel showed no custom events in that snapshot.

These are page-view counts, not unique customers or completed actions. Route counts can exceed visitors because one visitor can view multiple routes. Treat the baseline as directional, not a conversion benchmark.

## 3. Three audiences, three levels of detail

### Public visitor

Show only genuinely public, aggregated, non-identifying information:
- published services and prices;
- salon location, hours and contact route;
- optionally, a verified count of distinct customers with at least one completed appointment, with a clear "as of" date and only when the count is large enough to avoid exposing an individual;
- optionally, a truthful community milestone such as "100 completed appointments" once the underlying records support it.

Never expose live appointment lists, names, phone numbers, booking references, exact customer activity, private reviews, payment status or customer-level histories. Do not use fake scarcity, invented "people booking now" claims, or a counter that counts page views as customers.

### Customer

Show only data scoped to the authenticated customer's own Firebase UID:
- their own request sequence number, if/when securely allocated;
- their own requests, appointment states, dates, deposit-proof submission state and private messages;
- their own completed-appointment count and history;
- their next actionable step.

A request sequence is not a confirmed appointment. Copy must distinguish "request #014 received" from "appointment confirmed". Do not expose another customer's sequence, identity or booking history. A customer's number should be allocated once to the customer identity, not incremented on every repeat request.

### Authorized admin/staff

Show operational data derived from actual records:
- requests received in the selected period;
- requests awaiting review;
- confirmed, completed and cancelled appointments;
- deposits expected, proof submitted, manually verified and balances outstanding, only where the stored fields support those distinctions;
- completed service value and recorded actual collections as separate figures;
- new versus returning customers, based on stable customer identity and completed records;
- service demand, busy days/hours, booking lead time and repeat interval where the underlying fields are complete;
- unanswered private conversations and today's confirmed appointments.

Every figure needs a defined numerator, denominator, date window, timezone (Africa/Gaborone) and source. Label missing/legacy/unknown values rather than silently treating them as zero. Requested service value is not revenue; uploaded proof is not verified payment; confirmed is not completed.

Prioritize an action queue over a chart wall: new requests → deposit evidence awaiting manual review → unanswered messages → today's confirmed appointments → follow-up candidates. Each item must navigate to the real record/action.

## 4. Measurement event taxonomy

Use the existing @vercel/analytics integration for coarse, non-identifying product events where the account plan supports custom events. Do not add another analytics vendor.

Candidate events:
- jts_service_viewed — coarse service category only;
- jts_booking_started — booking journey entered;
- jts_booking_step_completed — fixed step key (service, date_time, contact);
- jts_booking_submitted — only after the Firestore write succeeds;
- jts_booking_submission_failed — fixed error category, never raw error text;
- jts_whatsapp_clicked — contact route selected;
- jts_account_viewed — coarse session type only;
- jts_google_account_connected — fixed connection method;
- jts_deposit_proof_submitted — only after the private message write succeeds; do not attach a booking ID;
- jts_admin_status_updated — fixed old/new status values only;
- jts_admin_priority_action — fixed action key;
- jts_style_studio_opened — feature entry only.

Do not emit events for every keystroke, every scroll, private message content, or payment screenshots. Track once per meaningful action and prevent duplicate submission events.

Never send names, emails, phone numbers, Firebase UIDs, appointment/booking IDs or references, free-text notes, messages, media URLs, exact appointment dates/times, payment details, IP addresses, or raw exception text as analytics properties. Do not include user-entered values in event names or properties. Analytics must be best-effort and must never block booking, auth, upload, messaging or admin actions.

If Vercel custom events are unavailable on the current plan, keep page/performance analytics and derive business metrics from authorized records. Do not make a plan upgrade a prerequisite for reliable business reporting. Do not create a client-writable public Firestore analytics collection as a workaround.

## 5. Secure request sequence / community proof

The proposed #014 is a customer-facing sequence, not a vanity counter.

Before implementing:
1. Decide whether the sequence counts distinct customer identities or first submitted requests. Label it exactly.
2. Use a server-authoritative, atomic transaction (or equivalent trusted allocator) so concurrent submissions cannot receive the same number.
3. Enforce one permanent sequence per customer identity; retries and repeat bookings must not allocate another "new customer" number.
4. Never derive the next number in browser code or expose a writable/readable global counter.
5. Ensure a failed booking write does not consume a number; ensure retries are idempotent.
6. Define how guest-to-Google account linking preserves the same identity and sequence.
7. Keep the public API response limited to the current customer's own sequence and non-sensitive aggregate totals.
8. Test concurrent requests, duplicate submits, offline-to-online sync, guest linking, unauthorized reads/writes and deleted/cancelled requests.

Until all checks pass, do not show a sequence number or public customer count. Use no placeholder number in production.

## 6. Data protection and access boundaries

Apply Botswana's Data Protection Act 2024 and current official guidance. This document is an engineering specification, not legal advice or a compliance certification.

- Document each purpose and lawful basis before collecting or sharing personal data.
- Keep public metrics aggregated and minimize re-identification risk; suppress small cohorts rather than publishing precise counts that reveal one person.
- Keep customer data private to the customer and authorized staff under existing Firebase rules.
- Do not weaken Firestore or Storage rules for analytics.
- Avoid creating a second copy of names, phone numbers, messages or payment evidence for reporting.
- Set and document retention/deletion rules for any new event data before collecting it.
- Review Vercel/Firebase/UploadThing processor terms, data locations, international transfers and privacy notices before production use.
- Separate essential service processing from optional marketing/analytics consent where applicable.
- Provide a clear privacy notice and a route for access/correction/deletion requests.

## 7. Definitions for admin reporting

Use these definitions consistently:
- Request: one successfully persisted appointment request.
- Distinct customer: one stable Firebase customer identity with at least one valid request; guest identities that later link to Google must be deduplicated by UID.
- Confirmed appointment: a request explicitly confirmed by authorized staff under the real appointment workflow.
- Completed appointment: a record explicitly marked completed after service delivery.
- Cancelled appointment: a record explicitly marked cancelled.
- Deposit proof submitted: customer evidence exists in the private thread; this does not mean money was received.
- Deposit verified: authorized staff explicitly checked the Orange Money account and recorded receipt.
- Revenue: do not calculate from requested/confirmed service price alone. Report completed service value and actual recorded collections separately; reconcile with business records before calling a figure revenue.
- Returning customer: a distinct customer with more than one completed appointment, not merely more than one request.

Legacy food-order statuses (New, Accepted, Collected, Delivered, etc.) must be mapped deliberately and validated against actual JTS usage before they feed appointment KPIs. Do not assume every old status means a JTS appointment state.

## 8. Delivery sequence and release gates

1. Audit and normalize definitions: inspect actual Firestore documents and rules; map fields/statuses; identify missing payment/completion evidence. No schema changes until impact is understood.
2. Baseline instrumentation: retain existing Vercel Analytics and Speed Insights; add only safe, coarse events to the public booking funnel. Verify no PII in event names/properties.
3. Admin operations view: build a compact mobile-first daily action queue and period summaries from authorized records; include date filters and explicit definitions.
4. Customer view: add own request sequence and progress only after secure allocation and owner-scoped reads are proven.
5. Public proof: publish only aggregate completed-customer/appointment milestones after privacy threshold, source validation and owner approval.
6. Review: reconcile a sample of dashboard metrics against Firestore/admin records; test customer/staff/public access boundaries and narrow mobile layout; run identity verification, TypeScript, lint and production build; inspect exact diff and Vercel deployment SHA.

Do not start by adding charts. First make the data trustworthy, then turn it into a small number of useful decisions.

## 9. Current known implementation facts

- The app already includes @vercel/analytics and @vercel/speed-insights in the root layout.
- Customer account code already emits coarse account-view and Google-connection events.
- Admin code already imports Vercel's track API.
- Appointment documents are still stored in the legacy orders collection and use transitional FoodOrder / createFoodOrder naming.
- Existing admin status and payment updates are authorized through Firestore rules; customer reads are UID-scoped.
- Existing private conversations contain customer messages and possible deposit evidence. They must never be copied into analytics.
- The current owner-provided Vercel snapshot reported 54 visitors and 362 page views over seven days, but no custom events. Do not claim a measured booking conversion rate from that snapshot.


## 10. Staged implementation checkpoint — 2026-11-03

- Admin now has a rolling 30-day operations overview sourced from the authorized live `orders` and private conversation subscriptions: new requests, confirmed/in-service, completed and cancelled counts; unread customer messages; deposit proofs awaiting manual review; and confirmed appointments today (Africa/Gaborone).
- Service demand is ranked from requested service line items and shown as request volume plus requested value. This is demand, not completed sales.
- Financial reconciliation is separate from Vercel web analytics. The admin shows non-cancelled requested service value, the 50% deposit benchmark, and staff-recorded deposit/balance collections. Appointment records store explicit `reconciliation.depositReceived`, `reconciliation.balanceReceived` and `reconciliation.updatedAt` values when staff use the new controls.
- Collection controls are manual, authorized-admin actions. Staff must check the Orange Money account before recording receipt. The interface does not infer receipt from a screenshot, a booking request, a status change or page analytics. These values are an operating ledger and must be checked against actual Orange Money/cash records; they are not independently verified bank data or audited revenue.
- Existing Vercel Analytics and Speed Insights remain the web usage/performance layer. Privacy-safe Vercel events are now emitted for booking start, coarse service category selection, booking step completion, successful online booking write, fixed-category submission failure, admin status change and recorded collection. No customer identifiers, booking references, contact details, free text or payment values are sent as event properties.
- Firebase Analytics has not been added as a second analytics vendor. Firestore remains the authorized operational source for appointments, customer identity, conversations and staff-entered reconciliation; this avoids duplicating private customer records into a separate analytics stream.
- The customer-facing "you are customer/request number X" feature remains intentionally deferred. It requires a trusted atomic server allocator, idempotency, guest-to-Google identity continuity and owner-scoped reads. Do not approximate it with Vercel visitor counts, client-side increments or a public Firestore counter. The booking confirmation continues to show its private booking reference only.
- Before treating the dashboard as financially complete, audit the existing Firestore order records and legacy payment fields, reconcile a sample against actual payment records, decide how refunds/partial payments/cancelled bookings are represented, and add explicit date-range selection if the owner needs periods beyond the current rolling 30 days.
