import { FormEvent, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ChatbotWidget from './ChatbotWidget';
import {
  getTickets, getTicketById, getTicketAgents, getTicketMessages, getTicketFeedback, getTicketEvents,
  getAgents, createAgent, updateAgent, deleteAgent, getAgentSkills,
  getSkills, createSkill, updateSkill, deleteSkill, assignSkillToAgent, removeSkillFromAgent,
  getConversations, getAnalytics,
  type Ticket, type TicketAgent, type TicketMessage, type TicketFeedback, type TicketEvent,
  type Agent, type Skill, type Conversation, type AnalyticsData
} from '../api/ticket';
import './admin-panel.css';

type AdminPanelProps = {
  isAdmin: boolean;
  onLogin: (username: string, password: string) => { success: boolean; message?: string };
  onLogout: () => void;
};

const API_BASE = (window as any).VITE_CHATBOT_API_BASE || 'http://localhost:8000';
const CHATBOT_TOKEN = (window as any).VITE_CHATBOT_TOKEN || 'chatbot-api-token-2024';

type RoutingRule = {
  id: number;
  topic: string;
  allowedRoles: string[];
  priority: number;
  autoAssign: boolean;
};

type Session = {
  id: number;
  user: { name: string; email: string; country?: string; pastIssues?: number };
  topic: string;
  status: string;
  unread: number;
  lastMsgTime: string;
  startedAgo: string;
  messages: any[];
  duration?: number;
  assignedAgentId?: number;
};

type Template = {
  id: number;
  type: string;
  content: string;
};

export default function AdminPanel({ isAdmin, onLogin, onLogout }: AdminPanelProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Main navigation state
  const [activeSection, setActiveSection] = useState('tickets');

  // Data states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);

  // Filter states
  const [ticketFilters, setTicketFilters] = useState({
    status: '',
    priority: '',
    agent_id: '',
    category: '',
    sort_by: 'created_at',
    sort_order: 'desc' as 'asc' | 'desc'
  });

  const [agentFilters, setAgentFilters] = useState({
    is_active: '',
    role: '',
    skill_id: '',
    sort_by: 'created_at',
    sort_order: 'desc' as 'asc' | 'desc'
  });

  // Load initial data
  useEffect(() => {
    if (isAdmin) {
      loadInitialData();
    }
  }, [isAdmin]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTickets(),
        loadAgents(),
        loadSkills(),
        loadAnalytics(),
        loadConversations()
      ]);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    const filters = {
      status: ticketFilters.status || undefined,
      priority: ticketFilters.priority || undefined,
      agent_id: ticketFilters.agent_id ? Number(ticketFilters.agent_id) : undefined,
      category: ticketFilters.category || undefined,
      sort_by: ticketFilters.sort_by as 'created_at' | 'updated_at' | 'priority' | undefined,
      sort_order: ticketFilters.sort_order as 'asc' | 'desc' | undefined
    };
    const result = await getTickets(filters);
    if (result.success && result.data) {
      setTickets(result.data);
    }
  };

  const loadAgents = async () => {
    const filters = {
      is_active: agentFilters.is_active ? agentFilters.is_active === 'true' : undefined,
      role: agentFilters.role || undefined,
      skill_id: agentFilters.skill_id ? Number(agentFilters.skill_id) : undefined,
      sort_by: agentFilters.sort_by as 'created_at' | 'max_concurrent_chats' | 'total_tickets' | undefined,
      sort_order: agentFilters.sort_order as 'asc' | 'desc' | undefined
    };
    const result = await getAgents(filters);
    if (result.success && result.data) {
      setAgents(result.data);
    }
  };

  const loadSkills = async () => {
    const result = await getSkills();
    if (result.success && result.data) {
      setSkills(result.data);
    }
  };

  const loadAnalytics = async () => {
    const result = await getAnalytics();
    if (result.success && result.data) {
      setAnalytics(result.data);
    }
  };

  const loadConversations = async () => {
    const result = await getConversations();
    if (result.success && result.data) {
      setConversations(result.data);
    }
  };

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
            Enter your credentials to access the ticket management system.
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
            <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
          </aside>

          <main className="admin-panel-main">
            <Header onLogout={onLogout} />

            <div style={{ marginTop: '16px' }}>
              {loading && <div className="admin-loading">Loading...</div>}

              {activeSection === 'tickets' && (
                <TicketsPage
                  tickets={tickets}
                  agents={agents}
                  filters={ticketFilters}
                  setFilters={setTicketFilters}
                  onRefresh={loadTickets}
                />
              )}

              {activeSection === 'agents' && (
                <AgentsPage
                  agents={agents}
                  skills={skills}
                  filters={agentFilters}
                  setFilters={setAgentFilters}
                  onRefresh={loadAgents}
                />
              )}

              {activeSection === 'analytics' && (
                <AnalyticsPage analytics={analytics} agents={agents} />
              )}

              {activeSection === 'conversations' && (
                <ConversationsPage conversations={conversations} />
              )}

              {activeSection === 'alerts' && (
                <AlertsPage agents={agents} />
              )}

              {activeSection === 'skills' && (
                <SkillsPage skills={skills} onRefresh={loadSkills} />
              )}

              {activeSection === 'workflows' && (
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
type HeaderProps = { onLogout: () => void };
function Header({ onLogout }: HeaderProps) {
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
              <button className="admin-header-dropdown-btn" style={{ textAlign: 'left', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '15px' }} onClick={() => { setShowMenu(false); }}>Settings</button>
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
  activeSection: string;
  setActiveSection: (section: string) => void;
};

function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const sections = [
    { id: 'tickets', label: 'Tickets', icon: '🎫' },
    { id: 'agents', label: 'Agents', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'conversations', label: 'Conversations', icon: '💬' },
    { id: 'alerts', label: 'Alerts', icon: '🚨' },
    { id: 'skills', label: 'Skills', icon: '🛠️' },
    { id: 'workflows', label: 'Workflows', icon: '⚙️' },
  ];

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-card">
        <div style={{ marginBottom: '16px' }}>
          <h2 className="admin-sidebar-title">Real Estate CRM</h2>
          <div className="admin-sidebar-subtitle">Ticket Management System</div>
        </div>

        <ul className="admin-sidebar-list">
          {sections.map((section) => (
            <li
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`admin-sidebar-item ${activeSection === section.id ? 'active' : ''}`}
            >
              <div>
                <div className="admin-sidebar-item-label">
                  {section.icon} {section.label}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type TicketsPageProps = {
  tickets: Ticket[];
  agents: Agent[];
  filters: {
    status: string;
    priority: string;
    agent_id: string;
    category: string;
    sort_by: string;
    sort_order: 'asc' | 'desc';
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    status: string;
    priority: string;
    agent_id: string;
    category: string;
    sort_by: string;
    sort_order: 'asc' | 'desc';
  }>>;
  onRefresh: () => void;
};

function TicketsPage({ tickets, agents, filters, setFilters, onRefresh }: TicketsPageProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketDetails, setTicketDetails] = useState<{
    agents: TicketAgent[];
    messages: TicketMessage[];
    feedback: TicketFeedback[];
    events: TicketEvent[];
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadTicketDetails = async (ticketId: string) => {
    setLoadingDetails(true);
    try {
      const [agentsRes, messagesRes, feedbackRes, eventsRes] = await Promise.all([
        getTicketAgents(ticketId),
        getTicketMessages(ticketId),
        getTicketFeedback(ticketId),
        getTicketEvents(ticketId)
      ]);

      setTicketDetails({
        agents: agentsRes.data || [],
        messages: messagesRes.data || [],
        feedback: feedbackRes.data || [],
        events: eventsRes.data || []
      });
    } catch (err) {
      console.error('Error loading ticket details:', err);
      setTicketDetails({ agents: [], messages: [], feedback: [], events: [] });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleTicketClick = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await loadTicketDetails(ticket.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'waiting': return '#f59e0b';
      case 'resolved': return '#8b5cf6';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="admin-tickets-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Tickets Management</h2>
        <button onClick={onRefresh} className="admin-button admin-button-secondary">Refresh</button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="admin-filter-group">
          <label>Priority:</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="admin-filter-group">
          <label>Agent:</label>
          <select
            value={filters.agent_id}
            onChange={(e) => setFilters(prev => ({ ...prev, agent_id: e.target.value }))}
          >
            <option value="">All Agents</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.display_name}</option>
            ))}
          </select>
        </div>

        <div className="admin-filter-group">
          <label>Sort By:</label>
          <select
            value={filters.sort_by}
            onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value as any }))}
          >
            <option value="created_at">Created Date</option>
            <option value="updated_at">Updated Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        <div className="admin-filter-group">
          <label>Order:</label>
          <select
            value={filters.sort_order}
            onChange={(e) => setFilters(prev => ({ ...prev, sort_order: e.target.value as 'asc' | 'desc' }))}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="admin-tickets-grid">
        {/* Tickets List */}
        <div className="admin-tickets-list">
          <h3>Tickets ({tickets.length})</h3>
          {tickets.length === 0 ? (
            <div className="admin-empty-state">No tickets found</div>
          ) : (
            tickets.map(ticket => (
              <div
                key={ticket.id}
                className={`admin-ticket-item ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
                onClick={() => handleTicketClick(ticket)}
              >
                <div className="admin-ticket-header">
                  <div className="admin-ticket-title">{ticket.title}</div>
                  <div className="admin-ticket-id">#{ticket.id.slice(-8)}</div>
                </div>
                <div className="admin-ticket-meta">
                  <span className="admin-ticket-status" style={{ backgroundColor: getStatusColor(ticket.status) }}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className="admin-ticket-priority" style={{ color: getPriorityColor(ticket.priority) }}>
                    {ticket.priority}
                  </span>
                  <span className="admin-ticket-date">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
                {ticket.description && (
                  <div className="admin-ticket-description">{ticket.description}</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Ticket Details */}
        <div className="admin-ticket-details">
          {selectedTicket ? (
            <>
              <h3>Ticket Details</h3>
              <div className="admin-ticket-detail-card">
                <h4>{selectedTicket.title}</h4>
                <div className="admin-ticket-detail-meta">
                  <p><strong>ID:</strong> {selectedTicket.id}</p>
                  <p><strong>Status:</strong>
                    <span style={{ backgroundColor: getStatusColor(selectedTicket.status), padding: '2px 8px', borderRadius: '4px', color: 'white', marginLeft: '8px' }}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </p>
                  <p><strong>Priority:</strong>
                    <span style={{ color: getPriorityColor(selectedTicket.priority), marginLeft: '8px' }}>
                      {selectedTicket.priority}
                    </span>
                  </p>
                  <p><strong>Created:</strong> {new Date(selectedTicket.created_at).toLocaleString()}</p>
                  {selectedTicket.updated_at && (
                    <p><strong>Updated:</strong> {new Date(selectedTicket.updated_at).toLocaleString()}</p>
                  )}
                  {selectedTicket.category && <p><strong>Category:</strong> {selectedTicket.category}</p>}
                </div>
                {selectedTicket.description && (
                  <div className="admin-ticket-detail-description">
                    <strong>Description:</strong>
                    <p>{selectedTicket.description}</p>
                  </div>
                )}
              </div>

              {loadingDetails ? (
                <div className="admin-loading">Loading details...</div>
              ) : ticketDetails ? (
                <>
                  {/* Assigned Agents */}
                  <div className="admin-ticket-detail-section">
                    <h4>Assigned Agents ({ticketDetails.agents.length})</h4>
                    {ticketDetails.agents.length === 0 ? (
                      <p>No agents assigned</p>
                    ) : (
                      ticketDetails.agents.map(agent => (
                        <div key={agent.id} className="admin-agent-assignment">
                          <p><strong>{agent.agent?.display_name || 'Unknown Agent'}</strong></p>
                          <p>Status: {agent.status.replace('_', ' ')}</p>
                          <p>Assigned: {new Date(agent.created_at).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Messages */}
                  <div className="admin-ticket-detail-section">
                    <h4>Messages ({ticketDetails.messages.length})</h4>
                    {ticketDetails.messages.length === 0 ? (
                      <p>No messages</p>
                    ) : (
                      ticketDetails.messages.map(message => (
                        <div key={message.id} className="admin-message-item">
                          <div className="admin-message-header">
                            <strong>{message.sender_type}</strong>
                            <span>{new Date(message.created_at).toLocaleString()}</span>
                          </div>
                          <div className="admin-message-content">{message.content}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Feedback */}
                  <div className="admin-ticket-detail-section">
                    <h4>Feedback ({ticketDetails.feedback.length})</h4>
                    {ticketDetails.feedback.length === 0 ? (
                      <p>No feedback</p>
                    ) : (
                      ticketDetails.feedback.map(fb => (
                        <div key={fb.id} className="admin-feedback-item">
                          <div className="admin-feedback-rating">Rating: {fb.rating}/5 ⭐</div>
                          {fb.comment && <div className="admin-feedback-comment">{fb.comment}</div>}
                          <div className="admin-feedback-date">{new Date(fb.created_at).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Events */}
                  <div className="admin-ticket-detail-section">
                    <h4>Events ({ticketDetails.events.length})</h4>
                    {ticketDetails.events.length === 0 ? (
                      <p>No events</p>
                    ) : (
                      ticketDetails.events.map(event => (
                        <div key={event.id} className="admin-event-item">
                          <div className="admin-event-type">{event.event_type || 'Event'}</div>
                          <div className="admin-event-actor">Actor: {event.actor_id || 'System'}</div>
                          <div className="admin-event-date">{new Date(event.created_at).toLocaleString()}</div>
                          {event.details && (
                            <div className="admin-event-details">
                              {JSON.stringify(event.details, null, 2)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="admin-empty-state">Select a ticket to view details</div>
          )}
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
  skills: Skill[];
  filters: {
    is_active: string;
    role: string;
    skill_id: string;
    sort_by: string;
    sort_order: 'asc' | 'desc';
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    is_active: string;
    role: string;
    skill_id: string;
    sort_by: string;
    sort_order: 'asc' | 'desc';
  }>>;
  onRefresh: () => void;
};

function AgentsPage({ agents, skills, filters, setFilters, onRefresh }: AgentsPageProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    email: '',
    password: '',
    role: 'agent',
    max_concurrent_chats: 2,
    skillIds: [] as number[]
  });

  const handleCreateAgent = async () => {
    try {
      const agentData = {
        username: formData.username,
        display_name: formData.display_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        max_concurrent_chats: formData.max_concurrent_chats
      };

      const result = await createAgent(agentData);
      if (result.success) {
        // Assign skills to the new agent
        if (formData.skillIds.length > 0 && result.data) {
          await Promise.all(
            formData.skillIds.map(skillId =>
              assignSkillToAgent(result.data!.id, skillId)
            )
          );
        }
        onRefresh();
        setShowCreateModal(false);
        resetForm();
      } else {
        alert('Error creating agent: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error creating agent');
    }
  };

  const handleUpdateAgent = async () => {
    if (!editingAgent) return;

    try {
      const agentData = {
        username: formData.username,
        display_name: formData.display_name,
        email: formData.email,
        role: formData.role,
        max_concurrent_chats: formData.max_concurrent_chats
      };

      const result = await updateAgent(editingAgent.id, agentData);
      if (result.success) {
        // Update skills
        const currentSkills = editingAgent.skills?.map(s => s.id) || [];
        const skillsToAdd = formData.skillIds.filter(id => !currentSkills.includes(id));
        const skillsToRemove = currentSkills.filter(id => !formData.skillIds.includes(id));

        await Promise.all([
          ...skillsToAdd.map(skillId => assignSkillToAgent(editingAgent.id, skillId)),
          ...skillsToRemove.map(skillId => removeSkillFromAgent(editingAgent.id, skillId))
        ]);

        onRefresh();
        setShowCreateModal(false);
        setEditingAgent(null);
        resetForm();
      } else {
        alert('Error updating agent: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error updating agent');
    }
  };

  const handleDeleteAgent = async (agentId: number) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;

    try {
      const result = await deleteAgent(agentId);
      if (result.success) {
        onRefresh();
      } else {
        alert('Error deleting agent');
      }
    } catch (err) {
      alert('Error deleting agent');
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      username: agent.username,
      display_name: agent.display_name,
      email: agent.email || '',
      password: '', // Don't populate password for security
      role: agent.role,
      max_concurrent_chats: agent.max_concurrent_chats,
      skillIds: agent.skills?.map(s => s.id) || []
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      display_name: '',
      email: '',
      password: '',
      role: 'agent',
      max_concurrent_chats: 2,
      skillIds: []
    });
  };

  const toggleSkill = (skillId: number) => {
    setFormData(prev => ({
      ...prev,
      skillIds: prev.skillIds.includes(skillId)
        ? prev.skillIds.filter(id => id !== skillId)
        : [...prev.skillIds, skillId]
    }));
  };

  return (
    <div className="admin-agents-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Agent Management</h2>
        <div className="admin-page-actions">
          <button onClick={onRefresh} className="admin-button admin-button-secondary">Refresh</button>
          <button
            onClick={() => {
              setEditingAgent(null);
              resetForm();
              setShowCreateModal(true);
            }}
            className="admin-button admin-button-primary"
          >
            Create Agent
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filter-group">
          <label>Status:</label>
          <select
            value={filters.is_active}
            onChange={(e) => setFilters(prev => ({ ...prev, is_active: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="admin-filter-group">
          <label>Role:</label>
          <select
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
          >
            <option value="">All Roles</option>
            <option value="agent">Agent</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="admin-filter-group">
          <label>Skill:</label>
          <select
            value={filters.skill_id}
            onChange={(e) => setFilters(prev => ({ ...prev, skill_id: e.target.value }))}
          >
            <option value="">All Skills</option>
            {skills.map(skill => (
              <option key={skill.id} value={skill.id}>{skill.name}</option>
            ))}
          </select>
        </div>

        <div className="admin-filter-group">
          <label>Sort By:</label>
          <select
            value={filters.sort_by}
            onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value as any }))}
          >
            <option value="created_at">Created Date</option>
            <option value="max_concurrent_chats">Max Chats</option>
            <option value="total_tickets">Total Tickets</option>
          </select>
        </div>

        <div className="admin-filter-group">
          <label>Order:</label>
          <select
            value={filters.sort_order}
            onChange={(e) => setFilters(prev => ({ ...prev, sort_order: e.target.value as 'asc' | 'desc' }))}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Agents List */}
      <div className="admin-agents-list">
        {agents.length === 0 ? (
          <div className="admin-empty-state">No agents found</div>
        ) : (
          agents.map(agent => (
            <div key={agent.id} className="admin-agent-card">
              <div className="admin-agent-header">
                <div className="admin-agent-avatar">
                  {agent.display_name[0].toUpperCase()}
                </div>
                <div className="admin-agent-info">
                  <h4>{agent.display_name}</h4>
                  <p className="admin-agent-role">{agent.role}</p>
                  <p className="admin-agent-status">
                    <span className={`admin-status-indicator ${agent.is_active ? 'active' : 'inactive'}`}></span>
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              <div className="admin-agent-details">
                <div className="admin-agent-detail-item">
                  <strong>Username:</strong> {agent.username}
                </div>
                <div className="admin-agent-detail-item">
                  <strong>Email:</strong> {agent.email || 'Not set'}
                </div>
                <div className="admin-agent-detail-item">
                  <strong>Max Concurrent Chats:</strong> {agent.max_concurrent_chats}
                </div>
                <div className="admin-agent-detail-item">
                  <strong>Skills:</strong> {agent.skills && agent.skills.length > 0
                    ? agent.skills.map(s => s.name).join(', ')
                    : 'No skills assigned'}
                </div>
                {agent.metrics && (
                  <>
                    <div className="admin-agent-detail-item">
                      <strong>Total Tickets:</strong> {agent.metrics.total_tickets || 0}
                    </div>
                    <div className="admin-agent-detail-item">
                      <strong>Avg Rating:</strong> {agent.metrics.avg_rating?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="admin-agent-detail-item">
                      <strong>Avg Response Time:</strong> {agent.metrics.avg_response_time || 'N/A'}s
                    </div>
                    <div className="admin-agent-detail-item">
                      <strong>Active Chats:</strong> {agent.metrics.active_chats || 0}
                    </div>
                  </>
                )}
              </div>

              <div className="admin-agent-actions">
                <button
                  onClick={() => handleEditAgent(agent)}
                  className="admin-button admin-button-secondary"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAgent(agent.id)}
                  className="admin-button admin-button-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingAgent ? 'Edit Agent' : 'Create New Agent'}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                />
              </div>

              <div className="admin-form-group">
                <label>Display Name:</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Enter display name"
                />
              </div>

              <div className="admin-form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                />
              </div>

              {!editingAgent && (
                <div className="admin-form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
              )}

              <div className="admin-form-group">
                <label>Role:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="agent">Agent</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Max Concurrent Chats:</label>
                <input
                  type="number"
                  value={formData.max_concurrent_chats}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_concurrent_chats: Number(e.target.value) }))}
                  min="1"
                  max="10"
                />
              </div>

              <div className="admin-form-group">
                <label>Skills:</label>
                <div className="admin-skills-checkboxes">
                  {skills.map(skill => (
                    <label key={skill.id} className="admin-skill-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.skillIds.includes(skill.id)}
                        onChange={() => toggleSkill(skill.id)}
                      />
                      {skill.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                className="admin-button admin-button-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="admin-button admin-button-primary"
                onClick={editingAgent ? handleUpdateAgent : handleCreateAgent}
              >
                {editingAgent ? 'Update Agent' : 'Create Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// AnalyticsPage Component
type AnalyticsPageProps = {
  analytics: AnalyticsData | null;
  agents: Agent[];
};

function AnalyticsPage({ analytics, agents }: AnalyticsPageProps) {
  if (!analytics) {
    return <div className="admin-loading">Loading analytics...</div>;
  }

  const general = analytics.general;
  const perAgent = analytics.per_agent;

  return (
    <div className="admin-analytics-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Analytics Dashboard</h2>
      </div>

      {/* General Analytics */}
      <div className="admin-analytics-section">
        <h3>General Analytics</h3>
        <div className="admin-stats-grid">
          <StatCard title="Total Tickets" value={general.total_tickets} />
          <StatCard title="Open Tickets" value={general.open_tickets} />
          <StatCard title="Resolved Tickets" value={general.resolved_tickets} />
          <StatCard title="Avg Resolution Time" value={`${general.avg_resolution_time}s`} />
          <StatCard title="Satisfied Users" value={general.satisfied_users} />
          <StatCard title="Avg Rating" value={general.avg_rating.toFixed(1)} />
        </div>
      </div>

      {/* Per-Agent Analytics */}
      <div className="admin-analytics-section">
        <h3>Agent Performance</h3>
        {perAgent.length === 0 ? (
          <div className="admin-empty-state">No agent data available</div>
        ) : (
          <div className="admin-agents-analytics-table">
            <div className="admin-table-header">
              <div>Agent</div>
              <div>Total Tickets</div>
              <div>Resolved</div>
              <div>Avg Rating</div>
              <div>Avg Response Time</div>
              <div>Active Chats</div>
            </div>
            {perAgent.map(agent => (
              <div key={agent.agent_id} className="admin-table-row">
                <div className="admin-agent-name">{agent.agent_name}</div>
                <div>{agent.total_tickets}</div>
                <div>{agent.resolved_tickets}</div>
                <div>{agent.avg_rating.toFixed(1)}</div>
                <div>{agent.avg_response_time}s</div>
                <div>{agent.active_chats}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
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
  const availableAgents = agents.filter((a) => a.is_active); // Use is_active instead of status
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
            <option key={a.id} value={a.id}>{a.display_name} — {a.role}</option>
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
        const result = await getSkills();
        if (result.success && Array.isArray(result.data)) {
          setAvailableRoles(result.data.map((skill: Skill) => skill.name));
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

// ConversationsPage Component
function ConversationsPage({ conversations }: { conversations: Conversation[] }) {
  const [filters, setFilters] = useState({
    status: '',
    agent_id: '',
    has_feedback: '',
    rating_min: '',
    sort_by: 'created_at',
    sort_order: 'desc' as 'asc' | 'desc'
  });

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [filters]);

  const loadConversations = async () => {
    setLoading(true);
    const result = await getConversations({
      status: filters.status || undefined,
      agent_id: filters.agent_id ? Number(filters.agent_id) : undefined,
      has_feedback: filters.has_feedback ? filters.has_feedback === 'true' : undefined,
      rating_min: filters.rating_min ? Number(filters.rating_min) : undefined,
      sort_by: filters.sort_by as any,
      sort_order: filters.sort_order
    });
    if (result.success && result.data) {
      // Note: conversations state is managed at parent level
    }
    setLoading(false);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality to be implemented');
  };

  const handleChangeAgent = (conversation: Conversation) => {
    // TODO: Implement change agent functionality
    alert('Change agent functionality to be implemented');
  };

  return (
    <div className="admin-conversations-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Conversations Management</h2>
        <button onClick={handleExport} className="admin-button admin-button-secondary">Export</button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="admin-filter-group">
          <label>Agent ID:</label>
          <input
            type="text"
            value={filters.agent_id}
            onChange={(e) => setFilters(prev => ({ ...prev, agent_id: e.target.value }))}
            placeholder="Agent ID"
          />
        </div>

        <div className="admin-filter-group">
          <label>Has Feedback:</label>
          <select
            value={filters.has_feedback}
            onChange={(e) => setFilters(prev => ({ ...prev, has_feedback: e.target.value }))}
          >
            <option value="">All</option>
            <option value="true">With Feedback</option>
            <option value="false">Without Feedback</option>
          </select>
        </div>

        <div className="admin-filter-group">
          <label>Min Rating:</label>
          <input
            type="number"
            value={filters.rating_min}
            onChange={(e) => setFilters(prev => ({ ...prev, rating_min: e.target.value }))}
            placeholder="Min rating"
            min="1"
            max="5"
          />
        </div>

        <div className="admin-filter-group">
          <label>Sort By:</label>
          <select
            value={filters.sort_by}
            onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value }))}
          >
            <option value="created_at">Created Date</option>
            <option value="updated_at">Updated Date</option>
          </select>
        </div>

        <div className="admin-filter-group">
          <label>Order:</label>
          <select
            value={filters.sort_order}
            onChange={(e) => setFilters(prev => ({ ...prev, sort_order: e.target.value as 'asc' | 'desc' }))}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {loading && <div className="admin-loading">Loading conversations...</div>}

      <div className="admin-conversations-grid">
        {/* Conversations List */}
        <div className="admin-conversations-list">
          <h3>Conversations ({conversations.length})</h3>
          {conversations.length === 0 ? (
            <div className="admin-empty-state">No conversations found</div>
          ) : (
            conversations.map(conversation => (
              <div
                key={conversation.session_id}
                className={`admin-conversation-item ${selectedConversation?.session_id === conversation.session_id ? 'selected' : ''}`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="admin-conversation-header">
                  <div className="admin-conversation-title">Session {conversation.session_id.slice(-8)}</div>
                  <div className="admin-conversation-status">{conversation.status || 'Unknown'}</div>
                </div>
                <div className="admin-conversation-meta">
                  <span>Created: {conversation.created_at ? new Date(conversation.created_at).toLocaleDateString() : 'N/A'}</span>
                  {conversation.feedback && (
                    <span>Rating: {conversation.feedback.rating}/5</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Conversation Details */}
        <div className="admin-conversation-details">
          {selectedConversation ? (
            <>
              <h3>Conversation Details</h3>
              <div className="admin-conversation-detail-card">
                <h4>Session {selectedConversation.session_id}</h4>
                <div className="admin-conversation-detail-meta">
                  <p><strong>Status:</strong> {selectedConversation.status || 'Unknown'}</p>
                  <p><strong>Created:</strong> {selectedConversation.created_at ? new Date(selectedConversation.created_at).toLocaleString() : 'N/A'}</p>
                  {selectedConversation.user_id && <p><strong>User ID:</strong> {selectedConversation.user_id}</p>}
                </div>
                {selectedConversation.feedback && (
                  <div className="admin-conversation-feedback">
                    <strong>Feedback:</strong>
                    <p>Rating: {selectedConversation.feedback.rating}/5</p>
                    {selectedConversation.feedback.comment && <p>{selectedConversation.feedback.comment}</p>}
                  </div>
                )}
                {selectedConversation.ticket && (
                  <div className="admin-conversation-ticket">
                    <strong>Ticket:</strong>
                    <p>Status: {selectedConversation.ticket.status}</p>
                    <p>Title: {selectedConversation.ticket.title}</p>
                  </div>
                )}
                <button
                  onClick={() => handleChangeAgent(selectedConversation)}
                  className="admin-button admin-button-primary"
                >
                  Change Agent
                </button>
              </div>

              {/* Messages */}
              <div className="admin-conversation-messages">
                <h4>Messages</h4>
                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map((msg: any, i: number) => (
                    <div key={i} className="admin-message-item">
                      <div className="admin-message-header">
                        <strong>{msg.sender || 'Unknown'}</strong>
                        <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}</span>
                      </div>
                      <div className="admin-message-content">{msg.text || msg.content}</div>
                    </div>
                  ))
                ) : (
                  <p>No messages available</p>
                )}
              </div>
            </>
          ) : (
            <div className="admin-empty-state">Select a conversation to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}

// AlertsPage Component
function AlertsPage({ agents }: { agents: Agent[] }) {
  // Critical agents: avg rating < 3
  const criticalAgents = agents.filter(agent => 
    agent.metrics && agent.metrics.avg_rating && agent.metrics.avg_rating < 3
  );

  return (
    <div className="admin-alerts-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Alerts</h2>
      </div>

      <div className="admin-alerts-section">
        <h3>Critical Agents (Avg Rating &lt; 3)</h3>
        {criticalAgents.length === 0 ? (
          <div className="admin-empty-state">No critical agents found</div>
        ) : (
          <div className="admin-alerts-list">
            {criticalAgents.map(agent => (
              <div key={agent.id} className="admin-alert-item">
                <div className="admin-alert-header">
                  <div className="admin-alert-title">{agent.display_name}</div>
                  <div className="admin-alert-severity">Critical</div>
                </div>
                <div className="admin-alert-details">
                  <p><strong>Average Rating:</strong> {agent.metrics?.avg_rating?.toFixed(1) || 'N/A'}</p>
                  <p><strong>Total Tickets:</strong> {agent.metrics?.total_tickets || 0}</p>
                  <p><strong>Active Chats:</strong> {agent.metrics?.active_chats || 0}</p>
                  <p><strong>Response Time:</strong> {agent.metrics?.avg_response_time || 'N/A'}s</p>
                </div>
                <div className="admin-alert-actions">
                  <button className="admin-button admin-button-secondary">Review Performance</button>
                  <button className="admin-button admin-button-primary">Contact Agent</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// SkillsPage Component
function SkillsPage({ skills, onRefresh }: { skills: Skill[]; onRefresh: () => void }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  const handleCreateSkill = async () => {
    try {
      const result = await createSkill({ name: formData.name.trim() });
      if (result.success) {
        onRefresh();
        setShowCreateModal(false);
        resetForm();
      } else {
        alert('Error creating skill: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error creating skill');
    }
  };

  const handleUpdateSkill = async () => {
    if (!editingSkill) return;

    try {
      const result = await updateSkill(editingSkill.id, { name: formData.name.trim() });
      if (result.success) {
        onRefresh();
        setShowCreateModal(false);
        setEditingSkill(null);
        resetForm();
      } else {
        alert('Error updating skill: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error updating skill');
    }
  };

  const handleDeleteSkill = async (skillId: number) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;

    try {
      const result = await deleteSkill(skillId);
      if (result.success) {
        onRefresh();
      } else {
        alert('Error deleting skill');
      }
    } catch (err) {
      alert('Error deleting skill');
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
  };

  return (
    <div className="admin-skills-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Skills Management</h2>
        <button
          onClick={() => {
            setEditingSkill(null);
            resetForm();
            setShowCreateModal(true);
          }}
          className="admin-button admin-button-primary"
        >
          Create Skill
        </button>
      </div>

      <div className="admin-skills-list">
        {skills.length === 0 ? (
          <div className="admin-empty-state">No skills found</div>
        ) : (
          skills.map(skill => (
            <div key={skill.id} className="admin-skill-card">
              <div className="admin-skill-info">
                <h4>{skill.name}</h4>
              </div>
              <div className="admin-skill-actions">
                <button
                  onClick={() => {
                    setEditingSkill(skill);
                    setFormData({ name: skill.name });
                    setShowCreateModal(true);
                  }}
                  className="admin-button admin-button-secondary"
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
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingSkill ? 'Edit Skill' : 'Create New Skill'}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Skill Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter skill name"
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                className="admin-button admin-button-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="admin-button admin-button-primary"
                onClick={editingSkill ? handleUpdateSkill : handleCreateSkill}
              >
                {editingSkill ? 'Update Skill' : 'Create Skill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
