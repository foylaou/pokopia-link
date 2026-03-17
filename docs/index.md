# Pokopia Link — 需求規劃書

> Nintendo Switch GameShare 跨地點連線管理工具
> **版本：v0.2 Draft** ｜ 作者：Foy Liu（劉名政）｜ 更新：2026-03-17

---

## 專案資訊

| 項目 | 內容 |
|------|------|
| 專案名稱 | Pokopia Link |
| 技術棧 | Tauri 2 (Rust) + React + TypeScript + shadcn/ui |
| 目標平台 | Windows 10 / 11  |
| 導航風格 | 頂部 Tab Bar |
| UI 主題 | 深色模式 |

---

## 1. 專案背景

Pokemon Pokopia 是 Nintendo Switch 2 的獨家遊戲，其 GameShare 功能允許一台 Switch 2 將遊戲串流分享給附近的 Switch 1 或 Switch 2，讓對方不需購買遊戲即可一同遊玩。

**GameShare 核心限制：**
- Local 模式：僅限同一 WiFi 網路，無法跨網路
- Online 模式：需要 GameChat，且只限 Switch 2 對 Switch 2

**解決方案：** 透過 ZeroTier L2 VPN 橋接兩地的網路，讓 Switch 以為彼此在同一個 LAN 內，藉此繞過 Local GameShare 的地理限制。

> ⚠️ 此工具設計用於兩地 PC 均需常駐執行，並需以系統管理員權限啟動。

---

## 2. 系統架構概覽

```
NS1 ──wifi──► [PC1 Hotspot]
                    │
              ZeroTier L2 Bridge tunnel
                    │
              [PC2 Hotspot] ◄──wifi── NS2
```

| 層級 | 元件 | 說明 |
|------|------|------|
| L2 VPN | ZeroTier One（Bridge 模式） | 建立跨網路的虛擬 LAN，讓兩地 Switch 廣播封包互通 |
| Hotspot | Windows Hosted Network (netsh) | 將 PC WiFi 分享為熱點，Switch 接入此熱點 |
| Bridge | Windows Network Bridge | 將 ZeroTier TAP 介面與 Hotspot 介面橋接 |
| 管理 UI | Tauri 2 + React | 本工具，管理以上所有元件的狀態與操作 |

**資料流：** NS1 → Hotspot(PC1) → ZeroTier Bridge → ZeroTier Bridge → Hotspot(PC2) → NS2

---

## 3. 應用程式架構

### 3.1 技術選型

| 技術 | 版本 | 用途 |
|------|------|------|
| Tauri | v2 | 桌面框架，Rust 後端 + Webview 前端 |
| React | v19+ | 前端 UI |
| TypeScript | v5+ | 型別安全 |
| Vite | v8 | 前端建構工具 |
| shadcn/ui | latest | UI 元件庫 |
| Tailwind CSS | v4+ | 樣式框架 |
| Recharts | latest | 折線圖、數據視覺化 |
| tauri-plugin-autostart | v2 | 開機自動啟動 |
| tauri-plugin-deep-link | v2 | 攔截 pokopia-link:// URL Scheme |

### 3.2 Rust Backend Commands

