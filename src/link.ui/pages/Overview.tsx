import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import SetupWizard from "@/components/shared/SetupWizard";
import { useZeroTierEnv } from "@/hooks/useZeroTierEnv";
import { useZeroTierStatus } from "@/hooks/useZeroTierStatus";
import type { ConnectionStatus, HotspotStatus, BridgeStatus } from "@/types";
import { Network, Wifi, MonitorSmartphone } from "lucide-react";

interface StatusCardProps {
  title: string;
  icon: React.FC<{ className?: string }>;
  status: ConnectionStatus;
  detail: string;
}

function StatusCard({ title, icon: Icon, status, detail }: StatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-sm">{title}</CardTitle>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{detail}</CardDescription>
      </CardContent>
    </Card>
  );
}

export default function Overview() {
  const { env, step, error, recheck } = useZeroTierEnv();
  const isReady = step === "ready";
  const { connectionStatus } = useZeroTierStatus(isReady);

  const [hotspot, setHotspot] = useState<HotspotStatus | null>(null);
  const fetchHotspot = useCallback(async () => {
    try {
      setHotspot(await invoke<HotspotStatus>("hotspot_status"));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    fetchHotspot();
    const id = setInterval(fetchHotspot, 5000);
    return () => clearInterval(id);
  }, [fetchHotspot]);

  const hotspotStatus: ConnectionStatus = hotspot?.running ? "online" : "na";
  const hotspotDetail = hotspot?.running
    ? `${hotspot.ssid} — ${hotspot.clientCount} 個裝置連線`
    : "行動熱點未啟動";

  const [bridge, setBridge] = useState<BridgeStatus | null>(null);
  const fetchBridge = useCallback(async () => {
    try {
      setBridge(await invoke<BridgeStatus>("bridge_status"));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    fetchBridge();
    const id = setInterval(fetchBridge, 5000);
    return () => clearInterval(id);
  }, [fetchBridge]);

  const bridgeStatus: ConnectionStatus = bridge?.active ? "online" : "na";
  const bridgeDetail = bridge?.active
    ? `Bridge 運行中 — ${bridge.interfaces.join(", ")}`
    : "Network Bridge 未建立";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ZeroTier / Hotspot / Bridge 狀態一覽
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="ZeroTier"
          icon={Network}
          status={isReady ? connectionStatus : "na"}
          detail={
            isReady ? "ZeroTier One 已連線" : "尚未偵測到 ZeroTier One"
          }
        />
        <StatusCard
          title="Hotspot"
          icon={Wifi}
          status={hotspotStatus}
          detail={hotspotDetail}
        />
        <StatusCard
          title="Bridge"
          icon={MonitorSmartphone}
          status={bridgeStatus}
          detail={bridgeDetail}
        />
      </div>

      {/* Setup wizard — shown when ZeroTier is not ready */}
      {!isReady && (
        <SetupWizard
          step={step}
          env={env}
          error={error}
          onRecheck={recheck}
        />
      )}
    </div>
  );
}
