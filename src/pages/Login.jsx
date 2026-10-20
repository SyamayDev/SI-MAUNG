import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import Input, { PasswordInput } from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.email.trim() || !form.password) {
      setError("Isi email dan kata sandi.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: err } = await login({ email: form.email.trim(), password: form.password });
    setBusy(false);
    if (err) setError(err);
    // On success the auth listener updates the session and PublicOnlyRoute redirects.
  };

  return (
    <AuthLayout
      title="Masuk"
      pose="coin"
      subtitle="Lanjutkan catatan keuanganmu."
      footer={
        <>
          Belum punya akun?{" "}
          <Link to="/register" className="link-btn">
            Daftar sekarang
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
        <Input id="email" name="email" type="email" label="Email" autoComplete="email" inputMode="email" value={form.email} onChange={onChange} required />
        <PasswordInput id="password" name="password" label="Kata sandi" autoComplete="current-password" value={form.password} onChange={onChange} required />
        <Link to="/forgot-password" className="link-btn" style={{ justifySelf: "end", fontSize: "var(--fs-sm)" }}>
          Lupa kata sandi?
        </Link>
        <Button type="submit" variant="primary" size="lg" block loading={busy}>
          Masuk
        </Button>
      </form>
    </AuthLayout>
  );
}
