import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePolling } from "./usePolling";
import type { PingResult, PingHistoryEntry } from "@/types";

const MAX_HISTORY = 60;

interface PingStats {
  min: number | null;
  max: number | null;
  avg: number | null;
  lossPercent: number;
}

interface UsePingMonitorReturn {
  history: PingHistoryEntry[];
  stats: PingStats;
  isRunning: boolean;
  start: (host: string) => void;
  stop: () => void;
}

function calcStats(history: PingHistoryEntry[]): PingStats {
  if (history.length === 0)
    return { min: null, max: null, avg: null, lossPercent: 0 };

  const latencies = history
    .map((h) => h.latencyMs)
    .filter((v): v is number => v !== null);

  const lost = history.length - latencies.length;

  return {
    min: latencies.length ? Math.min(...latencies) : null,
    max: latencies.length ? Math.max(...latencies) : null,
    avg: latencies.length
      ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10
      : null,
    lossPercent:
      history.length > 0
        ? Math.round((lost / history.length) * 1000) / 10
        : 0,
  };
}

export function usePingMonitor(intervalMs = 2000): UsePingMonitorReturn {
  const [host, setHost] = useState<string | null>(null);
  const [history, setHistory] = useState<PingHistoryEntry[]>([]);

  const poll = useCallback(async () => {
    if (!host) return;
    try {
      const result = await invoke<PingResult>("ping_peer", { host });
      setHistory((prev) => {
        const next = [
          ...prev,
          {
            timestamp: Date.now(),
            latencyMs: result.success ? (result.latencyMs ?? null) : null,
          },
        ];
        return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
      });
    } catch {
      setHistory((prev) => {
        const next = [...prev, { timestamp: Date.now(), latencyMs: null }];
        return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
      });
    }
  }, [host]);

  usePolling(poll, intervalMs, host !== null);

  const start = useCallback((target: string) => {
    setHistory([]);
    setHost(target);
  }, []);

  const stop = useCallback(() => {
    setHost(null);
  }, []);

  return {
    history,
    stats: calcStats(history),
    isRunning: host !== null,
    start,
    stop,
  };
}
