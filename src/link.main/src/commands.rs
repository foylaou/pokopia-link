use serde::{Deserialize, Serialize};
use tauri::Manager;
use std::fs;
use std::path::PathBuf;

// ── Helpers ──

fn auth_token_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("auth.json"))
}

fn read_stored_token(app: &tauri::AppHandle) -> Option<String> {
    let path = auth_token_path(app).ok()?;
    let data = fs::read_to_string(path).ok()?;
    let state: StoredAuth = serde_json::from_str(&data).ok()?;
    Some(state.access_token)
}

fn zt_token_cache_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("zt_authtoken.secret"))
}

fn read_zt_auth_token(app: &tauri::AppHandle) -> Option<String> {
    // 1. Try reading directly from ZeroTier's location
    let system_path = r"C:\ProgramData\ZeroTier\One\authtoken.secret";
    if let Ok(token) = fs::read_to_string(system_path) {
        let token = token.trim().to_string();
        if !token.is_empty() {
            return Some(token);
        }
    }

    // 2. Fall back to cached copy in app data
    if let Ok(cache_path) = zt_token_cache_path(app) {
        if let Ok(token) = fs::read_to_string(cache_path) {
            let token = token.trim().to_string();
            if !token.is_empty() {
                return Some(token);
            }
        }
    }

    None
}

fn zt_local_client(token: &str) -> Result<reqwest::Client, String> {
    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert(
        "X-ZT1-Auth",
        reqwest::header::HeaderValue::from_str(token).map_err(|e| e.to_string())?,
    );
    reqwest::Client::builder()
        .default_headers(headers)
        .build()
        .map_err(|e| e.to_string())
}

// ── ZeroTier ──

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZeroTierEnvironment {
    pub installed: bool,
    pub service_running: bool,
    pub api_reachable: bool,
    pub auth_token_available: bool,
    pub winget_available: bool,
}

#[derive(Serialize)]
pub struct ZeroTierStatus {
    pub online: bool,
    pub address: String,
    pub version: String,
}

#[derive(Serialize)]
pub struct ZeroTierPeer {
    pub address: String,
    pub latency: i32,
    pub role: String,
    pub paths: Vec<ZeroTierPath>,
}

