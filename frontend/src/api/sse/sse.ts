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
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
    const sseUrl = `${API_BASE}/events`;
    
    console.log('SSE Debug Info:');
    console.log('- API_BASE:', API_BASE);
    console.log('- SSE URL:', sseUrl);
    console.log('- Environment:', import.meta.env.MODE);
    
    const es = new EventSource(sseUrl);
    sseRef.current = es;
    
    console.log("SSE connection object created");

    es.onopen = () => {
      console.log("✅ SSE connection opened successfully");
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("📩 Received SSE:", data);
        onUpdate(data);
      } catch (error) {
        console.error("❌ Failed to parse SSE message:", error);
        console.error("Raw message:", e.data);
      }
    };

    es.onerror = (err) => {
      console.error("⚠ SSE connection error:", err);
      console.error("SSE readyState:", es.readyState);
      console.error("SSE URL:", sseUrl);
      
      if (es.readyState === EventSource.CLOSED) {
        console.error("❌ SSE connection closed - likely a 404 or server error");
      }
    };

    return () => {
      console.log("🛑 Closing SSE connection...");
      es.close();
      sseRef.current = null;
    };
  }, []); // ← empty deps = NEVER reconnect automatically
}
