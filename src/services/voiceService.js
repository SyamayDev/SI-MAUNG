// Small wrapper for browser SpeechRecognition to provide a promise-style transcription.
export function transcribeOnce({ lang = "id-ID", timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition)
      return reject(new Error("SpeechRecognition not supported"));

    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    let timer = setTimeout(() => {
      try {
        rec.stop();
      } catch (e) {}
      resolve("");
    }, timeout);

    rec.onresult = (e) => {
      clearTimeout(timer);
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      resolve(text);
    };

    rec.onerror = (e) => {
      clearTimeout(timer);
      reject(e.error || e.message || new Error("Recognition error"));
    };

    rec.onend = () => {
      clearTimeout(timer);
    };

    try {
      rec.start();
    } catch (e) {
      clearTimeout(timer);
      reject(e);
    }
  });
}

export default { transcribeOnce };
