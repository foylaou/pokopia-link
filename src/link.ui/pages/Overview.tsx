import StatusBadge from "@/components/shared/StatusBadge";
import { Wifi, Network, MonitorSmartphone } from "lucide-react";

function StatusCard({
  title,
  icon: Icon,
  status,
  detail,
}: {
  title: string;
  icon: React.FC<{ className?: string }>;
  status: "online" | "connecting" | "offline" | "na";
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <StatusBadge status={status} />
      </div>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

export default function Overview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ZeroTier / Hotspot / Bridge 狀態一覽
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="ZeroTier"
          icon={Network}
          status="na"
          detail="尚未偵測到 ZeroTier One"
        />
        <StatusCard
          title="Hotspot"
          icon={Wifi}
          status="na"
          detail="Hosted Network 未啟動"
        />
        <StatusCard
          title="Bridge"
          icon={MonitorSmartphone}
          status="na"
          detail="Network Bridge 未建立"
        />
      </div>
    </div>
  );
}
