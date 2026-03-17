use serde::Serialize;

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

#[derive(Serialize)]
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

// ── Commands ──

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
    // TODO: ZeroTier Local API :9993
    Err("ZeroTier not connected".to_string())
}

#[tauri::command]
pub async fn zt_get_peers() -> Result<Vec<ZeroTierPeer>, String> {
    // TODO: ZeroTier Local API :9993/peer
    Err("ZeroTier not connected".to_string())
}

#[tauri::command]
pub async fn zt_get_networks() -> Result<Vec<ZeroTierNetwork>, String> {
    // TODO: ZeroTier Local API :9993/network
    Err("ZeroTier not connected".to_string())
}

#[tauri::command]
pub async fn hotspot_status() -> Result<HotspotStatus, String> {
    // TODO: netsh wlan show hostednetwork
    Ok(HotspotStatus {
        running: false,
        ssid: String::new(),
        client_count: 0,
    })
}

#[tauri::command]
pub async fn bridge_status() -> Result<BridgeStatus, String> {
    // TODO: netsh bridge show
    Ok(BridgeStatus {
        active: false,
        interfaces: vec![],
    })
}

#[tauri::command]
pub async fn ping_peer(host: String) -> Result<PingResult, String> {
    // TODO: system ping
    Ok(PingResult {
        host,
        latency_ms: None,
        success: false,
    })
}
