import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Permintaan reset password berhasil. Cek email Anda.");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔒</div>

        <h1>Lupa Password</h1>
        <p>Masukkan email untuk menerima tautan reset password.</p>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Mengirim..." : "Kirim tautan reset"}
          </button>
        </form>

        <p className="auth-footer">
          Kembali ke <Link to="/login">Masuk</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
