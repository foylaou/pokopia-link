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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRoom } from "@/hooks/useRoom";
import {
  Plus,
  LogIn,
  Link,
  Copy,
  Check,
  LogOut,
  Loader2,
  Users,
  Minus,
} from "lucide-react";

export default function Room() {
  const { room, creating, joining, error, createRoom, joinRoom, leaveRoom } =
    useRoom();
  const [roomName, setRoomName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    await createRoom(roomName.trim());
    setRoomName("");
  };

  const handleJoin = async () => {
    const raw = joinId.trim();
    const match = raw.match(/network=([a-f0-9]+)/i);
    const networkId = match ? match[1] : raw;
    if (!networkId) return;
    await joinRoom(networkId);
    setJoinId("");
  };

  const handleCopyInvite = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFull = room !== null && room.memberCount >= maxPlayers;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Room</h1>
        <p className="text-sm text-muted-foreground mt-1">
          建立或加入 ZeroTier Network 房間
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!room && (
        <>
          {/* Max Players */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-sm">Max Players</CardTitle>
              </div>
              <CardDescription>
                房間人數上限，超出後邀請連結將失效
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setMaxPlayers((p) => Math.max(2, p - 1))}
                  disabled={maxPlayers <= 2}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold tabular-nums w-8 text-center">
                  {maxPlayers}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setMaxPlayers((p) => p + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  GameShare 無本體: 最多 2 人 / 有本體: 最多 4 人
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Room */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-sm">Create Room</CardTitle>
                </div>
                <CardDescription>
                  建立新的 ZeroTier Network 並自動設定 Bridge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input
                    id="room-name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="My Pokopia Room"
                    disabled={creating}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={!roomName.trim() || creating}
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {creating ? "Creating..." : "Create"}
                </Button>
              </CardContent>
            </Card>

            {/* Join Room */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-sm">Join Room</CardTitle>
                </div>
                <CardDescription>
                  輸入 Network ID 或貼上邀請連結
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="join-id">Network ID / Invite Link</Label>
                  <Input
                    id="join-id"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    placeholder="pokopia-link://join?network=..."
                    disabled={joining}
                  />
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleJoin}
                  disabled={!joinId.trim() || joining}
                >
                  {joining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {joining ? "Joining..." : "Join"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {room && (
        <>
          <Separator />

          {/* Current Room */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-sm">Current Room</CardTitle>
                </div>
                <Badge
                  variant={isFull ? "destructive" : "secondary"}
                >
                  <Users className="w-3 h-3 mr-1" />
                  {room.memberCount} / {maxPlayers}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-border bg-background p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Name</span>
                  <span className="text-sm font-medium">{room.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Network ID
                  </span>
                  <span className="text-sm font-mono">{room.networkId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Max Players
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        setMaxPlayers((p) => Math.max(2, p - 1))
                      }
                      disabled={maxPlayers <= 2}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-medium tabular-nums">
                      {maxPlayers}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setMaxPlayers((p) => p + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {isFull && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
                  房間已滿，邀請連結已失效
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleCopyInvite}
                  disabled={isFull}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied
                    ? "Copied!"
                    : isFull
                      ? "Room Full"
                      : "Copy Invite Link"}
                </Button>
                <Button variant="ghost" size="sm" onClick={leaveRoom}>
                  <LogOut className="w-4 h-4" />
                  Leave
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
