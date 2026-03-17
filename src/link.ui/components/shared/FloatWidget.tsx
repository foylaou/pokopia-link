import { getCurrentWindow } from "@tauri-apps/api/window";
import StatusBadge from "@/components/shared/StatusBadge";
import { GripVertical, X } from "lucide-react";

export default function FloatWidget() {
  const handleClose = () => {
    try {
      getCurrentWindow().hide();
    } catch {
      // Browser dev mode — no-op
    }
  };

  return (
    <div className="flex flex-col h-screen bg-card text-foreground rounded-lg overflow-hidden border border-border">
      {/* Drag handle */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between h-8 px-2 bg-card shrink-0 select-none"
      >
        <div className="flex items-center gap-1" data-tauri-drag-region>
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Pokopia Link
          </span>
        </div>
        <button
          onClick={handleClose}
          className="inline-flex items-center justify-center w-5 h-5 rounded-sm hover:bg-secondary"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 space-y-3 overflow-auto">
        {/* ZeroTier Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">ZeroTier</span>
          <StatusBadge status="na" />
        </div>

        {/* Hotspot */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Hotspot</span>
          <span className="text-xs">0 devices</span>
        </div>

        {/* Bridge */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Bridge</span>
          <StatusBadge status="na" />
        </div>

        {/* Ping chart placeholder */}
        <div className="rounded-md border border-border bg-background p-2">
          <p className="text-[10px] text-muted-foreground text-center">
            Ping — ms
          </p>
          <div className="h-24 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
