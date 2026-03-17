import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

interface UseAutostartReturn {
  enabled: boolean;
  loading: boolean;
  toggle: () => void;
}

export function useAutostart(): UseAutostartReturn {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<boolean>("plugin:autostart|is_enabled")
      .then(setEnabled)
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (enabled) {
        await invoke("plugin:autostart|disable");
        setEnabled(false);
      } else {
        await invoke("plugin:autostart|enable");
        setEnabled(true);
      }
    } catch (e) {
      console.error("Autostart toggle failed:", e);
    }
  }, [enabled]);

  return { enabled, loading, toggle };
}
