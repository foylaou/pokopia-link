import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

interface RoomInfo {
  networkId: string;
  name: string;
  inviteLink: string;
  memberCount: number;
}

interface UseRoomReturn {
  room: RoomInfo | null;
  creating: boolean;
  joining: boolean;
  error: string | null;
  createRoom: (name: string) => Promise<void>;
  joinRoom: (networkId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
}

export function useRoom(): UseRoomReturn {
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(async (name: string) => {
    setCreating(true);
    setError(null);
    try {
      const result = await invoke<{
        network_id: string;
        name: string;
        invite_link: string;
        member_count: number;
      }>("zt_central_create_network", { name });

      // Also join the local daemon
      await invoke("zt_join_network", { networkId: result.network_id });

      setRoom({
        networkId: result.network_id,
        name: result.name,
        inviteLink: result.invite_link,
        memberCount: result.member_count,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }, []);

  const joinRoom = useCallback(async (networkId: string) => {
    setJoining(true);
    setError(null);
    try {
      await invoke("zt_join_network", { networkId });
      setRoom({
        networkId,
        name: networkId,
        inviteLink: `pokopia-link://join?network=${networkId}`,
        memberCount: 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setJoining(false);
    }
  }, []);

  const leaveRoom = useCallback(async () => {
    if (!room) return;
    try {
      await invoke("zt_leave_network", { networkId: room.networkId });
      setRoom(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [room]);

  return { room, creating, joining, error, createRoom, joinRoom, leaveRoom };
}
