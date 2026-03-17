import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ZeroTierEnvironment } from "@/types";

export type SetupStep =
  | "checking"
  | "not-installed"
  | "installing"
  | "service-stopped"
  | "starting-service"
  | "need-token"
  | "ready"
  | "error";

interface UseZeroTierEnvReturn {
  env: ZeroTierEnvironment | null;
  step: SetupStep;
  error: string | null;
  recheck: () => void;
}

const INITIAL_ENV: ZeroTierEnvironment = {
  installed: false,
  serviceRunning: false,
  apiReachable: false,
  authTokenAvailable: false,
  wingetAvailable: false,
};

export function useZeroTierEnv(): UseZeroTierEnvReturn {
  const [env, setEnv] = useState<ZeroTierEnvironment | null>(null);
  const [step, setStep] = useState<SetupStep>("checking");
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setStep("checking");
    setError(null);

    try {
      const result = await invoke<ZeroTierEnvironment>(
        "check_zerotier_environment",
      );
      setEnv(result);

      if (result.apiReachable && result.authTokenAvailable) {
        setStep("ready");
      } else if (result.apiReachable && !result.authTokenAvailable) {
        setStep("need-token");
      } else if (result.serviceRunning) {
        // Service is running but API not reachable yet — may be starting up
        setStep("starting-service");
      } else if (result.installed) {
        setStep("service-stopped");
      } else {
        setStep("not-installed");
      }
    } catch (e) {
      // Tauri API not available (browser dev mode) — use mock
      setEnv(INITIAL_ENV);
      setStep("not-installed");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { env, step, error, recheck: check };
}
