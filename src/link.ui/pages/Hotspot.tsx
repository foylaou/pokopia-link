import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
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
import {
  Wifi,
  WifiOff,
  ClipboardCopy,
  Check,
  Power,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import type { HotspotStatus } from "@/types";

export default function Hotspot() {
  const [ssid, setSsid] = useState("PokopiaLink");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<HotspotStatus | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const result = await invoke<HotspotStatus>("hotspot_status");
      setStatus(result);
      if (result.running && result.ssid) {
        setSsid(result.ssid);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      await invoke("start_hotspot", { ssid, password });
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError(null);
    try {
      await invoke("stop_hotspot");
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const text = `SSID: ${ssid}\nPassword: ${password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRunning = status?.running ?? false;

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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Power className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-sm">Hotspot Control</CardTitle>
            </div>
            <CardDescription>設定 SSID 與密碼後啟動熱點</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ssid">SSID</Label>
              <Input
                id="ssid"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                placeholder="PokopiaLink"
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 8 個字元"
                  disabled={isRunning}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {isRunning ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleStop}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                Stop Hotspot
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={handleStart}
                disabled={loading || password.length < 8}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
                Start Hotspot
              </Button>
            )}

            {isRunning && (
              <p className="text-xs text-emerald-500 text-center">
                Hotspot 運行中 — {status?.clientCount ?? 0} 個裝置連線
              </p>
            )}

            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Share */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardCopy className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-sm">Quick Share</CardTitle>
            </div>
            <CardDescription>
              一鍵複製 WiFi 資訊，傳給對方手動輸入
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border bg-background p-4 font-mono text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">SSID: </span>
                {ssid || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Password: </span>
                {password ? "•".repeat(password.length) : "—"}
              </p>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              disabled={!ssid || !password}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-4 h-4" />
                  Copy SSID & Password
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
