"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/client";

type Contact = { id: number; name: string; phone: string };

export default function CustomerInvite() {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([{ id: 1, name: "", phone: "" }]);
  const [nextId, setNextId] = useState(2);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function update(id: number, field: "name" | "phone", value: string) {
    setContacts(current => current.map(contact => contact.id === id ? { ...contact, [field]: value } : contact));
    setError("");
    setNotice("");
  }

  async function share(contact: Contact) {
    const digits = contact.phone.replace(/\D/g, "");
    const number = digits.startsWith("267") ? digits : digits.startsWith("0") ? "267" + digits.slice(1) : digits.length === 8 ? "267" + digits : digits;
    if (!/^\d{8,15}$/.test(number)) { setError("Enter a valid Botswana or international WhatsApp number."); return; }
    const popup = window.open("about:blank", "_blank");
    if (!popup) { setError("Allow pop-ups to prepare the WhatsApp invitation."); return; }
    setBusy(contact.id); setError(""); setNotice("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Your admin session has expired. Sign in again.");
      const response = await fetch("/api/customer-invites", {
        method: "POST",
        headers: { Authorization: "Bearer " + await user.getIdToken(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: contact.name.trim(), phone: number })
      });
      const result = await response.json() as { inviteUrl?: string; matchedRequests?: number; error?: string };
      if (!response.ok || !result.inviteUrl) throw new Error(result.error || "The secure customer invitation could not be created.");
      const greeting = contact.name.trim() ? "Hi " + contact.name.trim() + "," : "Hello,";
      const message = greeting + " your Bold Dimensions customer account is ready. Open your personal account link to review your existing service requests, follow progress and place new service orders: " + result.inviteUrl + "\n\nIf WhatsApp opens the link inside its browser, tap ⋮ and choose Open in Chrome. This secure invitation can be used once and expires in 7 days.";
      popup.location.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
      setNotice("Secure account invitation prepared for " + (contact.name.trim() || number) + ". " + (result.matchedRequests || 0) + " existing request(s) matched. Review and send the WhatsApp message.");
    } catch (cause) {
      popup.close();
      setError(cause instanceof Error ? cause.message : "The invitation could not be prepared.");
    } finally { setBusy(null); }
  }

  return (
    <section className="bdCustomerInvite">
      <div className="bdCustomerInviteHead">
        <div><span className="bdEyebrow">CUSTOMER ONBOARDING</span><strong>Invite customers to their account</strong><small>Create a secure personal link and share it directly on WhatsApp.</small></div>
        <button type="button" className="bdPrimary" onClick={() => { setOpen(value => !value); setError(""); setNotice(""); }}>{open ? "Close" : "Share with customer ↗"}</button>
      </div>
      {open && <div className="bdCustomerInviteBody">
        <div className="bdCustomerInviteIntro"><span>Personal customer account</span><small>The one-time link connects requests already recorded under the customer's WhatsApp number to the account opened from that invitation.</small></div>
        {contacts.map((contact, index) => <div className="bdInviteContact" key={contact.id}>
          <span className="bdInviteIndex">{String(index + 1).padStart(2, "0")}</span>
          <label><span>Name</span><input value={contact.name} onChange={event => update(contact.id, "name", event.target.value)} placeholder="Customer name" /></label>
          <label><span>WhatsApp number</span><input type="tel" inputMode="tel" autoComplete="tel" value={contact.phone} onChange={event => update(contact.id, "phone", event.target.value)} placeholder="+267…" /></label>
          <button type="button" className="bdSecondary" onClick={() => void share(contact)} disabled={!contact.phone.trim() || busy!==null}>{busy===contact.id?"Preparing…":"Invite on WhatsApp ↗"}</button>
          {contacts.length > 1 && <button type="button" className="bdInviteRemove" aria-label="Remove contact" onClick={() => setContacts(current => current.filter(item => item.id !== contact.id))}>×</button>}
        </div>)}
        <div className="bdInviteFooter"><button type="button" className="bdInviteAdd" onClick={() => { setContacts(current => [...current, { id: nextId, name: "", phone: "" }]); setNextId(value => value + 1); }}>+ Add another contact</button><small>Each invitation is single-use and expires after 7 days. The customer opens their account in Chrome and can link Google to keep access across devices.</small></div>
        {error && <p className="bdFormError" role="alert">{error}</p>}
        {notice && <p className="bdAdminNotice" role="status">{notice}</p>}
      </div>}
    </section>
  );
}
