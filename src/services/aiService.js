/**
 * Optional AI fallback for sentences the on-device parser cannot read.
 *
 * The model is called ONLY through the `parse-transaction` Supabase Edge
 * Function (supabase/functions/parse-transaction), which keeps the provider
 * key server-side and requires a signed-in user. No secret ever ships in the
 * browser bundle. Disabled unless VITE_ENABLE_AI_PARSER=true (a public flag,
 * not a secret). The function's answer is untrusted input: it is validated
 * exactly like a typed form before the user can save it.
 */
import { supabase } from "../lib/supabase";
import { CATEGORY_VALUES } from "../lib/finance/categories";
import { parseLocalISODate, toLocalISODate } from "../lib/finance/dates";

export const isAIParserEnabled = import.meta.env.VITE_ENABLE_AI_PARSER === "true";

const TIMEOUT_MS = 12000;
const MAX_INPUT = 300;

function sanitizeDraft(raw, text) {
  if (!raw || typeof raw !== "object") return null;
  const type = raw.type === "income" || raw.type === "expense" ? raw.type : null;
  const amount = Number(raw.amount);
  const today = toLocalISODate();
  const date = parseLocalISODate(raw.transaction_date) && raw.transaction_date <= today ? raw.transaction_date : today;
  return {
    type: type || "expense",
    amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null,
    category: CATEGORY_VALUES.includes(raw.category) ? raw.category : "other",
    description: String(raw.description || text).replace(/\s+/g, " ").trim().slice(0, 120),
    transaction_date: date,
    notes: "",
    typeKnown: Boolean(type),
  };
}

/**
 * @returns {Promise<{ ok: true, draft } | { ok: false, reason: string }>}
 */
export async function parseWithAI(text) {
  if (!isAIParserEnabled || !supabase) return { ok: false, reason: "disabled" };
  const input = String(text || "").trim().slice(0, MAX_INPUT);
  if (!input) return { ok: false, reason: "empty" };

  const timeout = new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), TIMEOUT_MS));
  const call = supabase.functions.invoke("parse-transaction", { body: { text: input, today: toLocalISODate() } });
  const result = await Promise.race([call, timeout]);

  if (result?.timedOut) return { ok: false, reason: "timeout" };
  if (result?.error) return { ok: false, reason: "unavailable" };
  const draft = sanitizeDraft(result?.data?.draft, input);
  if (!draft || (!draft.amount && !draft.typeKnown)) return { ok: false, reason: "not-a-transaction" };
  return { ok: true, draft };
}
