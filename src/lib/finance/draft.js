import { toLocalISODate } from "./dates.js";

/** A blank transaction for manual entry (today, local time). */
export const emptyDraft = (type = "expense") => ({
  type,
  amount: null,
  category: "other",
  description: "",
  transaction_date: toLocalISODate(),
  notes: "",
});
