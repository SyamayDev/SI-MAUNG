// Supabase Edge Function: parse-transaction
//
// Optional AI fallback for sentences SI-MAUNG's on-device parser cannot read.
// The model key lives ONLY here, as a function secret (OPENAI_API_KEY) — never
// in the browser bundle. The browser sends one sentence (≤ 300 chars) and gets
// back an unsaved draft that the user must review before anything is stored.
//
// Security: JWT verification (default for deployed functions) + an explicit
// getUser() check, CORS allow-list, payload size cap, per-user rate limit
// (best effort, per instance), 10 s upstream timeout, strict output schema.
// The sentence is not logged.
//
// Secrets:  OPENAI_API_KEY (required), OPENAI_MODEL (optional, default gpt-4o-mini),
//           ALLOWED_ORIGINS (optional, comma separated)
// Deploy:   supabase functions deploy parse-transaction
//           supabase secrets set OPENAI_API_KEY=...   (never commit the value)
import { createClient } from "jsr:@supabase/supabase-js@2";

const CATEGORIES = ["food", "transportation", "shopping", "bills", "entertainment", "health", "education", "family", "salary", "gift", "other"];
const ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://syamaydev.github.io,http://localhost:5173,http://localhost:4173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const MAX_TEXT = 300;
const RATE = { windowMs: 60_000, max: 20 };
const hits = new Map<string, number[]>();

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function rateLimited(userId: string) {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < RATE.windowMs);
  recent.push(now);
  hits.set(userId, recent);
  return recent.length > RATE.max;
}

/** Strict validation of the model's answer — it is untrusted input. */
function toDraft(raw: unknown, today: string) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.is_transaction !== true) return null;
  const type = r.type === "income" || r.type === "expense" ? r.type : null;
  const amount = typeof r.amount === "number" && Number.isFinite(r.amount) && r.amount > 0 && r.amount <= 1e12 ? Math.round(r.amount) : null;
  if (!type && !amount) return null;
  const category = typeof r.category === "string" && CATEGORIES.includes(r.category) ? r.category : "other";
  const description = typeof r.description === "string" ? r.description.replace(/\s+/g, " ").trim().slice(0, 120) : "";
  const date = typeof r.transaction_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.transaction_date) && r.transaction_date <= today ? r.transaction_date : today;
  return { type, amount, category, description, transaction_date: date };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) return json({ error: "unauthorized" }, 401, cors);
  if (rateLimited(auth.user.id)) return json({ error: "rate_limited" }, 429, cors);

  if (Number(req.headers.get("content-length") ?? 0) > 2048) return json({ error: "payload_too_large" }, 413, cors);
  let body: { text?: unknown; today?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400, cors);
  }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : "";
  if (!text) return json({ error: "empty_text" }, 400, cors);
  const today = typeof body.today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : new Date().toISOString().slice(0, 10);

  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return json({ error: "not_configured" }, 503, cors);

  const system =
    "Kamu mengekstrak SATU transaksi keuangan dari kalimat Bahasa Indonesia. " +
    'Balas hanya JSON: {"is_transaction": boolean, "type": "income"|"expense"|null, "amount": number|null, ' +
    `"category": salah satu dari ${CATEGORIES.join(", ")}, "description": string maksimal 60 karakter, "transaction_date": "YYYY-MM-DD"|null}. ` +
    `Hari ini ${today}. Nominal dalam rupiah bulat. Jika nominal atau jenis tidak disebut, isi null — jangan menebak. ` +
    "Jika kalimat bukan transaksi, is_transaction = false.";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
    });
    if (res.status === 429) return json({ error: "upstream_rate_limited" }, 429, cors);
    if (!res.ok) return json({ error: "upstream_error" }, 502, cors);
    const payload = await res.json();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(payload?.choices?.[0]?.message?.content ?? "null");
    } catch {
      return json({ error: "invalid_model_output" }, 502, cors);
    }
    return json({ draft: toDraft(parsed, today) }, 200, cors);
  } catch (e) {
    const timedOut = e instanceof DOMException && e.name === "AbortError";
    return json({ error: timedOut ? "timeout" : "upstream_unreachable" }, timedOut ? 504 : 502, cors);
  } finally {
    clearTimeout(timer);
  }
});
