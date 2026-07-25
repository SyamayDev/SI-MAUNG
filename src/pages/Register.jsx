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
      setError("Passwords do not match.");
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

    if (data.session) {
      navigate("/dashboard");
    } else {
      setSuccess("Account created successfully! Please check your email for verification.");
    }
  };

  return (
    <div className={styles.authContainer}>
      <Card className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authBrand}>MT</div>
          <h1>Create your MoneyTalk Account</h1>
          <p>Start understanding where your money goes.</p>
        </div>

        {error && <p className={styles.formError}>{error}</p>}
        {success && <p className={styles.formSuccess}>{success}</p>}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <Input
            label="Full Name"
            id="fullName"
            name="fullName"
            type="text"
            placeholder="e.g., John Doe"
            value={form.fullName}
            onChange={handleChange}
            required
          />
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
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />
           <Input
            label="Confirm Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={handleChange}
            minLength={6}
            required
          />
          <Button type="submit" disabled={loadingState || loading} variant="primary" size="lg">
            {loadingState || loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <p className={styles.authFooter}>
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </Card>
    </div>
  );
}

export default Register;
