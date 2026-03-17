import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

interface UseDiscordReturn {
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  updateActivity: (
    roomName: string,
    networkId: string,
    currentSize: number,
    maxSize: number,
  ) => Promise<void>;
  clearActivity: () => Promise<void>;
}

export function useDiscord(): UseDiscordReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      await invoke("discord_connect");
      setConnected(true);
    } catch (e) {
      console.error("Discord connect failed:", e);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await invoke("discord_disconnect");
      setConnected(false);
    } catch (e) {
      console.error("Discord disconnect failed:", e);
    }
  }, []);

  const updateActivity = useCallback(
    async (
      roomName: string,
      networkId: string,
      currentSize: number,
      maxSize: number,
    ) => {
      try {
        await invoke("discord_update_activity", {
          roomName,
          networkId,
          currentSize,
          maxSize,
        });
      } catch (e) {
        console.error("Discord update activity failed:", e);
      }
    },
    [],
  );

  const clearActivity = useCallback(async () => {
    try {
      await invoke("discord_clear_activity");
    } catch (e) {
      console.error("Discord clear activity failed:", e);
    }
  }, []);

  return { connected, connecting, connect, disconnect, updateActivity, clearActivity };
}
