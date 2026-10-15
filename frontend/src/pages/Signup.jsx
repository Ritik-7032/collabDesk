import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../lib/api";
import AuthShowcase from "../components/AuthShowcase";
import ThemeToggle from "../components/ui/ThemeToggle";
import Button from "../components/ui/Button";
import { Lock, Mail, User } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signup({ name, email, password });
    setLoading(false);
    if (res.ok) {
      toast.success("Account created successfully — sign in to continue");
      navigate("/login");
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg text-text font-sans">
      <AuthShowcase />

      <div className="flex flex-1 flex-col justify-between p-6 sm:p-10 lg:p-12">
        {/* Top header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white font-bold text-xs shadow-sm">
              CD
            </span>
            <span className="font-semibold text-sm tracking-tight text-text">CollabDesk</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Center Signup Form */}
        <div className="mx-auto w-full max-w-sm my-auto py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Create your account
            </h1>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Start collaborating with real-time Kanban boards in seconds.
            </p>
          </div>

          {/* Google OAuth Button */}
          <a
            href={`${API_BASE_URL}/api/auth/google`}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface hover:bg-elevated px-4 py-2.5 text-xs font-semibold text-text shadow-subtle transition-all duration-150 hover:border-border/90 active:scale-[0.98] mb-5 cursor-pointer"
          >
            <GoogleIcon />
            <span>Sign up with Google</span>
          </a>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-border/80" />
            <span className="text-[11px] text-muted">or register with email</span>
            <div className="h-px flex-1 bg-border/80" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-xs text-danger leading-relaxed">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text tracking-tight">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Lee"
                  className="w-full rounded-xl border border-border bg-elevated pl-10 pr-3.5 py-2.5 text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text tracking-tight">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-border bg-elevated pl-10 pr-3.5 py-2.5 text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text tracking-tight">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-border bg-elevated pl-10 pr-3.5 py-2.5 text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Create free account
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Bottom Terms Note */}
        <p className="text-center text-[11px] text-muted">
          By registering you agree to CollabDesk's Terms of Service &middot; Free tier included
        </p>
      </div>
    </div>
  );
}
