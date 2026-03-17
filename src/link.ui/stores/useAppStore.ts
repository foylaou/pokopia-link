import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

// ── Types ──

interface RoomInfo {
  networkId: string;
  name: string;
  inviteLink: string;
  memberCount: number;
}

interface AppState {
  // Init
  init: () => Promise<void>;

  // Discord
  discordConnected: boolean;
  discordConnecting: boolean;
  discordConnect: () => Promise<void>;
  discordDisconnect: () => Promise<void>;
  discordUpdateActivity: (
    roomName: string,
    networkId: string,
    currentSize: number,
    maxSize: number,
  ) => Promise<void>;
  discordClearActivity: () => Promise<void>;

  // Auth
  loggedIn: boolean;
  authLoading: boolean;
  authSaving: boolean;
  authError: string | null;
  checkAuth: () => Promise<void>;
  saveToken: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // Room
  room: RoomInfo | null;
  roomCreating: boolean;
  roomJoining: boolean;
  roomError: string | null;
  maxPlayers: number;
  setMaxPlayers: (n: number) => void;
  createRoom: (name: string) => Promise<void>;
  joinRoom: (networkId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── Init (runs once on app start) ──
  init: async () => {
    // Check auth
    get().checkAuth();
    // Auto-connect Discord (silent fail if Discord not running)
    get().discordConnect();
  },

  // ── Discord ──
  discordConnected: false,
  discordConnecting: false,

  discordConnect: async () => {
    set({ discordConnecting: true });
    try {
      await invoke("discord_connect");
      set({ discordConnected: true });
    } catch (e) {
      console.error("Discord connect failed:", e);
    } finally {
      set({ discordConnecting: false });
    }
  },

  discordDisconnect: async () => {
    try {
      await invoke("discord_disconnect");
      set({ discordConnected: false });
    } catch (e) {
      console.error("Discord disconnect failed:", e);
    }
  },

  discordUpdateActivity: async (roomName, networkId, currentSize, maxSize) => {
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

  discordClearActivity: async () => {
    try {
      await invoke("discord_clear_activity");
    } catch (e) {
      console.error("Discord clear activity failed:", e);
    }
  },

  // ── Auth ──
  loggedIn: false,
  authLoading: true,
  authSaving: false,
  authError: null,

  checkAuth: async () => {
    try {
      const state = await invoke<{ loggedIn: boolean }>("get_auth_state");
      set({ loggedIn: state.loggedIn });
    } catch {
      set({ loggedIn: false });
    } finally {
      set({ authLoading: false });
    }
  },

  saveToken: async (token: string) => {
    set({ authSaving: true, authError: null });
    try {
      await invoke("save_api_token", { token });
      set({ loggedIn: true, authSaving: false });
      return true;
    } catch (e) {
      set({ authError: typeof e === "string" ? e : String(e), authSaving: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await invoke("logout");
      set({ loggedIn: false, authError: null });
    } catch (e) {
      console.error("Logout failed:", e);
    }
  },

  // ── Room ──
  room: null,
  roomCreating: false,
  roomJoining: false,
  roomError: null,
  maxPlayers: 4,

  setMaxPlayers: (n) => {
    set({ maxPlayers: n });
    // Sync discord if in room
    const { room, discordConnected, discordUpdateActivity } = get();
    if (room && discordConnected) {
      discordUpdateActivity(room.name, room.networkId, room.memberCount, n);
    }
  },

  createRoom: async (name) => {
    set({ roomCreating: true, roomError: null });
    try {
      const result = await invoke<RoomInfo>("zt_central_create_network", { name });

      await invoke("zt_join_network", { networkId: result.networkId });

      const room: RoomInfo = { ...result };
      set({ room });

      // Auto-update Discord
      const { discordConnected, discordUpdateActivity, maxPlayers } = get();
      if (discordConnected) {
        await discordUpdateActivity(room.name, room.networkId, room.memberCount, maxPlayers);
      }
    } catch (e) {
      set({ roomError: typeof e === "string" ? e : String(e) });
    } finally {
      set({ roomCreating: false });
    }
  },

  joinRoom: async (networkId) => {
    set({ roomJoining: true, roomError: null });
    try {
      await invoke("zt_join_network", { networkId });
      const room: RoomInfo = {
        networkId,
        name: networkId,
        inviteLink: `pokopia-link://join?network=${networkId}`,
        memberCount: 0,
      };
      set({ room });

      const { discordConnected, discordUpdateActivity, maxPlayers } = get();
      if (discordConnected) {
        await discordUpdateActivity(room.name, room.networkId, room.memberCount, maxPlayers);
      }
    } catch (e) {
      set({ roomError: typeof e === "string" ? e : String(e) });
    } finally {
      set({ roomJoining: false });
    }
  },

  leaveRoom: async () => {
    const { room, discordConnected, discordClearActivity } = get();
    if (!room) return;
    try {
      await invoke("zt_leave_network", { networkId: room.networkId });
      set({ room: null });
      if (discordConnected) {
        await discordClearActivity();
      }
    } catch (e) {
      set({ roomError: typeof e === "string" ? e : String(e) });
    }
  },
}));
