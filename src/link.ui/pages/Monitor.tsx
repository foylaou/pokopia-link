import { Activity, TrendingUp } from "lucide-react";

export default function Monitor() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ping 延遲監控與連線品質
        </p>
      </div>

      {/* Chart area */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-sm font-medium">Latency</h2>
          </div>
          <span className="text-xs text-muted-foreground">最近 60 筆</span>
        </div>
        <div className="h-64 flex items-center justify-center border border-border/50 rounded-md bg-background">
          <p className="text-sm text-muted-foreground">
            尚無 Peer 可進行 Ping 監測
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Min", value: "— ms" },
          { label: "Max", value: "— ms" },
          { label: "Avg", value: "— ms" },
          { label: "Loss", value: "— %" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-3 text-center"
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <span className="text-lg font-semibold">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
