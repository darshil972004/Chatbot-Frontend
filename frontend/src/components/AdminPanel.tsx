import { FormEvent, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ChatbotWidget from './ChatbotWidget';
import './admin-panel.css';

type AdminPanelProps = {
  isAdmin: boolean;
  onLogin: (username: string, password: string) => { success: boolean; message?: string };
  onLogout: () => void;
};

// Types for Admin Panel UI
type Skill = {
  id: number;
  name: string;
  proficiency?: number;
};

type Agent = {
  id: number;
  username: string;
  password: string;
  name: string;
  email?: string;
  role: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  currentSessionId: number | null;
  metrics: {
    chatsToday: number;
    avgResponse: number;
  };
  skills: Skill[];
  max_concurrent_chats?: number;
};

type Session = {
  id: number;
  userId: string;
  topic: string;
  status: 'waiting' | 'assigned' | 'closed';
  assignedAgentId: number | null;
  messages: Array<{ sender: string; text: string }>;
  duration: number;
  waitTime: number;
};

type Template = {
  id: number;
  type: string;
  content: string;
};

type RoutingRule = {
  id: number;
  topic: string;
  allowedRoles: string[];
  priority: number;
  autoAssign: boolean;
};

const API_BASE = (window as any).VITE_CHATBOT_API_BASE || 'http://localhost:8000';
const CHATBOT_TOKEN = (window as any).VITE_CHATBOT_TOKEN || 'chatbot-api-token-2024';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CHATBOT_TOKEN}`,
  },
});

const normalizeAgent = (agent: any, index: number): Agent => ({
  id: agent.id ?? index + 1,
  username: agent.username ?? `agent-${index + 1}`,
  password: '',
  name: agent.display_name ?? agent.name ?? agent.username ?? `Agent ${index + 1}`,
  email: agent.email ?? '',
  role: agent.role ?? 'support',
  status: agent.is_active === false ? 'offline' : 'online',
  currentSessionId: null,
  metrics: {
    chatsToday: agent.metrics?.chatsToday ?? agent.chatsToday ?? 0,
    avgResponse: agent.metrics?.avgResponse ?? agent.avgResponse ?? 0,
  },
  skills: [],
  max_concurrent_chats: agent.max_concurrent_chats ?? 2,
});

export default function AdminPanel({ isAdmin, onLogin, onLogout }: AdminPanelProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Panel UI state
  const [route, setRoute] = useState('dashboard');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  const loadSkills = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/skills');
      const payload = res.data?.data;
      if (res.data?.success && Array.isArray(payload)) {
        setSkills(
          payload.map((skill: any) => ({
            id: skill.id,
            name: skill.name,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  }, []);

  const attachAgentSkills = useCallback(async (agent: Agent): Promise<Agent> => {
    if (!agent.id) {
      return agent;
    }
    try {
      const res = await apiClient.get(`/api/agents/${agent.id}/skills`);
      const skillList = Array.isArray(res.data?.data)
        ? res.data.data.map((skill: any) => ({
            id: skill.id,
            name: skill.name,
            proficiency: skill.proficiency,
          }))
        : [];
      return { ...agent, skills: skillList };
    } catch (err) {
      console.error(`Error fetching skills for agent ${agent.id}`, err);
      return { ...agent, skills: [] };
    }
  }, []);

  const attachAgentStatus = useCallback(async (agent: Agent): Promise<Agent> => {
    if (!agent.id) {
      return agent;
    }
    try {
      const res = await apiClient.get(`/api/agents/${agent.id}/current-status`);
      if (res.data?.success && res.data?.data?.status) {
        return { ...agent, status: res.data.data.status as Agent['status'] };
      }
      // Fallback to is_active if no status event exists
      return agent;
    } catch (err: any) {
      // If 404, it means no status events exist, so use is_active from agent
      if (err?.response?.status === 404) {
        // Status will be set from normalizeAgent based on is_active
        return agent;
      }
      console.error(`Error fetching status for agent ${agent.id}`, err);
      // Fallback to is_active if status fetch fails
      return agent;
    }
  }, []);

  const loadAgents = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/agents');
      const payload = res.data?.data;
      if (res.data?.success && Array.isArray(payload)) {
        const normalized = payload.map((agent: any, idx: number) => normalizeAgent(agent, idx));
        const withSkills = await Promise.all(normalized.map((agent) => attachAgentSkills(agent)));
        const withStatus = await Promise.all(withSkills.map((agent) => attachAgentStatus(agent)));
        setAgents(withStatus);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  }, [attachAgentSkills, attachAgentStatus]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const syncAgentSkills = useCallback(async (agentId: number, selectedSkillIds: number[]) => {
    try {
      const res = await apiClient.get(`/api/agents/${agentId}/skills`);
      const existingIds: number[] = Array.isArray(res.data?.data)
        ? res.data.data.map((skill: any) => Number(skill.id))
        : [];

      const toAdd = selectedSkillIds.filter((skillId: number) => !existingIds.includes(skillId));
      const toRemove = existingIds.filter((skillId: number) => !selectedSkillIds.includes(skillId));

      await Promise.all([
        ...toAdd.map((skillId) =>
          apiClient.post('/api/agent-skills', {
            agent_id: agentId,
            skill_id: skillId,
            proficiency: 5,
          })
        ),
        ...toRemove.map((skillId) => apiClient.delete(`/api/agent-skills/${agentId}/${skillId}`)),
      ]);
    } catch (err) {
      console.error(`Error syncing skills for agent ${agentId}`, err);
      throw err;
    }
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await onLogin(username.trim(), password);
      if (result.success) {
        setUsername('');
        setPassword('');
        setError(null);
      } else {
        setError(result.message || 'Invalid username or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <h1 className="admin-login-heading">Admin Panel Login</h1>
          <p className="admin-login-subtitle">
            Enter your credentials to access workflow management tools.
          </p>
          <form onSubmit={handleSubmit} className="admin-login-form">
            <label className="admin-login-label">
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="admin-login-input"
                placeholder="admin"
                autoComplete="username"
                required
              />
            </label>
            <label className="admin-login-label">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="admin-login-input"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </label>
            {error && <div className="admin-login-error">{error}</div>}
            <button type="submit" className="admin-login-button" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-panel-wrapper">
        <div className="admin-panel-grid">
          <aside className="admin-panel-sidebar">
            <Sidebar route={route} setRoute={setRoute} agents={agents} sessions={sessions} onLogout={onLogout} />
          </aside>

          <main className="admin-panel-main">
            <Header onLogout={onLogout} setRoute={setRoute} />

            <div style={{ marginTop: '16px' }}>
              {route === 'dashboard' && <Dashboard agents={agents} sessions={sessions} />}
              {route === 'agents' && (
                <AgentsPage
                  agents={agents}
                  setAgents={setAgents}
                  skills={skills}
                  reloadAgents={loadAgents}
                  syncAgentSkills={syncAgentSkills}
                />
              )}
              {route === 'live' && (
                <LiveChatsPage sessions={sessions} setSessions={setSessions} agents={agents} setAgents={setAgents} />
              )}
              {route === 'routing' && (
                <RoutingPage rules={routingRules} setRules={setRoutingRules} agents={agents} />
              )}
              {route === 'templates' && (
                <TemplatesPage templates={templates} setTemplates={setTemplates} />
              )}
              {route === 'history' && <ChatHistoryPage sessions={sessions} />}
              {route === 'analytics' && <AnalyticsPage sessions={sessions} agents={agents} />}
              {route === 'settings' && <SettingsPage />}
              {route === 'workflows' && (
                <WorkflowSection />
              )}
            </div>
          </main>
        </div>
      </div>
          </div>
  );
}

// Workflow Section Component (from original AdminPanel)
function WorkflowSection() {
  return (
    <div className="admin-workflow-section">
      <div className="admin-workflow-actions">
        <Link to="/workflows" className="admin-workflow-link">
            View Saved Workflows
          </Link>
        <Link to="/workflow" className="admin-workflow-link admin-workflow-link-secondary">
            Create New Workflow
          </Link>
        </div>

      <section className="admin-chatbot-panel">
        <h2>Chatbot Preview</h2>
          <ChatbotWidget />
        </section>
    </div>
  );
}

// Header Component
type HeaderProps = { onLogout: () => void; setRoute: (route: string) => void };
function Header({ onLogout, setRoute }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="admin-header">
      <div>
        <h1>Support Admin Panel</h1>
        <p>Manage agents, routing, and live chats</p>
      </div>
      <div className="admin-header-user" style={{ position: 'relative' }}>
        <div className="admin-header-avatar" onClick={() => setShowMenu((v) => !v)} style={{ cursor: 'pointer' }}>A</div>
        {showMenu && (
          <div ref={menuRef} className="admin-header-dropdown" style={{ position: 'absolute', right: 0, top: '48px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', borderRadius: '8px', minWidth: '180px', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 8px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div className="admin-header-avatar" style={{ marginRight: '12px', width: '32px', height: '32px', fontSize: '18px' }}>A</div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>Admin</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px' }}>
              <button className="admin-header-dropdown-btn" style={{ textAlign: 'left', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '15px' }} onClick={() => { setShowMenu(false); setRoute('settings'); }}>Settings</button>
              <button className="admin-header-dropdown-btn" style={{ textAlign: 'left', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '15px', color: '#ef4444' }} onClick={() => { setShowMenu(false); onLogout(); }}>Log out</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sidebar Component
type SidebarProps = {
  route: string;
  setRoute: (route: string) => void;
  agents: Agent[];
  sessions: Session[];
  onLogout: () => void;
};

function Sidebar({ route, setRoute, agents, sessions, onLogout }: SidebarProps) {
  const waitingCount = sessions.filter((s) => s.status === 'waiting').length;
  const onlineCount = agents.filter((a) => a.status === 'online').length;

  const item = (id: string, label: string, subtitle: string | null) => (
    <li
      key={id}
      onClick={() => setRoute(id)}
      className={`admin-sidebar-item ${route === id ? 'active' : ''}`}
    >
      <div>
        <div className="admin-sidebar-item-label">{label}</div>
        {subtitle && <div className="admin-sidebar-item-subtitle">{subtitle}</div>}
      </div>
    </li>
  );

  const handleAddAgent = () => {
    setRoute('agents');
    // Trigger create modal - this will be handled by AgentsPage component
    setTimeout(() => {
      const createButton = document.querySelector('.admin-agents-page .admin-button-primary') as HTMLButtonElement;
      if (createButton) createButton.click();
    }, 100);
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-card">
        <div style={{ marginBottom: '16px' }}>
          <h2 className="admin-sidebar-title">Overview</h2>
          <div className="admin-sidebar-subtitle">Realtime control center</div>
        </div>

        <ul className="admin-sidebar-list">
          {item('dashboard', 'Dashboard', null)}
          {item('agents', `Agents (${onlineCount} online)`, null)}
          {/* {item('live', 'Live Chats', `Waiting: ${waitingCount}`)} */}
          {item('routing', 'Routing Rules', null)}
          {/* {item('templates', 'Message Templates', null)} */}
          {/* {item('history', 'Chat History', null)} */}
          {item('analytics', 'Analytics', null)}
          {/* Settings button removed, now only accessible from header dropdown */}
          {item('workflows', 'Workflows', null)}
        </ul>
      </div>

      <div className="admin-sidebar-card admin-quick-actions">
        <h3>Quick Actions</h3>
        <div className="admin-quick-actions-buttons">
          <button className="admin-button admin-button-primary" onClick={handleAddAgent}>Add Agent</button>
          <button className="admin-button admin-button-success" onClick={() => setRoute('live')}>View Waiting</button>
          {/* Log out button removed, now handled in header dropdown */}
        </div>
      </div>
    </div>
  );
}

// Dashboard Component
type DashboardProps = {
  agents: Agent[];
  sessions: Session[];
};

function Dashboard({ agents, sessions }: DashboardProps) {
  const totalChats = sessions.length;
  const avgWait = Math.round((sessions.reduce((s, it) => s + (it.waitTime || 0), 0) / Math.max(1, sessions.length)) * 10) / 10;

  const topicCounts = sessions.reduce((acc, s) => {
    acc[s.topic] = (acc[s.topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        <StatCard title="Total Chats" value={totalChats} />
        <StatCard title="Active Agents" value={agents.filter((a) => a.status !== 'offline').length} />
        <StatCard title="Avg Wait (s)" value={avgWait || 0} />
      </div>

      <div className="admin-content-grid">
        <div className="admin-content-card admin-content-card-wide">
          <h3>Topics distribution</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="admin-topic-list">
              {Object.entries(topicCounts).length === 0 && <div className="admin-empty-state">No data</div>}
              {Object.entries(topicCounts).map(([k, v]) => (
                <div key={k} className="admin-topic-item">
                  <div>{k}</div>
                  <div className="admin-topic-value">{v}</div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, fontSize: '14px', color: '#64748b' }}>
              Use analytics to dig deeper into topics and agent performance.
            </div>
          </div>
        </div>

        <div className="admin-content-card">
          <h3>Top Agents</h3>
          <ul className="admin-agents-list">
            {agents.slice(0, 5).map((a) => (
              <li key={a.id} className="admin-agent-item">
                <div>
                  <div className="admin-agent-name">{a.name}</div>
                  <div className="admin-agent-role">{a.role}</div>
                </div>
                <div style={{ fontSize: '14px' }}>{a.metrics.chatsToday}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// StatCard Component
type StatCardProps = {
  title: string;
  value: number | string;
};

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-title">{title}</div>
      <div className="admin-stat-value">{value}</div>
    </div>
  );
}

// AgentsPage Component
type AgentsPageProps = {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  skills: Skill[];
  reloadAgents: () => Promise<void>;
  syncAgentSkills: (agentId: number, skillIds: number[]) => Promise<void>;
};

function AgentsPage({ agents, setAgents, skills, reloadAgents, syncAgentSkills }: AgentsPageProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<{
    username: string;
    password: string;
    name: string;
    email: string;
    role: string;
    status: Agent['status'];
    skillIds: number[];
    max_concurrent_chats: number;
  }>({
    username: '',
    password: '',
    name: '',
    email: '',
    role: '',
    status: 'online',
    skillIds: [],
    max_concurrent_chats: 2,
  });

  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await apiClient.get('/api/agents');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const uniqueRoles = Array.from(new Set(res.data.data.map((a: any) => a.role).filter(Boolean))) as string[];
          setRoles(uniqueRoles);
        }
      } catch (err) {
        setRoles([]);
      }
    }
    fetchRoles();
  }, []);

  const toggleSkillSelection = (skillId: number) => {
    setFormData((prev) => {
      const exists = prev.skillIds.includes(skillId);
      return {
        ...prev,
        skillIds: exists ? prev.skillIds.filter((id) => id !== skillId) : [...prev.skillIds, skillId],
      };
    });
  };

  async function toggleStatus(id: number) {
    const agent = agents.find((a) => a.id === id);
    if (!agent) return;
    const newStatus = agent.status === 'online' ? 'offline' : 'online';
    try {
      // Optimistically update UI
      setAgents((prevAgents) =>
        prevAgents.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );

      // Create status event to track the status change
      await apiClient.post('/api/agent-status-events', {
        agent_id: id,
        status: newStatus,
        concurrent_load: 0,
        details: { source: 'admin_panel_toggle' }
      });

      // Reload to get the latest status from backend
      await reloadAgents();
    } catch (err) {
      // Revert optimistic update on error
      setAgents((prevAgents) =>
        prevAgents.map((a) => (a.id === id ? { ...a, status: agent.status } : a))
      );
      alert('Error updating agent status');
    }
  }

  async function handleCreateAgent() {
    try {
      const res = await apiClient.post('/api/agents', {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        display_name: formData.name,
        role: formData.role,
        max_concurrent_chats: formData.max_concurrent_chats
      });
      if (res.data.success) {
        const newAgentId = res.data?.data?.id;
        if (newAgentId) {
          await syncAgentSkills(newAgentId, formData.skillIds);
          // Create initial status event for the new agent
          try {
            await apiClient.post('/api/agent-status-events', {
              agent_id: newAgentId,
              status: formData.status,
              concurrent_load: 0,
              details: { source: 'admin_panel_create' }
            });
          } catch (statusErr) {
            console.error('Error creating initial status event:', statusErr);
            // Don't fail the whole operation if status event creation fails
          }
        }
        await reloadAgents();
        setShowCreateModal(false);
        setFormData({ username: '', password: '', name: '', email: '', role: 'support', status: 'online', skillIds: [], max_concurrent_chats: 2 });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Error creating agent';
      alert(msg);
    }
  }

  function handleEditAgent(agent: Agent) {
    setEditingAgent(agent);
    setFormData({
      username: agent.username,
      password: agent.password,
      name: agent.name,
      email: agent.email || '',
      role: agent.role,
      status: agent.status,
      skillIds: agent.skills?.map((skill) => skill.id) ?? [],
      max_concurrent_chats: agent.max_concurrent_chats ?? 2,
    });
    setShowCreateModal(true);
  }

  async function handleUpdateAgent() {
    if (editingAgent) {
      try {
        const res = await apiClient.put('/api/agents', {
          id: editingAgent.id,
          username: formData.username,
          password: formData.password,
          email: formData.email,
          display_name: formData.name,
          role: formData.role,
          max_concurrent_chats: formData.max_concurrent_chats
        });
        if (res.data.success) {
          await syncAgentSkills(editingAgent.id, formData.skillIds);
          // Always log a status event so backend history reflects the change time
          try {
            await apiClient.post('/api/agent-status-events', {
              agent_id: editingAgent.id,
              status: formData.status,
              concurrent_load: 0,
              details: {
                source: 'admin_panel_update',
                previous_status: editingAgent.status,
              },
            });
          } catch (statusErr) {
            console.error('Error creating status event:', statusErr);
            // Don't fail the whole operation if status event creation fails
          }
          await reloadAgents();
          setEditingAgent(null);
          setShowCreateModal(false);
          setFormData({ username: '', password: '', name: '', email: '', role: 'support', status: 'online', skillIds: [], max_concurrent_chats: 2 });
        }
      } catch (err: any) {
        const msg = err?.response?.data?.error?.message || err?.message || 'Error updating agent';
        alert(msg);
      }
    }
  }

  async function handleDeleteAgent(id: number) {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        const res = await apiClient.delete(`/api/agents/${id}`);
        if (res.data.success) {
          await reloadAgents();
        }
      } catch (err) {
        alert('Error deleting agent');
      }
    }
  }

  // ...existing code...
  return (
    <div className="admin-agents-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Agents</h2>
  <button onClick={() => { setEditingAgent(null); setFormData({ username: '', password: '', name: '', email: '', role: 'support', status: 'online', skillIds: [],max_concurrent_chats:2 }); setShowCreateModal(true); }} className="admin-button admin-button-primary">Create Agent</button>
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ marginTop: 0 }}>{editingAgent ? 'Edit Agent' : 'Create New Agent'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <label>
                Username
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="admin-login-input"
                  placeholder="Username"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value.slice(0, 72) })}
                  className="admin-login-input"
                  placeholder="Password (max 72 chars)"
                  maxLength={72}
                  required
                />
                {formData.password.length > 72 && (
                  <div style={{ color: 'red', fontSize: '12px' }}>
                    Password must be 72 characters or less.
                  </div>
                )}
              </label>
              <label>
                Display Name
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="admin-login-input"
                  placeholder="Agent name"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="admin-login-input"
                  placeholder="Email address"
                  required
                />
              </label>
              <label>
                Role
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="admin-login-input"
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>
              <label>
                Skills
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px' }}>
                  {skills.length === 0 && <div style={{ fontSize: '14px', color: '#94a3b8' }}>No skills available.</div>}
                  {skills.map((skill) => (
                    <label key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1f2937' }}>
                      <input
                        type="checkbox"
                        checked={formData.skillIds.includes(skill.id)}
                        onChange={() => toggleSkillSelection(skill.id)}
                      />
                      {skill.name}
                    </label>
                  ))}
                </div>
              </label>
              <label>
                Status
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Agent['status'] })}
                  className="admin-login-input"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="busy">Busy</option>
                  <option value="away">Away</option>
                </select>
              </label>
              <label>
                Max Concurrent Chats
                <input
                  type="number"
                  value={formData.max_concurrent_chats}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, max_concurrent_chats: Number(e.target.value) })}
                  className="admin-login-input"
                  placeholder="Max Concurrent Chats"
                  min={1}
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={editingAgent ? handleUpdateAgent : handleCreateAgent} className="admin-button admin-button-primary">
                {editingAgent ? 'Update' : 'Create'}
              </button>
              <button onClick={() => { setShowCreateModal(false); setEditingAgent(null); setFormData({ username: '', password: '', name: '', email: '', role: 'support', status: 'online', skillIds: [], max_concurrent_chats: 2 }); }} className="admin-button">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Role</th>
            <th>Skills</th>
            <th>Status</th>
            <th>Chats Today</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a: Agent) => (
            <tr key={a.id}>
              <td>{a.username}</td>
              <td>{a.name}</td>
              <td style={{ fontSize: '14px', color: '#475569' }}>{a.role}</td>
              <td style={{ fontSize: '14px', color: '#1f2937' }}>
                {a.skills && a.skills.length > 0 ? a.skills.map((skill) => skill.name).join(', ') : '—'}
              </td>
              <td style={{ textTransform: 'capitalize', fontWeight: a.status === 'online' ? 600 : 400 }}>
                {a.status}
              </td>
              <td>{a.metrics.chatsToday}</td>
              <td>
                <div className="admin-table-actions">
                  <button onClick={() => toggleStatus(a.id)} className="admin-button">Toggle</button>
                  <button onClick={() => handleEditAgent(a)} className="admin-button">Edit</button>
                  <button onClick={() => handleDeleteAgent(a.id)} className="admin-button admin-button-danger">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// LiveChatsPage Component
type LiveChatsPageProps = {
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
};

function LiveChatsPage({ sessions, setSessions, agents, setAgents }: LiveChatsPageProps) {
  const [selected, setSelected] = useState<number | null>(null);

  function takeSession(sessionId: number, agentId: number) {
    setSessions((s) => s.map((x) => (x.id === sessionId ? { ...x, status: 'assigned', assignedAgentId: agentId } : x)));
    setAgents((a) => a.map((ag) => (ag.id === agentId ? { ...ag, status: 'busy', currentSessionId: sessionId } : ag)));
  }

  function endSession(sessionId: number) {
    setSessions((s) => s.map((x) => (x.id === sessionId ? { ...x, status: 'closed' } : x)));
    setSelected(null);
  }

  const waiting = sessions.filter((s) => s.status === 'waiting');
  const active = sessions.filter((s) => s.status === 'assigned');

  return (
    <div className="admin-live-chats-grid">
      <div className="admin-live-chats-col admin-live-chats-col-3">
        <h3 className="admin-page-title">Waiting</h3>
        {waiting.length === 0 && <div className="admin-empty-state">No waiting users</div>}
        <ul className="admin-live-chats-list">
          {waiting.map((w) => (
            <li key={w.id} className="admin-live-chats-item" onClick={() => setSelected(w.id)}>
              <div className="admin-live-chats-item-title">Session {w.id}</div>
              <div className="admin-live-chats-item-subtitle">{w.topic}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-live-chats-col admin-live-chats-col-4">
        <h3 className="admin-page-title">Active Sessions</h3>
        {active.length === 0 && <div className="admin-empty-state">No active sessions</div>}
        <ul className="admin-live-chats-list">
          {active.map((a) => (
            <li key={a.id} className="admin-live-chats-item" onClick={() => setSelected(a.id)}>
              <div className="admin-live-chats-item-row">
                <div>
                  <div className="admin-live-chats-item-title">Session {a.id}</div>
                  <div className="admin-live-chats-item-subtitle">Agent {a.assignedAgentId}</div>
                </div>
                <div style={{ fontSize: '14px' }}>{a.duration}s</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-live-chats-col admin-live-chats-col-5">
        <h3 className="admin-page-title">Chat Window</h3>
        {!selected && <div className="admin-empty-state">Select a session to view chat</div>}
        {selected && (
          <div>
            <ChatWindow session={sessions.find((s) => s.id === selected)} onEnd={() => endSession(selected)} agents={agents} onAssign={takeSession} />
          </div>
        )}
      </div>
    </div>
  );
}

// ChatWindow Component
type ChatWindowProps = {
  session: Session | undefined;
  onEnd: () => void;
  agents: Agent[];
  onAssign: (sessionId: number, agentId: number) => void;
};

function ChatWindow({ session, onEnd, agents, onAssign }: ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  const [localMessages, setLocalMessages] = useState<Array<{ sender: string; text: string }>>([]);

  if (!session) return null;
  const availableAgents = agents.filter((a) => a.status === 'online');
  const allMessages = [...session.messages, ...localMessages];

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage = { sender: 'agent', text: messageText.trim() };
      setLocalMessages((prev) => [...prev, newMessage]);
      setMessageText('');
      // In a real app, this would send to the API
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="admin-chat-window">
      <div className="admin-chat-window-header">
        <div>
          <div className="admin-live-chats-item-title">Session {session.id}</div>
          <div className="admin-live-chats-item-subtitle">Topic: {session.topic}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onEnd} className="admin-button admin-button-danger">End</button>
        </div>
      </div>

      <div className="admin-chat-window-messages">
        {allMessages.map((m, i) => (
          <div key={i} className={`admin-chat-message ${m.sender === 'agent' ? 'admin-chat-message-agent' : 'admin-chat-message-user'}`}>
            <div className="admin-chat-message-sender">{m.sender}</div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>

      <div className="admin-chat-window-controls">
        <select defaultValue="" onChange={(e) => { if (e.target.value) onAssign(session.id, Number(e.target.value)); }}>
          <option value="">Assign to agent...</option>
          {availableAgents.map((a) => (
            <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
          ))}
        </select>
        <input 
          placeholder="Type a message to user" 
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSendMessage} className="admin-button admin-button-primary">Send</button>
      </div>
    </div>
  );
}

// RoutingPage Component
type RoutingPageProps = {
  rules: RoutingRule[];
  setRules: React.Dispatch<React.SetStateAction<RoutingRule[]>>;
  agents: Agent[];
};

function RoutingPage({ rules, setRules, agents }: RoutingPageProps) {
  const [editing, setEditing] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<{ topic: string; priority: number; allowedRoles: string[] } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRuleData, setNewRuleData] = useState({ topic: '', priority: 5, allowedRoles: ['technical'] });

  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await apiClient.get('/api/skills');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAvailableRoles(res.data.data.map((skill: any) => skill.name));
        }
      } catch (err) {
        setAvailableRoles([]);
      }
    }
    fetchRoles();
  }, []);

  function addRule() {
    if (newRuleData.topic.trim()) {
      const newRule: RoutingRule = { 
        id: Date.now(), 
        topic: newRuleData.topic.trim(), 
        allowedRoles: newRuleData.allowedRoles, 
        priority: newRuleData.priority, 
        autoAssign: true 
      };
      setRules((r) => [newRule, ...r]);
      setShowCreateModal(false);
      setNewRuleData({ topic: '', priority: 5, allowedRoles: ['technical'] });
    }
  }

  function startEdit(rule: RoutingRule) {
    setEditing(rule.id);
    setEditingData({ topic: rule.topic, priority: rule.priority, allowedRoles: [...rule.allowedRoles] });
  }

  function saveEdit(ruleId: number) {
    if (editingData) {
      setRules((prev) => prev.map((r) => 
        r.id === ruleId 
          ? { ...r, topic: editingData.topic, priority: editingData.priority, allowedRoles: editingData.allowedRoles }
          : r
      ));
      setEditing(null);
      setEditingData(null);
    }
  }

  function toggleRole(role: string) {
    if (editingData) {
      const newRoles = editingData.allowedRoles.includes(role)
        ? editingData.allowedRoles.filter((r) => r !== role)
        : [...editingData.allowedRoles, role];
      setEditingData({ ...editingData, allowedRoles: newRoles });
    }
  }

  return (
    <div className="admin-routing-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Routing Rules</h2>
        <button onClick={() => setShowCreateModal(true)} className="admin-button admin-button-primary">Create Rule</button>
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Create New Routing Rule</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <label>
                Topic
                <input
                  type="text"
                  value={newRuleData.topic}
                  onChange={(e) => setNewRuleData({ ...newRuleData, topic: e.target.value })}
                  className="admin-login-input"
                />
              </label>
              <label>
                Priority
                <input
                  type="number"
                  value={newRuleData.priority}
                  onChange={(e) => setNewRuleData({ ...newRuleData, priority: Number(e.target.value) })}
                  className="admin-login-input"
                />
              </label>
              <label>
                Allowed Roles
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px' }}>
                  {availableRoles.map((role) => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1f2937' }}>
                      <input
                        type="checkbox"
                        checked={newRuleData.allowedRoles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRuleData({ ...newRuleData, allowedRoles: [...newRuleData.allowedRoles, role] });
                          } else {
                            setNewRuleData({ ...newRuleData, allowedRoles: newRuleData.allowedRoles.filter((r) => r !== role) });
                          }
                        }}
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={addRule} className="admin-button admin-button-primary">Create</button>
              <button onClick={() => setShowCreateModal(false)} className="admin-button">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-routing-rules">
        {rules.map((r) => (
          <div key={r.id} className="admin-routing-rule">
            <div className="admin-routing-rule-header">
              <div>
                {editing === r.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      value={editingData?.topic || ''}
                      onChange={(e) => setEditingData({ ...editingData!, topic: e.target.value })}
                      className="admin-login-input"
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {availableRoles.map((role) => (
                        <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                          <input
                            type="checkbox"
                            checked={editingData?.allowedRoles.includes(role) || false}
                            onChange={() => toggleRole(role)}
                          />
                          {role}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="admin-routing-rule-topic">{r.topic}</div>
                    <div className="admin-routing-rule-roles">Roles: {r.allowedRoles.join(', ')}</div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {editing === r.id ? (
                  <>
                    <button className="admin-button admin-button-primary" onClick={() => saveEdit(r.id)}>Save</button>
                    <button className="admin-button" onClick={() => { setEditing(null); setEditingData(null); }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="admin-button" onClick={() => startEdit(r)}>Edit</button>
                    <button className="admin-button admin-button-danger" onClick={() => {
                      if (window.confirm('Are you sure you want to delete this rule?')) {
                        setRules((prev) => prev.filter((x) => x.id !== r.id));
                      }
                    }}>Delete</button>
                  </>
                )}
              </div>
            </div>

            {editing === r.id && editingData && (
              <div className="admin-routing-rule-edit">
                <label>Priority</label>
                <input 
                  type="number" 
                  value={editingData.priority}
                  onChange={(e) => setEditingData({ ...editingData, priority: Number(e.target.value) })}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// TemplatesPage Component
type TemplatesPageProps = {
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
};

function TemplatesPage({ templates, setTemplates }: TemplatesPageProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ type: '', content: '' });
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  function updateTemplate(id: number, content: string) {
    setTemplates((t) => t.map((x) => (x.id === id ? { ...x, content } : x)));
  }

  function handleCreateTemplate() {
    if (newTemplate.type.trim() && newTemplate.content.trim()) {
      const template: Template = {
        id: Date.now(),
        type: newTemplate.type.trim(),
        content: newTemplate.content.trim()
      };
      setTemplates((prev) => [...prev, template]);
      setShowCreateModal(false);
      setNewTemplate({ type: '', content: '' });
    }
  }

  function handleEditTemplate(template: Template) {
    setEditingTemplate(template);
    setNewTemplate({ type: template.type, content: template.content });
    setShowCreateModal(true);
  }

  function handleUpdateTemplate() {
    if (editingTemplate && newTemplate.type.trim() && newTemplate.content.trim()) {
      setTemplates((prev) => prev.map((t) => 
        t.id === editingTemplate.id 
          ? { ...t, type: newTemplate.type.trim(), content: newTemplate.content.trim() }
          : t
      ));
      setEditingTemplate(null);
      setShowCreateModal(false);
      setNewTemplate({ type: '', content: '' });
    }
  }

  function handleDeleteTemplate(id: number) {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  }

  return (
    <div className="admin-templates-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Message Templates</h2>
        <button onClick={() => { setEditingTemplate(null); setNewTemplate({ type: '', content: '' }); setShowCreateModal(true); }} className="admin-button admin-button-primary">Create Template</button>
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginTop: 0 }}>{editingTemplate ? 'Edit Template' : 'Create New Template'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <label>
                Type
                <input
                  type="text"
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                  className="admin-login-input"
                  placeholder="e.g., greeting, waiting, fallback"
                />
              </label>
              <label>
                Content
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  className="admin-login-input"
                  rows={4}
                  placeholder="Template content..."
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate} className="admin-button admin-button-primary">
                {editingTemplate ? 'Update' : 'Create'}
              </button>
              <button onClick={() => { setShowCreateModal(false); setEditingTemplate(null); setNewTemplate({ type: '', content: '' }); }} className="admin-button">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-templates-list">
        {templates.map((tpl) => (
          <div key={tpl.id} className="admin-template-item">
            <div className="admin-template-item-header">
              <div>
                <div className="admin-template-item-type">{tpl.type}</div>
                <div className="admin-template-item-preview">Preview</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEditTemplate(tpl)} className="admin-button">Edit</button>
                <button onClick={() => handleDeleteTemplate(tpl.id)} className="admin-button admin-button-danger">Delete</button>
              </div>
            </div>
            <textarea 
              value={tpl.content} 
              onChange={(e) => updateTemplate(tpl.id, e.target.value)} 
              rows={3} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ChatHistoryPage Component
type ChatHistoryPageProps = {
  sessions: Session[];
};

function ChatHistoryPage({ sessions }: ChatHistoryPageProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  return (
    <div className="admin-history-page">
      <h2 className="admin-page-title">Chat History</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div className="admin-history-list">
            {sessions.map((s) => (
              <div 
                key={s.id} 
                className={`admin-history-item ${selectedSession?.id === s.id ? 'admin-sidebar-item active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedSession(s)}
              >
                <div className="admin-history-item-header">
                  <div>
                    <div className="admin-history-item-title">Session {s.id}</div>
                    <div className="admin-history-item-topic">Topic: {s.topic} • Status: {s.status}</div>
                  </div>
                  <div style={{ fontSize: '14px' }}>Messages: {s.messages.length}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          {selectedSession ? (
            <div className="admin-content-card">
              <h3>Session {selectedSession.id} Details</h3>
              <div style={{ marginBottom: '16px' }}>
                <div><strong>Topic:</strong> {selectedSession.topic}</div>
                <div><strong>Status:</strong> {selectedSession.status}</div>
                <div><strong>Duration:</strong> {selectedSession.duration}s</div>
                <div><strong>Wait Time:</strong> {selectedSession.waitTime}s</div>
                {selectedSession.assignedAgentId && <div><strong>Assigned Agent:</strong> {selectedSession.assignedAgentId}</div>}
              </div>
              <h4>Messages:</h4>
              <div className="admin-chat-window-messages" style={{ height: '300px' }}>
                {selectedSession.messages.map((m, i) => (
                  <div key={i} className={`admin-chat-message ${m.sender === 'agent' ? 'admin-chat-message-agent' : 'admin-chat-message-user'}`}>
                    <div className="admin-chat-message-sender">{m.sender}</div>
                    <div>{m.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="admin-content-card">
              <div className="admin-empty-state">Select a session to view details</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// AnalyticsPage Component
type AnalyticsPageProps = {
  sessions: Session[];
  agents: Agent[];
};

function AnalyticsPage({ sessions, agents }: AnalyticsPageProps) {
  const total = sessions.length;
  const closed = sessions.filter((s) => s.status === 'closed').length;
  const avgDuration = Math.round((sessions.reduce((s, it) => s + (it.duration || 0), 0) / Math.max(1, sessions.length)) * 10) / 10;

  return (
    <div className="admin-analytics-page">
      <div className="admin-analytics-stats">
        <StatCard title="Total Sessions" value={total} />
        <StatCard title="Closed" value={closed} />
        <StatCard title="Avg Duration (s)" value={avgDuration} />
      </div>

      <div className="admin-content-card">
        <h3>Agent Response Times)</h3>
        <ul className="admin-analytics-list">
          {agents.map((a) => (
            <li key={a.id} className="admin-analytics-item">
              <div>{a.name}</div>
              <div>{a.metrics.avgResponse}s</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// SettingsPage Component
function SettingsPage() {
  const [settings, setSettings] = useState({
    businessHours: 'Mon-Fri 9:00-18:00',
    fallbackOption: 'Continue with bot'
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real app, this would save to API
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="admin-settings-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Settings</h2>
        <button onClick={handleSave} className="admin-button admin-button-primary">Save Settings</button>
      </div>
      {saved && <div style={{ backgroundColor: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>Settings saved successfully!</div>}
      <div className="admin-settings-form">
        <div className="admin-settings-field">
          <label>Business Hours</label>
          <input 
            value={settings.businessHours}
            onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
          />
        </div>
        <div className="admin-settings-field">
          <label>Fallback Option</label>
          <select 
            value={settings.fallbackOption}
            onChange={(e) => setSettings({ ...settings, fallbackOption: e.target.value })}
          >
            <option>Continue with bot</option>
            <option>Request callback</option>
            <option>Send email</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Mock Data Functions
// function mockAgents(): Agent[] {
//   return [
//     { id: 1, username: 'rakesh', password: 'pass123', name: 'Rakesh', role: 'technical', status: 'online', currentSessionId: null, metrics: { chatsToday: 12, avgResponse: 5 }, skills: [] },
//     { id: 2, username: 'maya', password: 'pass456', name: 'Maya', role: 'sales', status: 'online', currentSessionId: 101, metrics: { chatsToday: 8, avgResponse: 7 }, skills: [] },
//     { id: 3, username: 'arjun', password: 'pass789', name: 'Arjun', role: 'support', status: 'offline', currentSessionId: null, metrics: { chatsToday: 4, avgResponse: 12 }, skills: [] },
//   ];
// }

// function mockSessions(): Session[] {
//   return [
//     { id: 101, userId: 'u101', topic: 'booking', status: 'assigned', assignedAgentId: 2, messages: [{ sender: 'user', text: 'Hi, I need help booking' }, { sender: 'agent', text: 'Sure — I can help' }], duration: 120, waitTime: 5 },
//     { id: 102, userId: 'u102', topic: 'technical', status: 'waiting', assignedAgentId: null, messages: [{ sender: 'user', text: 'App crashes when I upload' }], duration: 0, waitTime: 20 },
//     { id: 103, userId: 'u103', topic: 'pricing', status: 'closed', assignedAgentId: null, messages: [{ sender: 'user', text: 'What are your fees?' }, { sender: 'bot', text: 'Here is our pricing' }], duration: 60, waitTime: 2 },
//   ];
// }

// function mockTemplates(): Template[] {
//   return [
//     { id: 1, type: 'greeting', content: 'Welcome! How can I help today?' },
//     { id: 2, type: 'waiting', content: "All agents are busy. We'll connect you shortly." },
//     { id: 3, type: 'fallback', content: 'Your agent is unavailable. Please try again later or leave a message.' },
//   ];
// }

// function mockRoutingRules(): RoutingRule[] {
//   return [
//     { id: 1, topic: 'technical', allowedRoles: ['technical'], priority: 1, autoAssign: true },
//     { id: 2, topic: 'sales', allowedRoles: ['sales'], priority: 5, autoAssign: true },
//   ];
// }


