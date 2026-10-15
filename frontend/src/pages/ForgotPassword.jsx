import { useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../lib/api";
import AuthShowcase from "../components/AuthShowcase";
import ThemeToggle from "../components/ui/ThemeToggle";
import Button from "../components/ui/Button";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetInfo, setResetInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setResetInfo(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not send reset link"));
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
              Reset password
            </h1>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Enter your registered email and we'll generate a secure 15-minute reset token.
            </p>
          </div>

          {resetInfo ? (
            <div className="rounded-2xl border border-primary/30 bg-surface p-5 space-y-4 animate-modal-in shadow-card">
              <div className="flex items-center gap-2.5 text-primary text-sm font-semibold">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Reset Token Active</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                A secure password reset link has been generated for your account:
              </p>
              <Link
                to={`/reset-password?token=${resetInfo.token}`}
                className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-xs font-semibold text-primary hover:bg-primary/20 transition-all"
              >
                <span>Click here to set new password</span>
                <ArrowRight className="h-4 w-4" />
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
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
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
                disabled={loading || !email.trim()}
              >
                Send Reset Link
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
