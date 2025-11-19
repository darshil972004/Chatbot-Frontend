import { apiClient, Conversation, ChatMessage, ConversationCreateRequest, ConversationUpdateRequest, ConversationDetailCreateRequest, ConversationDetailUpdateRequest } from './adminApi';

// Conversations API
export const conversationsApi = {
  // Get all conversations
  getConversations: async (limit?: number, offset?: number): Promise<Conversation[]> => {
    const params = { limit, offset };
    const response = await apiClient.get('/api/conversations', { params });
    return response.data?.data || [];
  },

  // Get conversation by ID
  getConversation: async (conversationId: number): Promise<Conversation> => {
    const response = await apiClient.get(`/api/conversations/${conversationId}`);
    return response.data?.data;
  },

  // Create conversation
  createConversation: async (conversationData: ConversationCreateRequest): Promise<Conversation> => {
    const response = await apiClient.post('/api/conversations', conversationData);
    return response.data?.data;
  },

  // Update conversation
  updateConversation: async (conversationData: ConversationUpdateRequest): Promise<Conversation> => {
    const response = await apiClient.put('/api/conversations', conversationData);
    return response.data?.data;
  },

  // Delete conversation
  deleteConversation: async (conversationId: number): Promise<void> => {
    await apiClient.delete(`/api/conversations/${conversationId}`);
  },

  // Get conversation by session ID
  getConversationBySession: async (sessionId: string): Promise<Conversation> => {
    const response = await apiClient.get(`/api/conversations/by-session/${sessionId}`);
    return response.data?.data;
  },

  // Get conversations by user ID
  getConversationsByUser: async (userId: number, limit?: number, offset?: number): Promise<Conversation[]> => {
    const params = { limit, offset };
    const response = await apiClient.get(`/api/conversations/by-user/${userId}`, { params });
    return response.data?.data || [];
  },
};

// Conversation Details API (Messages)
export const conversationDetailsApi = {
  // Get conversation details (messages) with filters
  getConversationDetails: async (filters?: {
    fkConvId?: number | null;
    user_id?: string | null;
    agent_id?: number | null;
    category?: string | null;
    responder_type?: string | null;
    limit?: number;
    offset?: number;
  }): Promise<ChatMessage[]> => {
    const params = filters ? { ...filters } : {};
    const response = await apiClient.get('/api/conversation-details', { params });
    return response.data?.data || [];
  },

  // Create conversation detail (message)
  createConversationDetail: async (detailData: ConversationDetailCreateRequest): Promise<ChatMessage> => {
    const response = await apiClient.post('/api/conversation-details', detailData);
    return response.data?.data;
  },

  // Create multiple conversation details (bulk)
  createConversationDetailsBulk: async (detailsData: ConversationDetailCreateRequest[]): Promise<ChatMessage[]> => {
    const response = await apiClient.post('/api/conversation-details', { details: detailsData });
    return response.data?.data || [];
  },

  // Update conversation detail
  updateConversationDetail: async (detailData: ConversationDetailUpdateRequest): Promise<ChatMessage> => {
    const response = await apiClient.put('/api/conversation-details', detailData);
    return response.data?.data;
  },

  // Get conversation detail by ID
  getConversationDetail: async (detailId: number): Promise<ChatMessage> => {
    const response = await apiClient.get(`/api/conversation-details/${detailId}`);
    return response.data?.data;
  },

  // Delete conversation detail
  deleteConversationDetail: async (detailId: number): Promise<void> => {
    await apiClient.delete(`/api/conversation-details/${detailId}`);
  },

  // Get conversation details by conversation ID
  getConversationDetailsByConversation: async (conversationId: number, limit?: number, offset?: number): Promise<ChatMessage[]> => {
    const params = { limit, offset };
    const response = await apiClient.get(`/api/conversations/${conversationId}/details`, { params });
    return response.data?.data || [];
  },

  // Get conversation details by user ID
  getConversationDetailsByUser: async (userId: string, limit?: number, offset?: number): Promise<ChatMessage[]> => {
    const params = { limit, offset };
    const response = await apiClient.get(`/api/conversation-details/by-user/${userId}`, { params });
    return response.data?.data || [];
  },

  // Get conversation details by agent ID
  getConversationDetailsByAgent: async (agentId: number, limit?: number, offset?: number): Promise<ChatMessage[]> => {
    const params = { limit, offset };
    const response = await apiClient.get(`/api/conversation-details/by-agent/${agentId}`, { params });
    return response.data?.data || [];
  },
};
