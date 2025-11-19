import axios from 'axios';

const API_BASE = (window as any).VITE_CHATBOT_API_BASE || 'http://localhost:8000';
const CHATBOT_TOKEN = (window as any).VITE_CHATBOT_TOKEN || 'chatbot-api-token-2024';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CHATBOT_TOKEN}`,
  },
});

// Types from OpenAPI specification
export interface Agent {
  id: number;
  username: string;
  display_name?: string | null;
  email: string;
  is_active?: boolean;
  max_concurrent_chats?: number | null;
  role?: string | null;
  created_at?: string;
  updated_at?: string;
  skills?: Skill[];
}

export interface Skill {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Ticket {
  id: string;
  session_id?: string | null;
  user_id?: number | null;
  title: string;
  description?: string | null;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category?: string | null;
  sla_due_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TicketMessage {
  id: number;
  ticket_id: string;
  sender_type: 'agent';
  sender_id?: string | null;
  content: string;
  attachments?: any[] | null;
  metadata?: any | null;
  created_at?: string;
}

export interface TicketEvent {
  id: number;
  ticket_id: string;
  event_type?: string | null;
  actor_id?: string | null;
  details?: any | null;
  created_at?: string;
}

export interface TicketFeedback {
  id: number;
  ticket_id: string;
  rating: number;
  comment?: string | null;
  created_at?: string;
}

export interface Conversation {
  id?: number;
  user_id?: number | null;
  session_id: string;
  metadata?: any | null;
  browser?: string | null;
  ip_address?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string;
  updated_at?: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id?: number;
  fkConvId?: number | null;
  user_id?: string | null;
  agent_id?: number | null;
  prompt?: string | null;
  output?: string | null;
  responder_type?: string | null;
  category?: string | null;
  search_params?: string | null;
  result_list?: any[] | null;
  attachments?: any[] | null;
  metadata?: any | null;
  created_at?: string;
}

export interface Analytics {
  total_tickets?: number;
  resolved_tickets?: number;
  avg_response_time?: number;
  avg_resolution_time?: number;
  satisfied_users?: number;
  total_chats?: number;
  agent_metrics?: AgentMetric[];
  alerts?: Alert[];
}

export interface AgentMetric {
  agent_id: number;
  agent_name: string;
  total_handled: number;
  avg_response_time: number;
  avg_resolution_time: number;
  satisfaction_rate: number;
}

export interface Alert {
  agent_id: number;
  agent_name: string;
  avg_rating: number;
}

// Request/Response interfaces
export interface AgentCreateRequest {
  username: string;
  display_name?: string | null;
  email: string;
  password: string;
  is_active?: boolean;
  max_concurrent_chats?: number | null;
  role?: string | null;
}

export interface AgentUpdateRequest {
  id: number;
  username?: string | null;
  display_name?: string | null;
  email?: string | null;
  password?: string | null;
  is_active?: boolean | null;
  max_concurrent_chats?: number | null;
  role?: string | null;
}

export interface SkillCreateRequest {
  name: string;
}

export interface SkillUpdateRequest {
  id: number;
  name: string;
}

export interface AgentSkillCreateRequest {
  agent_id: number;
  skill_id: number;
  proficiency?: number | null;
}

export interface AgentSkillUpdateRequest {
  agent_id: number;
  skill_id: number;
  proficiency: number;
}

export interface AgentStatusEventCreateRequest {
  agent_id: number;
  status: string;
  concurrent_load?: number | null;
  details?: any | null;
}

export interface TicketCreateRequest {
  session_id: string;
  user_id?: number | null;
  title: string;
  description?: string | null;
  category?: string;
  priority?: string | null;
  status?: string | null;
}

export interface TicketUpdateRequest {
  id: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
}

export interface TicketAgentUpdateRequest {
  ticket_id: string;
  assigned_agent_id: number;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  actor_id?: number | null;
}

export interface TicketMessageCreateRequest {
  ticket_id: string;
  sender_id?: string;
  sender_type?: string;
  content: string;
  attachments?: any[] | null;
  metadata?: any | null;
}

export interface TicketMessageUpdateRequest {
  id: number;
  content?: string | null;
  attachments?: any[] | null;
  metadata?: any | null;
}

export interface TicketFeedbackCreateRequest {
  ticket_id: string;
  rating: number;
  comment?: string | null;
}

export interface TicketFeedbackUpdateRequest {
  ticket_id: string;
  rating?: number | null;
  comment?: string | null;
}

export interface ConversationCreateRequest {
  user_id?: number | null;
  session_id: string;
  metadata?: any | null;
  browser?: string | null;
  ip_address?: string | null;
  start_time?: string | null;
}

export interface ConversationUpdateRequest {
  id: number;
  user_id?: number | null;
  session_id?: string | null;
  metadata?: any | null;
  browser?: string | null;
  ip_address?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

export interface ConversationDetailCreateRequest {
  fkConvId?: number | null;
  user_id?: string | null;
  agent_id?: number | null;
  prompt?: string | null;
  output?: string | null;
  responder_type?: string | null;
  category?: string | null;
  search_params?: string | null;
  result_list?: any[] | null;
  attachments?: any[] | null;
  metadata?: any | null;
}

export interface ConversationDetailUpdateRequest {
  id: number;
  fkConvId?: number | null;
  user_id?: string | null;
  agent_id?: number | null;
  prompt?: string | null;
  output?: string | null;
  responder_type?: string | null;
  category?: string | null;
  search_params?: string | null;
  result_list?: any[] | null;
  attachments?: any[] | null;
  metadata?: any | null;
}
