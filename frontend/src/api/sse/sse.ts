// useTicketUpdates.ts
import { useEffect, useRef } from "react";

export interface TicketEvent {
  type: string;
  ticket_id?: string;
  assigned_agent_id?: number;
  [key: string]: any;
}

export function useTicketUpdates(onUpdate: (event: TicketEvent) => void) {
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Prevent multiple connections
    if (sseRef.current) {
      console.log("SSE already open — skipping reconnect.");
      return;
    }

    console.log("Opening SSE connection...");
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const es = new EventSource(`${API_BASE.replace('/api', '')}/events`);
    sseRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("📩 Received SSE:", data);
        onUpdate(data);
      } catch (error) {
        console.error("❌ Failed to parse SSE message:", error);
      }
    };

    es.onerror = (err) => {
      console.warn("⚠ SSE connection error:", err);
      // You may implement retry logic here
    };

    return () => {
      console.log("🛑 Closing SSE connection...");
      es.close();
      sseRef.current = null;
    };
  }, []); // ← empty deps = NEVER reconnect automatically
}
