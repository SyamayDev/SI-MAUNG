import { Link } from "react-router-dom";
import Logo from "../ui/Logo";
import { asset } from "../../lib/assets";

/** Split auth layout: night brand panel with MAUNG, paper form side. Stacks on phones. */
export default function AuthLayout({ title, subtitle, art = "images/login-mascot.webp", tagline, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth__brand on-night">
        <Link to="/" className="auth__logo" aria-label="SI-MAUNG — halaman utama">
          <Logo size={40} />
        </Link>
        <div className="auth__art">
          <img src={asset(art)} alt="" width="400" height="560" />
        </div>
        <p className="auth__tagline display">{tagline || <>Catat uangmu <span className="accent-italic">cukup dengan suara.</span></>}</p>
      </aside>
      <main className="auth__main">
        <div className="auth__card">
          <h1 className="auth__title">{title}</h1>
          {subtitle && <p className="auth__subtitle">{subtitle}</p>}
          {children}
        </div>
        {footer && <p className="auth__footer">{footer}</p>}
      </main>
    </div>
  );
}
