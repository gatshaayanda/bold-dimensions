import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [
  "src/app/layout.tsx",
  "src/app/jts-browser-gate.tsx",
  "src/app/manifest.ts",
  "src/config/brand.ts",
  "src/app/pwa-register.tsx",
  "public/sw-jts.js",
  "public/jts-logo.svg",
  "README.md"
];
const failures = [];
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const brand = read("src/config/brand.ts");
const worker = read("public/sw-jts.js");
const layout = read("src/app/layout.tsx");
const manifest = read("src/app/manifest.ts");
const register = read("src/app/pwa-register.tsx");
const gate = read("src/app/jts-browser-gate.tsx");

const cacheVersion = brand.match(/serviceWorkerCache:\s*"([^"]+)"/)?.[1];
if (!cacheVersion || !worker.includes('const CACHE_VERSION="' + cacheVersion + '"')) {
  failures.push("Service-worker cache version must match brand.serviceWorkerCache.");
}
for (const [label, condition] of [
  ["Bold Dimensions brand name", brand.includes('name: "Bold Dimensions"')],
  ["official logo path", brand.includes('logo: "/brand/bold-dimensions-logo.jpg"')],
  ["standalone manifest", manifest.includes('display: "standalone"')],
  ["192px and 512px icons", manifest.includes("brand.icon192") && manifest.includes("brand.icon512")],
  ["server-first embedded-browser gate", layout.includes("const requestHeaders=await headers()") && layout.includes("initialContext")],
  ["preserved install prompt capture", layout.includes("beforeinstallprompt") && register.includes("promptEvent.prompt()")],
  ["preserved service-worker registration", register.includes('register("/sw-jts.js"')],
  ["truthful iOS installation guidance", register.includes("Share") && register.includes("Add to Home Screen")],
  ["Bold Dimensions browser handoff", gate.includes("Bold Dimensions")],
  ["new Firebase project in service worker", worker.includes('projectId:"the-wall-ab746"')],
  ["new cache namespace", cacheVersion?.startsWith("bold-dimensions-shell-")],
  ["generated icons use supplied logo", read("scripts/generate-pwa-icons.mjs").includes("public/brand/bold-dimensions-logo.jpg")]
]) if (!condition) failures.push("Missing or invalid: " + label);

for (const file of files) {
  const content = read(file);
  if (/stylist-36204|john-the-stylist-bw\.vercel\.app|namane-tyres\.vercel\.app/i.test(content)) {
    failures.push(file + " still contains an inherited Firebase or site identity.");
  }
}
for (const file of ["public/icon-192.png", "public/icon-512.png"]) {
  if (!fs.existsSync(path.join(root, file))) failures.push("Missing generated PWA icon: " + file);
}

if (failures.length) {
  console.error("Bold Dimensions identity verification FAILED");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}
console.log("Bold Dimensions identity and PWA checks passed.");
