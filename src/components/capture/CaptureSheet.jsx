import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Keyboard, Mic, MicOff, PencilLine, RotateCcw, Send, ShieldCheck, Sparkles } from "lucide-react";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import TransactionEditor from "../transactions/TransactionEditor";
import { emptyDraft } from "../../lib/finance/draft";
import { useSpeechCapture } from "../../hooks/useSpeechCapture";
import { isConfidentDraft, parseTransactionText } from "../../lib/finance/parseTransaction";
import { addTransaction, editTransaction, removeTransaction } from "../../lib/financeStore";
import { categoryLabel } from "../../lib/finance/categories";
import { formatDate, formatSigned } from "../../lib/finance/format";
import { usePreferences } from "../../lib/preferences";
import { setMood } from "../../lib/sceneStore";
import { isAIParserEnabled, parseWithAI } from "../../services/aiService";
import { useToast } from "../../context/ToastContext";
import { asset } from "../../lib/assets";
import { EXAMPLE_PHRASES } from "../../lib/finance/examples";

const LISTEN_LABEL = {
  idle: "Ketuk untuk bicara",
  starting: "Menyiapkan mikrofon…",
  listening: "Mendengarkan… ketuk untuk selesai",
  done: "Selesai",
  error: "Coba bicara lagi",
  denied: "Mikrofon tidak diizinkan",
  unsupported: "Suara tidak didukung di browser ini",
};

/**
 * The one place transactions are captured: voice, typed sentence, manual
 * form or an edit. Every draft is reviewed before saving unless the user
 * enabled auto-save AND the parser reports no doubt about the result.
 */
