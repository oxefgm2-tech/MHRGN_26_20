import { ChatMessage, LiveCallSession, ClinicTask } from '../types';

export interface OnlineUser {
  username: string;
  name: string;
  role: string;
  isOnline: boolean;
}

export interface SummonEvent {
  type: 'chat:summon';
  roomId: string;
  roomName: string;
  callerName: string;
  reason: string;
  isForced: boolean;
  targetUsernames: string[];
  activeCall?: LiveCallSession;
  message?: ChatMessage;
}

type MessageCallback = (data: { roomId: string; message: ChatMessage }) => void;
type PresenceCallback = (onlineUsers: OnlineUser[]) => void;
type SummonCallback = (summon: SummonEvent) => void;
type CallCallback = (data: { roomId: string; activeCall: LiveCallSession }) => void;
type TaskCallback = (data: { type: string; task?: ClinicTask; taskId?: string }) => void;

class RealtimeChatService {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private messageListeners = new Set<MessageCallback>();
  private presenceListeners = new Set<PresenceCallback>();
  private summonListeners = new Set<SummonCallback>();
  private callListeners = new Set<CallCallback>();
  private taskListeners = new Set<TaskCallback>();
  private currentUser: { username: string; name: string; role: string } | null = null;
  private isConnecting = false;

  public init(user: { username: string; name: string; role: string }) {
    this.currentUser = user;
    this.connect();
  }

  public updateUserInfo(user: { username: string; name: string; role: string }) {
    this.currentUser = user;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendAuth();
    } else {
      this.connect();
    }
  }

  private connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.isConnecting = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.sendAuth();
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncoming(data);
        } catch (e) {
          // ignore parsing error
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch (e) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private sendAuth() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.currentUser) return;
    this.ws.send(JSON.stringify({
      type: 'auth',
      username: this.currentUser.username,
      name: this.currentUser.name,
      role: this.currentUser.role,
    }));
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private handleIncoming(data: any) {
    if (!data || !data.type) return;

    if (data.type === 'presence' && Array.isArray(data.onlineUsers)) {
      this.presenceListeners.forEach((fn) => fn(data.onlineUsers));
    } else if (data.type === 'chat:message' && data.message) {
      this.messageListeners.forEach((fn) => fn({ roomId: data.roomId, message: data.message }));
    } else if (data.type === 'chat:summon') {
      this.summonListeners.forEach((fn) => fn(data as SummonEvent));
    } else if (data.type === 'chat:call_updated' && data.activeCall) {
      this.callListeners.forEach((fn) => fn({ roomId: data.roomId, activeCall: data.activeCall }));
    } else if (data.type.startsWith('task:')) {
      this.taskListeners.forEach((fn) => fn(data));
    }
  }

  public onMessage(fn: MessageCallback): () => void {
    this.messageListeners.add(fn);
    return () => this.messageListeners.delete(fn);
  }

  public onPresence(fn: PresenceCallback): () => void {
    this.presenceListeners.add(fn);
    return () => this.presenceListeners.delete(fn);
  }

  public onSummon(fn: SummonCallback): () => void {
    this.summonListeners.add(fn);
    return () => this.summonListeners.delete(fn);
  }

  public onCallUpdate(fn: CallCallback): () => void {
    this.callListeners.add(fn);
    return () => this.callListeners.delete(fn);
  }

  public onTaskEvent(fn: TaskCallback): () => void {
    this.taskListeners.add(fn);
    return () => this.taskListeners.delete(fn);
  }

  public destroy() {
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const realtimeChat = new RealtimeChatService();
