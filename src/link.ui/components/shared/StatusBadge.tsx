import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/types";

const statusConfig: Record<
  ConnectionStatus,
  { color: string; label: string }
> = {
  online: { color: "bg-emerald-500", label: "Online" },
  connecting: { color: "bg-amber-400", label: "Connecting" },
  offline: { color: "bg-red-500", label: "Offline" },
  na: { color: "bg-zinc-500", label: "N/A" },
};

interface StatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", config.color)} />
      {config.label}
    </span>
  );
}
