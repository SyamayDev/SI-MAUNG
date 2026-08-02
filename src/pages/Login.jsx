import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from './Auth.module.css';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function Login() {
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
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
    setError("");
    setLoadingState(true);

    const { error } = await login(form);

    setLoadingState(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authIntro}>
        {/* 
          Image placeholder:
          Please create an image named 'login-mascot.webp' 
          and place it in the 'public/images' folder.
        */}
        <img src="/images/login-mascot.webp" width="250" height="auto" alt="SI MAUNG Mascot" />
        <h2>Kelola Keuangan Anda dengan Auman!</h2>
        <p>SI MAUNG membantu Anda melacak setiap transaksi dan mencapai tujuan keuangan Anda dengan wawasan cerdas.</p>
      </div>
      <div className={styles.authFormContainer}>
        <Card className={styles.authCard}>
          <div className={styles.authHeader}>
            <div className={styles.authBrand}>
              <img src="/images/logo-simang.webp" alt="SI MAUNG Logo" />
            </div>
            <h1>Selamat Datang Kembali!</h1>
            <p>Masuk untuk melanjutkan ke SI MAUNG.</p>
          </div>

          {error && <p className={styles.formError}>{error}</p>}

          <form onSubmit={handleSubmit} className={styles.authForm}>
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
              placeholder="Masukkan kata sandi Anda"
              value={form.password}
              onChange={handleChange}
              required
            />
            <Button type="submit" disabled={loadingState || loading} variant="primary" size="lg">
              {loadingState || loading ? "Masuk..." : "Masuk"}
            </Button>
          </form>
          
          <p className={styles.authFooter}>
            <Link to="/forgot-password">Lupa kata sandi?</Link>
          </p>

          <p className={styles.authFooter}>
            Belum punya akun? <Link to="/register">Daftar sekarang</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

export default Login;
