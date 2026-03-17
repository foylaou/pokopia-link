import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
import { usePingMonitor } from "@/hooks/usePingMonitor";
import { Activity, TrendingUp, Target, Play, Square } from "lucide-react";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <span className="text-lg font-semibold">{value}</span>
      </CardContent>
    </Card>
  );
}

function formatTime(timestamp: number) {
  const d = new Date(timestamp);
  return `${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

export default function Monitor() {
  const [targetHost, setTargetHost] = useState("");
  const { history, stats, isRunning, start, stop } = usePingMonitor();

  const chartData = history.map((entry) => ({
    time: formatTime(entry.timestamp),
    latency: entry.latencyMs,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ping 延遲監控與連線品質
        </p>
      </div>

      {/* Ping Target */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-sm">Ping Target</CardTitle>
          </div>
          <CardDescription>
            輸入 ZeroTier Peer IP 或加入房間後自動偵測
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="ping-host" className="sr-only">
                Host
              </Label>
              <Input
                id="ping-host"
                value={targetHost}
                onChange={(e) => setTargetHost(e.target.value)}
                placeholder="10.147.20.x"
                disabled={isRunning}
              />
            </div>
            {isRunning ? (
              <Button variant="destructive" onClick={stop}>
                <Square className="w-4 h-4" />
                Stop
              </Button>
            ) : (
              <Button
                onClick={() => start(targetHost)}
                disabled={!targetHost.trim()}
              >
                <Play className="w-4 h-4" />
                Start
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-sm">Latency Chart</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">
              {history.length} / 60
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  unit=" ms"
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center rounded-md border border-border/50 bg-background">
              <p className="text-sm text-muted-foreground">
                開始 Ping 後顯示即時折線圖
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Min"
          value={stats.min !== null ? `${stats.min} ms` : "— ms"}
        />
        <StatCard
          label="Max"
          value={stats.max !== null ? `${stats.max} ms` : "— ms"}
        />
        <StatCard
          label="Avg"
          value={stats.avg !== null ? `${stats.avg} ms` : "— ms"}
        />
        <StatCard label="Loss" value={`${stats.lossPercent} %`} />
      </div>
    </div>
  );
}