#[derive(Serialize)]
pub struct ZeroTierPath {
    pub address: String,
    pub active: bool,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ZeroTierNetwork {
    pub id: String,
    pub name: String,
    pub status: String,
    pub bridge: bool,
    pub assigned_addresses: Vec<String>,
}

// ── Hotspot ──

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HotspotStatus {
    pub running: bool,
    pub ssid: String,
    pub client_count: u32,
}

// ── Bridge ──

#[derive(Serialize)]
pub struct BridgeStatus {
    pub active: bool,
    pub interfaces: Vec<String>,
}

// ── Ping ──

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingResult {
    pub host: String,
    pub latency_ms: Option<f64>,
    pub success: bool,
}

// ── OAuth ──

#[derive(Serialize, Deserialize)]
struct StoredAuth {
    access_token: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthState {
    pub logged_in: bool,
}

// ── Room ──

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomInfo {
    pub network_id: String,
    pub name: String,
    pub invite_link: String,
    pub member_count: u32,
}

// ── Commands: ZeroTier Auth Token Import ──

#[tauri::command]
pub async fn import_zt_auth_token(app: tauri::AppHandle) -> Result<bool, String> {
    // Try direct read first
    let system_path = r"C:\ProgramData\ZeroTier\One\authtoken.secret";
    if let Ok(token) = fs::read_to_string(system_path) {
        let token = token.trim().to_string();
        if !token.is_empty() {
            let cache = zt_token_cache_path(&app)?;
            fs::write(&cache, &token).map_err(|e| e.to_string())?;
            return Ok(true);
        }
    }

    // Need elevation: use PowerShell to copy the file with admin privileges
    let cache = zt_token_cache_path(&app)?;
    let cache_str = cache.to_string_lossy().replace('\\', "\\\\");
    let ps_script = format!(
        "Copy-Item '{}' -Destination '{}' -Force",
        system_path, cache_str
    );

    let output = std::process::Command::new("powershell")
        .args([
            "-Command",
            &format!(
                "Start-Process powershell -ArgumentList '-Command', '{}' -Verb RunAs -Wait",
                ps_script.replace('\'', "''")
            ),
        ])
        .output()
        .map_err(|e| format!("Failed to launch elevated process: {}", e))?;

    if !output.status.success() {
        return Err("使用者取消了權限提升或操作失敗".to_string());
    }

    // Verify the file was copied
    if cache.exists() {
        Ok(true)
    } else {
        Err("Token 匯入失敗 — 請確認已允許管理員權限".to_string())
    }
}

#[tauri::command]
pub async fn save_zt_auth_token(token: String, app: tauri::AppHandle) -> Result<bool, String> {
    let token = token.trim().to_string();
    if token.is_empty() {
        return Err("Token 不能為空".to_string());
    }

    // Validate by calling local API
    let client = zt_local_client(&token)?;
    let resp = client
        .get("http://localhost:9993/status")
        .send()
        .await
        .map_err(|e| format!("無法連線 ZeroTier: {}", e))?;

    if !resp.status().is_success() {
        return Err("Token 無效 — API 回傳錯誤".to_string());
    }

    let cache = zt_token_cache_path(&app)?;
    fs::write(&cache, &token).map_err(|e| e.to_string())?;
    Ok(true)
}

// ── Commands: ZeroTier Environment ──

#[tauri::command]
pub async fn check_zerotier_environment(app: tauri::AppHandle) -> Result<ZeroTierEnvironment, String> {
    // Check if ZeroTier is installed
    let zt_dir = std::path::Path::new(r"C:\ProgramData\ZeroTier\One");
    let installed = zt_dir.exists();

    // Check if ZeroTier service is running via sc query
    let service_running = std::process::Command::new("sc")
        .args(["query", "ZeroTierOneService"])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).contains("RUNNING"))
        .unwrap_or(false);

    // Check if local API is reachable (any HTTP response = reachable, even 401)
    let api_reachable = reqwest::Client::new()
        .get("http://localhost:9993/status")
        .send()
        .await
        .is_ok();

    // Check if auth token is readable
    let auth_token_available = read_zt_auth_token(&app).is_some();

    // Check if winget is available
    let winget_available = std::process::Command::new("where.exe")
        .arg("winget")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    Ok(ZeroTierEnvironment {
        installed,
        service_running,
        api_reachable,
        auth_token_available,
        winget_available,
    })
}

#[tauri::command]
pub async fn zt_get_status(app: tauri::AppHandle) -> Result<ZeroTierStatus, String> {
    let token = read_zt_auth_token(&app).ok_or("Cannot read authtoken.secret — 請先匯入 ZeroTier Token")?;
    let client = zt_local_client(&token)?;
    let resp: serde_json::Value = client
        .get("http://localhost:9993/status")
        .send()
        .await
        .map_err(|e| format!("Failed to reach ZeroTier: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Invalid response: {}", e))?;

    Ok(ZeroTierStatus {
        online: resp["online"].as_bool().unwrap_or(false),
        address: resp["address"].as_str().unwrap_or("").to_string(),
        version: resp["version"].as_str().unwrap_or("").to_string(),
    })
}

#[tauri::command]
pub async fn zt_get_peers(app: tauri::AppHandle) -> Result<Vec<ZeroTierPeer>, String> {
    let token = read_zt_auth_token(&app).ok_or("Cannot read authtoken.secret — 請先匯入 ZeroTier Token")?;
    let client = zt_local_client(&token)?;
    let resp: Vec<serde_json::Value> = client
        .get("http://localhost:9993/peer")
        .send()
        .await
        .map_err(|e| format!("Failed to reach ZeroTier: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Invalid response: {}", e))?;

    let peers = resp
        .into_iter()
        .map(|p| ZeroTierPeer {
            address: p["address"].as_str().unwrap_or("").to_string(),
            latency: p["latency"].as_i64().unwrap_or(-1) as i32,
            role: p["role"].as_str().unwrap_or("").to_string(),
            paths: p["paths"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .map(|path| ZeroTierPath {
                            address: path["address"].as_str().unwrap_or("").to_string(),
                            active: path["active"].as_bool().unwrap_or(false),
                        })
                        .collect()
                })
                .unwrap_or_default(),
        })
        .collect();

    Ok(peers)
}

