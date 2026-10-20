import { useCallback, useEffect, useRef, useState } from "react";

const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;

export const speechSupported = Boolean(Recognition);

const ERRORS = {
  "not-allowed": ["denied", "Izin mikrofon ditolak. Aktifkan izin mikrofon untuk situs ini di pengaturan browser, atau ketik transaksinya."],
  "service-not-allowed": ["denied", "Browser tidak mengizinkan layanan pengenalan suara di halaman ini. Silakan ketik transaksinya."],
  "audio-capture": ["error", "Mikrofon tidak ditemukan. Periksa perangkat Anda atau ketik transaksinya."],
  network: ["error", "Pengenalan suara butuh koneksi internet. Periksa koneksi lalu coba lagi."],
  "no-speech": ["error", "Tidak ada suara yang terdengar. Coba lagi dan bicara lebih dekat ke mikrofon."],
  "language-not-supported": ["error", "Bahasa Indonesia belum didukung pengenalan suara di browser ini."],
};

/**
 * Browser speech recognition (Web Speech API) as a small state machine:
 *   idle → starting → listening → done      (onFinal(text) is called exactly once)
 *                               ↘ error | denied
 *   unsupported when the browser has no recognition engine.
 * Each start() creates a fresh recognition session; events from stale
 * sessions are ignored, and the final transcript is delivered only once.
 */
export function useSpeechCapture({ lang = "id-ID", onFinal } = {}) {
  const [state, setState] = useState(speechSupported ? "idle" : "unsupported");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognition = useRef(null);
  const session = useRef(0);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const abort = useCallback(() => {
    session.current++;
    try {
      recognition.current?.abort();
    } catch {
      /* already stopped */
    }
    recognition.current = null;
    setState((s) => (s === "starting" || s === "listening" ? "idle" : s));
  }, []);

  const stop = useCallback(() => {
    try {
      recognition.current?.stop(); // ends with whatever was heard → onend delivers it
    } catch {
      /* already stopped */
    }
  }, []);

  const start = useCallback(() => {
    if (!Recognition) return;
    try {
      recognition.current?.abort();
    } catch {
      /* ignore */
    }
    const id = ++session.current;
    const rec = new Recognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let heard = "";
    let delivered = false;
    let failed = false;
    const current = () => id === session.current;

    rec.onstart = () => current() && setState("listening");
    rec.onresult = (event) => {
      if (!current()) return;
      // Rebuild from the full result list each time (some engines repeat earlier results).
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      heard = `${finalText} ${interimText}`.replace(/\s+/g, " ").trim();
      setTranscript(heard);
    };
    rec.onerror = (event) => {
      if (!current() || event.error === "aborted") return;
      failed = true;
      const [kind, message] = ERRORS[event.error] || ["error", "Pengenalan suara gagal. Coba lagi atau ketik transaksinya."];
      setState(kind);
      setError(message);
    };
    rec.onend = () => {
      if (!current()) return;
      recognition.current = null;
      if (delivered || failed) return;
      if (heard) {
        delivered = true;
        setState("done");
        onFinalRef.current?.(heard);
      } else {
        setState("error");
        setError(ERRORS["no-speech"][1]);
      }
    };

    setTranscript("");
    setError("");
    setState("starting");
    try {
      rec.start();
      recognition.current = rec;
    } catch {
      setState("error");
      setError("Mikrofon sedang dipakai. Tunggu sebentar lalu coba lagi.");
    }
  }, [lang]);

  const reset = useCallback(() => {
    abort();
    setTranscript("");
    setError("");
    setState(speechSupported ? "idle" : "unsupported");
  }, [abort]);

  // Never leave the microphone open after the component goes away.
  useEffect(
    () => () => {
      session.current++;
      try {
        recognition.current?.abort();
      } catch {
        /* ignore */
      }
    },
    []
  );

  return { state, transcript, error, start, stop, abort, reset, supported: speechSupported };
}
