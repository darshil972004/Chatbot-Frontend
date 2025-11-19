import axios from "axios";

/**
 * Ticket Management API functions
 */

const API_BASE = (window as any).VITE_CHATBOT_API_BASE || 'http://localhost:8000';
const CHATBOT_TOKEN = (window as any).VITE_CHATBOT_TOKEN || 'chatbot-api-token-2024';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CHATBOT_TOKEN}`,
  },
});

// Types for ticket management
export type Ticket = {
  id: string;
  session_id: string;
  user_id?: number;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  sla_due_at?: string;
  created_at: string;
  updated_at?: string;
};

export type TicketAgent = {
  id: string;
  ticket_id: string;
  assigned_agent_id: number;
  title?: string;
  description?: string;
  status: 'in_progress' | 'escalated' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  actor_id?: number;
  created_at: string;
  updated_at?: string;
  agent?: {
    id: number;
    username: string;
    display_name: string;
    email?: string;
    role?: string;
  };
};

export type TicketMessage = {
  id: number;
  ticket_id: string;
  sender_type: 'agent';
  sender_id?: string;
  content: string;
  attachments?: any[];
  metadata?: any;
  created_at: string;
};

export type TicketFeedback = {
  id: number;
  ticket_id: string;
  rating: number;
  comment?: string;
  created_at: string;
};

export type TicketEvent = {
  id: number;
  ticket_id: string;
  event_type?: string;
  actor_id?: string;
  details?: any;
  created_at: string;
};

export type Conversation = {
  session_id: string;
  user_id?: string;
  status?: string;
  created_at?: string;
  messages?: any[];
  feedback?: TicketFeedback;
  ticket?: Ticket;
};

export type Agent = {
  id: number;
  username: string;
  display_name: string;
  email?: string;
  is_active: boolean;
  max_concurrent_chats: number;
  role: string;
  created_at?: string;
  skills?: Skill[];
  metrics?: {
    total_tickets?: number;
    avg_rating?: number;
    avg_response_time?: number;
    active_chats?: number;
  };
};

export type Skill = {
  id: number;
  name: string;
};

export type AnalyticsData = {
  general: {
    total_tickets: number;
    open_tickets: number;
    resolved_tickets: number;
    avg_resolution_time: number;
    satisfied_users: number; // rating >= 3
    avg_rating: number;
  };
  per_agent: Array<{
    agent_id: number;
    agent_name: string;
    total_tickets: number;
    resolved_tickets: number;
    avg_rating: number;
    avg_response_time: number;
    active_chats: number;
  }>;
};

// Ticket Management APIs
export async function getTickets(filters?: {
  status?: string;
  priority?: string;
  agent_id?: number;
  category?: string;
  sort_by?: 'created_at' | 'updated_at' | 'priority';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; data?: Ticket[]; error?: any }> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const res = await apiClient.get(`/api/tickets?${params}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function getTicketById(ticketId: string): Promise<{ success: boolean; data?: Ticket; error?: any }> {
  try {
    const res = await apiClient.get(`/api/tickets/${ticketId}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function getTicketAgents(ticketId: string): Promise<{ success: boolean; data?: TicketAgent[]; error?: any }> {
  try {
    const res = await apiClient.get(`/api/ticket-agents/${ticketId}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function getTicketMessages(ticketId: string): Promise<{ success: boolean; data?: TicketMessage[]; error?: any }> {
  try {
    const res = await apiClient.get(`/api/ticket-messages/ticket/${ticketId}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function getTicketFeedback(ticketId: string): Promise<{ success: boolean; data?: TicketFeedback[]; error?: any }> {
  try {
    const res = await apiClient.get(`/api/ticket-feedback/ticket/${ticketId}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function getTicketEvents(ticketId: string): Promise<{ success: boolean; data?: TicketEvent[]; error?: any }> {
  try {
    const res = await apiClient.get(`/api/ticket-events/ticket/${ticketId}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

// Agent Management APIs
export async function getAgents(filters?: {
  is_active?: boolean;
  role?: string;
  skill_id?: number;
  sort_by?: 'created_at' | 'max_concurrent_chats' | 'total_tickets';
  sort_order?: 'asc' | 'desc';
}): Promise<{ success: boolean; data?: Agent[]; error?: any }> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const res = await apiClient.get(`/api/agents?${params}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function createAgent(agentData: {
  username: string;
  display_name: string;
  email: string;
  password: string;
  is_active?: boolean;
  max_concurrent_chats?: number;
  role?: string;
}): Promise<{ success: boolean; data?: Agent; error?: any }> {
  try {
    const res = await apiClient.post('/api/agents', agentData);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function updateAgent(agentId: number, agentData: Partial<{
  username: string;
  display_name: string;
  email: string;
  password: string;
  is_active: boolean;
  max_concurrent_chats: number;
  role: string;
}>): Promise<{ success: boolean; data?: Agent; error?: any }> {
  try {
    const res = await apiClient.put('/api/agents', { id: agentId, ...agentData });
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function deleteAgent(agentId: number): Promise<{ success: boolean; error?: any }> {
  try {
    const res = await apiClient.delete(`/api/agents/${agentId}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function getAgentSkills(agentId: number): Promise<{ success: boolean; data?: Skill[]; error?: any }> {
  try {
    const res = await apiClient.get(`/api/agents/${agentId}/skills`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

// Skill Management APIs
export async function getSkills(): Promise<{ success: boolean; data?: Skill[]; error?: any }> {
  try {
    const res = await apiClient.get('/api/skills');
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function createSkill(skillData: { name: string }): Promise<{ success: boolean; data?: Skill; error?: any }> {
  try {
    const res = await apiClient.post('/api/skills', skillData);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function updateSkill(skillId: number, skillData: { name: string }): Promise<{ success: boolean; data?: Skill; error?: any }> {
  try {
    const res = await apiClient.put('/api/skills', { id: skillId, ...skillData });
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function deleteSkill(skillId: number): Promise<{ success: boolean; error?: any }> {
  try {
    const res = await apiClient.delete(`/api/skills/${skillId}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function assignSkillToAgent(agentId: number, skillId: number, proficiency: number = 5): Promise<{ success: boolean; error?: any }> {
  try {
    const res = await apiClient.post('/api/agent-skills', {
      agent_id: agentId,
      skill_id: skillId,
      proficiency
    });
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function removeSkillFromAgent(agentId: number, skillId: number): Promise<{ success: boolean; error?: any }> {
  try {
    const res = await apiClient.delete(`/api/agent-skills/${agentId}/${skillId}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

// Conversation Management APIs
export async function getConversations(filters?: {
  status?: string;
  agent_id?: number;
  has_feedback?: boolean;
  rating_min?: number;
  sort_by?: 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; data?: Conversation[]; error?: any }> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const res = await apiClient.get(`/api/conversations?${params}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function getConversationBySession(sessionId: string): Promise<{ success: boolean; data?: Conversation; error?: any }> {
  try {
    const res = await apiClient.get(`/api/conversations/session/${sessionId}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

// Analytics APIs
export async function getAnalytics(): Promise<{ success: boolean; data?: AnalyticsData; error?: any }> {
  try {
    const res = await apiClient.get('/api/analytics');
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}

export async function getAgentAnalytics(agentId: number): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const res = await apiClient.get(`/api/analytics/agent/${agentId}`);
    return res.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data || err.message };
  }
}
