# Pokopia Link

Nintendo Switch GameShare 跨地點連線管理工具。

透過 ZeroTier L2 VPN 橋接兩地網路，讓 Switch 的 Local GameShare 可以跨地點使用。

```
NS1 ──wifi──> [PC1 Hotspot] ──ZeroTier Bridge── [PC2 Hotspot] <──wifi── NS2
```

## Features

- **ZeroTier 管理** — 自動偵測安裝狀態、環境引導、Local API 整合
- **Hotspot 控制** — Windows Hosted Network 開關、SSID/密碼設定、一鍵複製
- **Network Bridge** — ZeroTier TAP + Hotspot 橋接狀態監控
- **Ping 監控** — 即時延遲折線圖（Recharts）、min/max/avg/loss 統計
- **房間管理** — 建立/加入 ZeroTier Network、邀請連結、可設定人數上限
- **浮動視窗** — Always on Top 即時狀態面板
- **Discord Rich Presence** — 顯示遊玩狀態、朋友可直接邀請加入
- **系統匣常駐** — 關閉視窗最小化至 tray、開機自動啟動

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Framework | Tauri 2 (Rust) |
| Frontend | React 19 + TypeScript |
| Build Tool | Vite 6 |
| UI | shadcn/ui + Tailwind CSS v4 |
| Charts | Recharts |
| VPN | ZeroTier One (Bridge mode) |
| Discord | discord-rich-presence (RPC) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [ZeroTier One](https://www.zerotier.com/download/) (target machine)
- Windows 10/11 (target platform)

### Setup

```bash
# Clone
git clone https://github.com/your-username/pokopia-link.git
cd pokopia-link

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env and fill in your DISCORD_APP_ID

# Dev (frontend only)
pnpm dev

# Dev (full Tauri app, requires Windows)
pnpm tauri dev

# Build
pnpm tauri build
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_APP_ID` | Yes | Discord Developer Portal Application ID |

ZeroTier Central API Token is configured in-app via Settings page.

## Project Structure

```
src/
  link.main/          # Tauri Rust backend
    src/
      commands.rs     # IPC commands (ZeroTier, Hotspot, Bridge, Ping, Auth, Room)
      discord.rs      # Discord Rich Presence
      tray.rs         # System tray
      lib.rs          # Tauri builder + plugins
  link.ui/            # React frontend
    components/       # UI components (shadcn/ui + custom)
    pages/            # 6 tab pages (Overview, Devices, Hotspot, Monitor, Room, Settings)
    hooks/            # React hooks (useAuth, useRoom, usePingMonitor, useDiscord, ...)
    types/            # TypeScript type definitions
docs/
  index.md            # Project specification
  api/                # API endpoint documentation
```

## License

[MIT](LICENSE)
