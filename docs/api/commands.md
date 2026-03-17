# Tauri Backend Commands

> Rust → Frontend 的 IPC 介面定義

---

## ZeroTier 環境

### `check_zerotier_environment`

偵測本機 ZeroTier 安裝與運行狀態。

**Parameters:** 無

**Response:**
```json
{
  "installed": true,
  "service_running": true,
  "api_reachable": true,
  "winget_available": true
}
```

**實作邏輯：**
1. 檢查 `ZeroTierOneService` 是否存在（SCM）
2. 嘗試連線 `localhost:9993`
3. 執行 `where.exe winget` 判斷 winget 可用性

---

### `install_zerotier_winget`

透過 winget 靜默安裝 ZeroTier One。

**Parameters:** 無

**Events:** `install-progress` — 安裝進度事件

**Command:**
```
winget install -e --id ZeroTier.ZeroTierOne --silent --accept-package-agreements
```

---

### `start_zerotier_service`

啟動 ZeroTierOneService。

**Parameters:** 無

**Command:** `sc start ZeroTierOneService`

---

## ZeroTier Local API（:9993）

### `zt_get_status`

取得本機 ZeroTier 節點狀態。

**Parameters:** 無

**Endpoint:** `GET http://localhost:9993/status`

**Headers:** `X-ZT1-Auth: <authtoken.secret>`

**Response:**
```json
{
  "online": true,
  "address": "a1b2c3d4e5",
  "version": "1.14.0"
}
```

---

### `zt_get_peers`

取得所有 ZeroTier Peer。

**Parameters:** 無

**Endpoint:** `GET http://localhost:9993/peer`

**Response:**
```json
[
  {
    "address": "a1b2c3d4e5",
    "latency": 15,
    "role": "LEAF",
    "paths": [
      { "address": "192.168.1.100/9993", "active": true }
    ]
  }
]
```

---

### `zt_get_networks`

取得已加入的 Network 清單。

**Parameters:** 無

**Endpoint:** `GET http://localhost:9993/network`

**Response:**
```json
[
  {
    "id": "8056c2e21c000001",
    "name": "my-room",
    "status": "OK",
    "bridge": true,
    "assigned_addresses": ["10.147.20.1/24"]
  }
]
```

---

## Hotspot

### `hotspot_start`

啟動 Windows Hosted Network。

**Parameters:**
| 名稱 | 型別 | 說明 |
|------|------|------|
| `ssid` | `string` | 熱點名稱 |
| `password` | `string` | 熱點密碼（至少 8 字元） |

**Commands:**
```
netsh wlan set hostednetwork mode=allow ssid=<ssid> key=<password>
netsh wlan start hostednetwork
```

---

### `hotspot_stop`

停止 Hosted Network。

**Command:** `netsh wlan stop hostednetwork`

---

### `hotspot_status`

查詢熱點運行狀態。

**Response:**
```json
{
  "running": true,
  "ssid": "PokopiaLink",
  "client_count": 1
}
```

---

### `hotspot_get_clients`

取得熱點連線裝置。

**Commands:** `netsh wlan show hostednetwork` + `arp -a`

**Response:**
```json
[
  { "mac": "AA:BB:CC:DD:EE:FF", "ip": "192.168.137.2" }
]
```

---

## Bridge

### `bridge_status`

查詢 Windows Network Bridge 狀態。

**Response:**
```json
{
  "active": true,
  "interfaces": ["ZeroTier One [8056c2e21c000001]", "Local Area Connection* 12"]
}
```

---

## Network

### `ping_peer`

對指定 Host 發送 ping。

**Parameters:**
| 名稱 | 型別 | 說明 |
|------|------|------|
| `host` | `string` | 目標 IP 或 hostname |

**Response:**
```json
{
  "host": "10.147.20.2",
  "latency_ms": 12.5,
  "success": true
}
```

---

### `get_qr_code`

產生 WiFi QR Code SVG。

**Parameters:**
| 名稱 | 型別 | 說明 |
|------|------|------|
| `ssid` | `string` | WiFi SSID |
| `password` | `string` | WiFi 密碼 |

**Response:** SVG string

**Format:** `WIFI:S:<SSID>;T:WPA;P:<password>;;`

---

## OAuth

### `oauth_start`

開啟 Browser 導向 ZeroTier Central OAuth 授權頁面。

**Redirect URI:** `pokopia-link://oauth/callback`

---

### `oauth_exchange_token`

用 OAuth code 換取 Access Token。

**Parameters:**
| 名稱 | 型別 | 說明 |
|------|------|------|
| `code` | `string` | OAuth authorization code |

**存儲：** Token 以 Windows DPAPI 加密存入本機

---

## Autostart

### `set_autostart`

設定或取消開機自動啟動。

**Parameters:**
| 名稱 | 型別 | 說明 |
|------|------|------|
| `enabled` | `boolean` | 是否啟用 |
