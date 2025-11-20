import { useState } from 'react';
import { FormEvent, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AdminNavbar from './AdminPanel/AdminNavbar';
import ChatbotWidget from './ChatbotWidget';
import './admin-panel.css';
import { agentsApi, skillsApi, agentSkillsApi } from '../api/agentsApi';
import { ticketsApi, ticketAgentsApi, ticketMessagesApi, ticketFeedbackApi, ticketEventsApi } from '../api/ticketsApi';
import { conversationsApi, conversationDetailsApi } from '../api/conversationsApi';
import { analyticsApi } from '../api/analyticsApi';

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

type RoutingRule = {
  id: number;
  topic: string;
  allowedRoles: string[];
  priority: number;
  autoAssign: boolean;
};

type Session = {
  id: number;
  userId: string;
  topic: string;
  status: 'assigned' | 'waiting' | 'closed';
  assignedAgentId: number | null;
  messages: Array<{ sender: 'user' | 'agent' | 'bot'; text: string }>;
  duration: number;
  waitTime: number;
};

type Template = {
  id: number;
  type: string;
  content: string;
};

type Ticket = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  created_at: string;
  updated_at: string;
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
  const [skills, setSkills] = useState<Skill[]>([]);

  // New state for additional sections
  const [tickets, setTickets] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const loadSkills = useCallback(async () => {
    try {
      const skillsData = await skillsApi.getSkills();
      setSkills(skillsData.map((skill: any) => ({
        id: skill.id,
        name: skill.name,
      })));
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    try {
      const ticketsData = await ticketsApi.getTickets();
      setTickets(ticketsData);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const conversationsData = await conversationsApi.getConversations();
      setConversations(conversationsData);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const alertsData = await analyticsApi.getAlerts();
      setAnalytics({ alerts: alertsData });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setAnalytics({ alerts: [] });
    }
  }, []);

  const attachAgentSkills = useCallback(async (agent: Agent): Promise<Agent> => {
    if (!agent.id) {
      return agent;
    }
    try {
      const skillsData = await agentsApi.getAgentSkills(agent.id);
      return { ...agent, skills: skillsData };
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
      const statusData = await agentsApi.getCurrentAgentStatus(agent.id);
      if (statusData?.status) {
        return { ...agent, status: statusData.status as Agent['status'] };
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
      const agentsData = await agentsApi.getAgents();
      const normalized = agentsData.map((agent: any, idx: number) => normalizeAgent(agent, idx));
      const withSkills = await Promise.all(normalized.map((agent) => attachAgentSkills(agent)));
      const withStatus = await Promise.all(withSkills.map((agent) => attachAgentStatus(agent)));
      setAgents(withStatus);
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

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const syncAgentSkills = useCallback(async (agentId: number, selectedSkillIds: number[]) => {
    try {
      const existingSkills = await agentsApi.getAgentSkills(agentId);
      const existingIds = existingSkills.map(skill => skill.id);

      const toAdd = selectedSkillIds.filter((skillId: number) => !existingIds.includes(skillId));
      const toRemove = existingIds.filter((skillId: number) => !selectedSkillIds.includes(skillId));

      await Promise.all([
        ...toAdd.map((skillId) => agentSkillsApi.createAgentSkill({
          agent_id: agentId,
          skill_id: skillId,
          proficiency: 5,
        })),
        ...toRemove.map((skillId) => agentSkillsApi.deleteAgentSkill(agentId, skillId)),
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
            <Sidebar route={route} setRoute={setRoute} agents={agents} onLogout={onLogout} />
          </aside>

          <main className="admin-panel-main">
            <AdminNavbar />

            <div style={{ marginTop: '16px' }}>
              {route === 'dashboard' && <Dashboard agents={agents} />}
              {route === 'agents' && (
                <AgentsPage
                  agents={agents}
                  setAgents={setAgents}
                  skills={skills}
                  reloadAgents={loadAgents}
                  syncAgentSkills={syncAgentSkills}
                />
              )}
              {route === 'analysis' && <AnalyticsPage sessions={[]} agents={agents} />}
              {route === 'tickets' && <TicketsPage tickets={tickets} setTickets={setTickets} />}
              {route === 'conversations' && <ConversationsPage conversations={conversations} setConversations={setConversations} />}
              {route === 'alerts' && <AlertsPage analytics={analytics} />}
              {route === 'skills' && <SkillsPage skills={skills} setSkills={setSkills} />}
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
    <header className="crm-header">
      <div className="crm-header-container">
        {/* Logo and Brand */}
        <div className="crm-brand">
          <div className="crm-logo">
            🏢
          </div>
          <div className="crm-brand-text">
            <h1 className="crm-title">Real Estate CRM</h1>
            <span className="crm-subtitle">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="crm-nav">
          <button onClick={() => setRoute('dashboard')} className="crm-nav-link">Dashboard</button>
          <button onClick={() => setRoute('agents')} className="crm-nav-link">Agents</button>
          <button onClick={() => setRoute('tickets')} className="crm-nav-link">Tickets</button>
          <button onClick={() => setRoute('analysis')} className="crm-nav-link">Analytics</button>
        </nav>

        {/* User Menu */}
        <div className="crm-user-menu" ref={menuRef}>
          <button className="crm-user-button" onClick={() => setShowMenu(!showMenu)}>
            <div className="crm-user-avatar">A</div>
            <span className="crm-user-name">Admin</span>
            <svg className="crm-dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {showMenu && (
            <div className="crm-dropdown-menu">
              <div className="crm-dropdown-header">
                <div className="crm-user-avatar">A</div>
                <div>
                  <div className="crm-dropdown-name">Administrator</div>
                  <div className="crm-dropdown-email">admin@realestate.com</div>
                </div>
              </div>
              <div className="crm-dropdown-divider"></div>
              <button className="crm-dropdown-item" onClick={() => { setShowMenu(false); setRoute('settings'); }}>
                <svg className="crm-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              <button className="crm-dropdown-item crm-dropdown-logout" onClick={() => { setShowMenu(false); onLogout(); }}>
                <svg className="crm-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Sidebar Component
type SidebarProps = {
  route: string;
  setRoute: (route: string) => void;
  agents: Agent[];
  onLogout: () => void;
};

function Sidebar({ route, setRoute, agents, onLogout }: SidebarProps) {
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
        <ul className="admin-sidebar-list">
          {item('dashboard', 'Dashboard', null)}
          {item('tickets', 'Tickets', null)}
          {item('agents', `Agents (${onlineCount} online)`, null)}
          {item('analysis', 'Analysis', null)}
          {item('conversations', 'Conversations', null)}
          {item('alerts', 'Alerts', null)}
          {item('skills', 'Skills', null)}
          {/* Settings button removed, now only accessible from header dropdown */}
          {item('workflows', 'Workflows', null)}
        </ul>
      </div>
    </div>
  );
}

// Dashboard Component
type DashboardProps = {
  agents: Agent[];
};

function Dashboard({ agents }: DashboardProps) {
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status !== 'offline').length;

  // Sort agents by chats today and take top 5
  const topAgents = [...agents]
    .sort((a, b) => b.metrics.chatsToday - a.metrics.chatsToday)
    .slice(0, 5);

  return (
    <div className="admin-dashboard">
      {/* Left Side - Stats and Status Overview */}
      <div className="dashboard-left-section">
        {/* Compact Stats Row */}
        <div className="dashboard-stats-compact">
          <StatCard title="Total Agents" value={totalAgents} icon="👥" />
          <StatCard title="Active Agents" value={activeAgents} icon="⚡" />
          <StatCard title="Online Agents" value={agents.filter((a) => a.status === 'online').length} icon="🟢" />
        </div>

        {/* Compact Status Overview */}
        <div className="dashboard-status-overview">
          <h3 className='admin-stat-title'>Agent Status Overview</h3>
          <div className="status-overview-grid">
            <div className="status-item">
              <div className="status-icon">🟢</div>
              <div className="status-content">
                <div className="status-label">Online</div>
                <div className="status-value">{agents.filter(a => a.status === 'online').length}</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-icon">🔴</div>
              <div className="status-content">
                <div className="status-label">Offline</div>
                <div className="status-value">{agents.filter(a => a.status === 'offline').length}</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-icon">🟠</div>
              <div className="status-content">
                <div className="status-label">Busy</div>
                <div className="status-value">{agents.filter(a => a.status === 'busy').length}</div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-icon">🟣</div>
              <div className="status-content">
                <div className="status-label">Away</div>
                <div className="status-value">{agents.filter(a => a.status === 'away').length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Top Agents */}
      <div className="dashboard-right-section">
        {/* Top Agents by Performance */}
        <div className="dashboard-top-agents">
          <h3>Top Agents by Chats Today</h3>
          <div className="top-agents-compact">
            {topAgents.length === 0 ? (
              <div className="admin-empty-state">No agent data available</div>
            ) : (
              topAgents.map((a, index) => (
                <div key={a.id} className="top-agent-compact">
                  <div className="agent-compact-rank">#{index + 1}</div>
                  <div className="agent-compact-avatar">{a.name.charAt(0).toUpperCase()}</div>
                  <div className="agent-compact-info">
                    <div className="agent-compact-name">{a.name}</div>
                    <div className="agent-compact-role">{a.role}</div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-secondary)', marginTop: '2px' }}>
                      {a.metrics.chatsToday} chats today
                    </div>
                  </div>
                  <div className={`agent-compact-status ${a.status}`}>
                    {a.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// StatCard Component
type StatCardProps = {
  title: string;
  value: number | string;
  icon?: string;
};

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="admin-stat-card">
      
      <div className="admin-stat-content">
        <span className="admin-stat-title">{title} </span>
        <span className="admin-stat-value">{value}</span>
      </div>
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAgent, setViewingAgent] = useState<Agent | null>(null);
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

  // Filters and sorting state
  const [filters, setFilters] = useState({
    status: '',
    role: '',
    skill: '',
    sort_by: 'name'
  });

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

  // async function toggleStatus(id: number) {
  //   const agent = agents.find((a) => a.id === id);
  //   if (!agent) return;
  //   const newStatus = agent.status === 'online' ? 'offline' : 'online';
  //   try {
  //     // Optimistically update UI
  //     setAgents((prevAgents) =>
  //       prevAgents.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
  //     );

  //     // Create status event to track the status change
  //     await agentsApi.updateAgentStatus({
  //       agent_id: id,
  //       status: newStatus,
  //       concurrent_load: 0,
  //       details: { source: 'admin_panel_toggle' }
  //     });

  //     // Reload to get the latest status from backend
  //     await reloadAgents();
  //   } catch (err) {
  //     // Revert optimistic update on error
  //     setAgents((prevAgents) =>
  //       prevAgents.map((a) => (a.id === id ? { ...a, status: agent.status } : a))
  //     );
  //     alert('Error updating agent status');
  //   }
  // }

  async function handleCreateAgent() {
    try {
      const agentData = {
        username: formData.username,
        display_name: formData.name,
        email: formData.email,
        password: formData.password,
        is_active: formData.status !== 'offline',
        max_concurrent_chats: formData.max_concurrent_chats,
        role: formData.role,
      };

      const newAgent = await agentsApi.createAgent(agentData);

      if (newAgent) {
        const newAgentId = newAgent.id;
        if (newAgentId) {
          await syncAgentSkills(newAgentId, formData.skillIds);
          // Create initial status event for the new agent
          try {
            await agentsApi.updateAgentStatus({
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
      const msg = err?.response?.data?.detail || err?.message || 'Error creating agent';
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
        const agentData = {
          id: editingAgent.id,
          username: formData.username,
          display_name: formData.name,
          email: formData.email,
          password: formData.password,
          is_active: formData.status !== 'offline',
          max_concurrent_chats: formData.max_concurrent_chats,
          role: formData.role,
        };

        const updatedAgent = await agentsApi.updateAgent(agentData);

        if (updatedAgent) {
          await syncAgentSkills(editingAgent.id, formData.skillIds);
          // Always log a status event so backend history reflects the change time
          try {
            await agentsApi.updateAgentStatus({
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
        const msg = err?.response?.data?.detail || err?.message || 'Error updating agent';
        alert(msg);
      }
    }
  }

  // function handleViewAgent(agent: Agent) {
  //   setViewingAgent(agent);
  //   setShowViewModal(true);
  // }

  async function handleDeleteAgent(id: number) {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        await agentsApi.deleteAgent(id);
        await reloadAgents();
      } catch (err) {
        alert('Error deleting agent');
      }
    }
  }

  // Filter and sort agents
  const filteredAgents = agents
    .filter((agent) => {
      if (filters.status && agent.status !== filters.status) return false;
      if (filters.role && agent.role !== filters.role) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sort_by) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'role':
          return a.role.localeCompare(b.role);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  // ...existing code...
  return (
    <div>
      <div className="admin-agents-page">
        <div className="admin-page-header">
          <h2 className="admin-page-title">Agents</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="admin-login-input"
              style={{ width: '120px' }}
            >
              <option value="">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="busy">Busy</option>
              <option value="away">Away</option>
            </select>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="admin-login-input"
              style={{ width: '120px' }}
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select
              value={filters.sort_by}
              onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
              className="admin-login-input"
              style={{ width: '140px' }}
            >
              <option value="name">Name A-Z</option>
              <option value="role">Role</option>
              <option value="status">Status</option>
            </select>
            <button onClick={() => { setEditingAgent(null); setFormData({ username: '', password: '', name: '', email: '', role: 'support', status: 'online', skillIds: [], max_concurrent_chats: 2 }); setShowCreateModal(true); }} className="admin-button admin-button-primary">Create Agent</button>
          </div>
        </div>

        {showCreateModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
              <button
                onClick={() => { setShowCreateModal(false); setEditingAgent(null); setFormData({ username: '', password: '', name: '', email: '', role: 'support', status: 'online', skillIds: [], max_concurrent_chats: 2 }); }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                ×
              </button>
              <h3 style={{ marginTop: 0, marginRight: '40px' }}>{editingAgent ? 'Edit Agent' : 'Create New Agent'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <label>
                  Username : 
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
                  Display Name :
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="admin-login-input"
                    placeholder="Agent name"
                  />
                </label>
                <label>
                  Email : 
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
                Password : 
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="admin-login-input"
                  autoComplete="current-password"
                  required
                />
              </label>
                <label>
                  Role :
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
                  Skills : 
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', scrollBehavior: 'smooth' }}>
                    {skills.length === 0 && <div style={{ fontSize: '14px', color: '#94a3b8', padding: '8px 0' }}>No skills available.</div>}
                    {skills.map((skill) => (
                      <label key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1f2937', padding: '4px 0', cursor: 'pointer' }}>
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
                {/* <label>
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
                </label> */}
                <label>
                  Max Concurrent Chats : 
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
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowCreateModal(false); setEditingAgent(null); setFormData({ username: '', password: '', name: '', email: '', role: 'support', status: 'online', skillIds: [], max_concurrent_chats: 2 }); }}
                  className="admin-button"
                  style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
                >
                  Close
                </button>
                <button onClick={editingAgent ? handleUpdateAgent : handleCreateAgent} className="admin-button admin-button-primary">
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showViewModal && viewingAgent && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
              <button
                onClick={() => { setShowViewModal(false); setViewingAgent(null); }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                ×
              </button>
              <h3 style={{ marginTop: 0, marginRight: '40px' }}>Agent Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#374151' }}>Username:</label>
                  <div style={{ marginTop: '4px', color: '#6b7280' }}>{viewingAgent.username}</div>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#374151' }}>Display Name:</label>
                  <div style={{ marginTop: '4px', color: '#6b7280' }}>{viewingAgent.name}</div>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#374151' }}>Email:</label>
                  <div style={{ marginTop: '4px', color: '#6b7280' }}>{viewingAgent.email || 'Not provided'}</div>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#374151' }}>Role:</label>
                  <div style={{ marginTop: '4px', color: '#6b7280' }}>{viewingAgent.role}</div>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#374151' }}>Status:</label>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`admin-status-badge admin-status-${viewingAgent.status}`}>
                      {viewingAgent.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#374151' }}>Skills:</label>
                  <div style={{ marginTop: '4px', color: '#6b7280' }}>
                    {viewingAgent.skills && viewingAgent.skills.length > 0
                      ? viewingAgent.skills.map((skill) => skill.name).join(', ')
                      : 'No skills assigned'
                    }
                  </div>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#374151' }}>Max Concurrent Chats:</label>
                  <div style={{ marginTop: '4px', color: '#6b7280' }}>{viewingAgent.max_concurrent_chats || 2}</div>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#374151' }}>Chats Today:</label>
                  <div style={{ marginTop: '4px', color: '#6b7280' }}>{viewingAgent.metrics.chatsToday}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowViewModal(false); setViewingAgent(null); }}
                  className="admin-button"
                  style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="admin-tickets-container admin-tab-card">
        <div className="admin-tickets-table-wrapper admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>No.</th>
                <th style={{ minWidth: '120px' }}>Username</th>
                <th style={{ minWidth: '150px' }}>Name</th>
                <th style={{ width: '100px' }}>Role</th>
                <th style={{ minWidth: '200px' }}>Skills</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '120px' }}>Chats Today</th>
                <th style={{ width: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((a: Agent, index: number) => (
                <tr key={a.id}>
                  <td style={{ width: '60px', fontWeight: '500', color: 'var(--admin-text)' }}>{index + 1}</td>
                  <td style={{ minWidth: '120px', fontWeight: '500' }}>{a.username}</td>
                  <td style={{ minWidth: '150px', fontWeight: '500' }}>{a.name}</td>
                  <td style={{ width: '100px', fontSize: '14px', color: '#475569' }}>{a.role}</td>
                  <td style={{ minWidth: '200px', fontSize: '14px', color: '#1f2937' }}>
                    {a.skills && a.skills.length > 0 ? (
                      a.skills.map((skill) => skill.name).join(', ').length > 60
                        ? `${a.skills.map((skill) => skill.name).join(', ').substring(0, 60)}...`
                        : a.skills.map((skill) => skill.name).join(', ')
                    ) : '—'}
                  </td>
                  <td style={{ width: '100px' }}>
                    <span className={`admin-status-badge admin-status-${a.status}`}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ width: '120px', fontSize: '14px', textAlign: 'center' }}>{a.metrics.chatsToday}</td>
                  <td style={{ width: '160px' }}>
                    <div className="admin-table-actions">
                      {/* <button onClick={() => handleViewAgent(a)} className="admin-button">View</button>
                      <button onClick={() => toggleStatus(a.id)} className="admin-button">Toggle</button> */}
                      <button onClick={() => handleEditAgent(a)} className="admin-button">Edit</button>
                      <button onClick={() => handleDeleteAgent(a.id)} className="admin-button admin-button-danger">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
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

  const availableRoles = ['technical', 'sales', 'support'];

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
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '4px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
            >
              ×
            </button>
            <h3 style={{ marginTop: 0, marginRight: '40px' }}>Create New Routing Rule</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <label>
                Topic
                <input
                  type="text"
                  value={newRuleData.topic}
                  onChange={(e) => setNewRuleData({ ...newRuleData, topic: e.target.value })}
                  className="admin-login-input"
                  placeholder="e.g., technical, sales, support"
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', scrollBehavior: 'smooth' }}>
                  {availableRoles.map((role) => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1f2937', padding: '4px 0', cursor: 'pointer' }}>
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
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateModal(false)} className="admin-button" style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>
                Close
              </button>
              <button onClick={addRule} className="admin-button admin-button-primary">
                Create Rule
              </button>
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
        <h3>Agent Response Times (sample)</h3>
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

// TicketsPage Component
type TicketsPageProps = {
  tickets: any[];
  setTickets: React.Dispatch<React.SetStateAction<any[]>>;
};

function TicketsPage({ tickets, setTickets }: TicketsPageProps) {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    agent_id: '',
    sort_by: 'newest'
  });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [ticketEvents, setTicketEvents] = useState<any[]>([]);
  const [ticketFeedback, setTicketFeedback] = useState<any[]>([]);

  // Filter and sort tickets
  const filteredTickets = tickets
    .filter((ticket) => {
      if (filters.status && ticket.status !== filters.status) return false;
      if (filters.priority && ticket.priority !== filters.priority) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sort_by) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'longest_open':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // Assuming open means created_at is older
        default:
          return 0;
      }
    });

  const handleViewTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    try {
      // Load ticket messages, events, and feedback
      const [messages, events, feedback] = await Promise.all([
        ticketMessagesApi.getTicketMessages(ticket.id),
        ticketEventsApi.getTicketEvents(ticket.id),
        ticketFeedbackApi.getTicketFeedbackByTicket(ticket.id)
      ]);
      setTicketMessages(messages);
      setTicketEvents(events);
      setTicketFeedback(feedback);
    } catch (err) {
      console.error('Error loading ticket details:', err);
    }
  };

  const handleAssignTicket = async (ticketId: string) => {
    // This would typically open a modal to select an agent
    // For now, just show an alert
    alert('Assign ticket functionality - would open agent selection modal');
  };

  if (selectedTicket) {
    return (
      <div className="admin-agents-page">
        <div className="admin-page-header">
          <button onClick={() => setSelectedTicket(null)} className="admin-button">
            ← Back to Tickets
          </button>
          <h2 className="admin-page-title">Ticket #{selectedTicket.id}</h2>
        </div>

        <div className="admin-ticket-detail-grid">
          {/* Ticket Details */}
          <div className="admin-content-card admin-ticket-card">
            <h3 className="admin-card-title">Ticket Details</h3>
            <div className="admin-ticket-details">
              <div className="admin-detail-row">
                <span className="admin-detail-label">Title:</span>
                <span className="admin-detail-value">{selectedTicket.title}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Description:</span>
                <span className="admin-detail-value">{selectedTicket.description || 'No description provided'}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Status:</span>
                <span className={`admin-status-badge admin-status-${selectedTicket.status.replace('_', '-')}`}>
                  {selectedTicket.status.replace('_', ' ')}
                </span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Priority:</span>
                <span className={`admin-priority-badge admin-priority-${selectedTicket.priority}`}>
                  {selectedTicket.priority}
                </span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Category:</span>
                <span className="admin-detail-value">{selectedTicket.category || 'Uncategorized'}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Created:</span>
                <span className="admin-detail-value">{new Date(selectedTicket.created_at).toLocaleString()}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Updated:</span>
                <span className="admin-detail-value">{new Date(selectedTicket.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Ticket Feedback */}
          <div className="admin-content-card admin-ticket-card">
            <h3 className="admin-card-title">Feedback & Rating</h3>
            <div className="admin-ticket-feedback">
              {ticketFeedback.length === 0 ? (
                <div className="admin-empty-state">No feedback available</div>
              ) : (
                ticketFeedback.map((feedback: any) => (
                  <div key={feedback.id} className="admin-feedback-item">
                    <div className="admin-feedback-header">
                      <span className="admin-feedback-rating">Rating: {feedback.rating}/5</span>
                      <span className="admin-feedback-date">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="admin-feedback-comment">
                      {feedback.comment || 'No comment provided'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ticket Messages */}
          <div className="admin-content-card admin-ticket-messages-card">
            <h3 className="admin-card-title">Messages ({ticketMessages.length})</h3>
            <div className="admin-messages-container">
              {ticketMessages.length === 0 ? (
                <div className="admin-empty-state">No messages in this ticket</div>
              ) : (
                ticketMessages.map((message: any) => (
                  <div key={message.id} className="admin-message-item">
                    <div className="admin-message-header">
                      <span className="admin-message-sender">
                        {message.sender_type} {message.sender_id}
                      </span>
                      <span className="admin-message-time">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="admin-message-content">{message.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ticket Events */}
          <div className="admin-content-card admin-ticket-events-card">
            <h3 className="admin-card-title">Events ({ticketEvents.length})</h3>
            <div className="admin-events-container">
              {ticketEvents.length === 0 ? (
                <div className="admin-empty-state">No events recorded</div>
              ) : (
                ticketEvents.map((event: any) => (
                  <div key={event.id} className="admin-event-item">
                    <div className="admin-event-header">
                      <span className="admin-event-type">{event.event_type}</span>
                      <span className="admin-event-time">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="admin-event-actor">by {event.actor_id}</div>
                    {event.details && (
                      <div className="admin-event-details">
                        {JSON.stringify(event.details, null, 2)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-agents-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Tickets</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="admin-login-input"
            style={{ width: '120px' }}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="admin-login-input"
            style={{ width: '120px' }}
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={filters.sort_by}
            onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
            className="admin-login-input"
            style={{ width: '140px' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="longest_open">Longest Open</option>
          </select>
        </div>
      </div>

      <div className="admin-tickets-container admin-tab-card">
        <div className="admin-tickets-table-wrapper admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ minWidth: '200px' }}>Title</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '100px' }}>Priority</th>
                <th style={{ width: '120px' }}>Created</th>
                <th style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="admin-empty-state">No tickets found</div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td style={{ width: '80px', fontWeight: '500', color: 'var(--admin-text)' }}>{ticket.id}</td>
                    <td style={{ minWidth: '200px', fontWeight: '500', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.title}
                    </td>
                    <td style={{ width: '120px' }}>
                      <span className={`admin-status-badge admin-status-${ticket.status.replace('_', '-')}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ width: '100px' }}>
                      <span className={`admin-priority-badge admin-priority-${ticket.priority}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td style={{ width: '120px', fontSize: '14px', color: 'var(--admin-text-secondary)' }}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ width: '140px' }}>
                      <div className="admin-table-actions">
                        <button onClick={() => handleViewTicket(ticket)} className="admin-button">View</button>
                        <button onClick={() => handleAssignTicket(ticket.id)} className="admin-button">Assign</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ConversationsPage Component
type ConversationsPageProps = {
  conversations: any[];
  setConversations: React.Dispatch<React.SetStateAction<any[]>>;
};

function ConversationsPage({ conversations, setConversations }: ConversationsPageProps) {
  const [filters, setFilters] = useState({
    ai_only: false,
    agent_involved: false,
    status: '',
    sort_by: 'newest'
  });
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);

  // Filter and sort conversations
  const filteredConversations = conversations
    .filter((conv) => {
      if (filters.ai_only && conv.agent_involved) return false;
      if (filters.agent_involved && !conv.agent_involved) return false;
      if (filters.status && conv.status !== filters.status) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sort_by) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        default:
          return 0;
      }
    });

  const handleViewConversation = async (conversation: any) => {
    setSelectedConversation(conversation);
    try {
      // Load conversation messages
      const messages = await conversationDetailsApi.getConversationDetailsByConversation(conversation.id);
      setConversationMessages(messages);
    } catch (err) {
      console.error('Error loading conversation details:', err);
    }
  };

  const handleChangeAgent = async (conversationId: number) => {
    // This would typically open a modal to select a new agent
    alert('Change agent functionality - would open agent selection modal');
  };

  const handleExportConversations = async () => {
    // This would export selected conversations
    alert('Export functionality - would download CSV/JSON of conversations');
  };

  if (selectedConversation) {
    return (
      <div className="admin-agents-page">
        <div className="admin-page-header">
          <button onClick={() => setSelectedConversation(null)} className="admin-button">← Back to Conversations</button>
          <h2 className="admin-page-title">Conversation #{selectedConversation.id}</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {/* Conversation Details */}
          <div className="admin-content-card">
            <h3>Conversation Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Session ID:</strong> {selectedConversation.session_id}</div>
              <div><strong>User ID:</strong> {selectedConversation.user_id || 'N/A'}</div>
              <div><strong>Browser:</strong> {selectedConversation.browser || 'N/A'}</div>
              <div><strong>IP Address:</strong> {selectedConversation.ip_address || 'N/A'}</div>
              <div><strong>Start Time:</strong> {selectedConversation.start_time ? new Date(selectedConversation.start_time).toLocaleString() : 'N/A'}</div>
              <div><strong>End Time:</strong> {selectedConversation.end_time ? new Date(selectedConversation.end_time).toLocaleString() : 'N/A'}</div>
            </div>
          </div>

          {/* Conversation Messages */}
          <div className="admin-content-card">
            <h3>Messages ({conversationMessages.length})</h3>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {conversationMessages.length === 0 ? (
                <div className="admin-empty-state">No messages in this conversation</div>
              ) : (
                conversationMessages.map((message: any) => (
                  <div key={message.id} style={{ marginBottom: '12px', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      <strong>{message.responder_type} {message.agent_id ? `(Agent ${message.agent_id})` : ''}</strong> - {new Date(message.created_at).toLocaleString()}
                    </div>
                    {message.prompt && (
                      <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#374151' }}>
                        <strong>Prompt:</strong> {message.prompt}
                      </div>
                    )}
                    {message.output && (
                      <div style={{ marginTop: '4px' }}>
                        <strong>Response:</strong> {message.output}
                      </div>
                    )}
                    {message.category && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        Category: {message.category}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-agents-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Conversations</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={filters.ai_only}
              onChange={(e) => setFilters({ ...filters, ai_only: e.target.checked })}
            />
            AI Only
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={filters.agent_involved}
              onChange={(e) => setFilters({ ...filters, agent_involved: e.target.checked })}
            />
            Agent Involved
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="admin-login-input"
            style={{ width: '120px' }}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <button onClick={handleExportConversations} className="admin-button admin-button-primary">Export</button>
        </div>
      </div>

      <div className="admin-tab-card">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>User ID</th>
                <th>Status</th>
                <th>Messages</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="admin-empty-state">No conversations found</div>
                  </td>
                </tr>
              ) : (
                filteredConversations.map((conv) => (
                  <tr key={conv.id}>
                    <td>{conv.session_id}</td>
                    <td>{conv.user_id || 'N/A'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{conv.status || 'N/A'}</td>
                    <td>{conversationMessages.length || 0}</td>
                    <td>{conv.created_at ? new Date(conv.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="admin-table-actions">
                        <button onClick={() => handleViewConversation(conv)} className="admin-button">View</button>
                        <button onClick={() => handleChangeAgent(conv.id)} className="admin-button">Change Agent</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// AlertsPage Component
type AlertsPageProps = {
  analytics: any;
};

function AlertsPage({ analytics }: AlertsPageProps) {
  const alerts = analytics?.alerts || [];

  return (
    <div className="admin-agents-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Alerts</h2>
      </div>

      <div className="admin-tab-card admin-tab-card--padded">
        <div className="admin-content-grid">
          {alerts.length === 0 ? (
            <div className="admin-content-card" style={{ gridColumn: '1 / -1' }}>
              <div className="admin-empty-state">No alerts at this time</div>
            </div>
          ) : (
            alerts.map((alert: any) => (
              <div key={alert.agent_id} className="admin-content-card">
                <h3 style={{ color: '#ef4444' }}>⚠️ Low Rating Alert</h3>
                <div style={{ marginTop: '8px' }}>
                  <div><strong>Agent:</strong> {alert.agent_name}</div>
                  <div><strong>Average Rating:</strong> {alert.avg_rating}/5</div>
                  <div style={{ marginTop: '12px' }}>
                    <button className="admin-button admin-button-primary">Contact Agent</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// SkillsPage Component
type SkillsPageProps = {
  skills: Skill[];
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
};

function SkillsPage({ skills, setSkills }: SkillsPageProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  const handleCreateSkill = async () => {
    if (formData.name.trim()) {
      try {
        const newSkill = await skillsApi.createSkill({ name: formData.name.trim() });
        setSkills((prev) => [...prev, newSkill]);
        setShowCreateModal(false);
        setFormData({ name: '' });
      } catch (err) {
        alert('Error creating skill');
      }
    }
  };

  const handleUpdateSkill = async () => {
    if (editingSkill && formData.name.trim()) {
      try {
        const updatedSkill = await skillsApi.updateSkill({
          id: editingSkill.id,
          name: formData.name.trim()
        });
        setSkills((prev) =>
          prev.map((skill) =>
            skill.id === editingSkill.id ? updatedSkill : skill
          )
        );
        setEditingSkill(null);
        setShowCreateModal(false);
        setFormData({ name: '' });
      } catch (err) {
        alert('Error updating skill');
      }
    }
  };

  const handleDeleteSkill = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      try {
        await skillsApi.deleteSkill(id);
        setSkills((prev) => prev.filter((skill) => skill.id !== id));
      } catch (err) {
        alert('Error deleting skill');
      }
    }
  };

  return (
    <div className="admin-agents-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Skills</h2>
        <button
          onClick={() => {
            setEditingSkill(null);
            setFormData({ name: '' });
            setShowCreateModal(true);
          }}
          className="admin-button admin-button-primary"
        >
          Add Skill
        </button>
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setEditingSkill(null);
                setFormData({ name: '' });
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '4px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
            >
              ×
            </button>
            <h3 style={{ marginTop: 0, marginRight: '40px' }}>{editingSkill ? 'Edit Skill' : 'Create New Skill'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <label>
                Skill Name
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="admin-login-input"
                  placeholder="Enter skill name"
                  required
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSkill(null);
                  setFormData({ name: '' });
                }}
                className="admin-button"
                style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
              >
                Close
              </button>
              <button
                onClick={editingSkill ? handleUpdateSkill : handleCreateSkill}
                className="admin-button admin-button-primary"
              >
                {editingSkill ? 'Update Skill' : 'Create Skill'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-tab-card">
        <div className="admin-skills-table-wrapper admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Skill Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills
                .sort((a, b) => a.id - b.id)
                .map((skill, index) => (
                <tr key={skill.id}>
                  <td>{index + 1}</td>
                  <td>{skill.name}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        onClick={() => {
                          setEditingSkill(skill);
                          setFormData({ name: skill.name });
                          setShowCreateModal(true);
                        }}
                        className="admin-button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="admin-button admin-button-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Mock Data Functions
function mockAgents(): Agent[] {
  return [
    { id: 1, username: 'rakesh', password: 'pass123', name: 'Rakesh', role: 'technical', status: 'online', currentSessionId: null, metrics: { chatsToday: 12, avgResponse: 5 }, skills: [] },
    { id: 2, username: 'maya', password: 'pass456', name: 'Maya', role: 'sales', status: 'online', currentSessionId: 101, metrics: { chatsToday: 8, avgResponse: 7 }, skills: [] },
    { id: 3, username: 'arjun', password: 'pass789', name: 'Arjun', role: 'support', status: 'offline', currentSessionId: null, metrics: { chatsToday: 4, avgResponse: 12 }, skills: [] },
  ];
}