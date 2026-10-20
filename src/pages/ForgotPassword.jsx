import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, MailCheck } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import ConfigMissing from "../components/layouts/ConfigMissing";

export default function ForgotPassword() {
  const { sendPasswordResetEmail, status } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (status === "unconfigured") return <ConfigMissing />;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Format email tidak valid.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: err } = await sendPasswordResetEmail(email.trim());
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  };

  return (
    <AuthLayout
      title="Lupa kata sandi"
      subtitle="Kami kirim tautan untuk membuat kata sandi baru."
      art="images/empty-state-mascot.webp"
      pose="thinking"
      footer={
        <Link to="/login" className="link-btn">
          Kembali ke halaman masuk
        </Link>
      }
    >
      {sent ? (
        <p className="callout callout--success" role="status">
          <MailCheck size={18} aria-hidden="true" />
          <span>Jika email itu terdaftar, tautan atur ulang sudah dikirim. Periksa juga folder spam.</span>
        </p>
      ) : (
        <form className="stack" onSubmit={onSubmit} noValidate>
          {error && (
            <p className="callout callout--error" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              {error}
            </p>
          )}
          <Input id="email" type="email" label="Email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" variant="primary" size="lg" block loading={busy}>
            Kirim tautan
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
