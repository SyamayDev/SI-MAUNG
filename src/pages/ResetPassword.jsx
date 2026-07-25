import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const accessToken = searchParams.get("access_token");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!password || password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi harus sama.");
      return;
    }

    if (!accessToken) {
      setError("Token reset tidak ditemukan. Gunakan tautan yang valid.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      access_token: accessToken,
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Password berhasil diperbarui. Silakan masuk ulang.");
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔐</div>

        <h1>Atur Ulang Password</h1>
        <p>Masukkan password baru untuk akun Anda.</p>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <label>Password Baru</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            required
          />

          <label>Konfirmasi Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Memperbarui..." : "Perbarui Password"}
          </button>
        </form>

        <p className="auth-footer">
          Kembali ke <Link to="/login">Masuk</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
