import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

interface UseAuthReturn {
  loggedIn: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveToken: (token: string) => Promise<boolean>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoke<{ logged_in: boolean }>("get_auth_state")
      .then((state) => setLoggedIn(state.logged_in))
      .catch(() => setLoggedIn(false))
      .finally(() => setLoading(false));
  }, []);

  const saveToken = useCallback(async (token: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await invoke("save_api_token", { token });
      setLoggedIn(true);
      return true;
    } catch (e) {
      setError(typeof e === "string" ? e : String(e));
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await invoke("logout");
      setLoggedIn(false);
      setError(null);
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }, []);

  return { loggedIn, loading, saving, error, saveToken, logout };
}
