import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PlanBadge from "./PlanBadge";
import ThemeToggle from "./ui/ThemeToggle";
import { Avatar } from "./ui/Avatar";
import Button from "./ui/Button";
import {
  Crown,
  LogOut,
  ChevronDown,
  Layers,
} from "lucide-react";

function Logo() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white font-bold text-xs shadow-sm transition-transform duration-200 group-hover:scale-105">
        CD
      </span>
      <span className="font-semibold text-sm tracking-tight text-text group-hover:text-primary transition-colors">
        CollabDesk
      </span>
    </Link>
  );
}

export default function AppShell({ children, onUpgradeClick }) {
  const { user, logout, isPremium } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Left section: Logo & Nav */}
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  location.pathname === "/dashboard"
                    ? "bg-elevated text-text border border-border/80 shadow-subtle"
                    : "text-muted hover:text-text hover:bg-elevated/50"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Workspaces</span>
              </Link>
            </nav>
          </div>

          {/* Right section: Theme Toggle, Plan Badge, Upgrade CTA & Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle (Dark / Light) */}
            <ThemeToggle />

            {/* Plan Badge */}
            <div className="hidden sm:block">
              <PlanBadge premium={isPremium} />
            </div>

            {/* Upgrade CTA */}
            {!isPremium && onUpgradeClick && (
              <Button
                variant="primary"
                size="sm"
                icon={Crown}
                onClick={onUpgradeClick}
                className="hidden sm:inline-flex"
              >
                Upgrade
              </Button>
            )}

            {/* Profile Menu Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-label="User menu"
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-elevated border border-transparent hover:border-border transition-all cursor-pointer"
              >
                <Avatar name={user?.name || user?.email} size="sm" />
                <ChevronDown className="h-3.5 w-3.5 text-muted hidden sm:block" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 animate-modal-in rounded-2xl border border-border bg-surface p-2 shadow-elevated">
                  {/* User Info Header */}
                  <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/80 mb-1">
                    <Avatar name={user?.name || user?.email} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-text tracking-tight">
                        {user?.name || "Member"}
                      </p>
                      <p className="truncate text-[11px] text-muted">{user?.email}</p>
                    </div>
                  </div>

                  {/* Plan Badge in Mobile */}
                  <div className="px-3 py-2 sm:hidden flex items-center justify-between border-b border-border/60 mb-1">
                    <span className="text-xs text-muted">Current Plan:</span>
                    <PlanBadge premium={isPremium} />
                  </div>

                  {/* Upgrade CTA in Mobile */}
                  {!isPremium && onUpgradeClick && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onUpgradeClick();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-primary hover:bg-primary/10 transition-colors sm:hidden"
                    >
                      <Crown className="h-4 w-4" /> Upgrade to Pro
                    </button>
                  )}

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Canvas */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
