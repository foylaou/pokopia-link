use discord_rich_presence::{
    activity::{Activity, Assets, Party, Secrets, Timestamps},
    DiscordIpc, DiscordIpcClient,
};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

const DISCORD_APP_ID: &str = env!("DISCORD_APP_ID");

pub struct DiscordState {
    client: Mutex<Option<DiscordIpcClient>>,
}

impl DiscordState {
    pub fn new() -> Self {
        Self {
            client: Mutex::new(None),
        }
    }

    pub fn connect(&self) -> Result<(), String> {
        let mut guard = self.client.lock().map_err(|e| e.to_string())?;
        if guard.is_some() {
            return Ok(());
        }

        let mut client =
            DiscordIpcClient::new(DISCORD_APP_ID).map_err(|e| e.to_string())?;
        client.connect().map_err(|e| e.to_string())?;
        *guard = Some(client);
        Ok(())
    }

    pub fn disconnect(&self) -> Result<(), String> {
        let mut guard = self.client.lock().map_err(|e| e.to_string())?;
        if let Some(ref mut client) = *guard {
            let _ = client.close();
        }
        *guard = None;
        Ok(())
    }

    pub fn update_activity(
        &self,
        room_name: &str,
        network_id: &str,
        current_size: u32,
        max_size: u32,
    ) -> Result<(), String> {
        let mut guard = self.client.lock().map_err(|e| e.to_string())?;
        let client = guard.as_mut().ok_or("Discord not connected")?;

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        let state_text = format!("{}/{} players", current_size, max_size);
        let details_text = format!("Room: {}", room_name);

        // join secret encodes network_id + room_name for the receiver
        // buttons and secrets are mutually exclusive; secrets enables the invite system
        let join_secret = format!("pokopia:{}:{}", network_id, room_name);

        let activity = Activity::new()
            .state(&state_text)
            .details(&details_text)
            .timestamps(Timestamps::new().start(now))
            .assets(
                Assets::new()
                    .large_image("pokopia_link_icon")
                    .large_text("Pokopia Link"),
            )
            .party(
                Party::new()
                    .id(network_id)
                    .size([current_size as i32, max_size as i32]),
            )
            .secrets(
                Secrets::new()
                    .join(&join_secret),
            );

        client.set_activity(activity).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn clear_activity(&self) -> Result<(), String> {
        let mut guard = self.client.lock().map_err(|e| e.to_string())?;
        let client = guard.as_mut().ok_or("Discord not connected")?;
        client.clear_activity().map_err(|e| e.to_string())?;
        Ok(())
    }
}
