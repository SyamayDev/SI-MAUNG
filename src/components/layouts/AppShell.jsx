import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Mic, MoreHorizontal, PenLine } from "lucide-react";
import Logo from "../ui/Logo";
import ThemeToggle from "../ui/ThemeToggle";
import Dialog from "../ui/Dialog";
import { NAV_ITEMS } from "./navItems";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";

const MOBILE_PRIMARY = ["/dashboard", "/transactions", "/savings"];

function useLogout() {
  const { logout } = useAuth();
  const showToast = useToast();
  return async () => {
    const { error } = await logout();
    if (error) showToast(error, { type: "error" });
  };
}

function Sidebar() {
  const { displayName, user } = useAuth();
  const { openCapture, openManual } = useModal();
  const logout = useLogout();
  return (
    <aside className="sidebar on-stage" aria-label="Navigasi utama">
      <Link to="/dashboard" className="sidebar__brand" aria-label="SI-MAUNG — Beranda">
        <Logo size={40} />
      </Link>

      <div className="sidebar__cta">
        <button type="button" className="btn btn--amber btn--lg btn--block" onClick={() => openCapture()}>
          <Mic size={20} aria-hidden="true" /> Catat dengan suara
        </button>
        <button type="button" className="btn btn--sm btn--block" onClick={() => openManual()}>
          <PenLine size={16} aria-hidden="true" /> Isi manual
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="sidebar__link">
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__foot">
        <div className="sidebar__theme">
          <span>Tema tampilan</span>
          <ThemeToggle />
        </div>
        <div className="sidebar__user">
          <span className="avatar" aria-hidden="true">
            {(displayName || user?.email || "?").trim()[0]?.toUpperCase()}
          </span>
          <span className="sidebar__user-meta">
            <strong>{displayName || "Pengguna"}</strong>
            <small>{user?.email}</small>
          </span>
        </div>
        <button type="button" className="sidebar__link sidebar__logout" onClick={logout}>
          <LogOut size={20} aria-hidden="true" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}

function MobileBar({ stage }) {
  const { displayName, user } = useAuth();
  return (
    <header className={`mobilebar ${stage ? "mobilebar--stage on-stage" : ""}`}>
      <Link to="/dashboard" aria-label="SI-MAUNG — Beranda">
        <Logo size={34} />
      </Link>
      <div className="mobilebar__actions">
        <ThemeToggle />
        <Link to="/settings" className="avatar avatar--link" aria-label="Pengaturan akun">
          {(displayName || user?.email || "?").trim()[0]?.toUpperCase()}
        </Link>
      </div>
    </header>
  );
}

function BottomNav() {
  const { openCapture } = useModal();
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const logout = useLogout();
  const primary = NAV_ITEMS.filter((n) => MOBILE_PRIMARY.includes(n.to));
  const more = NAV_ITEMS.filter((n) => !MOBILE_PRIMARY.includes(n.to));
  const moreActive = more.some((n) => pathname.startsWith(n.to));

  const link = ({ to, label, icon: Icon }) => (
    <NavLink key={to} to={to} className="bottomnav__link">
      <Icon size={22} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <>
      <nav className="bottomnav" aria-label="Navigasi utama">
        {link(primary[0])}
        {link(primary[1])}
        <button type="button" className="bottomnav__mic" onClick={() => openCapture()} aria-label="Catat transaksi dengan suara">
          <Mic size={26} aria-hidden="true" />
        </button>
        {link(primary[2])}
        <button
          type="button"
          className={`bottomnav__link ${moreActive ? "active" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-current={moreActive ? "page" : undefined}
        >
          <MoreHorizontal size={22} aria-hidden="true" />
          <span>Lainnya</span>
        </button>
      </nav>
      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu lainnya" width={420}>
        <nav className="more-menu" aria-label="Menu lainnya">
          {more.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="more-menu__link" onClick={() => setMoreOpen(false)}>
              <Icon size={20} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            className="more-menu__link more-menu__logout"
            onClick={() => {
              setMoreOpen(false);
              logout();
            }}
          >
            <LogOut size={20} aria-hidden="true" />
            Keluar
          </button>
        </nav>
      </Dialog>
    </>
  );
}

/** Signed-in layout: sidebar on desktop, top bar + bottom navigation on phones/tablets. */
export default function AppShell() {
  const { pathname } = useLocation();
  const stage = pathname.startsWith("/dashboard");
  return (
    <div className={`shell ${stage ? "shell--stage" : ""}`}>
      <a href="#main" className="skip-link">
        Lewati ke konten
      </a>
      <Sidebar />
      <MobileBar stage={stage} />
      <main id="main" className="shell__main" tabIndex={-1}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
