import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, LogIn, Menu, Mic, PiggyBank, ShieldCheck, UserPlus, Wallet, X } from "lucide-react";
import { scrollToChapter } from "../../lib/scrollStory";

const SECTIONS = [
  { chapter: 1, label: "Catat dengan suara", icon: Mic },
  { chapter: 2, label: "Pemasukan & pengeluaran", icon: Wallet },
  { chapter: 3, label: "Analitik", icon: BarChart3 },
  { chapter: 4, label: "Tabungan", icon: PiggyBank },
  { chapter: 5, label: "Privasi", icon: ShieldCheck },
];

/** Landing menu: account actions + jump to a chapter. Esc / outside click closes; focus returns to the button. */
export default function LandingMenu() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    panelRef.current?.querySelector("a, button")?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e) => {
      if (!panelRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const go = (chapter) => {
    setOpen(false);
    scrollToChapter(chapter);
  };

  return (
    <div className="site-menu">
      <button ref={buttonRef} type="button" className="round-btn" aria-expanded={open} aria-controls={id} aria-label={open ? "Tutup menu" : "Buka menu"} onClick={() => setOpen((v) => !v)}>
        {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>
      <div ref={panelRef} id={id} className="site-menu__panel" hidden={!open}>
        <div className="site-menu__account">
          <Link to="/register" className="btn btn--amber btn--block">
            <UserPlus size={19} aria-hidden="true" /> Daftar gratis
          </Link>
          <Link to="/login" className="btn btn--block">
            <LogIn size={19} aria-hidden="true" /> Masuk
          </Link>
        </div>
        <nav aria-label="Bagian halaman">
          <ul className="site-menu__list">
            {SECTIONS.map(({ chapter, label, icon: Icon }) => (
              <li key={chapter}>
                <button type="button" className="site-menu__link" onClick={() => go(chapter)}>
                  <span className="site-menu__icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
