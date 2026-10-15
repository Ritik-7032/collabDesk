import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle color theme"
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-elevated text-muted hover:text-text hover:border-muted/50 transition-all duration-150 active:scale-95 cursor-pointer ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-200 rotate-0 scale-100 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-200 rotate-0 scale-100 text-indigo-500" />
      )}
    </button>
  );
}

export default ThemeToggle;
