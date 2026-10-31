export type PublicServiceMedia = { url: string; type: "image" | "video"; alt?: string };

export type PublicService = {
  id: string; name: string; price: number; maxPrice?: number; display: string;
  detail: string; note: string; tag: string; media?: PublicServiceMedia[];
};

export const DEFAULT_PUBLIC_SERVICES: PublicService[] = [
  { id: "kids-cut", name: "Kids Cut", price: 100, display: "P100", detail: "Children’s haircut", note: "A neat, comfortable cut for kids.", tag: "HAIRCUTS" },
  { id: "fade", name: "Fade", price: 100, display: "P100", detail: "Fade haircut", note: "A clean fade shaped to your look.", tag: "HAIRCUTS" },
  { id: "fade-tint", name: "Fade + Tint", price: 200, display: "P200", detail: "Fade with tint", note: "A fresh fade finished with colour.", tag: "HAIRCUTS" },
  { id: "ladies-cut-only", name: "Ladies Cut Only", price: 120, display: "P120", detail: "Ladies haircut", note: "A tailored cut and finish.", tag: "HAIRCUTS" },
  { id: "ladies-cut-tint", name: "Ladies Cut + Tint", price: 200, display: "P200", detail: "Ladies cut with tint", note: "A tailored cut paired with tint.", tag: "HAIRCUTS" },
  { id: "ladies-cut-enecto-tint", name: "Ladies Cut + Enecto Tint", price: 200, display: "P200", detail: "Ladies cut with Enecto tint", note: "A tailored cut finished with Enecto tint.", tag: "HAIRCUTS" },
  { id: "blonde", name: "Blonde", price: 250, display: "P250", detail: "Blonde bleach service", note: "A blonde colour transformation.", tag: "BLEACH SERVICES" },
  { id: "pure-white-cut", name: "Pure White + Cut", price: 300, display: "P300", detail: "Pure white bleach with cut", note: "A pure white finish paired with a cut.", tag: "BLEACH SERVICES" },
  { id: "grey", name: "Grey", price: 350, display: "P350", detail: "Grey colour service", note: "A bold grey colour finish.", tag: "BLEACH SERVICES" },
  { id: "cut-s-curl", name: "Cut + S Curl", price: 200, display: "P200", detail: "Cut with S Curl", note: "A fresh cut with an S Curl finish.", tag: "S CURLS & CURL STYLES" },
  { id: "cut-s-curl-tint", name: "Cut + S Curl + Tint", price: 280, display: "P280", detail: "Cut, S Curl and tint", note: "An S Curl style finished with tint.", tag: "S CURLS & CURL STYLES" },
  { id: "cut-finger-coils", name: "Cut + Finger Coils", price: 300, display: "P300", detail: "Cut with finger coils", note: "A shaped cut finished with finger coils.", tag: "S CURLS & CURL STYLES" },
  { id: "cut-ice-curls", name: "Cut + Ice Curls", price: 250, display: "P250", detail: "Cut with Ice Curls", note: "A fresh cut finished with Ice Curls.", tag: "S CURLS & CURL STYLES" },
  { id: "bob-pixie-without-tint", name: "Bob/Pixie Cut (Without Tint)", price: 350, display: "P350", detail: "Bob or pixie cut without tint", note: "A shaped bob or pixie cut, without colour.", tag: "BOBS & PIXIE CUTS" },
  { id: "bob-pixie-with-tint", name: "Bob/Pixie Cut (With Tint)", price: 400, display: "P400", detail: "Bob or pixie cut with tint", note: "A shaped bob or pixie cut finished with tint.", tag: "BOBS & PIXIE CUTS" },
  { id: "pixie-cut-colors", name: "Pixie Cut with Colors", price: 450, display: "P450", detail: "Pixie cut with colours", note: "A statement pixie cut finished with colour.", tag: "BOBS & PIXIE CUTS" },
  { id: "pixie-cut-queen-cazard-relaxer", name: "Pixie Cut with Queen Cazard Hair Relaxer", price: 450, display: "P450", detail: "Pixie cut with Queen Cazard Hair Relaxer", note: "A pixie cut finished with Queen Cazard Hair Relaxer.", tag: "BOBS & PIXIE CUTS" },
];

export function normalizePublicServices(value: unknown): PublicService[] {
  if (!Array.isArray(value)) return DEFAULT_PUBLIC_SERVICES;
  return value.filter((item): item is PublicService => !!item && typeof item === "object"
    && typeof (item as PublicService).id === "string"
    && typeof (item as PublicService).name === "string"
    && typeof (item as PublicService).price === "number"
    && typeof (item as PublicService).display === "string"
    && typeof (item as PublicService).note === "string"
    && typeof (item as PublicService).tag === "string"
    && typeof (item as PublicService).detail === "string");
}


export const PUBLIC_SERVICE_CATEGORIES = [
  "HAIRCUTS",
  "BLEACH SERVICES",
  "S CURLS & CURL STYLES",
  "BOBS & PIXIE CUTS",
] as const;

export function mergePublicServices(value: unknown): PublicService[] {
  const saved = normalizePublicServices(value);
  const byId = new Map(saved.map(service => [service.id, service]));
  const canonical = DEFAULT_PUBLIC_SERVICES.map(base => ({
    ...base,
    ...(byId.get(base.id) || {}),
    media: byId.get(base.id)?.media || base.media || [],
  }));
  const extras = saved.filter(service =>
    !DEFAULT_PUBLIC_SERVICES.some(base => base.id === service.id)
    && PUBLIC_SERVICE_CATEGORIES.includes(service.tag as typeof PUBLIC_SERVICE_CATEGORIES[number])
  );
  return [...canonical, ...extras];
}
