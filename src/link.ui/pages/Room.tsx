import { Plus, Link, Copy, LogIn } from "lucide-react";

export default function Room() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Room</h1>
        <p className="text-sm text-muted-foreground mt-1">
          建立或加入 ZeroTier Network 房間
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Room */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-sm font-medium">Create Room</h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Room Name</label>
              <input
                type="text"
                placeholder="My Pokopia Room"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Create
            </button>
          </div>
        </div>

        {/* Join Room */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-sm font-medium">Join Room</h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Network ID or Invite Link
              </label>
              <input
                type="text"
                placeholder="pokopia-link://join?network=..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <button className="w-full rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Current Room */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-sm font-medium">Current Room</h2>
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center py-6">
          尚未加入任何房間
        </div>
        <div className="flex gap-2">
          <button
            disabled
            className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground opacity-50"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Invite Link
          </button>
        </div>
      </div>
    </div>
  );
}
