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
import { getSupabase } from "../lib/supabase";
import { CATEGORY_VALUES } from "../lib/finance/categories";
import { parseLocalISODate, toLocalISODate } from "../lib/finance/dates";
import { reconcileAIAmount } from "../lib/finance/indonesianMoneyParser";

export const isAIParserEnabled = import.meta.env.VITE_ENABLE_AI_PARSER === "true";

const TIMEOUT_MS = 12000;
const MAX_INPUT = 300;

/**
 * The model's answer is untrusted. Its amount is NEVER used on its own: the
 * deterministic Indonesian money parser re-reads the same sentence and wins
 * whenever it is sure (see reconcileAIAmount).
 */
function sanitizeDraft(raw, text) {
  if (!raw || typeof raw !== "object") return null;
  const type = raw.type === "income" || raw.type === "expense" ? raw.type : null;
  const today = toLocalISODate();
  const date = parseLocalISODate(raw.transaction_date) && raw.transaction_date <= today ? raw.transaction_date : today;
  const checked = reconcileAIAmount(text, raw.amount);
  return {
    draft: {
      type: type || "expense",
      amount: checked.amount,
      category: CATEGORY_VALUES.includes(raw.category) ? raw.category : "other",
      description: String(raw.description || text).replace(/\s+/g, " ").trim().slice(0, 120),
      transaction_date: date,
      notes: "",
    },
    typeKnown: Boolean(type),
    choices: checked.choices,
    note: checked.note,
  };
}

/**
 * @returns {Promise<{ ok: true, draft, choices: number[], note: string } | { ok: false, reason: string }>}
 */
export async function parseWithAI(text) {
  if (!isAIParserEnabled) return { ok: false, reason: "disabled" };
  const supabase = await getSupabase().catch(() => null);
  if (!supabase) return { ok: false, reason: "unavailable" };
  const input = String(text || "").trim().slice(0, MAX_INPUT);
  if (!input) return { ok: false, reason: "empty" };

  const timeout = new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), TIMEOUT_MS));
  const call = supabase.functions.invoke("parse-transaction", { body: { text: input, today: toLocalISODate() } });
  const result = await Promise.race([call, timeout]);

  if (result?.timedOut) return { ok: false, reason: "timeout" };
  if (result?.error) return { ok: false, reason: "unavailable" };
  const parsed = sanitizeDraft(result?.data?.draft, input);
  if (!parsed || (!parsed.draft.amount && !parsed.choices.length && !parsed.typeKnown)) return { ok: false, reason: "not-a-transaction" };
  return { ok: true, draft: parsed.draft, choices: parsed.choices, note: parsed.note };
}
