import { useState } from "react";
import api, { getErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { CheckCircle2, Crown, ShieldCheck, X } from "lucide-react";
import Button from "./ui/Button";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PERKS = [
  "Unlimited AI subtask breakdowns with Google Gemini",
  "Zero-latency real-time collaboration across multiple devices",
  "Direct-to-S3 file uploads with high performance",
  "Slack incoming webhook notifications for team channels",
  "Unlimited team member invitations and workspace boards",
];

export default function UpgradeModal({ onClose }) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        toast.error("Couldn't load payment gateway. Check your connection.");
        setLoading(false);
        return;
      }

      const { data: order } = await api.post("/payment/create-order");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "CollabDesk",
        description: "Premium plan upgrade",
        order_id: order.id,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#4F46E5" },
        handler: async (response) => {
          try {
            await api.post("/payment/verify-payment", response);
            await refreshUser();
            toast.success("Welcome to CollabDesk Premium!");
            onClose();
          } catch (err) {
            toast.error(getErrorMessage(err, "Payment verification failed"));
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setLoading(false);
      });

      rzp.open();
      setLoading(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't start checkout"));
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md animate-modal-in rounded-2xl border border-border bg-surface text-text shadow-elevated z-10 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/80 px-6 py-5 bg-surface">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-text tracking-tight">CollabDesk Pro</h2>
              <p className="text-xs text-muted mt-0.5">Lifetime individual & team upgrade</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:text-text hover:bg-elevated transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Pricing Content */}
        <div className="p-6 space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Lifetime Access
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-bold tracking-tight text-text">₹499</span>
                <span className="text-xs text-muted">one-time payment</span>
              </div>
            </div>
            <span className="rounded-full bg-primary/15 text-primary text-[11px] font-semibold px-2.5 py-1 border border-primary/25">
              Best Value
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-text tracking-tight">Everything in Pro:</p>
            <ul className="space-y-2.5">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-xs text-muted leading-relaxed">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              icon={Crown}
              loading={loading}
              onClick={handleUpgrade}
            >
              {loading ? "Launching checkout…" : "Upgrade Now for ₹499"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-muted" /> Secured 256-bit encryption by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
