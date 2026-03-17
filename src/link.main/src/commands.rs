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

// ── ZeroTier ──

#[derive(Serialize)]
pub struct ZeroTierEnvironment {
    pub installed: bool,
    pub service_running: bool,
    pub api_reachable: bool,
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
pub struct ZeroTierNetwork {
    pub id: String,
    pub name: String,
    pub status: String,
    pub bridge: bool,
    pub assigned_addresses: Vec<String>,
}

// ── Hotspot ──

#[derive(Serialize)]
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
pub struct AuthState {
    pub logged_in: bool,
}

// ── Room ──

#[derive(Serialize)]
pub struct RoomInfo {
    pub network_id: String,
    pub name: String,
    pub invite_link: String,
    pub member_count: u32,
}

// ── Commands: ZeroTier Environment ──

#[tauri::command]
pub async fn check_zerotier_environment() -> Result<ZeroTierEnvironment, String> {
    // TODO: SCM + where.exe detection on Windows
    Ok(ZeroTierEnvironment {
        installed: false,
        service_running: false,
        api_reachable: false,
        winget_available: false,
    })
}

#[tauri::command]
pub async fn zt_get_status() -> Result<ZeroTierStatus, String> {
    // TODO: GET http://localhost:9993/status
    Err("ZeroTier not connected".to_string())
}

#[tauri::command]
pub async fn zt_get_peers() -> Result<Vec<ZeroTierPeer>, String> {
    // TODO: GET http://localhost:9993/peer
    Err("ZeroTier not connected".to_string())
}

#[tauri::command]
pub async fn zt_get_networks() -> Result<Vec<ZeroTierNetwork>, String> {
    // TODO: GET http://localhost:9993/network
    Err("ZeroTier not connected".to_string())
}

// ── Commands: Hotspot ──

#[tauri::command]
pub async fn hotspot_status() -> Result<HotspotStatus, String> {
    // TODO: netsh wlan show hostednetwork
    Ok(HotspotStatus {
        running: false,
        ssid: String::new(),
        client_count: 0,
    })
}

// ── Commands: Bridge ──

#[tauri::command]
pub async fn bridge_status() -> Result<BridgeStatus, String> {
    // TODO: netsh bridge show
    Ok(BridgeStatus {
        active: false,
        interfaces: vec![],
    })
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
pub async fn zt_join_network(network_id: String) -> Result<(), String> {
    // TODO: POST http://localhost:9993/network/{network_id} body: {}
    let _ = network_id;
    Ok(())
}

#[tauri::command]
pub async fn zt_leave_network(network_id: String) -> Result<(), String> {
    // TODO: DELETE http://localhost:9993/network/{network_id}
    let _ = network_id;
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
    if let Some(win) = app.get_webview_window("float") {
        let visible = win.is_visible().map_err(|e| e.to_string())?;
        if visible {
            win.hide().map_err(|e| e.to_string())?;
        } else {
            win.show().map_err(|e| e.to_string())?;
            win.set_focus().map_err(|e| e.to_string())?;
        }
        Ok(!visible)
    } else {
        Err("Float window not found".to_string())
    }
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
