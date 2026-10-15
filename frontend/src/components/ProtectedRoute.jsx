import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconLoader } from "./Icons";

function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-amber">
        <IconLoader className="text-2xl" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
