import { User, Rocket, PanelTop, MessageSquare } from "lucide-react";

function SettingSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked = false,
}: {
  label: string;
  description: string;
  checked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-secondary"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">應用程式設定</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <SettingSection title="Account" icon={User}>
          <div className="text-sm text-muted-foreground">
            ZeroTier Central 尚未登入
          </div>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Login with ZeroTier
          </button>
        </SettingSection>

        <SettingSection title="General" icon={Rocket}>
          <ToggleRow
            label="Auto Start"
            description="開機時自動啟動並最小化至系統匣"
          />
          <ToggleRow
            label="Minimize to Tray"
            description="關閉視窗時最小化至系統匣"
            checked
          />
        </SettingSection>

        <SettingSection title="Float Window" icon={PanelTop}>
          <ToggleRow label="Ping Chart" description="顯示即時延遲折線圖" />
          <ToggleRow
            label="ZeroTier Status"
            description="顯示 ZeroTier 連線狀態"
          />
          <ToggleRow label="Hotspot Clients" description="顯示熱點連線裝置數量" />
          <ToggleRow label="Bridge Status" description="顯示 Bridge 是否正常" />
        </SettingSection>

        <SettingSection title="Discord (Coming Soon)" icon={MessageSquare}>
          <div className="space-y-3 opacity-50">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Bot Token</label>
              <input
                disabled
                type="password"
                placeholder="••••••••"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Channel ID
              </label>
              <input
                disabled
                type="text"
                placeholder="000000000000000000"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </SettingSection>
      </div>
    </div>
  );
}