| Command | 功能 | 資料來源 |
|---------|------|---------|
| `check_zerotier_environment` | 偵測 ZT 安裝狀態、Service 狀態、winget 可用性 | SCM + where.exe |
| `install_zerotier_winget` | 背景靜默安裝 ZeroTier，emit 進度 | winget |
| `start_zerotier_service` | 啟動 ZeroTierOneService | sc start |
| `zt_get_status` | 取得本機節點狀態（online/address/version） | ZeroTier Local API :9993 |
| `zt_get_peers` | 取得所有 Peer（latency/address/paths） | ZeroTier Local API :9993 |
| `zt_get_networks` | 取得加入的 Network 與 Bridge 狀態 | ZeroTier Local API :9993 |
| `zt_central_create_network` | 建立新 Network（房間） | ZeroTier Central API |
| `zt_central_authorize_member` | 自動授權加入的 Member | ZeroTier Central API |
| `hotspot_start` | 啟動 Windows Hosted Network | netsh wlan start hostednetwork |
| `hotspot_stop` | 停止 Windows Hosted Network | netsh wlan stop hostednetwork |
| `hotspot_status` | 查詢熱點狀態 | netsh wlan show hostednetwork |
| `hotspot_get_clients` | 取得連線裝置 IP + MAC | netsh + arp -a |
| `bridge_status` | 查詢 Windows Network Bridge 狀態 | netsh bridge show |
| `ping_peer` | 對 ZeroTier Peer 發送 ping，回傳延遲 ms | 系統 ping |
| `get_qr_code` | 產生熱點 WiFi QR Code SVG | Rust qrcode crate |
| `oauth_start` | 開啟 Browser 導向 ZeroTier OAuth 授權 | system browser |
| `oauth_exchange_token` | 用 code 換取 Access Token | ZeroTier OAuth API |
| `set_autostart` | 設定 / 取消開機自動啟動 | tauri-plugin-autostart |

---

## 4. 視窗規格

### 4.1 主視窗（Main Window）

| 屬性 | 值 |
|------|----|
| 尺寸 | 960 × 640（最小 800 × 520） |
| 裝飾 | 無邊框（decorations: false）+ 自訂標題列 |
| 透明度 | 背景透明，支援毛玻璃效果 |
| 關閉行為 | 最小化至系統匣，不終止程式 |
| 導航 | 頂部 Tab Bar |

**Tab 頁面：**

| Tab | 頁面名稱 | 主要功能 |
|-----|---------|---------|
| Overview | 總覽 | ZeroTier / 熱點 / Bridge 狀態一覽，首次啟動引導 |
| Devices | 裝置管理 | 熱點連線裝置清單 + ZeroTier Peer 清單 |
| Hotspot | 熱點控制 | 開關熱點、SSID/密碼、QR Code |
| Monitor | 網路監控 | Ping 折線圖、延遲歷史、連線品質 |
| Room | 房間管理 | 建立/加入 Network、產生邀請連結、Discord 發送 |
| Settings | 設定 | 帳號、開機啟動、浮動視窗設定、Discord Bot |

### 4.2 浮動視窗（Float Window）

| 屬性 | 值 |
|------|----|
| 尺寸 | 280 × 320（可調整） |
| 裝飾 | 無邊框，自訂拖曳區 |
| Always on Top | true |
| 初始狀態 | 隱藏，由主視窗按鈕切換 |
| 觸發方式 | 主視窗右上角切換按鈕 |

**可在 Settings 勾選的顯示項目：**
- Ping 折線圖（對 ZeroTier Peer 的即時延遲，最近 60 筆）
- ZeroTier 連線狀態 Badge
- 熱點裝置數量
- Bridge 是否正常

---

## 5. 功能規格

### 5.1 ZeroTier 自動安裝與環境偵測

> ⚠️ `libzt`（ZeroTier SDK）**不適用**本工具：libzt 不會在 OS 建立虛擬網卡，其他程式（Switch）完全看不到這個網路，無法做 L2 Bridge。必須依賴完整的 ZeroTier One 安裝。

**啟動偵測流程：**

```
App 啟動
  │
  ├─ localhost:9993 可連線？
  │     YES → 正常進入主畫面
  │     NO  ↓
  │
  ├─ ZeroTierOneService 存在但未執行？
  │     YES → sc start ZeroTierOneService → 等待 → 重試
  │     NO  ↓
  │
  ├─ winget 可用？（where.exe winget）
  │     YES → 背景靜默安裝，顯示進度條
  │           winget install -e --id ZeroTier.ZeroTierOne
  │           --silent --accept-package-agreements
  │     NO  ↓
  │
  └─ 顯示下載連結 + 等待使用者手動安裝後重試
```

> ⚠️ ZeroTier One 安裝時需安裝 TAP 虛擬網卡驅動，可能觸發 Windows 驅動簽章確認彈窗，無法完全靜默。

