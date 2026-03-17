mod commands;
mod discord;
mod tray;

use commands::*;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_deep_link::init())
        .manage(discord::DiscordState::new())
        .setup(|app| {
            // Setup system tray
            tray::setup_tray(app.handle())?;

            // Main window: intercept close → hide to tray instead of quitting
            if let Some(win) = app.get_webview_window("main") {
                let win_clone = win.clone();
                win.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = win_clone.hide();
                    }
                });
            }

            // Float window: intercept close → hide instead of destroying
            if let Some(win) = app.get_webview_window("float") {
                let win_clone = win.clone();
                win.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = win_clone.hide();
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // ZeroTier environment
            check_zerotier_environment,
            import_zt_auth_token,
            save_zt_auth_token,
            zt_get_status,
            zt_get_peers,
            zt_get_networks,
            // Hotspot
            hotspot_status,
            start_hotspot,
            stop_hotspot,
            // Bridge
            bridge_status,
            open_network_connections,
            // Ping
            ping_peer,
            // Auth
            save_api_token,
            get_auth_state,
            logout,
            // Room / Central API
            zt_central_create_network,
            zt_join_network,
            zt_leave_network,
            zt_central_authorize_member,
            // Float window
            toggle_float_window,
            // Discord
            discord_connect,
            discord_disconnect,
            discord_update_activity,
            discord_clear_activity,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
