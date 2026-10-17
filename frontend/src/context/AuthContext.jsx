import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api, { getErrorMessage } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      return res.data;
    } catch {
      localStorage.removeItem("token");
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setInitializing(false));
  }, [refreshUser]);

  const login = (token, userData) => {
    if (token) localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem("token");
    setUser(null);
  };

  const signup = async ({ name, email, password }) => {
    try {
      await api.post("/auth/signup", { name, email, password });
      return { ok: true };
    } catch (err) {
      return { ok: false, message: getErrorMessage(err, "Signup failed") };
    }
  };

  const loginWithPassword = async ({ email, password }) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.token, res.data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: getErrorMessage(err, "Login failed") };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        initializing,
        login,
        logout,
        signup,
        loginWithPassword,
        refreshUser,
        isPremium: user?.plan === "premium",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
