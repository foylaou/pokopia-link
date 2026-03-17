# ZeroTier API 端點參考

> 本工具使用的 ZeroTier API 分為兩層：Local API 與 Central API

---

## Local API（ZeroTier One Daemon）

**Base URL:** `http://localhost:9993`

**認證方式:** `X-ZT1-Auth` header，值為 `authtoken.secret` 檔案內容

**Token 位置（Windows）:**
```
C:\ProgramData\ZeroTier\One\authtoken.secret
```

### GET /status

取得本機 ZeroTier 節點狀態。

```json
{
  "address": "a1b2c3d4e5",
  "publicIdentity": "...",
  "online": true,
  "tcpFallbackActive": false,
  "versionMajor": 1,
  "versionMinor": 14,
  "versionRev": 0,
  "version": "1.14.0",
  "clock": 1710000000000
}
```

### GET /peer

列出所有已知 Peer。

```json
[
  {
    "address": "a1b2c3d4e5",
    "versionMajor": 1,
    "versionMinor": 14,
    "versionRev": 0,
    "version": "1.14.0",
    "latency": 15,
    "role": "LEAF",
    "paths": [
      {
        "active": true,
        "address": "192.168.1.100/9993",
        "lastSend": 1710000000000,
        "lastReceive": 1710000000000,
        "trustedPathId": 0
      }
    ]
  }
]
```

### GET /network

列出已加入的 Network。

```json
[
  {
    "id": "8056c2e21c000001",
    "nwid": "8056c2e21c000001",
    "name": "my-network",
    "status": "OK",
    "type": "PRIVATE",
    "bridge": true,
    "broadcastEnabled": true,
    "portDeviceName": "ZeroTier One [8056c2e21c000001]",
    "assignedAddresses": ["10.147.20.1/24"],
    "mac": "aa:bb:cc:dd:ee:ff"
  }
]
```

### POST /network/{networkId}

加入指定 Network。

**Request Body:** `{}`

### DELETE /network/{networkId}

離開指定 Network。

---

## Central API（ZeroTier Central）

**Base URL:** `https://api.zerotier.com/api/v1`

**認證方式:** `Authorization: Bearer <access_token>`

### POST /network

建立新 Network。

**Request:**
```json
{
  "config": {
    "name": "pokopia-room-001",
    "private": true,
    "enableBroadcast": true,
    "v4AssignMode": { "zt": true },
    "ipAssignmentPools": [
      { "ipRangeStart": "10.147.20.1", "ipRangeEnd": "10.147.20.254" }
    ],
    "routes": [
      { "target": "10.147.20.0/24" }
    ]
  }
}
```

**Response:**
```json
{
  "id": "8056c2e21c000001",
  "config": {
    "name": "pokopia-room-001",
    "private": true
  }
}
```

### GET /network/{networkId}/member

列出 Network 所有成員。

### POST /network/{networkId}/member/{memberId}

授權或更新成員設定。

**Request（授權成員）:**
```json
{
  "config": {
    "authorized": true
  }
}
```

### DELETE /network/{networkId}

刪除 Network。

---

## OAuth 2.0 Flow

### 1. Authorization Request

```
GET https://my.zerotier.com/oauth2/authorize
  ?client_id=<CLIENT_ID>
  &response_type=code
  &redirect_uri=pokopia-link://oauth/callback
  &state=<random_state>
```

### 2. Token Exchange

```
POST https://my.zerotier.com/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=<AUTH_CODE>
&client_id=<CLIENT_ID>
&client_secret=<CLIENT_SECRET>
&redirect_uri=pokopia-link://oauth/callback
```

**Response:**
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

---

## Bridge 設定注意事項

為了讓 Switch 的 L2 廣播封包（mDNS / UDP broadcast）跨 VPN tunnel：

1. ZeroTier Network 需啟用 `enableBroadcast: true`
2. 加入 Network 後，需在 ZeroTier Central 將 member 的 `activeBridge` 設為 `true`
3. Windows 端需建立 Network Bridge，將 ZeroTier TAP 介面與 Hosted Network 虛擬介面橋接