#[tauri::command]
pub async fn zt_get_networks(app: tauri::AppHandle) -> Result<Vec<ZeroTierNetwork>, String> {
    let token = read_zt_auth_token(&app).ok_or("Cannot read authtoken.secret — 請先匯入 ZeroTier Token")?;
    let client = zt_local_client(&token)?;
    let resp: Vec<serde_json::Value> = client
        .get("http://localhost:9993/network")
        .send()
        .await
        .map_err(|e| format!("Failed to reach ZeroTier: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Invalid response: {}", e))?;

    let networks = resp
        .into_iter()
        .map(|n| ZeroTierNetwork {
            id: n["id"].as_str().unwrap_or("").to_string(),
            name: n["name"].as_str().unwrap_or("").to_string(),
            status: n["status"].as_str().unwrap_or("").to_string(),
            bridge: n["bridge"].as_bool().unwrap_or(false),
            assigned_addresses: n["assignedAddresses"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect()
                })
                .unwrap_or_default(),
        })
        .collect();

    Ok(networks)
}

// ── Commands: Hotspot (Mobile Hotspot via WinRT) ──

fn get_tethering_manager(
) -> Result<windows::Networking::NetworkOperators::NetworkOperatorTetheringManager, String> {
    use windows::Networking::Connectivity::NetworkInformation;
    use windows::Networking::NetworkOperators::NetworkOperatorTetheringManager;

    let profile = NetworkInformation::GetInternetConnectionProfile()
        .map_err(|e| format!("找不到網路連線: {}", e))?;
    NetworkOperatorTetheringManager::CreateFromConnectionProfile(&profile)
        .map_err(|e| format!("無法建立 Tethering Manager: {}", e))
}