export default function CaptureSheet({ open, request, onClose }) {
  const mode = request?.mode || "voice";
  const isEdit = mode === "edit";
  const prefs = usePreferences();
  const showToast = useToast();

  const [stage, setStage] = useState("input"); // input | review | saved
  const [typed, setTyped] = useState("");
  const [notice, setNotice] = useState(null); // { kind, text, link? }
  const [parsed, setParsed] = useState(null); // { draft, review, suggestion, source, heard, channel }
  const [saved, setSaved] = useState(null); // { row, auto }
  const [processing, setProcessing] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const textRef = useRef(null);

  const handleSentence = useCallback(
    async (sentence, channel) => {
      const text = sentence.trim();
      if (!text) return;
      setNotice(null);
      setProcessing(true);
      setMood("thinking");
      let result = parseTransactionText(text);
      let source = "local";

      if (result.intent === "unknown" && isAIParserEnabled) {
        const ai = await parseWithAI(text);
        if (ai.ok) {
          result = {
            intent: "transaction",
            draft: ai.draft,
            issues: [{ field: "amount", message: "Dibaca oleh AI. Periksa semua isian sebelum menyimpan." }],
            confidence: { amount: 0, type: 0, category: 0, date: 0 },
            suggestion: null,
          };
          source = "ai";
        }
      }
      setProcessing(false);

      if (result.intent === "question") {
        setMood("idle");
        setNotice({ kind: "info", text: "Itu terdengar seperti pertanyaan. Asisten MAUNG bisa menjawab pertanyaan tentang catatanmu.", link: { to: "/ai", state: { question: text }, label: "Tanya Asisten" } });
        return;
      }
      if (result.intent === "savings") {
        setMood("idle");
        setNotice({ kind: "info", text: "Untuk menambah tabungan, setor langsung ke tujuan tabunganmu.", link: { to: "/savings", label: "Buka Tabungan" } });
        return;
      }
      if (result.intent !== "transaction") {
        setMood("idle");
        setNotice({ kind: "warn", text: `MAUNG belum menemukan transaksi dari “${text}”. Sebutkan apa transaksinya dan nominalnya, misalnya “beli bensin 50 ribu”.` });
        return;
      }

      const review = Object.fromEntries(result.issues.map((i) => [i.field, i.message]));
      const entry = { draft: result.draft, review, suggestion: result.suggestion, source, heard: text, channel };

      if (prefs.voiceAutoSave && source === "local" && isConfidentDraft(result)) {
        setProcessing(true);
        const { data, error } = await addTransaction({ ...result.draft, notes: null }, channel);
        setProcessing(false);
        if (!error) {
          setMood("happy");
          setSaved({ row: data, auto: true });
          setStage("saved");
          return;
        }
        showToast(error, { type: "error" });
      }
      setMood("idle");
      setParsed(entry);
      setStage("review");
    },
    [prefs.voiceAutoSave, showToast]
  );

  const onFinal = useCallback((text) => handleSentence(text, "voice"), [handleSentence]);
  const speech = useSpeechCapture({ onFinal });
  const { reset: resetSpeech, abort: abortSpeech } = speech;

  // Fresh state each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      resetSpeech();
      setNotice(null);
      setSaved(null);
      setProcessing(false);
      if (request?.mode === "edit") {
        setParsed({ draft: request.transaction, review: {}, suggestion: null, source: "manual", heard: "", channel: "manual" });
        setStage("review");
      } else if (request?.mode === "manual") {
        setParsed({ draft: emptyDraft(request.type), review: {}, suggestion: null, source: "manual", heard: "", channel: "manual" });
        setStage("review");
      } else {
        setParsed(null);
        setStage("input");
        setTyped(request?.text || "");
        if (request?.text) handleSentence(request.text, "text");
        else if (request?.mode === "text") requestAnimationFrame(() => textRef.current?.focus());
      }
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request]);

  // MAUNG listens while the microphone is open.
  useEffect(() => {
    if (speech.state === "listening") setMood("listening");
    else if (speech.state === "error" || speech.state === "denied") setMood("idle");
  }, [speech.state]);

  const close = () => {
    abortSpeech();
    setMood("idle");
    onClose();
  };

  const backToInput = () => {
    resetSpeech();
    setParsed(null);
    setNotice(null);
    setStage("input");
  };

  const submit = async (value) => {
    if (isEdit) {
      const { error } = await editTransaction(request.transaction.id, value);
      if (error) return { error };
      showToast("Perubahan disimpan.", { type: "success" });
      close();
      return {};
    }
    const { data, error } = await addTransaction(value, parsed?.source === "ai" ? "ai" : parsed?.channel || "manual");
    if (error) return { error };
    setMood("happy");
    setSaved({ row: data, auto: false });
    setStage("saved");
    return {};
  };

  const undo = async () => {
    if (!saved?.row) return;
    setUndoing(true);
    const { error } = await removeTransaction(saved.row.id);
    setUndoing(false);
    if (error) showToast(error, { type: "error" });
    else {
      showToast("Transaksi dibatalkan.", { type: "info" });
      backToInput();
    }
  };

  const title = isEdit ? "Ubah transaksi" : stage === "review" ? (parsed?.heard ? "Periksa hasil MAUNG" : "Catat transaksi") : stage === "saved" ? "Tercatat!" : "Catat dengan suara";
  const description =
    stage === "input" ? "Ucapkan atau ketik transaksimu dalam Bahasa Indonesia sehari-hari." : stage === "review" && !isEdit && parsed?.heard ? "Pastikan semuanya benar sebelum disimpan." : undefined;

  const listening = speech.state === "listening" || speech.state === "starting";

  return (
    <Dialog open={open} onClose={close} title={title} description={description} width={600} className="capture">
      {stage === "input" && (
        <div className="capture__input">
          {speech.supported ? (
            <div className={`capture__voice ${listening ? "is-listening" : ""}`}>
              <button
                type="button"
                className="capture__mic"
                onClick={listening ? speech.stop : speech.start}
                aria-label={listening ? "Selesai bicara" : "Mulai bicara"}
                aria-pressed={listening}
                disabled={processing}
                data-autofocus={request?.mode === "voice" ? true : undefined}
              >
                <span className="capture__rings" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                {speech.state === "denied" ? <MicOff size={34} aria-hidden="true" /> : <Mic size={34} aria-hidden="true" />}
              </button>
              <p className="capture__status" aria-live="polite">
                {processing ? "MAUNG sedang membaca…" : LISTEN_LABEL[speech.state]}
              </p>
              <p className={`capture__transcript ${speech.transcript ? "" : "is-empty"}`} aria-live="polite">
                {speech.transcript ? `“${speech.transcript}”` : "Contoh: “Tadi beli bensin lima puluh ribu”"}
              </p>
              {speech.error && (
                <p className="callout callout--warn" role="alert">
                  {speech.error}
                </p>
              )}
            </div>
          ) : (
            <p className="callout callout--warn">
              <Keyboard size={18} aria-hidden="true" />
              Browser ini belum mendukung pengenalan suara (mis. Firefox). Ketik saja kalimat transaksinya di bawah, hasilnya sama.
            </p>
          )}

          <form
            className="capture__type"
            onSubmit={(e) => {
              e.preventDefault();
              handleSentence(typed, "text");
            }}
          >
            <label htmlFor="capture-text" className="field__label">
              {speech.supported ? "Atau ketik kalimatnya" : "Ketik kalimat transaksi"}
            </label>
            <div className="capture__type-row">
              <input
                ref={textRef}
                id="capture-text"
                className="input"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="beli kopi 25rb"
                autoComplete="off"
                enterKeyHint="send"
                maxLength={300}
                data-autofocus={!speech.supported || request?.mode === "text" ? true : undefined}
              />
              <Button type="submit" variant="primary" disabled={!typed.trim() || processing} aria-label="Proses kalimat">
                <Send size={18} aria-hidden="true" />
              </Button>
            </div>
          </form>

          <div className="capture__examples" aria-label="Contoh kalimat">
            {EXAMPLE_PHRASES.map((p) => (
              <button key={p} type="button" className="chip" onClick={() => setTyped(p)}>
                {p}
              </button>
            ))}
          </div>

          {notice && (
            <div className={`callout callout--${notice.kind === "warn" ? "warn" : "success"}`} role="status">
              <span className="grow">{notice.text}</span>
              {notice.link && (
                <Link className="link-btn" to={notice.link.to} state={notice.link.state} onClick={close}>
                  {notice.link.label}
                </Link>
              )}
            </div>
          )}

          <div className="capture__footer">
            <button type="button" className="link-btn" onClick={() => {
              setParsed({ draft: emptyDraft(), review: {}, suggestion: null, source: "manual", heard: "", channel: "manual" });
              setStage("review");
            }}>
              <PencilLine size={15} aria-hidden="true" /> Isi formulir manual
            </button>
            <p className="capture__privacy">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>
                Audio tidak direkam atau disimpan SI-MAUNG. Pengenalan suara dijalankan oleh browser (di Chrome diproses layanan Google); teksnya dibaca di perangkatmu
                {isAIParserEnabled ? ", dan hanya kalimat yang tak terbaca dikirim ke fungsi AI kami" : ""}.
              </span>
            </p>
          </div>
        </div>
      )}

      {stage === "review" && parsed && (
        <div className="capture__review">
          {parsed.heard && (
            <div className="capture__heard">
              <img src={asset("images/logo-simang.webp")} alt="" width="40" height="36" />
              <div>
                <p className="eyebrow">{parsed.channel === "voice" ? "Kamu bilang" : "Kamu tulis"}</p>
                <p className="capture__quote">“{parsed.heard}”</p>
                <span className={`chip ${parsed.source === "ai" ? "chip--amber" : ""}`}>
                  <Sparkles size={13} aria-hidden="true" />
                  {parsed.source === "ai" ? "Dibaca AI (Edge Function)" : "Dibaca parser di perangkat"}
                </span>
              </div>
            </div>
          )}
          <TransactionEditor
            key={parsed.heard + (request?.transaction?.id || "")}
            initial={parsed.draft}
            review={parsed.review}
            suggestion={parsed.suggestion}
            submitLabel={isEdit ? "Simpan perubahan" : "Simpan transaksi"}
            onSubmit={submit}
            secondary={
              isEdit ? (
                <Button onClick={close}>Batal</Button>
              ) : (
                <Button onClick={backToInput}>
                  <RotateCcw size={16} aria-hidden="true" /> Ulangi
                </Button>
              )
            }
          />
        </div>
      )}

      {stage === "saved" && saved?.row && (
        <div className="capture__saved" role="status">
          <CheckCircle2 size={44} className="capture__saved-icon" aria-hidden="true" />
          <p className={`capture__saved-amount ${saved.row.type === "income" ? "text-income" : "text-expense"}`}>{formatSigned(saved.row.amount, saved.row.type)}</p>
          <p className="capture__saved-desc">{saved.row.description}</p>
          <p className="muted">
            {saved.row.type === "income" ? "Pemasukan" : "Pengeluaran"} · {categoryLabel(saved.row.category)} · {formatDate(saved.row.transaction_date)}
          </p>
          {saved.auto && <p className="chip chip--amber">Disimpan otomatis (hasil jelas)</p>}
          <div className="dialog__actions capture__saved-actions">
            {saved.auto && (
              <Button onClick={undo} loading={undoing}>
                Batalkan
              </Button>
            )}
            <Button onClick={backToInput}>
              <Mic size={16} aria-hidden="true" /> Catat lagi
            </Button>
            <Button variant="primary" onClick={close} data-autofocus>
              Selesai
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
