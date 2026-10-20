import { Moon, Sun } from "lucide-react";
import { toggleTheme, useTheme } from "../../lib/theme";

/** One button: shows the active theme (moon = gelap, sun = terang) and switches to the other. */
export default function ThemeToggle({ className = "" }) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const Icon = dark ? Moon : Sun;
  const label = dark ? "Tema gelap aktif. Ganti ke tema terang" : "Tema terang aktif. Ganti ke tema gelap";
  return (
    <button type="button" className={`theme-toggle ${className}`} onClick={toggleTheme} aria-label={label} title={label}>
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
