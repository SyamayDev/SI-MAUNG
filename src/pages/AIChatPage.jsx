import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Mic, Send, Square, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import TransactionEditor from "../components/transactions/TransactionEditor";
import Button from "../components/ui/Button";
import { useSpeechCapture } from "../hooks/useSpeechCapture";
import { parseTransactionText } from "../lib/finance/parseTransaction";
import { answerQuestion, SUPPORTED_QUESTIONS } from "../lib/finance/questions";
import { formatSigned } from "../lib/finance/format";
import { categoryLabel } from "../lib/finance/categories";
import { isAIParserEnabled, parseWithAI } from "../services/aiService";
import { asset } from "../lib/assets";
import { EXAMPLE_PHRASES } from "../lib/finance/examples";

const SUGGESTIONS = [EXAMPLE_PHRASES[3], SUPPORTED_QUESTIONS[1], SUPPORTED_QUESTIONS[3]];

/**
 * "Asisten MAUNG" — honest about what it does: it turns sentences into
 * transaction drafts (saved only after the user confirms) and answers a fixed
 * set of questions computed from the user's own records.
 */
export default function AIChatPage() {
  const { displayName } = useAuth();
  const { transactions, goals, addTransaction } = useFinance();
  const location = useLocation();
  const navigate = useNavigate();
  const nextId = useRef(1);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: 0,
      role: "assistant",
      kind: "text",
      text: `Halo${displayName ? ` ${displayName.split(" ")[0]}` : ""}! Aku bisa mencatat transaksi dari kalimat (“beli bensin 50 ribu”) dan menjawab pertanyaan ringkas tentang catatanmu (“berapa pengeluaran bulan ini?”). Pertanyaan umum di luar itu belum bisa kujawab.`,
    },
  ]);

  const push = useCallback((msg) => {
    const id = nextId.current++;
    setMessages((list) => [...list, { ...msg, id }]);
    return id;
  }, []);
  const patch = useCallback((id, changes) => setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...changes } : m))), []);

  const respond = useCallback(
    async (raw) => {
      const input = raw.trim();
      if (!input) return;
      push({ role: "user", kind: "text", text: input });
      setBusy(true);
      const parsed = parseTransactionText(input);

      if (parsed.intent === "transaction") {
        const review = Object.fromEntries(parsed.issues.map((i) => [i.field, i.message]));
        push({ role: "assistant", kind: "proposal", text: "Ini yang kutangkap. Periksa dulu, lalu simpan:", draft: parsed.draft, review, suggestion: parsed.suggestion, status: "pending", source: "text" });
      } else if (parsed.intent === "savings") {
        push({ role: "assistant", kind: "text", text: "Setoran tabungan dicatat langsung di tujuan tabunganmu.", link: { to: "/savings", label: "Buka Tabungan" } });
      } else {
        const answer = answerQuestion(input, { transactions, goals });
        if (answer.handled) {
          push({ role: "assistant", kind: "text", text: answer.answer, basis: answer.basis });
        } else if (isAIParserEnabled) {
          const ai = await parseWithAI(input);
          if (ai.ok) push({ role: "assistant", kind: "proposal", text: "Dibaca oleh AI — periksa semua isian:", draft: ai.draft, review: { amount: "Hasil AI, mohon periksa." }, status: "pending", source: "ai" });
          else push({ role: "assistant", kind: "text", text: "Maaf, aku belum mengerti. Coba sebutkan transaksi dengan nominalnya, atau tanyakan ringkasan catatanmu.", examples: true });
        } else {
          push({ role: "assistant", kind: "text", text: "Maaf, aku belum mengerti itu. Aku hanya bisa mencatat transaksi dan menjawab pertanyaan tentang catatanmu, misalnya:", examples: true });
        }
      }
      setBusy(false);
    },
    [push, transactions, goals]
  );

  const send = (e) => {
    e?.preventDefault();
    if (busy || !text.trim()) return;
    const value = text;
    setText("");
    respond(value);
  };

  const onFinal = useCallback((heard) => respond(heard), [respond]);
  const speech = useSpeechCapture({ onFinal });
  const listening = speech.state === "listening" || speech.state === "starting";

  // A question handed over from the capture sheet.
  useEffect(() => {
    const q = location.state?.question;
    if (!q) return;
    navigate(location.pathname, { replace: true, state: null });
    const t = setTimeout(() => respond(q), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "end" });
  }, [messages]);

  const save = async (msg, value) => {
    const { data, error } = await addTransaction(value, msg.source === "ai" ? "ai" : "text");
    if (error) return { error };
    patch(msg.id, { status: "saved", saved: data });
    return {};
  };

  return (
    <div className="page chat-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Asisten</p>
          <h1 className="page-head__title">Tanya & catat</h1>
          <p className="page-head__desc">Jawaban dihitung dari catatanmu sendiri. Percakapan tidak disimpan setelah halaman ditutup.</p>
        </div>
      </header>

      <div className="chat" role="log" aria-live="polite" aria-relevant="additions">
        {messages.map((m) => (
          <div key={m.id} className={`msg msg--${m.role}`}>
            {m.role === "assistant" && <img className="msg__avatar" src={asset("images/logo-simang.webp")} alt="" width="36" height="32" />}
            <div className="msg__bubble">
              <p>{m.text}</p>
              {m.basis && <p className="msg__basis">Dasar: {m.basis}</p>}
              {m.link && (
                <Link to={m.link.to} className="link-btn">
                  {m.link.label}
                </Link>
              )}
              {m.examples && (
                <div className="row" style={{ gap: "var(--sp-2)", marginTop: "var(--sp-2)" }}>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="chip" onClick={() => respond(s)} disabled={busy}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {m.kind === "proposal" && m.status === "pending" && (
                <div className="msg__card">
                  <TransactionEditor
                    initial={m.draft}
                    review={m.review}
                    suggestion={m.suggestion}
                    onSubmit={(value) => save(m, value)}
                    secondary={
                      <Button onClick={() => patch(m.id, { status: "cancelled" })}>
                        Batal
                      </Button>
                    }
                  />
                </div>
              )}
              {m.kind === "proposal" && m.status === "saved" && (
                <p className="msg__status msg__status--ok">
                  <CheckCircle2 size={16} aria-hidden="true" /> Tersimpan: {m.saved.description} · {formatSigned(m.saved.amount, m.saved.type)} · {categoryLabel(m.saved.category)}
                </p>
              )}
              {m.kind === "proposal" && m.status === "cancelled" && (
                <p className="msg__status">
                  <XCircle size={16} aria-hidden="true" /> Dibatalkan — tidak ada yang disimpan.
                </p>
              )}
            </div>
          </div>
        ))}
        {messages.length === 1 && (
          <div className="row chat__starters">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => respond(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        {busy && (
          <p className="msg__typing" aria-label="MAUNG sedang membaca">
            <span />
            <span />
            <span />
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form className="chat__composer" onSubmit={send}>
        {speech.error && (
          <p className="field__error" role="alert" style={{ gridColumn: "1 / -1" }}>
            {speech.error}
          </p>
        )}
        <label htmlFor="chat-input" className="sr-only">
          Tulis pesan
        </label>
        <textarea
          ref={inputRef}
          id="chat-input"
          className="textarea chat__input"
          rows={1}
          maxLength={300}
          placeholder={listening ? speech.transcript || "Mendengarkan…" : "Tulis transaksi atau pertanyaan…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) send(e);
          }}
          enterKeyHint="send"
        />
        {speech.supported && (
          <button
            type="button"
            className={`icon-btn chat__mic ${listening ? "is-on" : ""}`}
            onClick={listening ? speech.stop : speech.start}
            aria-label={listening ? "Selesai bicara" : "Bicara"}
            aria-pressed={listening}
          >
            {listening ? <Square size={18} aria-hidden="true" /> : <Mic size={20} aria-hidden="true" />}
          </button>
        )}
        <Button type="submit" variant="primary" disabled={busy || !text.trim()} aria-label="Kirim" className="chat__send">
          <Send size={18} aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
