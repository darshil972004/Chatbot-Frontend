import { apiClient, Agent, Skill, AgentCreateRequest, AgentUpdateRequest, SkillCreateRequest, SkillUpdateRequest, AgentSkillCreateRequest, AgentSkillUpdateRequest, AgentStatusEventCreateRequest } from './adminApi';

// Agents API
export const agentsApi = {
  // Get all agents
  getAgents: async (limit?: number, offset?: number): Promise<Agent[]> => {
    const params = { limit, offset };
    const response = await apiClient.get('/api/agents', { params });
    return response.data?.data || [];
  },

  // Get agent by ID
  getAgent: async (agentId: number): Promise<Agent> => {
    const response = await apiClient.get(`/api/agents/${agentId}`);
    return response.data?.data;
  },

  // Create new agent
  createAgent: async (agentData: AgentCreateRequest): Promise<Agent> => {
    const response = await apiClient.post('/api/agents', agentData);
    return response.data?.data;
  },

  // Update agent
  updateAgent: async (agentData: AgentUpdateRequest): Promise<Agent> => {
    const response = await apiClient.put('/api/agents', agentData);
    return response.data?.data;
  },

  // Delete agent
  deleteAgent: async (agentId: number): Promise<void> => {
    await apiClient.delete(`/api/agents/${agentId}`);
  },

  // Get agent skills
  getAgentSkills: async (agentId: number): Promise<Skill[]> => {
    const response = await apiClient.get(`/api/agents/${agentId}/skills`);
    return response.data?.data || [];
  },

  // Get agent status events
  getAgentStatusEvents: async (agentId: number, limit?: number): Promise<any[]> => {
    const params = { limit };
    const response = await apiClient.get(`/api/agents/${agentId}/status-events`, { params });
    return response.data?.data || [];
  },

  // Get current agent status
  getCurrentAgentStatus: async (agentId: number): Promise<any> => {
    const response = await apiClient.get(`/api/agents/${agentId}/current-status`);
    return response.data?.data;
  },

  // Update agent status
  updateAgentStatus: async (statusData: AgentStatusEventCreateRequest): Promise<void> => {
    await apiClient.post('/api/agent-status-events', statusData);
  },

  // Agent login
  agentLogin: async (username: string, password: string): Promise<any> => {
    const response = await apiClient.post('/api/agent-login', { username, password });
    return response.data?.data;
  },
};

// Skills API
export const skillsApi = {
  // Get all skills
  getSkills: async (): Promise<Skill[]> => {
    const response = await apiClient.get('/api/skills');
    return response.data?.data || [];
  },

  // Create skill
  createSkill: async (skillData: SkillCreateRequest): Promise<Skill> => {
    const response = await apiClient.post('/api/skills', skillData);
    return response.data?.data;
  },

  // Update skill
  updateSkill: async (skillData: SkillUpdateRequest): Promise<Skill> => {
    const response = await apiClient.put('/api/skills', skillData);
    return response.data?.data;
  },

  // Delete skill
  deleteSkill: async (skillId: number): Promise<void> => {
    await apiClient.delete(`/api/skills/${skillId}`);
  },

  // Get skill by ID
  getSkill: async (skillId: number): Promise<Skill> => {
    const response = await apiClient.get(`/api/skills/${skillId}`);
    return response.data?.data;
  },
};

// Agent Skills API
export const agentSkillsApi = {
  // Create agent skill relationship
  createAgentSkill: async (agentSkillData: AgentSkillCreateRequest): Promise<void> => {
    await apiClient.post('/api/agent-skills', agentSkillData);
  },

  // Update agent skill relationship
  updateAgentSkill: async (agentSkillData: AgentSkillUpdateRequest): Promise<void> => {
    await apiClient.put('/api/agent-skills', agentSkillData);
  },

  // Delete agent skill relationship
  deleteAgentSkill: async (agentId: number, skillId: number): Promise<void> => {
    await apiClient.delete(`/api/agent-skills/${agentId}/${skillId}`);
  },
};
