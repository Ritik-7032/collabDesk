import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const { refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const error = params.get("error");

    if (error) {
      toast.error("Google sign-in was canceled or failed");
      navigate("/login", { replace: true });
      return;
    }

    refreshUser().then((user) => {
      if (user) {
        toast.success(`Welcome back, ${user.name}`);
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    });
  }, [params, navigate, refreshUser, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-text gap-3 font-sans">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span className="text-muted text-sm font-medium">Completing secure sign in…</span>
    </div>
  );
}
