import { Wifi, QrCode, Power } from "lucide-react";

export default function Hotspot() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Hotspot</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Windows Hosted Network 控制
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Power className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-sm font-medium">Hotspot Control</h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">SSID</label>
              <input
                type="text"
                placeholder="PokopiaLink"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Start Hotspot
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-sm font-medium">WiFi QR Code</h2>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="w-48 h-48 rounded-lg border border-border bg-background flex items-center justify-center">
              <Wifi className="w-12 h-12 text-muted-foreground/30" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            啟動熱點後自動產生 QR Code
          </p>
        </div>
      </div>
    </div>
  );
}
