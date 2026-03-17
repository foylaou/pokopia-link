import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePolling } from "./usePolling";
import type { ZeroTierStatus, ConnectionStatus } from "@/types";

interface UseZeroTierStatusReturn {
  status: ZeroTierStatus | null;
  connectionStatus: ConnectionStatus;
}

export function useZeroTierStatus(
  enabled = true,
  intervalMs = 5000,
): UseZeroTierStatusReturn {
  const [status, setStatus] = useState<ZeroTierStatus | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("na");

  const poll = useCallback(async () => {
    try {
      const result = await invoke<ZeroTierStatus>("zt_get_status");
      setStatus(result);
      setConnectionStatus(result.online ? "online" : "connecting");
    } catch {
      setStatus(null);
      setConnectionStatus(enabled ? "offline" : "na");
    }
  }, [enabled]);

  usePolling(poll, intervalMs, enabled);

  return { status, connectionStatus };
}
