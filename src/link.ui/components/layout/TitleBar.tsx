import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

const appWindow = getCurrentWindow();

function WindowButton({
  onClick,
  children,
  variant = "default",
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "close";
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-sm transition-colors ${
        variant === "close"
          ? "hover:bg-destructive hover:text-white"
          : "hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

export default function TitleBar() {
  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between h-10 px-4 bg-card select-none shrink-0"
    >
      <div className="flex items-center gap-2" data-tauri-drag-region>
        <span className="text-sm font-semibold tracking-tight">
          Pokopia Link
        </span>
        <span className="text-xs text-muted-foreground">v0.1.0</span>
      </div>

      <div className="flex items-center">
        <WindowButton onClick={() => appWindow.minimize()}>
          <Minus className="w-4 h-4" />
        </WindowButton>
        <WindowButton onClick={() => appWindow.toggleMaximize()}>
          <Square className="w-3 h-3" />
        </WindowButton>
        <WindowButton variant="close" onClick={() => appWindow.close()}>
          <X className="w-4 h-4" />
        </WindowButton>
      </div>
    </div>
  );
}
