"use client";

import { useState } from "react";

type Contact = { id: number; name: string; phone: string };

function whatsappNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("267")
    ? digits
    : digits.startsWith("0")
      ? "267" + digits.slice(1)
      : digits.length === 8
        ? "267" + digits
        : digits;
}

export default function CustomerInvite() {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([{ id: 1, name: "", phone: "" }]);
  const [nextId, setNextId] = useState(2);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function update(id: number, field: "name" | "phone", value: string) {
    setContacts(current => current.map(contact => contact.id === id ? { ...contact, [field]: value } : contact));
    setError("");
    setNotice("");
  }

  function share(contact: Contact) {
    const number = whatsappNumber(contact.phone);
    if (!/^\d{8,15}$/.test(number)) {
      setError("Enter a valid Botswana or international WhatsApp number.");
      setNotice("");
      return;
    }
    const accountUrl = window.location.origin + "/account";
    const greeting = contact.name.trim() ? "Hi " + contact.name.trim() + "," : "Hello,";
    const message = greeting + " welcome to Bold Dimensions. Open your customer account here to review your service requests, follow updates and place another order whenever convenient: " + accountUrl + "\n\nFor the best experience, open the link in Google Chrome.";
    window.open("https://wa.me/" + number + "?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
    setError("");
    setNotice("WhatsApp opened for " + (contact.name.trim() || number) + ". Review the message and press Send.");
  }

  return (
    <section className="bdCustomerInvite">
      <div className="bdCustomerInviteHead">
        <div><span className="bdEyebrow">CUSTOMER ONBOARDING</span><strong>Share the customer account</strong><small>Send the account link straight to a customer on WhatsApp.</small></div>
        <button type="button" className="bdPrimary" onClick={() => { setOpen(value => !value); setError(""); setNotice(""); }}>{open ? "Close" : "Share with customer ↗"}</button>
      </div>
      {open && <div className="bdCustomerInviteBody">
        <div className="bdCustomerInviteIntro"><span>Customer account</span><a href="/account" target="_blank" rel="noreferrer">/account ↗</a><small>Customers can review requests, follow progress and place new service orders. Ask them to open the link in Google Chrome.</small></div>
        {contacts.map((contact, index) => <div className="bdInviteContact" key={contact.id}>
          <span className="bdInviteIndex">0{index + 1}</span>
          <label><span>Name <i>optional</i></span><input value={contact.name} onChange={event => update(contact.id, "name", event.target.value)} placeholder="Customer name" /></label>
          <label><span>WhatsApp number</span><input type="tel" inputMode="tel" autoComplete="tel" value={contact.phone} onChange={event => update(contact.id, "phone", event.target.value)} placeholder="+267…" /></label>
          <button type="button" className="bdSecondary" onClick={() => share(contact)} disabled={!contact.phone.trim()}>WhatsApp ↗</button>
          {contacts.length > 1 && <button type="button" className="bdInviteRemove" aria-label="Remove contact" onClick={() => setContacts(current => current.filter(item => item.id !== contact.id))}>×</button>}
        </div>)}
        <div className="bdInviteFooter"><button type="button" className="bdInviteAdd" onClick={() => { setContacts(current => [...current, { id: nextId, name: "", phone: "" }]); setNextId(value => value + 1); }}>+ Add another contact</button><small>Each WhatsApp message opens separately. You review and send it; nothing is sent automatically.</small></div>
        {error && <p className="bdFormError" role="alert">{error}</p>}
        {notice && <p className="bdAdminNotice" role="status">{notice}</p>}
      </div>}
    </section>
  );
}
