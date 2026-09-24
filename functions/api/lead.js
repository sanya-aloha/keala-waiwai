/**
 * Keala Waiwai lead intake (Cloudflare Pages Function)
 * Receives the site's contact form and upserts a contact into GHL.
 * The GHL token lives ONLY here, as a Cloudflare env secret (GHL_TOKEN).
 * Never expose it client-side.
 *
 * Route: POST /api/lead
 * Body (JSON or form-encoded): { name, email, phone }
 */

const GHL_BASE = "https://services.leadconnectorhq.com";
const LOCATION_ID = "fv75fGhbpyWdREppovnX";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const clean = (v) => (typeof v === "string" ? v.trim() : v);

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.GHL_TOKEN) {
    return json({ ok: false, error: "Server not configured." }, 500);
  }

  let body;
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = {};
      for (const [k, v] of form.entries()) body[k] = v;
    }
  } catch {
    return json({ ok: false, error: "Bad request." }, 400);
  }

  // Honeypot: silently accept bots without writing to GHL
  if (clean(body.company_website)) return json({ ok: true });

  const name = clean(body.name);
  const email = clean(body.email);
  const phone = clean(body.phone);

  if (!email && !phone) {
    return json({ ok: false, error: "Email or phone is required." }, 400);
  }

  const nameParts = (name || "").split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || undefined;
  const lastName = nameParts.slice(1).join(" ") || undefined;

  const payload = {
    locationId: LOCATION_ID,
    firstName,
    lastName,
    email: email || undefined,
    phone: phone || undefined,
    source: "keala-waiwai.pages.dev",
    tags: ["kw:source:website-form"],
  };

  const res = await fetch(`${GHL_BASE}/contacts/upsert`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GHL_TOKEN}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    return json({ ok: false, error: "Could not save your info. Please try again.", status: res.status, detail }, 502);
  }

  return json({ ok: true });
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return json({ ok: false, error: "Method not allowed." }, 405);
}
