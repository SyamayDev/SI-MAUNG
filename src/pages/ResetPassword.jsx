import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import { PasswordInput } from "../components/ui/Input";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { initialUrlHash } from "../lib/supabase";

/** Error details Supabase appends to the redirect URL when a link is invalid or expired. */
function readLinkError() {
  const params = new URLSearchParams((initialUrlHash || window.location.hash).replace(/^#/, "") || window.location.search);
  const code = params.get("error_code") || params.get("error");
  if (!code) return "";
  return /expired/i.test(code + params.get("error_description"))
    ? "Tautan sudah kedaluwarsa. Minta tautan baru."
    : "Tautan tidak valid. Minta tautan baru.";
}

/**
 * Supabase signs the visitor in from the email link (recovery session, event
 * PASSWORD_RECOVERY) — the new password is then set for that session.
 */
export default function ResetPassword() {
  const { status, recovery, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [linkError] = useState(readLinkError);
  const [waited, setWaited] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Give the client a moment to read the recovery token from the URL.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const v = {};
    if (form.password.length < 8) v.password = "Minimal 8 karakter.";
    if (form.confirm !== form.password) v.confirm = "Kata sandi tidak sama.";
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setError("");
    const { error: err } = await updatePassword(form.password);
    setBusy(false);
    if (err) setError(err);
    else setDone(true);
  };

  let body;
  if (done) {
    body = (
      <div className="stack">
        <p className="callout callout--success" role="status">
          <CheckCircle2 size={18} aria-hidden="true" /> Kata sandi berhasil diperbarui.
        </p>
        <Button variant="primary" size="lg" block onClick={() => navigate("/dashboard", { replace: true })}>
          Buka SI-MAUNG
        </Button>
      </div>
    );
  } else if (linkError || (status === "signedOut" && waited)) {
    body = (
      <div className="stack">
        <p className="callout callout--error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          {linkError || "Tautan atur ulang tidak ditemukan atau sudah dipakai. Minta tautan baru."}
        </p>
        <Link to="/forgot-password" className="btn btn--primary btn--lg btn--block">
          Minta tautan baru
        </Link>
      </div>
    );
  } else if (status === "signedIn" || recovery) {
    body = (
      <form className="stack" onSubmit={onSubmit} noValidate>
        {error && (
          <p className="callout callout--error" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            {error}
          </p>
        )}
        <PasswordInput id="password" label="Kata sandi baru" autoComplete="new-password" hint="Minimal 8 karakter." value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} error={errors.password} />
        <PasswordInput id="confirm" label="Ulangi kata sandi baru" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} error={errors.confirm} />
        <Button type="submit" variant="primary" size="lg" block loading={busy}>
          Simpan kata sandi
        </Button>
      </form>
    );
  } else {
    body = <LoadingSpinner message="Memeriksa tautan…" />;
  }

  return (
    <AuthLayout title="Atur ulang kata sandi" subtitle="Buat kata sandi baru untuk akunmu." art="images/onboarding-finish.webp">
      {body}
    </AuthLayout>
  );
}
