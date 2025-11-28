export type ChatMessage = {
  id: string;
  role: 'user' | 'bot' | 'system';
  text: string;
};

export type ChatbotResponse =
  | {
      success: true;
      data: {
        type: string;
        result: string;
        response_type?: string;
        options?: string[];
        properties?: any[];
        follow_up?: string;
      };
    }
  | {
      success: false;
      error?: string;
      detail?: string;
    };

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const CHATBOT_TOKEN = import.meta.env.VITE_CHATBOT_TOKEN || 'chatbot-api-token-2024';

export async function sendMessageToBot(userId: string, prompt: string): Promise<ChatbotResponse> {
  const payload: Record<string, unknown> = { user_id: userId, prompt };
  // Only include property_data when present to avoid FastAPI 422
  // payload.property_data = someValue

  const res = await fetch(`${API_BASE}/chatbot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHATBOT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = (j as any)?.detail || JSON.stringify(j);
    } catch {
      detail = res.statusText;
    }
    // Surface detail for debugging
    console.error('Chatbot API error', res.status, detail)
    return { success: false, detail } as ChatbotResponse;
  }
  return (await res.json()) as ChatbotResponse;
}


