export type ConnectionStatus = "online" | "connecting" | "offline" | "na";

export interface ZeroTierEnvironment {
  installed: boolean;
  serviceRunning: boolean;
  apiReachable: boolean;
  wingetAvailable: boolean;
}

export interface ZeroTierStatus {
  online: boolean;
  address: string;
  version: string;
}

export interface ZeroTierPeer {
  address: string;
  latency: number;
  role: string;
  paths: ZeroTierPath[];
}

export interface ZeroTierPath {
  address: string;
  active: boolean;
}

export interface ZeroTierNetwork {
  id: string;
  name: string;
  status: string;
  bridge: boolean;
  assignedAddresses: string[];
}

export interface HotspotStatus {
  running: boolean;
  ssid: string;
  clientCount: number;
}

export interface HotspotClient {
  mac: string;
  ip: string;
}

export interface BridgeStatus {
  active: boolean;
  interfaces: string[];
}

export interface PingResult {
  host: string;
  latencyMs: number | null;
  success: boolean;
}

export interface PingHistoryEntry {
  timestamp: number;
  latencyMs: number | null;
}
