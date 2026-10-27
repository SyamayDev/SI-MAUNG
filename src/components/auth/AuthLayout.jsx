import { useRef } from "react";
import { Link } from "react-router-dom";
import Logo from "../ui/Logo";
import ThemeToggle from "../ui/ThemeToggle";
import FullscreenToggle from "../ui/FullscreenToggle";
import { asset } from "../../lib/assets";
import { useMaung3D } from "../scene/sceneHooks";
import { useMaungFrame } from "../scene/useMaungFrame";

/**
 * Split auth layout. The brand side is see-through: the persistent 3D layer
 * draws MAUNG inside .auth__art with the pose this page asks for. Only when
 * 3D is unavailable is the 2D illustration (`art`) shown there instead.
 */
export default function AuthLayout({ title, subtitle, art = "images/login-mascot.webp", pose = "wave", tagline, children, footer }) {
  const frameRef = useRef(null);
  useMaungFrame(frameRef, pose);
  const { available } = useMaung3D();

  return (
    <div className="auth">
      <aside className="auth__brand on-stage">
        <Link to="/" className="auth__logo" aria-label="SI-MAUNG — halaman utama">
          <Logo size={40} />
        </Link>
        <span className="auth__tools">
          <ThemeToggle />
          <FullscreenToggle />
        </span>
        <div className="auth__art" ref={frameRef} data-maung-frame>
          {!available && <img src={asset(art)} alt="" width="400" height="560" />}
        </div>
        <p className="auth__tagline display">{tagline || <>Catat uang, <span className="accent-italic">cukup ngomong.</span></>}</p>
      </aside>
      <main className="auth__main" id="main">
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
