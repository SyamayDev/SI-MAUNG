import { useCallback, useState } from "react";
import { parseTransactionFromText } from "../services/aiService";

export const useAIChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseTransaction = useCallback(async (text) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseTransactionFromText(text);
      if (!parsed) {
        return { intent: "unknown", confidence: 0 };
      }
      return parsed;
    } catch (e) {
      setError(e.message);
      return { intent: "unknown", confidence: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  return { parseTransaction, loading, error };
};
