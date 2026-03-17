import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/useAppStore";
import { useAutostart } from "@/hooks/useAutostart";
import {
  User,
  Rocket,
  PanelTop,
  Gamepad2,
  LogOut,
  LogIn,
  Loader2,
} from "lucide-react";

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  defaultChecked,
}: {
  id: string;
  label: string;
  description: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        defaultChecked={defaultChecked}
      />
    </div>
  );
}

export default function Settings() {
  const {
    loggedIn, authLoading: loading, authSaving: saving, authError,
    saveToken, logout,
    discordConnected, discordConnecting, discordConnect, discordDisconnect,
  } = useAppStore();
  const autostart = useAutostart();
  const [tokenInput, setTokenInput] = useState("");

  const handleSaveToken = async () => {
    const ok = await saveToken(tokenInput);
    if (ok) setTokenInput("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">應用程式設定</p>
      </div>

      <div className="space-y-4">
        {/* Account */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-sm">ZeroTier Central</CardTitle>
              </div>
              {loggedIn && <Badge variant="secondary">Connected</Badge>}
            </div>
            <CardDescription>
              前往 my.zerotier.com → Account → API Access Tokens 建立 Token
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">檢查登入狀態...</p>
            ) : loggedIn ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-emerald-500">API Token 已設定</p>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                  Remove Token
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="api-token">API Access Token</Label>
                  <Input
                    id="api-token"
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste your token here"
                  />
                </div>
                {authError && (
                  <p className="text-xs text-destructive">{authError}</p>
                )}
                <Button
                  onClick={handleSaveToken}
                  disabled={!tokenInput.trim() || saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {saving ? "Verifying..." : "Save Token"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* General */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-sm">General</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <ToggleRow
              id="autostart"
              label="Auto Start"
              description="開機時自動啟動並最小化至系統匣"
              checked={autostart.enabled}
              onCheckedChange={autostart.toggle}
            />
            <Separator />
            <ToggleRow
              id="minimize-to-tray"
              label="Minimize to Tray"
              description="關閉視窗時最小化至系統匣"
              defaultChecked
            />
          </CardContent>
        </Card>

        {/* Float Window */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PanelTop className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-sm">Float Window</CardTitle>
            </div>
            <CardDescription>浮動視窗顯示項目</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <ToggleRow
              id="float-ping"
              label="Ping Chart"
              description="顯示即時延遲折線圖"
            />
            <Separator />
            <ToggleRow
              id="float-zt-status"
              label="ZeroTier Status"
              description="顯示 ZeroTier 連線狀態"
            />
            <Separator />
            <ToggleRow
              id="float-hotspot"
              label="Hotspot Clients"
              description="顯示熱點連線裝置數量"
            />
            <Separator />
            <ToggleRow
              id="float-bridge"
              label="Bridge Status"
              description="顯示 Bridge 是否正常"
            />
          </CardContent>
        </Card>

        {/* Discord Rich Presence */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-sm">Discord</CardTitle>
              </div>
              {discordConnected && (
                <Badge variant="secondary">Connected</Badge>
              )}
            </div>
            <CardDescription>
              Rich Presence — 在 Discord 顯示遊玩狀態，朋友可直接邀請加入
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {discordConnected ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-emerald-500">已連線至 Discord</p>
                <Button variant="ghost" size="sm" onClick={discordDisconnect}>
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={discordConnect} disabled={discordConnecting}>
                {discordConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Gamepad2 className="w-4 h-4" />
                )}
                {discordConnecting ? "Connecting..." : "Connect to Discord"}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              連線後加入房間會自動更新 Discord 狀態，朋友可透過 "+" 按鈕邀請加入
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
