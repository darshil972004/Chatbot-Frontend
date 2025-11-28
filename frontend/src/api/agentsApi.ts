import { apiClient, Agent, Skill, AgentCreateRequest, AgentUpdateRequest, SkillCreateRequest, SkillUpdateRequest, AgentSkillCreateRequest, AgentSkillUpdateRequest, AgentStatusEventCreateRequest } from './adminApi';

// Agents API
export const agentsApi = {
  // Get all agents
  getAgents: async (limit?: number, offset?: number): Promise<Agent[]> => {
    const params = { limit, offset };
    const response = await apiClient.get('/agents', { params });
    return response.data?.data || [];
  },

  // Get agent by ID
  getAgent: async (agentId: number): Promise<Agent> => {
    const response = await apiClient.get(`/agents/${agentId}`);
    return response.data?.data;
  },

  // Create new agent
  createAgent: async (agentData: AgentCreateRequest): Promise<Agent> => {
    const response = await apiClient.post('/agents', agentData);
    return response.data?.data;
  },

  // Update agent
  updateAgent: async (agentData: AgentUpdateRequest): Promise<Agent> => {
    const response = await apiClient.put('/agents', agentData);
    return response.data?.data;
  },

  // Delete agent
  deleteAgent: async (agentId: number): Promise<void> => {
    await apiClient.delete(`/agents/${agentId}`);
  },

  // Get agent skills
  getAgentSkills: async (agentId: number): Promise<Skill[]> => {
    const response = await apiClient.get(`/agents/${agentId}/skills`);
    return response.data?.data || [];
  },

  // Get agent status events
  getAgentStatusEvents: async (agentId: number, limit?: number): Promise<any[]> => {
    const params = { limit };
    const response = await apiClient.get(`/agents/${agentId}/status-events`, { params });
    return response.data?.data || [];
  },

  // Get current agent status
  getCurrentAgentStatus: async (agentId: number): Promise<any> => {
    const response = await apiClient.get(`/agents/${agentId}/current-status`);
    return response.data?.data;
  },

  // Update agent status
  updateAgentStatus: async (statusData: AgentStatusEventCreateRequest): Promise<void> => {
    await apiClient.post('/agent-status-events', statusData);
  },

  // Agent login
  agentLogin: async (username: string, password: string): Promise<any> => {
    const response = await apiClient.post('/agent-login', { username, password });
    return response.data?.data;
  },

  // Get all available agents (not offline)
  getAvailableAgents: async (): Promise<Agent[]> => {
    const agents = await apiClient.get('/agents');
    const allAgents = agents.data?.data || [];
    // Filter out offline agents - we'll need to check their current status
    const availableAgents = [];
    
    for (const agent of allAgents) {
      try {
        const statusResponse = await apiClient.get(`/agents/${agent.id}/current-status`);
        const currentStatus = statusResponse.data?.data?.status;
        // Only include agents that are not offline
        if (currentStatus && currentStatus !== 'offline') {
          availableAgents.push(agent);
        }
      } catch (error) {
        // If we can't get status, assume they are offline and exclude them
        continue;
      }
    }
    
    return availableAgents;
  },
};

// Skills API
export const skillsApi = {
  // Get all skills
  getSkills: async (): Promise<Skill[]> => {
    const response = await apiClient.get('/skills');
    return response.data?.data || [];
  },

  // Create skill
  createSkill: async (skillData: SkillCreateRequest): Promise<Skill> => {
    const response = await apiClient.post('/skills', skillData);
    return response.data?.data;
  },

  // Update skill
  updateSkill: async (skillData: SkillUpdateRequest): Promise<Skill> => {
    const response = await apiClient.put('/skills', skillData);
    return response.data?.data;
  },

  // Delete skill
  deleteSkill: async (skillId: number): Promise<void> => {
    await apiClient.delete(`/skills/${skillId}`);
  },

  // Get skill by ID
  getSkill: async (skillId: number): Promise<Skill> => {
    const response = await apiClient.get(`/skills/${skillId}`);
    return response.data?.data;
  },
};

// Agent Skills API
export const agentSkillsApi = {
  // Create agent skill relationship
  createAgentSkill: async (agentSkillData: AgentSkillCreateRequest): Promise<void> => {
    await apiClient.post('/agent-skills', agentSkillData);
  },

  // Update agent skill relationship
  updateAgentSkill: async (agentSkillData: AgentSkillUpdateRequest): Promise<void> => {
    await apiClient.put('/agent-skills', agentSkillData);
  },

  // Delete agent skill relationship
  deleteAgentSkill: async (agentId: number, skillId: number): Promise<void> => {
    await apiClient.delete(`/agent-skills/${agentId}/${skillId}`);
  },
};
