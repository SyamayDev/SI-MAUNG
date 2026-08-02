import { guessCategoryFromText } from "../utils/categoryUtils.jsx";
import { transactionCategories } from "../lib/constants.js";
import { parseDateLike } from "../utils/dateUtils";

async function parseWithOpenAI(text) {
  const key = import.meta.env.VITE_OPENAI_KEY;
  if (!key) return null;

  try {
    const categoryList = transactionCategories.map((c) => c.value).join(", ");
    const system = `You are a JSON formatter. Parse a natural language sentence describing a money transaction into valid JSON with fields: intent (create_transaction or create_savings_goal), type (income or expense), amount (number, in IDR), description (string), category (one of: ${categoryList} or other), transaction_date (YYYY-MM-DD), notes (string). Return only valid JSON.`;

    const messages = [
      { role: "system", content: system },
      { role: "user", content: `Parse this: "${text.replace(/"/g, '\\"')}"` },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 300,
      }),
    });

    if (!res.ok) return null;
    const payload = await res.json();
    const reply = payload?.choices?.[0]?.message?.content || "";

    const jsonStart = reply.indexOf("{");
    const jsonText = jsonStart >= 0 ? reply.slice(jsonStart) : reply;
    try {
      const parsed = JSON.parse(jsonText);
      return {
        intent: parsed.intent || "create_transaction",
        type: parsed.type || "expense",
        amount: Number(parsed.amount || 0),
        description: parsed.description || text,
        category: parsed.category || "other",
        transaction_date: parsed.transaction_date || new Date().toISOString().slice(0, 10),
        notes: parsed.notes || "parsed",
        confidence: parsed.confidence || 0.95,
      };
    } catch (e) {
      return null;
    }
  } catch (e) {
    return null;
  }
}

function parseReadableAmount(lowerText) {
  const amountMatch = lowerText.match(/(\d+[\d.,]*)\s*(juta|jt|j|m|ribu|rb|k)?/i);
  if (!amountMatch) return null;

  let rawNumber = amountMatch[1].replace(/[.,\s]/g, "");
  let value = Number(rawNumber);
  const suffix = amountMatch[2]?.toLowerCase();

  if (suffix) {
    if (["ribu", "rb", "k"].includes(suffix)) {
      value *= 1000;
    }
    if (["juta", "jt", "j", "m"].includes(suffix)) {
      value *= 1000000;
    }
  }

  return Number.isFinite(value) ? value : null;
}

export async function parseTransactionFromText(text) {
  if (!text) return null;

  const openAIResult = await parseWithOpenAI(text);
  if (openAIResult && openAIResult.confidence > 0.4) return openAIResult;

  const lower = text.toLowerCase();
  const amount = parseReadableAmount(lower);
  const category = guessCategoryFromText(lower);
  const date = parseDateLike(text) || parseDateLike(lower);

  const savingsKeywords = ["tabung", "menabung", "tabungan", "goal", "target", "simpan", "investasi"];
  const incomeKeywords = ["gaji", "salary", "income", "diterima", "menerima", "diberi", "masuk", "pendapatan"];
  const expenseKeywords = ["beli", "bayar", "keluar", "habis", "belanja", "pengeluaran"];

  const isSavingsGoal = savingsKeywords.some((keyword) => lower.includes(keyword));
  const isIncome = incomeKeywords.some((keyword) => lower.includes(keyword));
  const isExpense = expenseKeywords.some((keyword) => lower.includes(keyword)) || (!isIncome && !!amount);

  if (!amount && !isSavingsGoal) {
    return {
      intent: "unknown",
      type: isIncome ? "income" : "expense",
      amount: 0,
      description: text.trim(),
      category,
      transaction_date: date || new Date().toISOString().slice(0, 10),
      notes: "Parsing belum cukup jelas",
      confidence: 0.45,
    };
  }

  return {
    intent: isSavingsGoal ? "create_savings_goal" : "create_transaction",
    type: isIncome ? "income" : "expense",
    amount: amount || 0,
    description: text.trim(),
    category,
    transaction_date: date || new Date().toISOString().slice(0, 10),
    notes: isSavingsGoal ? "savings goal parsed" : "parsed locally",
    confidence: amount ? 0.92 : 0.65,
  };
}

export default { parseTransactionFromText };