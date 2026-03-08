export interface RealtimeAppointmentStats {
  waiting: number;
  inProgress: number;
  completed: number;
}

interface AppointmentSocketBaseMessage {
  type: string;
  data?: unknown;
}

interface HeartbeatMessage {
  type: 'heartbeat';
  timestamp: string;
}

interface AuthMessage {
  type: 'auth';
  token: string;
}

type SocketEventName =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'maxReconnectReached'
  | 'statsUpdate'
  | 'notification';

type EventCallback<T = unknown> = (payload?: T) => void;

const DEFAULT_RECONNECT_INTERVAL = 3000;
const DEFAULT_HEARTBEAT_INTERVAL = 30000;
const DEFAULT_MAX_RECONNECT_COUNT = 5;

export type WebSocketSidPrefix = 'admin' | 'doctor' | 'resident';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveWsBaseUrl(): string {
  const configured = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
  if (configured) {
    if (configured.startsWith('ws://') || configured.startsWith('wss://')) {
      return trimTrailingSlash(configured);
    }

    if (configured.startsWith('http://') || configured.startsWith('https://')) {
      const wsProtocol = configured.startsWith('https://') ? 'wss://' : 'ws://';
      return trimTrailingSlash(configured.replace(/^https?:\/\//, wsProtocol));
    }
  }

  // Prefer backend direct address in local development to avoid proxy upgrade mismatch.
  if (import.meta.env.DEV) {
    return 'ws://localhost:8080';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}

export class AppointmentWebSocket {
  private readonly userId: number;

  private readonly sidPrefix: WebSocketSidPrefix;

  private ws: WebSocket | null = null;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly token: string | null;

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private reconnectCount = 0;

  private readonly maxReconnectCount = DEFAULT_MAX_RECONNECT_COUNT;

  private readonly reconnectInterval = DEFAULT_RECONNECT_INTERVAL;

  private readonly heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL;

  private manualDisconnect = false;

  private listeners = new Map<SocketEventName, EventCallback[]>();

  constructor(userId: number, sidPrefix: WebSocketSidPrefix, token?: string | null) {
    this.userId = userId;
    this.sidPrefix = sidPrefix;
    const persistedToken = localStorage.getItem('token');
    this.token = token || persistedToken;
  }

  connect() {
    this.manualDisconnect = false;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    const wsBaseUrl = resolveWsBaseUrl();
    const sid = `${this.sidPrefix}_${this.userId}`;
    const wsUrl = `${wsBaseUrl}/ws/${sid}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectCount = 0;

        // Browser WebSocket cannot set custom headers; send token as first auth message.
        if (this.token) {
          const authPayload: AuthMessage = {
            type: 'auth',
            token: this.token,
          };
          this.ws?.send(JSON.stringify(authPayload));
        }

        this.startHeartbeat();
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.emit('disconnected');

        if (!this.manualDisconnect) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (event) => {
        this.emit('error', event);
      };
    } catch (error) {
      this.emit('error', error);
    }
  }

  disconnect() {
    this.manualDisconnect = true;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event: SocketEventName, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const callbacks = this.listeners.get(event);
    callbacks?.push(callback);
  }

  off(event: SocketEventName, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) {
      return;
    }

    const index = callbacks.indexOf(callback);
    if (index >= 0) {
      callbacks.splice(index, 1);
    }
  }

  private handleMessage(rawData: string) {
    try {
      const message = JSON.parse(rawData) as AppointmentSocketBaseMessage;

      switch (message.type) {
        case 'appointment_stats':
          this.emit('statsUpdate', message.data);
          break;
        case 'notification':
          this.emit('notification', message.data);
          break;
        default:
          break;
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectCount >= this.maxReconnectCount) {
      this.emit('maxReconnectReached');
      return;
    }

    this.reconnectCount += 1;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  private startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const heartbeat: HeartbeatMessage = {
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      };

      this.ws.send(JSON.stringify(heartbeat));
    }, this.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private emit(event: SocketEventName, payload?: unknown) {
    const callbacks = this.listeners.get(event);
    if (!callbacks || callbacks.length === 0) {
      return;
    }

    callbacks.forEach((callback) => {
      try {
        callback(payload);
      } catch {
        // Prevent callback runtime errors from affecting socket lifecycle.
      }
    });
  }
}

export default AppointmentWebSocket;
