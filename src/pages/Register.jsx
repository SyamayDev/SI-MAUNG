import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from './Auth.module.css';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function Register() {
  const navigate = useNavigate();
  const { register, user, loading } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingState, setLoadingState] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Kata sandi tidak cocok.");
      return;
    }

    setError("");
    setSuccess("");
    setLoadingState(true);

    const { data, error } = await register({ email: form.email, password: form.password, fullName: form.fullName });

    setLoadingState(false);

    if (error) {
      setError(error.message);
      return;
    }
    
    // Redirect to onboarding or show success message
    if (data.user) {
       navigate("/onboarding");
    } else {
      setSuccess("Akun berhasil dibuat! Silakan periksa email Anda untuk verifikasi.");
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authIntro}>
        {/* 
          Image placeholder:
          Please create an image named 'register-mascot.webp' 
          and place it in the 'public/images' folder.
        */}
        <img src="/images/register-mascot.webp" width="270" height="auto" alt="SI MAUNG Mascot" />
        <h2>Mulai Perjalanan Keuangan Anda Hari Ini!</h2>
        <p>Bergabunglah dengan SI MAUNG untuk mendapatkan kendali penuh atas keuangan Anda, dengan mudah dan cerdas.</p>
      </div>
      <div className={styles.authFormContainer}>
        <Card className={styles.authCard}>
          <div className={styles.authHeader}>
            <div className={styles.authBrand}>
              <img src="/images/logo-simang.webp" alt="SI MAUNG Logo" />
            </div>
            <h1>Buat Akun SI MAUNG Anda</h1>
            <p>Mulai pahami ke mana uang Anda pergi.</p>
          </div>

          {error && <p className={styles.formError}>{error}</p>}
          {success && <p className={styles.formSuccess}>{success}</p>}

          {!success && (
            <form onSubmit={handleSubmit} className={styles.authForm}>
              <Input
                label="Nama Lengkap"
                id="fullName"
                name="fullName"
                type="text"
                placeholder="contoh: John Doe"
                value={form.fullName}
                onChange={handleChange}
                required
              />
              <Input
                label="Email"
                id="email"
                name="email"
                type="email"
                placeholder="anda@contoh.com"
                value={form.email}
                onChange={handleChange}
                required
              />
              <Input
                label="Kata Sandi"
                id="password"
                name="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={handleChange}
                minLength={6}
                required
              />
              <Input
                label="Konfirmasi Kata Sandi"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Ulangi kata sandi Anda"
                value={form.confirmPassword}
                onChange={handleChange}
                minLength={6}
                required
              />
              <Button type="submit" disabled={loadingState || loading} variant="primary" size="lg">
                {loadingState || loading ? "Membuat Akun..." : "Buat Akun"}
              </Button>
            </form>
          )}

          <p className={styles.authFooter}>
            Sudah punya akun? <Link to="/login">Masuk</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

export default Register;
