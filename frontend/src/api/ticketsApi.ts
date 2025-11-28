import { apiClient, Ticket, TicketMessage, TicketEvent, TicketFeedback, TicketCreateRequest, TicketUpdateRequest, TicketAgentUpdateRequest, TicketMessageCreateRequest, TicketMessageUpdateRequest, TicketFeedbackCreateRequest, TicketFeedbackUpdateRequest } from './adminApi';

// Tickets API
export const ticketsApi = {
  // Get all tickets
  getTickets: async (limit?: number, offset?: number): Promise<Ticket[]> => {
    const params = { limit, offset };
    const response = await apiClient.get('/tickets', { params });
    return response.data?.data || [];
  },

  // Get ticket by ID
  getTicket: async (ticketId: string): Promise<Ticket> => {
    const response = await apiClient.get(`/tickets/${ticketId}`);
    return response.data?.data;
  },

  // Create ticket
  createTicket: async (ticketData: TicketCreateRequest): Promise<Ticket> => {
    const response = await apiClient.post('/tickets', ticketData);
    return response.data?.data;
  },

  // Update ticket
  updateTicket: async (ticketData: TicketUpdateRequest): Promise<Ticket> => {
    const response = await apiClient.put('/tickets', ticketData);
    return response.data?.data;
  },

  // Delete ticket
  deleteTicket: async (ticketId: string): Promise<void> => {
    await apiClient.delete(`/tickets/${ticketId}`);
  },

  // Get tickets by session
  getTicketsBySession: async (sessionId: string): Promise<Ticket[]> => {
    const response = await apiClient.get(`/tickets/session/${sessionId}`);
    return response.data?.data || [];
  },

  // Get tickets by agent
  getTicketsByAgent: async (agentId: number, limit?: number, offset?: number): Promise<Ticket[]> => {
    const params = { limit, offset };
    const response = await apiClient.get(`/tickets/agent/${agentId}`, { params });
    return response.data?.data || [];
  },

  closeTicket: async (ticketId: string, remark?: string): Promise<void> => {
    await apiClient.put('/tickets', {
      id: ticketId,
      status: 'closed',
    });
  },

  // Get conversation details by ticket ID
  getConversationDetailsByTicketId: async (ticketId: string): Promise<any[]> => {
    try {
      // Direct call to the backend endpoint for conversation details by ticket ID
      const response = await apiClient.get(`/conversation-details/by-ticket/${ticketId}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Failed to get conversation details by ticket ID:', error);
      return [];
    }
  },
};

// Ticket Agents API
export const ticketAgentsApi = {
  // Get ticket agents
  getTicketAgents: async (ticketId: string): Promise<any[]> => {
    const response = await apiClient.get(`/ticket-agents/${ticketId}`);
    return response.data?.data || [];
  },

  // Update ticket agent
  updateTicketAgent: async (agentData: TicketAgentUpdateRequest): Promise<void> => {
    await apiClient.post('/ticket-agents', agentData);
  },

  // Remove agent from ticket
  removeTicketAgent: async (ticketId: string, agentId: number): Promise<void> => {
    await apiClient.delete(`/ticket-agents/${ticketId}/${agentId}`);
  },
};

// Ticket Messages API
export const ticketMessagesApi = {
  // Create ticket message
  createTicketMessage: async (messageData: TicketMessageCreateRequest): Promise<TicketMessage> => {
    const response = await apiClient.post('/ticket-messages', messageData);
    return response.data?.data;
  },

  // Update ticket message
  updateTicketMessage: async (messageData: TicketMessageUpdateRequest): Promise<TicketMessage> => {
    const response = await apiClient.put('/ticket-messages', messageData);
    return response.data?.data;
  },

  // Get ticket message by ID
  getTicketMessage: async (messageId: number): Promise<TicketMessage> => {
    const response = await apiClient.get(`/ticket-messages/${messageId}`);
    return response.data?.data;
  },

  // Delete ticket message
  deleteTicketMessage: async (messageId: number): Promise<void> => {
    await apiClient.delete(`/ticket-messages/${messageId}`);
  },

  // Get ticket messages by ticket
  getTicketMessages: async (ticketId: string, limit?: number, offset?: number): Promise<TicketMessage[]> => {
    const params = { limit, offset };
    const response = await apiClient.get(`/ticket-messages/ticket/${ticketId}`, { params });
    return response.data?.data || [];
  },
};

// Ticket Feedback API
export const ticketFeedbackApi = {
  // Create ticket feedback
  createTicketFeedback: async (feedbackData: TicketFeedbackCreateRequest): Promise<TicketFeedback> => {
    const response = await apiClient.post('/ticket-feedback', feedbackData);
    return response.data?.data;
  },

  // Update ticket feedback
  updateTicketFeedback: async (feedbackData: TicketFeedbackUpdateRequest): Promise<TicketFeedback> => {
    const response = await apiClient.put('/ticket-feedback', feedbackData);
    return response.data?.data;
  },

  // Get ticket feedback by ID
  getTicketFeedback: async (feedbackId: number): Promise<TicketFeedback> => {
    const response = await apiClient.get(`/ticket-feedback/${feedbackId}`);
    return response.data?.data;
  },

  // Delete ticket feedback
  deleteTicketFeedback: async (feedbackId: number): Promise<void> => {
    await apiClient.delete(`/ticket-feedback/${feedbackId}`);
  },

  // Get ticket feedback by ticket
  getTicketFeedbackByTicket: async (ticketId: string): Promise<TicketFeedback[]> => {
    const response = await apiClient.get(`/ticket-feedback/ticket/${ticketId}`);
    return response.data?.data || [];
  },
};

// Ticket Events API
export const ticketEventsApi = {
  // Get ticket events by ticket
  getTicketEvents: async (ticketId: string, limit?: number, offset?: number): Promise<TicketEvent[]> => {
    const params = { limit, offset };
    const response = await apiClient.get(`/ticket-events/ticket/${ticketId}`, { params });
    return response.data?.data || [];
  },
};
