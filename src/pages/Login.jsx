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
    <div className={styles.authContainer}>
      <Card className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authBrand}>MT</div>
          <h1>Welcome Back!</h1>
          <p>Log in to continue managing your finances.</p>
        </div>

        {error && <p className={styles.formError}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <Input
            label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <Button type="submit" disabled={loadingState || loading} variant="primary" size="lg">
            {loadingState || loading ? "Logging In..." : "Log In"}
          </Button>
        </form>
        
        <p className={styles.authFooter}>
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <p className={styles.authFooter}>
          Don't have an account? <Link to="/register">Sign up now</Link>
        </p>
      </Card>
    </div>
  );
}

export default Login;
