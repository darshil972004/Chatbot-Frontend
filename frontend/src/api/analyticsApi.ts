import { apiClient, Analytics, Alert } from './adminApi';

// Analytics API
export const analyticsApi = {
  // Get global analytics (this might not exist in the API spec, but we can keep it for future)
  getGlobalAnalytics: async (dateFrom?: string, dateTo?: string): Promise<Analytics> => {
    const params = { date_from: dateFrom, date_to: dateTo };
    // This endpoint might not exist in the current API spec, but keeping it for potential future use
    const response = await apiClient.get('/api/analytics/global', { params });
    return response.data?.data || {};
  },

  // Get alerts (agents with low ratings)
  getAlerts: async (): Promise<Alert[]> => {
    // This endpoint might not exist in the current API spec, but we can implement it based on the requirements
    try {
      const response = await apiClient.get('/api/analytics/alerts');
      return response.data?.data || [];
    } catch (error) {
      // Fallback: return empty array if endpoint doesn't exist
      console.warn('Alerts endpoint not available');
      return [];
    }
  },

  // Additional analytics methods can be added here as needed
  // For now, we'll keep the basic structure based on the requirements

  // Get agent performance metrics (if available in future API)
  getAgentMetrics: async (agentId?: number): Promise<any[]> => {
    const params = agentId ? { agent_id: agentId } : {};
    try {
      const response = await apiClient.get('/api/analytics/agent-metrics', { params });
      return response.data?.data || [];
    } catch (error) {
      console.warn('Agent metrics endpoint not available');
      return [];
    }
  },
};
