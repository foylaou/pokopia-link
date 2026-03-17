import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { Minus, Square, X, PanelTop } from "lucide-react";

function WindowButton({
  onClick,
  children,
  variant = "default",
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "close";
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
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
  const handleMinimize = () => getCurrentWindow().minimize();
  const handleMaximize = () => getCurrentWindow().toggleMaximize();
  const handleClose = () => getCurrentWindow().close();
  const handleToggleFloat = () => {
    invoke("toggle_float_window").catch(() => {});
  };
  const handleDrag = (e: React.MouseEvent) => {
    // Only drag on left mouse button, not on interactive elements
    if (e.button !== 0) return;
    getCurrentWindow().startDragging().catch(() => {});
  };

  return (
    <div
      onMouseDown={handleDrag}
      className="flex items-center justify-between h-10 px-4 bg-card select-none shrink-0"
    >
      <div className="flex items-center gap-2 pointer-events-none">
        <span className="text-sm font-semibold tracking-tight">
          Pokopia Link
        </span>
        <span className="text-xs text-muted-foreground">v0.1.0</span>
      </div>

      <div className="flex items-center">
        <WindowButton onClick={handleToggleFloat} title="Toggle Float Window">
          <PanelTop className="w-4 h-4" />
        </WindowButton>
        <WindowButton onClick={handleMinimize} title="Minimize">
          <Minus className="w-4 h-4" />
        </WindowButton>
        <WindowButton onClick={handleMaximize} title="Maximize">
          <Square className="w-3 h-3" />
        </WindowButton>
        <WindowButton variant="close" onClick={handleClose} title="Close">
          <X className="w-4 h-4" />
        </WindowButton>
      </div>
    </div>
  );
}