#[tauri::command]
pub async fn hotspot_status() -> Result<HotspotStatus, String> {
    tokio::task::spawn_blocking(|| {
        use windows::Networking::NetworkOperators::TetheringOperationalState;

        let manager = get_tethering_manager()?;

        let state = manager
            .TetheringOperationalState()
            .map_err(|e| format!("無法取得狀態: {}", e))?;
        let config = manager
            .GetCurrentAccessPointConfiguration()
            .map_err(|e| format!("無法取得設定: {}", e))?;
        let ssid = config.Ssid().map_err(|e| e.to_string())?.to_string();
        let clients = manager.ClientCount().unwrap_or(0);

        Ok(HotspotStatus {
            running: state == TetheringOperationalState::On,
            ssid,
            client_count: clients,
        })
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn start_hotspot(ssid: String, password: String) -> Result<(), String> {
    if password.len() < 8 {
        return Err("密碼至少需要 8 個字元".to_string());
    }

    tokio::task::spawn_blocking(move || {
        use windows::Networking::NetworkOperators::TetheringOperationStatus;

        let manager = get_tethering_manager()?;

        let config = manager
            .GetCurrentAccessPointConfiguration()
            .map_err(|e| format!("無法取得設定: {}", e))?;

        config
            .SetSsid(&windows::core::HSTRING::from(&ssid))
            .map_err(|e| format!("設定 SSID 失敗: {}", e))?;
        config
            .SetPassphrase(&windows::core::HSTRING::from(&password))
            .map_err(|e| format!("設定密碼失敗: {}", e))?;

        manager
            .ConfigureAccessPointAsync(&config)
            .map_err(|e| format!("設定失敗: {}", e))?
            .get()
            .map_err(|e| format!("設定失敗: {}", e))?;

        let start_result = manager
            .StartTetheringAsync()
            .map_err(|e| format!("啟動失敗: {}", e))?
            .get()
            .map_err(|e| format!("啟動失敗: {}", e))?;

        if start_result.Status().unwrap_or(TetheringOperationStatus::Unknown)
            != TetheringOperationStatus::Success
        {
            return Err("啟動熱點失敗".to_string());
        }

        Ok(())
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn stop_hotspot() -> Result<(), String> {
    tokio::task::spawn_blocking(|| {
        use windows::Networking::NetworkOperators::TetheringOperationStatus;

        let manager = get_tethering_manager()?;

        let result = manager
            .StopTetheringAsync()
            .map_err(|e| format!("停止失敗: {}", e))?
            .get()
            .map_err(|e| format!("停止失敗: {}", e))?;

        if result.Status().unwrap_or(TetheringOperationStatus::Unknown)
            != TetheringOperationStatus::Success
        {
            return Err("停止熱點失敗".to_string());
        }

        Ok(())
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

// ── Commands: Bridge ──

fn run_ps(script: &str) -> Result<String, String> {
    let output = std::process::Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script])
        .output()
        .map_err(|e| format!("PowerShell 執行失敗: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if !output.status.success() {
        return Err(if stderr.is_empty() { stdout } else { stderr });
    }
    Ok(stdout)
}

#[tauri::command]
pub async fn bridge_status() -> Result<BridgeStatus, String> {
    tokio::task::spawn_blocking(|| {
        // Detect bridge adapter (Microsoft Network Adapter Multiplexor Driver)
        let script = r#"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$bridge = Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceDescription -like '*Multiplexor*' -or ($_.Name -like '*Bridge*' -and $_.InterfaceDescription -notlike '*Hyper-V*') }
if ($bridge -and $bridge.Status -eq 'Up') {
    Write-Output "ACTIVE|$($bridge.Name)"
} else {
    Write-Output "INACTIVE|"
}
"#;
        let output = run_ps(script).unwrap_or_else(|_| "INACTIVE|".to_string());
        let parts: Vec<&str> = output.split('|').collect();
        let active = parts.first().map(|s| *s == "ACTIVE").unwrap_or(false);
        let name = parts.get(1).unwrap_or(&"").to_string();
        let interfaces = if active && !name.is_empty() {
            vec![name]
        } else {
            vec![]
        };

        Ok(BridgeStatus { active, interfaces })
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn open_network_connections() -> Result<(), String> {
    std::process::Command::new("cmd")
        .args(["/C", "ncpa.cpl"])
        .spawn()
        .map_err(|e| format!("無法開啟網路連線: {}", e))?;
    Ok(())
}

// ── Commands: Ping ──

#[tauri::command]
pub async fn ping_peer(host: String) -> Result<PingResult, String> {
    // TODO: system ping
    Ok(PingResult {
        host,
        latency_ms: None,
        success: false,
    })
}

// ── Commands: Auth (API Access Token) ──

#[tauri::command]
pub async fn save_api_token(token: String, app: tauri::AppHandle) -> Result<AuthState, String> {
    if token.trim().is_empty() {
        return Err("Token cannot be empty".to_string());
    }

    // Validate token by calling ZeroTier Central API
    let client = reqwest::Client::new();
    let resp = client
        .get("https://api.zerotier.com/api/v1/status")
        .header("Authorization", format!("Bearer {}", token.trim()))
        .send()
        .await
        .map_err(|e| format!("Failed to validate token: {}", e))?;

    if !resp.status().is_success() {
        return Err("Invalid token — 請確認 Token 是否正確".to_string());
    }

    let stored = StoredAuth {
        access_token: token.trim().to_string(),
    };
    let path = auth_token_path(&app)?;
    let json = serde_json::to_string(&stored).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;

    Ok(AuthState { logged_in: true })
}

#[tauri::command]
pub async fn get_auth_state(app: tauri::AppHandle) -> Result<AuthState, String> {
    let logged_in = read_stored_token(&app).is_some();
    Ok(AuthState { logged_in })
}

#[tauri::command]
pub async fn logout(app: tauri::AppHandle) -> Result<(), String> {
    let path = auth_token_path(&app)?;
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ── Commands: Room (Central API) ──

#[tauri::command]
pub async fn zt_central_create_network(name: String, app: tauri::AppHandle) -> Result<RoomInfo, String> {
    let _token = read_stored_token(&app).ok_or("Not logged in")?;
    // TODO: POST https://api.zerotier.com/api/v1/network with Bearer token
    // Stub response
    let fake_id = format!("{:016x}", rand_id());
    let invite = format!("pokopia-link://join?network={}&name={}", fake_id, name);
    Ok(RoomInfo {
        network_id: fake_id,
        name,
        invite_link: invite,
        member_count: 1,
    })
}

#[tauri::command]
pub async fn zt_join_network(network_id: String, app: tauri::AppHandle) -> Result<(), String> {
    let token = read_zt_auth_token(&app).ok_or("Cannot read authtoken.secret — 請先匯入 ZeroTier Token")?;
    let client = zt_local_client(&token)?;
    let resp = client
        .post(format!("http://localhost:9993/network/{}", network_id))
        .json(&serde_json::json!({}))
        .send()
        .await
        .map_err(|e| format!("Failed to join network: {}", e))?;
    if !resp.status().is_success() {
        return Err(format!("Failed to join network: HTTP {}", resp.status()));
    }
    Ok(())
}

#[tauri::command]
pub async fn zt_leave_network(network_id: String, app: tauri::AppHandle) -> Result<(), String> {
    let token = read_zt_auth_token(&app).ok_or("Cannot read authtoken.secret — 請先匯入 ZeroTier Token")?;
    let client = zt_local_client(&token)?;
    let resp = client
        .delete(format!("http://localhost:9993/network/{}", network_id))
        .send()
        .await
        .map_err(|e| format!("Failed to leave network: {}", e))?;
    if !resp.status().is_success() {
        return Err(format!("Failed to leave network: HTTP {}", resp.status()));
    }
    Ok(())
}

#[tauri::command]
pub async fn zt_central_authorize_member(
    network_id: String,
    member_id: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let _token = read_stored_token(&app).ok_or("Not logged in")?;
    // TODO: POST https://api.zerotier.com/api/v1/network/{network_id}/member/{member_id}
    let _ = (network_id, member_id);
    Ok(())
}

// ── Commands: Float Window ──

#[tauri::command]
pub async fn toggle_float_window(app: tauri::AppHandle) -> Result<bool, String> {
    let win = match app.get_webview_window("float") {
        Some(w) => w,
        None => {
            // Recreate the float window if it was destroyed
            tauri::WebviewWindowBuilder::new(
                &app,
                "float",
                tauri::WebviewUrl::App("index.html?window=float".into()),
            )
            .title("Pokopia Link - Float")
            .inner_size(280.0, 320.0)
            .position(100.0, 100.0)
            .decorations(false)
            .transparent(true)
            .always_on_top(true)
            .resizable(true)
            .visible(false)
            .build()
            .map_err(|e| format!("Failed to create float window: {}", e))?
        }
    };

    let visible = win.is_visible().map_err(|e| e.to_string())?;
    if visible {
        win.hide().map_err(|e| e.to_string())?;
    } else {
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(!visible)
}

// ── Commands: Discord Rich Presence ──

#[tauri::command]
pub async fn discord_connect(app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<crate::discord::DiscordState>();
    state.connect()
}

#[tauri::command]
pub async fn discord_disconnect(app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<crate::discord::DiscordState>();
    state.disconnect()
}

#[tauri::command]
pub async fn discord_update_activity(
    room_name: String,
    network_id: String,
    current_size: u32,
    max_size: u32,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let state = app.state::<crate::discord::DiscordState>();
    state.update_activity(&room_name, &network_id, current_size, max_size)
}

#[tauri::command]
pub async fn discord_clear_activity(app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<crate::discord::DiscordState>();
    state.clear_activity()
}

fn rand_id() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos() as u64
}
