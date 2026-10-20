import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, MailCheck } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import Input, { PasswordInput } from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

function validate(form) {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = "Isi nama Anda.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Format email tidak valid.";
  if (form.password.length < 8) errors.password = "Minimal 8 karakter.";
  if (form.confirm !== form.password) errors.confirm = "Kata sandi tidak sama.";
  return errors;
}

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((x) => ({ ...x, [e.target.name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setError("");
    const result = await register({ email: form.email.trim(), password: form.password, fullName: form.fullName.trim() });
    setBusy(false);
    if (result.error) setError(result.error);
    else if (result.needsConfirmation) setSentTo(form.email.trim());
    // Otherwise a session exists: the router moves on to onboarding.
  };

  if (sentTo) {
    return (
      <AuthLayout title="Cek email Anda" art="images/onboarding-finish.webp">
        <div className="stack">
          <p className="callout callout--success">
            <MailCheck size={18} aria-hidden="true" />
            <span>
              Tautan konfirmasi dikirim ke <strong>{sentTo}</strong>. Buka tautan itu, lalu masuk.
            </span>
          </p>
          <Link to="/login" className="btn btn--primary btn--lg btn--block">
            Ke halaman masuk
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Buat akun"
      subtitle="Gratis. Mulai catat dalam satu menit."
      art="images/register-mascot.webp"
      footer={
        <>
          Sudah punya akun?{" "}
          <Link to="/login" className="link-btn">
            Masuk
          </Link>
        </>
      }
    >
      <form className="stack" onSubmit={onSubmit} noValidate>
        {error && (
          <p className="callout callout--error" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            {error}
          </p>
        )}
        <Input id="fullName" name="fullName" label="Nama" autoComplete="name" value={form.fullName} onChange={onChange} error={errors.fullName} maxLength={60} />
        <Input id="email" name="email" type="email" label="Email" autoComplete="email" inputMode="email" value={form.email} onChange={onChange} error={errors.email} />
        <PasswordInput id="password" name="password" label="Kata sandi" autoComplete="new-password" hint="Minimal 8 karakter." value={form.password} onChange={onChange} error={errors.password} />
        <PasswordInput id="confirm" name="confirm" label="Ulangi kata sandi" autoComplete="new-password" value={form.confirm} onChange={onChange} error={errors.confirm} />
        <Button type="submit" variant="primary" size="lg" block loading={busy}>
          Buat akun
        </Button>
      </form>
    </AuthLayout>
  );
}
