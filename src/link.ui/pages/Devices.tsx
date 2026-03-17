import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-sm">Hotspot Clients</CardTitle>
              </div>
              <Badge variant="secondary">0 devices</Badge>
            </div>
            <CardDescription>
              透過 Hosted Network 連線的裝置
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border bg-background p-6 text-center">
              <p className="text-sm text-muted-foreground">
                尚無裝置連線至熱點
              </p>
            </div>
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
              <Badge variant="secondary">0 peers</Badge>
            </div>
            <CardDescription>
              ZeroTier 網路中的其他節點
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border bg-background p-6 text-center">
              <p className="text-sm text-muted-foreground">
                ZeroTier 尚未連線
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
