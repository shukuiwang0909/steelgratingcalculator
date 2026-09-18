// IndexNow submission — pushes every URL in dist/sitemap-0.xml to Bing/Yandex.
// The key file (public/02cda008af5df8b0e19b9d4e4dbee773.txt) must be reachable at
// https://meshcalculator.com/02cda008af5df8b0e19b9d4e4dbee773.txt — it already is.
//
// Usage: npm run build && node scripts/indexnow-submit.js

import { readFileSync } from "node:fs";

const HOST = "meshcalculator.com";
const KEY = "02cda008af5df8b0e19b9d4e4dbee773";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP = new URL("../dist/sitemap-0.xml", import.meta.url);

const xml = readFileSync(SITEMAP, "utf-8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (urls.length === 0) {
  console.error("No URLs found in dist/sitemap-0.xml — run npm run build first.");
  process.exit(1);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
});

console.log(`IndexNow: ${urls.length} URLs submitted — HTTP ${res.status}`);
if (res.status >= 400) {
  console.error(await res.text());
  process.exit(1);
}
