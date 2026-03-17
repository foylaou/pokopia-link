import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SetupStep } from "@/hooks/useZeroTierEnv";
import type { ZeroTierEnvironment } from "@/types";
import {
  Download,
  Play,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

interface SetupWizardProps {
  step: SetupStep;
  env: ZeroTierEnvironment | null;
  error: string | null;
  onRecheck: () => void;
}

const steps = [
  { key: "install", label: "ZeroTier Installed" },
  { key: "service", label: "Service Running" },
  { key: "api", label: "API Reachable" },
] as const;

function StepIndicator({
  done,
  active,
}: {
  done: boolean;
  active: boolean;
}) {
  if (done) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (active) return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
  return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
}

export default function SetupWizard({
  step,
  env,
  error,
  onRecheck,
}: SetupWizardProps) {
  const stepDone = {
    install: env?.installed ?? false,
    service: env?.serviceRunning ?? false,
    api: env?.apiReachable ?? false,
  };

  const activeStep =
    step === "checking" || step === "installing" || step === "starting-service"
      ? step
      : null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-sm">ZeroTier Setup Required</CardTitle>
        </div>
        <CardDescription>
          需要完成以下步驟才能使用 Pokopia Link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress steps */}
        <div className="space-y-3">
          {steps.map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <StepIndicator
                done={stepDone[s.key]}
                active={
                  (s.key === "install" &&
                    (activeStep === "checking" ||
                      activeStep === "installing")) ||
                  (s.key === "service" &&
                    activeStep === "starting-service" &&
                    stepDone.install) ||
                  (s.key === "api" &&
                    activeStep === "starting-service" &&
                    stepDone.service)
                }
              />
              <span
                className={`text-sm ${stepDone[s.key] ? "text-foreground" : "text-muted-foreground"}`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Actions based on current step */}
        {step === "not-installed" && (
          <div className="space-y-2">
            {env?.wingetAvailable ? (
              <Button className="w-full">
                <Download className="w-4 h-4" />
                Install ZeroTier via winget
              </Button>
            ) : (
              <Button variant="outline" className="w-full" asChild>
                <a
                  href="https://www.zerotier.com/download/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Download ZeroTier
                </a>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="w-full" onClick={onRecheck}>
              Re-check
            </Button>
          </div>
        )}

        {step === "service-stopped" && (
          <div className="space-y-2">
            <Button className="w-full">
              <Play className="w-4 h-4" />
              Start ZeroTier Service
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={onRecheck}>
              Re-check
            </Button>
          </div>
        )}

        {step === "checking" && (
          <p className="text-xs text-muted-foreground text-center">
            正在偵測環境...
          </p>
        )}

        {step === "installing" && (
          <p className="text-xs text-muted-foreground text-center">
            正在安裝 ZeroTier One...
          </p>
        )}

        {step === "starting-service" && (
          <p className="text-xs text-muted-foreground text-center">
            正在啟動 ZeroTier Service...
          </p>
        )}

        {step === "error" && error && (
          <div className="space-y-2">
            <p className="text-xs text-destructive">{error}</p>
            <Button variant="ghost" size="sm" className="w-full" onClick={onRecheck}>
              Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
