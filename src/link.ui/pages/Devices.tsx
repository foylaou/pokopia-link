import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Radio } from "lucide-react";
import type { HotspotStatus, ZeroTierPeer } from "@/types";

export default function Devices() {
  const [hotspot, setHotspot] = useState<HotspotStatus | null>(null);
  const [peers, setPeers] = useState<ZeroTierPeer[]>([]);

  const fetchHotspot = useCallback(async () => {
    try {
      setHotspot(await invoke<HotspotStatus>("hotspot_status"));
    } catch { /* ignore */ }
  }, []);

  const fetchPeers = useCallback(async () => {
    try {
      setPeers(await invoke<ZeroTierPeer[]>("zt_get_peers"));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchHotspot();
    fetchPeers();
    const id = setInterval(() => { fetchHotspot(); fetchPeers(); }, 5000);
    return () => clearInterval(id);
  }, [fetchHotspot, fetchPeers]);

  const clientCount = hotspot?.clientCount ?? 0;
  const leafPeers = peers.filter((p) => p.role === "LEAF");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Devices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          熱點連線裝置與 ZeroTier Peer 清單
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotspot Clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-sm">Hotspot Clients</CardTitle>
              </div>
              <Badge variant="secondary">
                {clientCount} device{clientCount !== 1 ? "s" : ""}
              </Badge>
            </div>
            <CardDescription>
              透過行動熱點連線的裝置
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hotspot?.running ? (
              <div className="rounded-md border border-border bg-background p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">SSID</span>
                  <span className="text-sm font-mono">{hotspot.ssid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">連線數</span>
                  <span className="text-sm font-medium">{clientCount}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-background p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  行動熱點未啟動
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ZeroTier Peers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-sm">ZeroTier Peers</CardTitle>
              </div>
              <Badge variant="secondary">
                {leafPeers.length} peer{leafPeers.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <CardDescription>
              ZeroTier 網路中的其他節點
            </CardDescription>
          </CardHeader>
          <CardContent>
            {peers.length > 0 ? (
              <div className="space-y-2">
                {peers.map((peer) => (
                  <div
                    key={peer.address}
                    className="rounded-md border border-border bg-background p-3 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-mono">{peer.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {peer.role}
                        {peer.paths.length > 0 &&
                          ` — ${peer.paths.filter((p) => p.active).length} active path${peer.paths.filter((p) => p.active).length !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium ${peer.latency >= 0 ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {peer.latency >= 0 ? `${peer.latency} ms` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-border bg-background p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  ZeroTier 尚未連線或無 Peer
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
