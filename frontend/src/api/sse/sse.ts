import { useEffect } from "react";

export interface TicketEvent {
  type: string;
  ticket_id?: string;
  assigned_agent_id?: number;
  [key: string]: any; // allow extra fields
}

export function useTicketUpdates(onUpdate: (event: TicketEvent) => void) {
  useEffect(() => {
    const events = new EventSource("http://localhost:8000/events");

    events.onmessage = (e: MessageEvent) => {
      try {
        const data: TicketEvent = JSON.parse(e.data);
        console.log("Received SSE:", data);
        onUpdate(data);
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    events.onerror = (err) => {
      console.warn("SSE connection lost, retrying...", err);
      // Optional: events.close();
    };

    return () => {
      console.log("Closing SSE connection...");
      events.close();
    };
  }, [onUpdate]);
}
