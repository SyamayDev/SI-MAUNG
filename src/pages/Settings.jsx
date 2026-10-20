import { useState } from "react";
import { CheckCircle2, LogOut, Mic, MicOff, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Input, { PasswordInput } from "../components/ui/Input";
import Button from "../components/ui/Button";
import Switch from "../components/ui/Switch";
import Segmented from "../components/ui/Segmented";
import { setPreference, usePreferences } from "../lib/preferences";
import { speechSupported } from "../hooks/useSpeechCapture";
import { canRender3D, prefersReducedMotion } from "../lib/device";
import { followDevice, setTheme, useTheme } from "../lib/theme";

const REASONS = {
  off: "Scene 3D dimatikan — tampilan memakai ilustrasi 2D.",
  "no-webgl": "Browser ini tidak mendukung WebGL — ilustrasi 2D dipakai.",
  software: "Grafis perangkat ini terlalu terbatas untuk 3D yang mulus — ilustrasi 2D dipakai.",
};

function ProfileForm() {
  const { displayName, user, updateProfile } = useAuth();
  const showToast = useToast();
  const [name, setName] = useState(displayName);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const value = name.replace(/\s+/g, " ").trim();
    if (!value) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: err } = await updateProfile({ full_name: value });
    setBusy(false);
    if (err) setError(err);
    else showToast("Nama tersimpan.", { type: "success" });
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <Input id="profile-name" label="Nama tampilan" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} error={error} autoComplete="name" />
      <Input id="profile-email" label="Email" value={user?.email || ""} readOnly hint="Email dipakai untuk masuk dan tidak bisa diubah di sini." />
      <div>
        <Button type="submit" variant="primary" loading={busy} disabled={name.trim() === displayName}>
          Simpan nama
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { updatePassword } = useAuth();
  const showToast = useToast();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (form.password.length < 8) v.password = "Minimal 8 karakter.";
    if (form.confirm !== form.password) v.confirm = "Kata sandi tidak sama.";
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    const { error } = await updatePassword(form.password);
    setBusy(false);
    if (error) setErrors({ password: error });
    else {
      setForm({ password: "", confirm: "" });
      showToast("Kata sandi diperbarui.", { type: "success" });
    }
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <PasswordInput id="new-password" label="Kata sandi baru" autoComplete="new-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} error={errors.password} hint="Minimal 8 karakter." />
      <PasswordInput id="confirm-password" label="Ulangi kata sandi baru" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} error={errors.confirm} />
      <div>
        <Button type="submit" loading={busy} disabled={!form.password}>
          Ganti kata sandi
        </Button>
      </div>
    </form>
  );
}

export default function Settings() {
  const prefs = usePreferences();
  const { logout } = useAuth();
  const { theme, followsDevice } = useTheme();
  const scene = canRender3D();

  return (
    <div className="page settings">
      <header className="page-head">
        <div>
          <p className="eyebrow">Pengaturan</p>
          <h1 className="page-head__title">Akun & preferensi</h1>
        </div>
      </header>

      <div className="settings-grid">
        <section className="panel" aria-labelledby="set-profile">
          <h2 className="panel__title" id="set-profile">
            Profil
          </h2>
          <p className="panel__sub" style={{ marginBottom: "var(--sp-4)" }}>
            Nama ini dipakai MAUNG untuk menyapamu.
          </p>
          <ProfileForm />
        </section>

        <section className="panel" aria-labelledby="set-voice">
          <h2 className="panel__title" id="set-voice">
            Pencatatan suara
          </h2>
          <p className={`chip ${speechSupported ? "chip--income" : "chip--expense"}`} style={{ margin: "var(--sp-3) 0" }}>
            {speechSupported ? <Mic size={14} aria-hidden="true" /> : <MicOff size={14} aria-hidden="true" />}
            {speechSupported ? "Pengenalan suara didukung browser ini" : "Browser ini belum mendukung pengenalan suara — gunakan ketik"}
          </p>
          <Switch
            checked={prefs.voiceAutoSave}
            onChange={(v) => setPreference("voiceAutoSave", v)}
            label="Simpan otomatis bila hasilnya jelas"
            description="Hanya untuk kalimat dengan nominal bersatuan, jenis transaksi yang jelas, dan tanpa tanda ragu. Kamu tetap bisa membatalkan sesudahnya. Bawaan: mati."
          />
          <p className="field__hint" style={{ marginTop: "var(--sp-3)" }}>
            Audio tidak direkam SI-MAUNG. Di Chrome, suara diubah menjadi teks oleh layanan Google; teks itu lalu dibaca di perangkatmu. Preferensi ini tersimpan di perangkat ini saja.
          </p>
        </section>

        <section className="panel" aria-labelledby="set-display">
          <h2 className="panel__title" id="set-display">
            Tampilan
          </h2>
          <p className="field__label" style={{ marginTop: "var(--sp-4)" }}>
            Tema warna
          </p>
          <Segmented
            label="Tema warna"
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: "Terang", icon: Sun },
              { value: "dark", label: "Gelap", icon: Moon },
            ]}
          />
          <p className="field__hint" style={{ marginTop: "var(--sp-2)" }}>
            {followsDevice ? (
              "Saat ini mengikuti tema perangkatmu."
            ) : (
              <>
                Pilihanmu tersimpan di perangkat ini.{" "}
                <button type="button" className="link-btn" onClick={followDevice}>
                  Ikuti perangkat lagi
                </button>
              </>
            )}
          </p>
          <p className="field__label" style={{ marginTop: "var(--sp-5)" }}>
            Scene 3D MAUNG
          </p>
          <Segmented
            label="Scene 3D MAUNG"
            value={prefs.scene3d}
            onChange={(v) => setPreference("scene3d", v)}
            options={[
              { value: "auto", label: "Otomatis" },
              { value: "off", label: "Mati (2D)" },
            ]}
          />
          <p className="field__hint" style={{ marginTop: "var(--sp-2)" }}>
            {scene.ok ? (
              <>
                <CheckCircle2 size={13} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px" }} /> Perangkat ini menampilkan MAUNG 3D
                {prefersReducedMotion() ? " dalam pose tenang (gerakan dikurangi sesuai pengaturan perangkat)" : ""}. Matikan untuk menghemat baterai.
              </>
            ) : (
              REASONS[scene.reason] || "Ilustrasi 2D dipakai."
            )}
          </p>
        </section>

        <section className="panel" aria-labelledby="set-security">
          <h2 className="panel__title" id="set-security">
            Keamanan
          </h2>
          <p className="panel__sub" style={{ marginBottom: "var(--sp-4)" }}>
            Ganti kata sandi akun.
          </p>
          <PasswordForm />
          <hr className="divider" />
          <Button variant="danger" onClick={logout}>
            <LogOut size={16} aria-hidden="true" /> Keluar dari akun
          </Button>
        </section>
      </div>
    </div>
  );
}
