import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api, { getErrorMessage } from "../lib/api";
import { useToast } from "../context/ToastContext";
import AuthShowcase from "../components/AuthShowcase";
import ThemeToggle from "../components/ui/ThemeToggle";
import Button from "../components/ui/Button";
import { ArrowLeft, Lock } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing or invalid reset token in URL");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", { token, password });
      toast.success(res.data.message || "Password updated successfully — please sign in");
      navigate("/login");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg text-text font-sans">
      <AuthShowcase />

      <div className="flex flex-1 flex-col justify-between p-6 sm:p-10 lg:p-12">
        <div className="flex items-center justify-between">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-sm my-auto py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Set new password
            </h1>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Choose a strong password with at least 6 characters.
            </p>
          </div>

          {!token ? (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 p-5 text-xs text-danger space-y-2 shadow-subtle">
              <p className="font-semibold text-sm">Invalid Reset Token</p>
              <p className="leading-relaxed">No reset token was found in this link or it has expired.</p>
              <Link
                to="/forgot-password"
                className="inline-block mt-2 font-semibold text-primary hover:underline"
              >
                Request a new password reset link &rarr;
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-xs text-danger leading-relaxed">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text tracking-tight">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-xl border border-border bg-elevated pl-10 pr-3.5 py-2.5 text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text tracking-tight">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
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
                Reset &amp; Save Password
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-muted">
            Remembered your password?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-muted">
          CollabDesk Identity Security &middot; Encrypted SHA-256 Tokens
        </p>
      </div>
    </div>
  );
}