### 5.2 ZeroTier Central OAuth 2.0 登入

**兩層 Token 說明：**

| Token 類型 | 用途 | 取得方式 |
|-----------|------|---------|
| `authtoken.secret`（本機） | 控制本機 ZeroTier daemon（Local API :9993） | 自動讀取本機檔案，使用者無感 |
| Central Access Token | 管理 Network、授權 Member（Central API） | OAuth 2.0 流程自動取得 |

**OAuth 2.0 授權流程：**

```
1. App 開啟 System Browser
   → https://my.zerotier.com/oauth2/authorize
     ?client_id=<id>
     &response_type=code
     &redirect_uri=switchshare://oauth/callback

2. 使用者在瀏覽器完成登入

3. ZeroTier 重定向 → switchshare://oauth/callback?code=<code>

4. Tauri 攔截 Deep Link，用 code 換取 Access Token

5. Token 加密存入本機（Windows DPAPI）

6. 後續 Central API 自動附帶 Bearer Token
```

> ⚠️ `switchshare://` 需在 tauri.conf.json 的 `deep_link_protocols` 中註冊。

**Central API 功能（使用 OAuth Token）：**
- 自動建立 Network（房間），取得 Network ID
- 自動授權加入的 Member（免去手動網頁 Authorize）
- 查詢 Network 成員清單與連線狀態
- 刪除 / 重建 Network

### 5.3 熱點管理

- 以 `netsh wlan` 指令控制 Windows Hosted Network
- UAC 提示於 App 啟動時一次性取得，後續操作無感
- 支援：啟動/停止、設定 SSID 與密碼、查看連線裝置（MAC + ARP 解析 IP）
- QR Code：自動產生 WiFi 連線 QR Code（`WIFI:S:<SSID>;T:WPA;P:<password>;;`）

> ⚠️ Windows 11 部分版本對 netsh hostednetwork 有相容性問題，需確認 WiFi 驅動支援。

### 5.4 Bridge 狀態

- 顯示 Windows Network Bridge 連線狀態
- 列出橋接介面（ZeroTier TAP + Hosted Network 虛擬介面）
- 狀態指示：正常（綠）/ 異常（紅）/ 未建立（灰）

### 5.5 網路監控

- 對已連線的 ZeroTier Peer IP 定期 ping（間隔 2 秒）
- 保留最近 60 筆，Recharts 折線圖顯示
- 指標：最小/最大/平均延遲、封包遺失率
- 浮動視窗同步顯示即時折線圖

### 5.6 系統匣（Tray Icon）

- 常駐系統匣，圖示根據連線狀態變化（Online / Offline / Warning）
- 右鍵選單：開啟主視窗、顯示/隱藏浮動視窗、熱點快速開關、結束程式

### 5.7 開機自動啟動

- 透過 `tauri-plugin-autostart` 設定
- 啟動後預設最小化至系統匣
- 可在 Settings 頁面切換

### 5.8 房間管理與邀請連結

- 建立 Network（房間）後產生 `switchshare://join?network=<id>&name=<房間名>` 格式 Deep Link
- 一鍵複製邀請連結，可貼到任何平台
- 對方點選連結，若已安裝 App 直接觸發 join network + 設定 hotspot

### 5.9 Discord Rich Presence 整合

**方案：** 使用 Discord Rich Presence + Activity Invite（不需 Bot）

| 功能 | 說明 |
|------|------|
| Rich Presence | 顯示「正在遊玩 Pokopia Link — In Room: XXX」 |
| Activity Invite | 朋友透過 Discord "+" 按鈕直接發送遊戲邀請 |
| Party Info | 顯示目前人數 / 上限（如 2/4） |
| Join Event | 對方點選邀請後自動加入對應房間 |

**需求：**
- Discord Developer Portal 建立 Application（取得 Application ID）
- 選擇「Integrate the Discord Social SDK」+「Customize my game's identity on Discord」
- Rust 端使用 `discord-rich-presence` crate 連接 Discord RPC

