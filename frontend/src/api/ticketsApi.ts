import { apiClient, Ticket, TicketMessage, TicketEvent, TicketFeedback, TicketCreateRequest, TicketUpdateRequest, TicketAgentUpdateRequest, TicketMessageCreateRequest, TicketMessageUpdateRequest, TicketFeedbackCreateRequest, TicketFeedbackUpdateRequest } from './adminApi';

// Tickets API
export const ticketsApi = {
  // Get all tickets
  getTickets: async (limit?: number, offset?: number): Promise<Ticket[]> => {
    const params = { limit, offset };
    const response = await apiClient.get('/api/tickets', { params });
    return response.data?.data || [];
  },

  // Get ticket by ID
  getTicket: async (ticketId: string): Promise<Ticket> => {
    const response = await apiClient.get(`/api/tickets/${ticketId}`);
    return response.data?.data;
  },

  // Create ticket
  createTicket: async (ticketData: TicketCreateRequest): Promise<Ticket> => {
    const response = await apiClient.post('/api/tickets', ticketData);
    return response.data?.data;
  },

  // Update ticket
  updateTicket: async (ticketData: TicketUpdateRequest): Promise<Ticket> => {
    const response = await apiClient.put('/api/tickets', ticketData);
    return response.data?.data;
  },

  // Delete ticket
  deleteTicket: async (ticketId: string): Promise<void> => {
    await apiClient.delete(`/api/tickets/${ticketId}`);
  },

  // Get tickets by session
  getTicketsBySession: async (sessionId: string): Promise<Ticket[]> => {
    const response = await apiClient.get(`/api/tickets/session/${sessionId}`);
    return response.data?.data || [];
  },
};

// Ticket Agents API
export const ticketAgentsApi = {
  // Get ticket agents
  getTicketAgents: async (ticketId: string): Promise<any[]> => {
    const response = await apiClient.get(`/api/ticket-agents/${ticketId}`);
    return response.data?.data || [];
  },

  // Update ticket agent
  updateTicketAgent: async (agentData: TicketAgentUpdateRequest): Promise<void> => {
    await apiClient.put('/api/ticket-agents', agentData);
  },

  // Remove agent from ticket
  removeTicketAgent: async (ticketId: string, agentId: number): Promise<void> => {
    await apiClient.delete(`/api/ticket-agents/${ticketId}/${agentId}`);
  },
};

// Ticket Messages API
export const ticketMessagesApi = {
  // Create ticket message
  createTicketMessage: async (messageData: TicketMessageCreateRequest): Promise<TicketMessage> => {
    const response = await apiClient.post('/api/ticket-messages', messageData);
    return response.data?.data;
  },

  // Update ticket message
  updateTicketMessage: async (messageData: TicketMessageUpdateRequest): Promise<TicketMessage> => {
    const response = await apiClient.put('/api/ticket-messages', messageData);
    return response.data?.data;
  },

  // Get ticket message by ID
  getTicketMessage: async (messageId: number): Promise<TicketMessage> => {
    const response = await apiClient.get(`/api/ticket-messages/${messageId}`);
    return response.data?.data;
  },

  // Delete ticket message
  deleteTicketMessage: async (messageId: number): Promise<void> => {
    await apiClient.delete(`/api/ticket-messages/${messageId}`);
  },

  // Get ticket messages by ticket
  getTicketMessages: async (ticketId: string, limit?: number, offset?: number): Promise<TicketMessage[]> => {
    const params = { limit, offset };
    const response = await apiClient.get(`/api/ticket-messages/ticket/${ticketId}`, { params });
    return response.data?.data || [];
  },
};

// Ticket Feedback API
export const ticketFeedbackApi = {
  // Create ticket feedback
  createTicketFeedback: async (feedbackData: TicketFeedbackCreateRequest): Promise<TicketFeedback> => {
    const response = await apiClient.post('/api/ticket-feedback', feedbackData);
    return response.data?.data;
  },

  // Update ticket feedback
  updateTicketFeedback: async (feedbackData: TicketFeedbackUpdateRequest): Promise<TicketFeedback> => {
    const response = await apiClient.put('/api/ticket-feedback', feedbackData);
    return response.data?.data;
  },

  // Get ticket feedback by ID
  getTicketFeedback: async (feedbackId: number): Promise<TicketFeedback> => {
    const response = await apiClient.get(`/api/ticket-feedback/${feedbackId}`);
    return response.data?.data;
  },

  // Delete ticket feedback
  deleteTicketFeedback: async (feedbackId: number): Promise<void> => {
    await apiClient.delete(`/api/ticket-feedback/${feedbackId}`);
  },

  // Get ticket feedback by ticket
  getTicketFeedbackByTicket: async (ticketId: string): Promise<TicketFeedback[]> => {
    const response = await apiClient.get(`/api/ticket-feedback/ticket/${ticketId}`);
    return response.data?.data || [];
  },
};

// Ticket Events API
export const ticketEventsApi = {
  // Get ticket events by ticket
  getTicketEvents: async (ticketId: string, limit?: number, offset?: number): Promise<TicketEvent[]> => {
    const params = { limit, offset };
    const response = await apiClient.get(`/api/ticket-events/ticket/${ticketId}`, { params });
    return response.data?.data || [];
  },
};
