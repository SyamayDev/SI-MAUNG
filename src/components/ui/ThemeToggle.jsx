import { Monitor, Moon, Sun } from "lucide-react";
import { nextThemePreference, THEME_LABELS as LABEL, useTheme } from "../../lib/theme";
const ICON = { light: Sun, dark: Moon, system: Monitor };

/** Cycles Terang → Gelap → Ikuti sistem. The current choice is announced. */
export default function ThemeToggle({ className = "" }) {
  const { preference, setPreference } = useTheme();
  const next = nextThemePreference(preference);
  const Icon = ICON[preference];
  const label = `Tema: ${LABEL[preference]}. Ganti ke ${LABEL[next]}`;
  return (
    <button type="button" className={`theme-toggle ${className}`} onClick={() => setPreference(next)} aria-label={label} title={label}>
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}

