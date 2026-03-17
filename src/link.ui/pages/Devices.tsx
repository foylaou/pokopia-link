import { Users, Radio } from "lucide-react";

export default function Devices() {
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
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-sm font-medium">Hotspot Clients</h2>
          </div>
          <div className="text-sm text-muted-foreground text-center py-8">
            尚無裝置連線至熱點
          </div>
        </div>

        {/* ZeroTier Peers */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-sm font-medium">ZeroTier Peers</h2>
          </div>
          <div className="text-sm text-muted-foreground text-center py-8">
            ZeroTier 尚未連線
          </div>
        </div>
      </div>
    </div>
  );
}
