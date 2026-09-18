/**
 * MeshCalculator /go/ click-tracking redirect — Cloudflare Worker.
 *
 * Why this exists (ISSUE #8):
 *   Every outbound factory link goes through /go/<key> so clicks are
 *   counted centrally before the 302. This is the billing basis for the
 *   factory directory (ISSUE #10): Listed factories get tracked links,
 *   Verified factories keep full contact display.
 *
 * Usage from the site:
 *   <a href="https://meshcalculator.com/go/anping-example/"> ...
 *   or on a custom subdomain: https://go.meshcalculator.com/?to=anping-example
 *
 * Security: only keys present in ALLOWLIST redirect. Anything else 404s.
 *   Never pass raw user-supplied URLs through this worker.
 */

/** key -> factory website. Keys must match factories.json slugs (issue #10). */
const ALLOWLIST = {
  "zhongtai-expanded-metal": "https://www.zxwiremesh.com/",
  "yize-metal": "http://www.yizegongsi.com/",
  "zhonghao-noise-barriers": "http://www.zhshengpingzhang.com/",
  "jialu-traffic-tech": "http://www.jialukeji.com.cn/",
  "ofolan-metal-mesh": "http://www.ofolan.com/",
};

/** UTM appended to every outbound jump so factories see where buyers came from. */
const UTM = {
  utm_source: "meshcalculator.com",
  utm_medium: "factory_click",
  utm_campaign: "directory",
};

/**
 * Optional server-side GA4 event (factory_click, issue #13 companion).
 * GA4 Measurement Protocol requires an API secret:
 *   GA4 → Admin → Data Streams → your stream → Measurement Protocol → create secret.
 * Then set secrets via: wrangler secret put GA4_API_SECRET / GA4_MEASUREMENT_ID
 * Leave unset to run without analytics (redirects still work).
 */
async function trackClick(env, key, request) {
  if (!env.GA4_API_SECRET || !env.GA4_MEASUREMENT_ID) return;
  const payload = {
    client_id: "go-redirect",
    events: [
      {
        name: "factory_click",
        params: {
          factory_key: key,
          page_location: request.headers.get("referer") || "direct",
        },
      },
    ],
  };
  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${env.GA4_MEASUREMENT_ID}&api_secret=${env.GA4_API_SECRET}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Support both /go/<key> and /go/?to=<key>
    let key = url.searchParams.get("to");
    if (!key) {
      const m = url.pathname.match(/^\/go\/([a-z0-9-]+)\/?$/i);
      if (m) key = m[1];
    }
    if (!key) return new Response("Not found", { status: 404 });

    const target = ALLOWLIST[key];
    if (!target) return new Response("Not found", { status: 404 });

    const dest = new URL(target);
    for (const [k, v] of Object.entries(UTM)) {
      if (!dest.searchParams.has(k)) dest.searchParams.set(k, v);
    }

    ctx.waitUntil(trackClick(env, key, request).catch(() => {}));

    return new Response(null, {
      status: 302,
      headers: {
        Location: dest.toString(),
        // Keep referer for the factory's own analytics, don't index redirect pages
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Robots-Tag": "noindex",
        "Cache-Control": "no-store",
      },
    });
  },
};
