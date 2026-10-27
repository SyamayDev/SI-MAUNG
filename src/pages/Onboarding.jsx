import { useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Check, Mic, PiggyBank, ShieldCheck, Target } from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Logo from "../components/ui/Logo";
import ThemeToggle from "../components/ui/ThemeToggle";
import FullscreenToggle from "../components/ui/FullscreenToggle";
import { useMaung3D } from "../components/scene/sceneHooks";
import { useMaungFrame } from "../components/scene/useMaungFrame";
import { useAuth } from "../context/AuthContext";
import { asset } from "../lib/assets";

const GOALS = [
  { id: "control_spending", label: "Mengontrol pengeluaran", icon: ShieldCheck },
  { id: "save_more", label: "Menabung lebih banyak", icon: PiggyBank },
  { id: "track_finances", label: "Sekadar mencatat keuangan", icon: Target },
];

// MAUNG's 3D pose per step; the 2D art is only used when 3D is unavailable.
const STEPS = [
  { art: "images/onboarding-welcome.webp", pose: "wave" },
  { art: "images/onboarding-name.webp", pose: "listen" },
  { art: "images/onboarding-goals.webp", pose: "point" },
  { art: "images/onboarding-finish.webp", pose: "cheer" },
];

export default function Onboarding() {
  const { completeOnboarding, displayName } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(displayName || "");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const frameRef = useRef(null);
  useMaungFrame(frameRef, STEPS[step].pose);
  const { available } = useMaung3D();

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    const { error: err } = await completeOnboarding({ fullName: name.trim(), primaryGoal: goal });
    setBusy(false);
    if (err) setError(err);
    // On success the profile says onboarding_completed → the router opens the dashboard.
  };

  return (
    <div className="onboarding on-stage">
      <header className="onboarding__bar">
        <Logo size={36} />
        <div className="onboarding__bar-end">
          <p className="eyebrow onboarding__count" aria-live="polite">
            <span className="onboarding__count-long">
              Langkah {step + 1} dari {STEPS.length}
            </span>
            <span className="onboarding__count-short" aria-hidden="true">
              {step + 1}/{STEPS.length}
            </span>
          </p>
          <ThemeToggle />
          <FullscreenToggle />
        </div>
      </header>
      <div className="onboarding__progress" aria-hidden="true">
        <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <main className="onboarding__body">
        <div className="onboarding__art" ref={frameRef} data-maung-frame>
          {!available && <img src={asset(STEPS[step].art)} alt="" width="320" height="420" key={step} />}
        </div>
        <div className="onboarding__card panel">
          {step === 0 && (
            <>
              <h1 className="onboarding__title">Halo, aku MAUNG.</h1>
              <p className="muted">Aku bantu mencatat uang masuk dan keluarmu, cukup dari satu kalimat. Pengaturannya cuma sebentar.</p>
              <Button variant="primary" size="lg" block onClick={() => setStep(1)} data-autofocus>
                Mulai
              </Button>
            </>
          )}

          {step === 1 && (
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) setStep(2);
              }}
            >
              <h1 className="onboarding__title">Aku panggil kamu siapa?</h1>
              <Input id="nickname" label="Nama panggilan" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="given-name" autoFocus />
              <div className="row">
                <Button onClick={() => setStep(0)} aria-label="Kembali">
                  <ArrowLeft size={18} aria-hidden="true" />
                </Button>
                <Button type="submit" variant="primary" size="lg" className="grow" disabled={!name.trim()}>
                  Lanjut
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="stack">
              <h1 className="onboarding__title">Apa fokus utamamu?</h1>
              <div role="radiogroup" aria-label="Fokus utama" className="goal-options">
                {GOALS.map(({ id, label, icon: Icon }) => (
                  <button key={id} type="button" role="radio" aria-checked={goal === id} className="goal-option" onClick={() => setGoal(id)}>
                    <Icon size={20} aria-hidden="true" />
                    <span className="grow">{label}</span>
                    {goal === id && <Check size={18} aria-hidden="true" />}
                  </button>
                ))}
              </div>
              <div className="row">
                <Button onClick={() => setStep(1)} aria-label="Kembali">
                  <ArrowLeft size={18} aria-hidden="true" />
                </Button>
                <Button variant="primary" size="lg" className="grow" disabled={!goal} onClick={() => setStep(3)}>
                  Lanjut
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="stack">
              <h1 className="onboarding__title">Siap, {name.trim().split(" ")[0]}!</h1>
              <p className="muted">
                Tekan tombol <Mic size={15} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px" }} /> kapan saja dan sebutkan transaksimu, misalnya “beli kopi 20 ribu”. Kamu selalu bisa memeriksa hasilnya sebelum tersimpan.
              </p>
              {error && (
                <p className="callout callout--error" role="alert">
                  <AlertCircle size={18} aria-hidden="true" />
                  {error}
                </p>
              )}
              <div className="row">
                <Button onClick={() => setStep(2)} aria-label="Kembali" disabled={busy}>
                  <ArrowLeft size={18} aria-hidden="true" />
                </Button>
                <Button variant="amber" size="lg" className="grow" onClick={finish} loading={busy}>
                  Buka beranda
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
