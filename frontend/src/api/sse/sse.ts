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
    
    console.log('SSE Debug:');
    console.log('- API_BASE:', API_BASE);
    console.log('- SSE URL:', sseUrl);
    
    let es: EventSource | null = null;
    try {
      es = new EventSource(sseUrl);
      sseRef.current = es;
      console.log("SSE connection created successfully");
    } catch (error) {
      console.error("Failed to create SSE connection:", error);
      return;
    }

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
      console.error("⚠ SSE connection error:", {
        error: err,
        url: sseUrl,
        readyState: es?.readyState
      });
      
      // Check if it's a 404 error
      if (es?.readyState === EventSource.CLOSED) {
        console.error("SSE connection failed - endpoint may not exist or server is unreachable");
      }
    };

    return () => {
      console.log("🛑 Closing SSE connection...");
      if (es) {
        es.close();
      }
      sseRef.current = null;
    };
  }, []); // ← empty deps = NEVER reconnect automatically
}