**流程：**
1. 使用者在 Settings 連接 Discord（本機 IPC）
2. 建立/加入房間後自動更新 Rich Presence（房間名、人數、party ID）
3. 朋友在 Discord 看到狀態 → 透過 "+" 按鈕發送邀請
4. 對方點選 Join → Discord 觸發 join event → App 自動加入房間

### 5.10 房間人數上限

- 使用者可自行設定 Max Players（最小 2，無硬性上限）
- 參考值：GameShare 無本體最多 2 人，有本體最多 4 人
- 人數達上限時，邀請連結失效，顯示「房間已滿」
- Discord Rich Presence 同步顯示 current/max party size

---

## 6. UI/UX 規格

| 項目 | 規格 |
|------|------|
| 主題 | 深色模式（Dark） |
| 主色 | #2563EB（Blue-600） |
| 強調色 | #10B981（Emerald-500） |
| 警告 | #F59E0B |
| 錯誤 | #EF4444 |
| 字型 | Segoe UI（Windows 系統字型） |
| 元件庫 | shadcn/ui（Tailwind CSS） |
| 動畫 | CSS transition 150ms ease |

**狀態 Badge 規範：**

| 狀態 | 顏色 | 文字 |
|------|------|------|
| 連線正常 | Emerald-500 | ● Online |
| 連線中 | Amber-400 | ● Connecting |
| 離線/錯誤 | Red-500 | ● Offline |
| 未設定 | Gray-500 | ● N/A |

---

## 7. 非功能需求

| 類別 | 需求 |
|------|------|
| 效能 | UI 輪詢間隔 2~5 秒，不影響遊戲網路品質 |
| 權限 | 應用程式需以系統管理員權限執行（UAC manifest） |
| 錯誤處理 | ZeroTier 未安裝/未執行、token 不存在、netsh 失敗，UI 顯示明確錯誤與引導 |
| 安裝包 | NSIS installer（Windows .exe），不需額外 runtime |
| 記憶體 | 常駐時目標 < 100MB |
| Token 安全 | Central Access Token 使用 Windows DPAPI 加密存儲 |

---

## 8. 已知限制與風險

- **L2 廣播依賴**：ZeroTier Bridge 需正確設定，Switch 的 mDNS / UDP 廣播封包才能跨 VPN tunnel，需實機驗證
- **Windows 11 netsh hostednetwork**：部分版本可能需要額外 WiFi 驅動設定
- **TAP 驅動安裝**：ZeroTier 安裝時可能觸發驅動簽章確認，無法完全靜默
- **延遲影響**：VPN tunnel 增加 5~30ms，實際遊戲體驗需測試
- **對方端依賴**：對方 PC 需同樣安裝並執行此工具
- **OAuth Scope**：ZeroTier Central OAuth 的 scope 需確認是否支援 Network 建立與 Member 授權

---

## 9. 開發里程碑

| 階段 | 目標 | 主要工作 |
|------|------|---------|
| Phase 1 | 環境偵測 + 基礎架構 | ZeroTier 安裝偵測流程、winget 安裝、Tauri 專案骨架 |
| Phase 2 | OAuth 登入 | ZeroTier Central OAuth 2.0、Deep Link 攔截、Token 加密存儲 |
| Phase 3 | 主視窗 UI | Tab Bar、Overview / Hotspot / Devices 頁面 |
| Phase 4 | 監控功能 | Ping 輪詢、Recharts 折線圖、Monitor 頁面 |
| Phase 5 | 浮動視窗 | Float Window、可勾選顯示項目、拖曳定位 |
| Phase 6 | 房間管理 | 建立 Network、邀請連結、Central API 自動授權 |
| Phase 7 | 系統整合 | Tray Icon、開機啟動、UAC manifest、錯誤處理完善 |
| Phase 8 | Discord 整合 | Bot sidecar、Embed 訊息、Rich Presence |
| Phase 9 | 打包發布 | NSIS installer、圖示設計、README |

---

*— 規劃書結束 —*