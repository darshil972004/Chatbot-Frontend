/**
 * Agent API and WebSocket client utilities
 * Exported functions for agent login, notifier websocket, and chat websocket
 */

export type AgentLoginRequest = {
  username: string;
  password: string;
};

export type AgentLoginResponse = {
  success: boolean;
  data?: {
    id: number;
    username: string;
    display_name?: string;
    email?: string;
    is_active?: boolean;
    max_concurrent_chats?: number;
    role?: string;
    created_at?: string;
  };
  error?: {
    message: string;
    status_code: number;
  };
};

export type AgentNotifierMessage = {
  type: string;
  ticket_id?: string;
  agent_id?: string;
  agent_name?: string;
  user_name?: string;
  user_email?: string;
  category?: string;
  [key: string]: any;
};

export type ChatMessage = {
  type?: string;
  text?: string;
  action?: string;
  ticket_id?: string;
  agent_id?: string;
  agent_name?: string;
  user_id?: string;
  [key: string]: any;
};

const API_BASE = (window as any).VITE_CHATBOT_API_BASE || 'http://localhost:8000';
const BACKEND_WS_HOST = (window as any).VITE_BACKEND_WS_HOST || (window.location.hostname || '127.0.0.1');
const BACKEND_WS_PORT = (window as any).VITE_BACKEND_WS_PORT || '8000';
const CHATBOT_TOKEN = (window as any).VITE_CHATBOT_TOKEN || 'chatbot-api-token-2024';

/**
 * Agent login API call
 * @param username agent username
 * @param password agent password
 * @returns agent login response with agent data
 */
export async function agentLogin(
  username: string,
  password: string
): Promise<AgentLoginResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/agent-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHATBOT_TOKEN}`,
      },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        message = (j as any)?.detail || message;
      } catch {
        message = res.statusText || message;
      }
      return {
        success: false,
        error: {
          message,
          status_code: res.status,
        },
      };
    }

    const data = (await res.json()) as AgentLoginResponse;
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during agent login';
    return {
      success: false,
      error: {
        message,
        status_code: 0,
      },
    };
  }
}

/**
 * Open agent notifier WebSocket
 * Agents connect to receive new ticket notifications and send claim/action messages
 * @param agentId agent ID
 * @param onMessage callback for incoming messages
 * @param onError callback for errors
 * @returns WebSocket instance
 */
export function openAgentNotifierWS(
  agentId: number | string,
  onMessage?: (msg: AgentNotifierMessage) => void,
  onError?: (err: string) => void
): WebSocket {
  const wsUrl = `ws://${BACKEND_WS_HOST}:${BACKEND_WS_PORT}/ws/agents/${agentId}`;
  console.log('Opening agent notifier WS:', wsUrl);

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('Agent notifier WS connected');
  };

  ws.onmessage = (event: MessageEvent) => {
    try {
      const payload = JSON.parse(event.data) as AgentNotifierMessage;
      console.log('Agent notifier message received:', payload);
      if (onMessage) {
        onMessage(payload);
      }
    } catch (err) {
      // Not JSON, pass raw data
      console.log('Non-JSON notifier message:', event.data);
      if (onMessage) {
        onMessage({ type: 'raw', text: event.data });
      }
    }
  };

  ws.onerror = (event: Event) => {
    const msg = 'Agent notifier WS error';
    console.error(msg, event);
    if (onError) {
      onError(msg);
    }
  };

  ws.onclose = () => {
    console.log('Agent notifier WS closed');
  };

  return ws;
}

/**
 * Send claim action on agent notifier WS
 * @param ws WebSocket instance
 * @param ticketId ticket to claim
 */
export function sendClaimAction(ws: WebSocket, ticketId: string | number): void {
  if (ws.readyState === WebSocket.OPEN) {
    const payload = {
      action: 'claim',
      ticket_id: ticketId,
    };
    ws.send(JSON.stringify(payload));
    console.log('Sent claim action:', payload);
  } else {
    console.warn('WebSocket not open, cannot send claim action');
  }
}

/**
 * Open agent-side chat WebSocket for a ticket
 * Agent must send an init message first: {"type":"init","agent_id":"...","agent_name":"..."}
 * @param ticketId ticket ID
 * @param agentId agent ID
 * @param agentName agent display name
 * @param onMessage callback for incoming messages
 * @param onError callback for errors
 * @returns WebSocket instance
 */
export function openAgentChatWS(
  ticketId: string | number,
  agentId: number | string,
  agentName: string,
  onMessage?: (msg: ChatMessage) => void,
  onError?: (err: string) => void
): WebSocket {
  const wsUrl = `ws://${BACKEND_WS_HOST}:${BACKEND_WS_PORT}/ws/chat/${ticketId}/agent`;
  console.log('Opening agent chat WS:', wsUrl);

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('Agent chat WS connected, sending init message');
    // Send agent init message
    const initMsg = {
      type: 'init',
      agent_id: agentId,
      agent_name: agentName,
    };
    ws.send(JSON.stringify(initMsg));
  };

  ws.onmessage = (event: MessageEvent) => {
    try {
      const payload = JSON.parse(event.data) as ChatMessage;
      console.log('Agent chat WS message received:', payload);
      if (onMessage) {
        onMessage(payload);
      }
    } catch (err) {
      // Not JSON, treat as plain text message from user
      console.log('Non-JSON chat message:', event.data);
      if (onMessage) {
        onMessage({ type: 'text', text: event.data });
      }
    }
  };

  ws.onerror = (event: Event) => {
    const msg = 'Agent chat WS error';
    console.error(msg, event);
    if (onError) {
      onError(msg);
    }
  };

  ws.onclose = () => {
    console.log('Agent chat WS closed');
  };

  return ws;
}

/**
 * Send chat message on agent chat WS
 * @param ws WebSocket instance
 * @param message message text
 */
export function sendChatMessage(ws: WebSocket, message: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message);
    console.log('Sent chat message:', message);
  } else {
    console.warn('WebSocket not open, cannot send message');
  }
}

/**
 * Send release action on agent chat WS (release ticket back to bot)
 * @param ws WebSocket instance
 * @param ticketId ticket ID
 */
export function sendReleaseAction(ws: WebSocket, ticketId: string | number): void {
  if (ws.readyState === WebSocket.OPEN) {
    const payload = {
      action: 'release',
      ticket_id: ticketId,
    };
    ws.send(JSON.stringify(payload));
    console.log('Sent release action:', payload);
  } else {
    console.warn('WebSocket not open, cannot send release action');
  }
}

/**
 * Store agent info in localStorage
 * @param agent agent object
 */
export function storeAgentInfo(agent: any): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('agent', JSON.stringify(agent));
  }
}

/**
 * Retrieve agent info from localStorage
 * @returns agent object or null
 */
export function retrieveAgentInfo(): any {
  if (typeof window !== 'undefined') {
    const raw = window.localStorage.getItem('agent');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.warn('Failed to parse stored agent info', e);
        return null;
      }
    }
  }
  return null;
}

/**
 * Clear agent info from localStorage
 */
export function clearAgentInfo(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('agent');
  }
}
