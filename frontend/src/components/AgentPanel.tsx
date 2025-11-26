import React, {useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef} from 'react'
import './agent_panel_responsive.css'
import AgentLogin from './AgentLogin'
import GeneralPopup from './GeneralPopup'
import QuickReplyModal from './QuickReplyModal'
import { format } from 'date-fns'
import { openAgentNotifierWS, openAgentChatWS, sendClaimAction, sendChatMessage, sendReleaseAction, retrieveAgentInfo, clearAgentInfo, updateAgentStatus, fetchActiveRooms, fetchAgentCurrentStatus, fetchAgentSkills, fetchAgentQuickReplies, createAgentQuickReply, deleteAgentQuickReply, updateAgentQuickReply, type AgentSkill, type AgentQuickReply } from '../api/agent'
import { ticketsApi, ticketAgentsApi } from '../api/ticketsApi'
import { agentsApi } from '../api/agentsApi'
import { conversationDetailsApi } from '../api/conversationsApi'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useTicketUpdates ,TicketEvent } from '../api/sse/sse'

const DEFAULT_ROLE_LABEL = 'Technical Agent'

// Helper function to format time in 12-hour format with AM/PM
const formatTime12Hour = (date: Date | string | number | null | undefined): string => {
  if (!date) return 'Now'
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    return format(dateObj, 'h:mm a')
  } catch (error) {
    return 'Now'
  }
}

// Helper function to format date and time in 12-hour format
const formatDateTime12Hour = (date: Date | string | number | null | undefined): string => {
  if (!date) return 'Now'
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    return format(dateObj, 'MMM d, yyyy h:mm a')
  } catch (error) {
    return 'Now'
  }
}

const CLOSED_STATUSES = ['closed', 'resolved', 'cancelled']
const OPEN_STATUSES = ['open', 'in_progress', 'assigned', 'escalated']

function normalizeStatus(status?: string | null) {
  return (status || '').toLowerCase()
}

function isClosedStatus(status?: string | null) {
  return CLOSED_STATUSES.includes(normalizeStatus(status))
}

function isWaitingStatus(status?: string | null) {
  return normalizeStatus(status) === 'waiting'
}

function isOpenStatus(status?: string | null) {
  const normalized = normalizeStatus(status)
  return OPEN_STATUSES.includes(normalized)
}

function getConversationStatusClass(status?: string | null) {
  if (isWaitingStatus(status)) return 'ticket-waiting'
  if (isClosedStatus(status)) return 'ticket-closed'
  if (isOpenStatus(status)) return 'ticket-open'
  return ''
}

function formatRoleLabel(role?: string): string {
  if (!role || typeof role !== 'string') {
    return DEFAULT_ROLE_LABEL
  }

  const normalized = role.replace(/[_-]+/g, ' ').trim()
  if (!normalized) return DEFAULT_ROLE_LABEL

  return normalized
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function normalizeAgentSkills(skills?: any): AgentSkill[] {
  if (!Array.isArray(skills)) return []

  return skills
    .map((skill: any, index: number) => {
      if (typeof skill === 'string') {
        return { id: index, name: skill }
      }
      if (skill && typeof skill.name === 'string') {
        return {
          id: typeof skill.id === 'number' ? skill.id : index,
          name: skill.name,
          proficiency: skill.proficiency,
        }
      }
      return null
    })
    .filter(Boolean) as AgentSkill[]
}

export default function AgentPanelApp({agentId = 1, onLogout}:{agentId?: number, onLogout?: () => void}){
  const [status, setStatus] = useState<string>('offline') // online, away, busy, offline
  const [statusSynced, setStatusSynced] = useState<boolean>(false)
  // Initialize with empty list so queue comes from backend active rooms + notifier
  const [sessions, setSessions] = useState<any[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string|number|null>(null)
  const wsRef = useRef<any>(null)
  const [loggedOut, setLoggedOut] = useState(false)
  const [agentProfile, setAgentProfile] = useState<any>(null)
  const [agentName, setAgentName] = useState<string>('Agent')
  const [agentRole, setAgentRole] = useState<string>(DEFAULT_ROLE_LABEL)
  const [agentSkills, setAgentSkills] = useState<AgentSkill[]>([])
  const [skillsSynced, setSkillsSynced] = useState<boolean>(false)
  const chatWsRef = useRef<WebSocket | null>(null)
  const [activeChatTicketId, setActiveChatTicketId] = useState<string | number | null>(null)
  const [quickReplyTemplates, setQuickReplyTemplates] = useState<AgentQuickReply[]>([])
  const [quickRepliesLoading, setQuickRepliesLoading] = useState<boolean>(false)
  const [quickRepliesError, setQuickRepliesError] = useState<string | null>(null)
  const [quickReplyDraft, setQuickReplyDraft] = useState<{
    id: number | null;
    category: string;
    text: string;
    formFields: { id: number; label: string; type: string; required: boolean }[];
  }>({
    id: null,
    category: '',
    text: '',
    formFields: [],
  })
  const [quickReplySubmitting, setQuickReplySubmitting] = useState<boolean>(false)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [wsConnected, setWsConnected] = useState<boolean>(false)
  const sessionRestoredRef = useRef<boolean>(false)
  const chatWindowRef = useRef<ChatWindowRef>(null)
  
  // Transfer state
  const [showTransferPopup, setShowTransferPopup] = useState<boolean>(false)
  const [transferTicketId, setTransferTicketId] = useState<string | number | null>(null)
  const [availableAgents, setAvailableAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [transferLoading, setTransferLoading] = useState<boolean>(false)
  const handlerRef = useRef<(event: TicketEvent) => void>(() => {});
  
  // Notification state
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    ticket_id?: string;
    timestamp: number;
    read: boolean;
  }>>([])
  const [showNotifications, setShowNotifications] = useState<boolean>(false)
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false)

  // General popup state
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Quick reply modal state
  const [quickReplyModalOpen, setQuickReplyModalOpen] = useState<boolean>(false);
  const [editingQuickReply, setEditingQuickReply] = useState<AgentQuickReply | null>(null);

  // Conversation history state
  const [conversationHistory, setConversationHistory] = useState<{
    [ticketId: string]: any[];
  }>({})
  const [loadingHistory, setLoadingHistory] = useState<{
    [ticketId: string]: boolean;
  }>({})

  // Persist active chat session to localStorage
  const saveActiveChatSession = useCallback((ticketId: string | number | null) => {
    if (ticketId) {
      window.localStorage.setItem('agent_active_chat_session', String(ticketId));
    } else {
      window.localStorage.removeItem('agent_active_chat_session');
    }
  }, []);

  // Retrieve active chat session from localStorage
  const getActiveChatSession = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('agent_active_chat_session');
  }, []);

  // Popup helper functions
  const showPopup = useCallback((type: 'info' | 'success' | 'warning' | 'error' | 'confirm', title: string, message: string, onConfirm?: () => void) => {
    setPopup({
      isOpen: true,
      type,
      title,
      message,
      onConfirm
    });
  }, []);

  const closePopup = useCallback(() => {
    setPopup(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showAlert = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    showPopup(type, type.charAt(0).toUpperCase() + type.slice(1), message);
  }, [showPopup]);

  const showConfirm = useCallback((message: string, onConfirm: () => void) => {
    showPopup('confirm', 'Confirm Action', message, onConfirm);
  }, [showPopup]);

  // Quick reply modal functions
  const openAddQuickReplyModal = useCallback(() => {
    setEditingQuickReply(null);
    // Force modal to reset by closing and reopening
    setQuickReplyModalOpen(false);
    setTimeout(() => {
      setQuickReplyModalOpen(true);
    }, 50);
  }, []);

  const openEditQuickReplyModal = useCallback((reply: AgentQuickReply) => {
    setEditingQuickReply(reply);
    setQuickReplyModalOpen(true);
  }, []);

  const closeQuickReplyModal = useCallback(() => {
    setQuickReplyModalOpen(false);
    setEditingQuickReply(null);
  }, []);

  const handleQuickReplySave = useCallback(async (replyData: Partial<AgentQuickReply>) => {
    if (!agentProfile?.id) {
      showAlert('Agent information not available. Please re-login.', 'error');
      return;
    }

    try {
      const payload = {
        category: replyData.category || undefined,
        template_text: replyData.template_text || '',
        form_schema: replyData.form_schema
      };
      
      if (editingQuickReply) {
        // Update existing quick reply
        await updateAgentQuickReply(agentProfile.id, editingQuickReply.id, payload);
      } else {
        // Create new quick reply
        await createAgentQuickReply(agentProfile.id, payload);
      }

      // Load quick replies after save
      const quickReplies = await fetchAgentQuickReplies(agentProfile.id);
      setQuickReplyTemplates(quickReplies || []);
      
      closeQuickReplyModal();
      showAlert(editingQuickReply ? 'Quick reply updated successfully!' : 'Quick reply added successfully!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save quick reply';
      showAlert(message, 'error');
    }
  }, [agentProfile, editingQuickReply, closeQuickReplyModal, showAlert]);

  // Auto-reconnect WebSocket with exponential backoff
  const reconnectChatWS = useCallback(async (sessionId: string | number, maxRetries = 5) => {
    const agent = retrieveAgentInfo();
    if (!agent?.id) return;

    // Set active chat ticket ID before reconnecting
    setActiveChatTicketId(sessionId);
    saveActiveChatSession(sessionId);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to reconnect to chat WS (attempt ${attempt}/${maxRetries})`);
        
        if (chatWsRef.current) chatWsRef.current.close();
        
        chatWsRef.current = openAgentChatWS(
          sessionId,
          agent.id,
          agent.display_name || agent.username || 'Agent',
          (msg) => {
            console.log('Chat message (reconnected):', msg);
            if (msg.type === 'agent_joined' || msg.type === 'agent_claimed') return;
            setSessions(prev => prev.map(s => s.id == sessionId ? {
              ...s,
              messages: [...s.messages, { sender: msg.type === 'text' || !msg.type ? 'user' : 'system', text: msg.text || JSON.stringify(msg), ts: Date.now() }]
            } : s));
          },
          (err) => {
            console.error('Chat WS error:', err);
            setWsConnected(false);
          }
        );

        // Set connection state when opened
        if (chatWsRef.current) {
          chatWsRef.current.addEventListener('open', () => {
            console.log('Chat WS reconnected successfully');
            setWsConnected(true);
          });
        }

        // Wait a bit for the connection to establish
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (chatWsRef.current?.readyState === WebSocket.OPEN) {
          console.log('Chat WS reconnected successfully');
          setWsConnected(true);
          return; // Success
        }
      } catch (err) {
        console.error(`Reconnect attempt ${attempt} failed:`, err);
      }

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, 8s
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.warn('Failed to reconnect after max retries');
    setWsConnected(false);
  }, []);

  // Load quick replies for the agent
  const loadQuickReplies = useCallback(async (agentId: number) => {
    setQuickRepliesLoading(true)
    setQuickRepliesError(null)
    try {
      const replies = await fetchAgentQuickReplies(agentId)
      setQuickReplyTemplates(replies)
    } catch (err) {
      console.error('Failed to load quick replies:', err)
      setQuickRepliesError('Failed to load quick replies')
      setQuickReplyTemplates([])
    } finally {
      setQuickRepliesLoading(false)
    }
  }, [])

  // Load ticket messages
  // Function to refresh tickets from backend
  async function refreshTickets() {
    const agent = retrieveAgentInfo();
    if (!agent?.id) return;

    try {
      // Fetch tickets assigned to this agent
      const tickets = await ticketsApi.getTicketsByAgent(agent.id, 100, 0);
      if (Array.isArray(tickets) && tickets.length > 0) {
        const mapped = tickets.map((ticket: any) => {
          // Preserve the actual ticket status from backend, but normalize for UI
          let normalizedStatus = ticket.status;
          
          return {
            id: ticket.id,
            user: { 
              name: `User ${ticket.user_id || 'Unknown'}`, 
              email: '',
              country: '',
              pastIssues: 0
            },
            topic: ticket.category || 'tech',
            status: normalizedStatus,
            unread: 0,
            lastMsgTime: ticket.created_at ? formatDateTime12Hour(ticket.created_at) : 'now',
            startedAgo: ticket.created_at ? formatDateTime12Hour(ticket.created_at) : 'just now',
            messages: [],
            messagesLoaded: false,
            loadingMessages: false,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority
          };
        });
        
        // Replace sessions with fresh data from backend
        setSessions(mapped);
        
        // If no active session, pick the most recent ticket
        if (!activeSessionId && mapped.length > 0) {
          setActiveSessionId(mapped[0].id);
        }
      }
    } catch (e) {
      console.warn('Failed to refresh tickets', e);
      // Fallback to active rooms if tickets fetch fails
      try {
        const resp = await fetchActiveRooms();
        if (resp && resp.success && Array.isArray(resp.data)) {
          const mapped = resp.data.map((r: any) => ({
            id: r.ticket_id,
            user: { name: r.user_id || 'User', email: '' },
            topic: 'tech',
            status: r.status || 'waiting',
            unread: 0,
            lastMsgTime: r.created_at || 'now',
            startedAgo: r.created_at || 'just now',
            messages: r.history || [],
            messagesLoaded: Array.isArray(r.history) && r.history.length > 0,
            loadingMessages: false
          }));
          setSessions(mapped);
          if (!activeSessionId && mapped.length > 0) {
            setActiveSessionId(mapped[0].id);
          }
        }
      } catch (fallbackErr) {
        console.warn('Failed to fetch active rooms as fallback', fallbackErr);
      }
    }
  }

  const loadConversationHistory = useCallback(async (ticketId: string | number) => {
    const ticketIdStr = String(ticketId);
    
    setLoadingHistory(prev => ({ ...prev, [ticketIdStr]: true }));
    
    try {
      const history = await conversationDetailsApi.getConversationDetailsByTicket(ticketId, 100, 0);
      
      if (Array.isArray(history) && history.length > 0) {
        // Format the conversation history
        const formattedHistory = history
          .map(item => {
            const messages = [];
            // prompt is from USER side - show on left
            if (item.prompt) {
              messages.push({
                sender: 'user',
                text: item.prompt,
                ts: item.created_at ? new Date(item.created_at).getTime() : Date.now()
              });
            }
            // output is from US - show on right
            if (item.output) {
              messages.push({
                sender: 'agent',
                text: item.output,
                ts: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
                agentName: (item as any).display_name || 'AI' // Use display_name from DB or fallback to 'AI'
              });
            }
            return messages;
          })
          .flat(); // Flatten the array of arrays
        
        setConversationHistory(prev => ({ ...prev, [ticketIdStr]: formattedHistory }));
      } else {
        // No history found
        setConversationHistory(prev => ({ ...prev, [ticketIdStr]: [] }));
      }
    } catch (err) {
      console.error('Failed to load conversation history', err);
      setConversationHistory(prev => ({ ...prev, [ticketIdStr]: [] }));
    } finally {
      setLoadingHistory(prev => ({ ...prev, [ticketIdStr]: false }));
    }
  }, []);

  useEffect(()=>{
    if (loggedOut) {
      return
    }
    let isMounted = true
    setStatusSynced(false)
    setSkillsSynced(false)
    // Read agent info from localStorage and set display name
    const agent = retrieveAgentInfo()
    setAgentProfile(agent || null)
    if (agent && agent.display_name) {
      setAgentName(agent.display_name || agent.username || 'Agent')
    }
    if (agent?.role) {
      setAgentRole(formatRoleLabel(agent.role))
    } else {
      setAgentRole(DEFAULT_ROLE_LABEL)
    }

    const storedSkills = normalizeAgentSkills(agent?.skills)
    setAgentSkills(storedSkills)
    if (storedSkills.length > 0) {
      setSkillsSynced(true)
    } else {
      ;(async () => {
        if (!agent?.id) {
          if (isMounted) setSkillsSynced(true)
          return
        }
        try {
          const skills = await fetchAgentSkills(agent.id)
          if (!isMounted) return
          setAgentSkills(skills)
        } catch (err) {
          console.error('Failed to load agent skills', err)
        } finally {
          if (isMounted) setSkillsSynced(true)
        }
      })()
    }

    const hydrateStatusFromBackend = async () => {
      if (!agent?.id) {
        setStatusSynced(true)
        return
      }
      try {
        const backendStatus = await fetchAgentCurrentStatus(agent.id)
        if (!isMounted) return
        if (backendStatus) {
          setStatus(backendStatus)
        } else if (typeof agent.is_active === 'boolean') {
          setStatus(agent.is_active ? 'online' : 'offline')
        }
      } catch (err) {
        console.error('Failed to load agent status from backend', err)
        if (!isMounted) return
        if (typeof agent?.is_active === 'boolean') {
          setStatus(agent.is_active ? 'online' : 'offline')
        }
      } finally {
        if (isMounted) {
          setStatusSynced(true)
        }
      }
    }

    hydrateStatusFromBackend()

    if (agent?.id) {
      loadQuickReplies(agent.id)
    } else {
      setQuickReplyTemplates([])
    }

    // Connect notifier websocket for agent notifications (ticket claims)
    if (agent && agent.id) {
      wsRef.current = openAgentNotifierWS(
        agent.id,
        (msg) => {
          console.log('Notifier message received:', msg)
          // Handle ticket claimed notifications
          if (msg.type === 'ticket_claimed') {
            setSessions(prev => prev.map(s => s.id === msg.ticket_id ? { ...s, status: 'assigned' } : s))
          }
        },
        (err) => console.error('Notifier error:', err)
      )
    }

    // Fetch tickets assigned to this agent from backend
    (async () => {
      if (!agent?.id) return
      try {
        // Fetch tickets assigned to this agent
        const tickets = await ticketsApi.getTicketsByAgent(agent.id, 100, 0)
        if (Array.isArray(tickets) && tickets.length > 0) {
          const mapped = tickets.map((ticket: any) => {
            // Check if this ticket is the saved active session
            const savedSessionId = getActiveChatSession();
            const isSavedSession = savedSessionId && String(ticket.id) === String(savedSessionId);
            
            // Preserve the actual ticket status from backend, but normalize for UI
            let normalizedStatus = ticket.status;
            
            return {
              id: ticket.id,
              user: { 
                name: `User ${ticket.user_id || 'Unknown'}`, 
                email: '',
                country: '',
                pastIssues: 0
              },
              topic: ticket.category || 'tech',
              status: normalizedStatus,
              unread: 0,
              lastMsgTime: ticket.created_at ? formatDateTime12Hour(ticket.created_at) : 'now',
              startedAgo: ticket.created_at ? formatDateTime12Hour(ticket.created_at) : 'just now',
              messages: [],
              messagesLoaded: false,
              loadingMessages: false,
              title: ticket.title,
              description: ticket.description,
              priority: ticket.priority
            };
          })
          
          // Merge with any existing sessions, dedupe by id
          // Preserve existing session status if it's active (not closed)
          setSessions(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const merged = mapped.map(newSession => {
              const existing = prev.find(p => p.id === newSession.id)
              // If existing session is active (not closed), preserve its status
              if (existing && !isClosedStatus(existing.status) && isClosedStatus(newSession.status)) {
                console.log('Preserving active session status for ticket:', newSession.id);
                return { ...newSession, status: existing.status }
              }
              return newSession
            })
            return [...merged, ...prev.filter(p=>!existingIds.has(p.id))]
          })
          
          // If no active session, pick the most recent ticket
          if (!activeSessionId && mapped.length > 0) {
            setActiveSessionId(mapped[0].id)
          }
        }
      } catch (e) {
        console.warn('Failed to fetch tickets by agent', e)
        // Fallback to active rooms if tickets fetch fails
        try {
          const resp = await fetchActiveRooms()
          if (resp && resp.success && Array.isArray(resp.data)) {
            const mapped = resp.data.map((r: any) => ({
              id: r.ticket_id,
              user: { name: r.user_id || 'User', email: '' },
              topic: 'tech',
              status: r.status || 'waiting',
              unread: 0,
              lastMsgTime: r.created_at || 'now',
              startedAgo: r.created_at || 'just now',
              messages: r.history || [],
              messagesLoaded: Array.isArray(r.history) && r.history.length > 0,
              loadingMessages: false
            }))
            setSessions(prev => {
              const existingIds = new Set(prev.map(p => p.id))
              const merged = [...mapped, ...prev.filter(p=>!existingIds.has(p.id))]
              return merged
            })
            if (!activeSessionId && mapped.length > 0) {
              setActiveSessionId(mapped[0].id)
            }
          }
        } catch (fallbackErr) {
          console.warn('Failed to fetch active rooms as fallback', fallbackErr)
        }
      }
    })()

    return ()=>{
      isMounted = false
      if(wsRef.current) wsRef.current.close()
      // Only close chatWsRef if agent explicitly ends chat
      // Do not close chatWsRef on page reload, so connection persists
      // if(chatWsRef.current) chatWsRef.current.close()
    }
  },[agentId, loggedOut, loadQuickReplies])

  useEffect(() => {
    handlerRef.current = async (event: TicketEvent) => {
      const agent = retrieveAgentInfo();
      if (!agent?.id) return;

      // 1️⃣ Agent-based filtering
      if (event.assigned_agent_id) {
        if (Number(event.assigned_agent_id) !== Number(agent.id)) {
          console.log("Ignoring event for another agent:", event.assigned_agent_id);
          return;
        }
      } else {
        // 2️⃣ Allow CREATED/UPDATED even if session missing
        if (!["TICKET_CREATED", "TICKET_UPDATED"].includes(event.type)) {
          const existsInCurrentList = sessions.some(
            (session) => String(session.id) === String(event.ticket_id)
          );

          if (!existsInCurrentList) {
            console.log("Ignoring SSE event: ticket not in list:", event.ticket_id);
            return;
          }
        }
      }

      console.log("SSE event relevant:", event);

      // 3️⃣ Add notification
      const newNotification = {
        id: `${event.type}_${event.ticket_id}_${Date.now()}`,
        type: event.type,
        ticket_id: event.ticket_id,
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]);

      // 4️⃣ Refresh tickets
      try {
        const tickets = await ticketsApi.getTicketsByAgent(agent.id, 100, 0);

        if (Array.isArray(tickets)) {
          const mapped = tickets.map((ticket: any) => ({
            id: ticket.id,
            user: { name: `User ${ticket.user_id || "Unknown"}`, email: "", country: "", pastIssues: 0 },
            topic: ticket.category || "tech",
            status: ticket.status,
            unread: 0,
            lastMsgTime: formatDateTime12Hour(ticket.created_at),
            startedAgo: formatDateTime12Hour(ticket.created_at),
            messages: [],
            messagesLoaded: false,
            loadingMessages: false,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
          }));

          setSessions(() => mapped);

          if (!activeSessionId && mapped.length > 0) {
            setActiveSessionId(mapped[0].id);
          }
        }
      } catch (e) {
        console.warn("Failed to refresh tickets", e);
      }
    };
  }, [sessions, activeSessionId]);

  useTicketUpdates((event) => handlerRef.current(event));

  // Restore active chat session from localStorage after page reload
  useEffect(() => {
    if (loggedOut || sessionRestoredRef.current) return;
    
    const savedSessionId = getActiveChatSession();
    if (!savedSessionId) {
      sessionRestoredRef.current = true; // Mark as processed even if no session
      return;
    }

    const agent = retrieveAgentInfo();
    if (!agent?.id) return;

    // Wait for sessions to be loaded before restoring
    const restoreSession = async () => {
      // Check if the session exists in the sessions list
      const session = sessions.find(s => String(s.id) === String(savedSessionId));
      
      if (session) {
        // Only skip restore if session is explicitly closed in UI (not from backend check)
        // Trust localStorage - if user was in a chat, restore it
        if (isClosedStatus(session.status)) {
          console.log('Session is marked as closed in UI, skipping restore');
          // But don't clear from storage yet - might be a false positive
          // Only clear if we're absolutely sure
          sessionRestoredRef.current = true;
          return;
        }
        
        console.log('Restoring active chat session:', savedSessionId, 'Session status:', session.status);
        sessionRestoredRef.current = true; // Mark as restored to prevent multiple restorations
        
        // Set as active session FIRST before any async operations
        setActiveSessionId(savedSessionId);
        
        // Ensure session status is not closed (defensive check)
        setSessions(prev => prev.map(s => {
          if (s.id == savedSessionId && isClosedStatus(s.status)) {
            // If somehow marked as closed, restore to assigned
            console.log('Session was marked closed, restoring to assigned status');
            return { ...s, status: 'assigned' };
          }
          return s;
        }));
        
        // Load messages if not already loaded
        if (!session.messagesLoaded && !session.loadingMessages) {
          await loadConversationHistory(savedSessionId);
        }
        
        // Reconnect to the chat WebSocket
        await reconnectChatWS(savedSessionId);
      } else if (sessions.length > 0) {
        // Sessions are loaded but saved session not found
        // Try to fetch the ticket directly from backend
        try {
          const ticket = await ticketsApi.getTicket(String(savedSessionId));
          if (ticket && !isClosedStatus(ticket.status)) {
            // Ticket exists and is not closed, add it to sessions
            console.log('Ticket found in backend, adding to sessions:', savedSessionId);
            let normalizedStatus: string = ticket.status;
            
            const newSession = {
              id: ticket.id,
              user: { 
                name: `User ${ticket.user_id || 'Unknown'}`, 
                email: '',
                country: '',
                pastIssues: 0
              },
              topic: ticket.category || 'tech',
              status: normalizedStatus,
              unread: 0,
              lastMsgTime: ticket.created_at ? formatDateTime12Hour(ticket.created_at) : 'now',
              startedAgo: ticket.created_at ? formatDateTime12Hour(ticket.created_at) : 'just now',
              messages: [],
              messagesLoaded: false,
              loadingMessages: false,
              title: ticket.title,
              description: ticket.description,
              priority: ticket.priority
            };
            
            setSessions(prev => {
              const exists = prev.some(s => s.id == savedSessionId);
              if (!exists) {
                return [...prev, newSession];
              }
              return prev;
            });
            
            setActiveSessionId(savedSessionId);
            await loadConversationHistory(savedSessionId);
            await reconnectChatWS(savedSessionId);
            sessionRestoredRef.current = true;
            return;
          } else if (ticket && isClosedStatus(ticket.status)) {
            console.log('Ticket is closed on backend, clearing from storage');
            saveActiveChatSession(null);
            sessionRestoredRef.current = true;
            return;
          }
        } catch (err) {
          console.warn('Failed to fetch ticket from backend, clearing from storage', err);
        }
        
        // If we get here, session not found and couldn't restore from backend
        console.log('Saved session not found in sessions list, clearing from storage');
        saveActiveChatSession(null);
        sessionRestoredRef.current = true;
      }
    };

    // Only restore if we have sessions loaded
    // Wait a bit to ensure sessions are fully loaded and statuses are set
    const timeoutId = setTimeout(() => {
      if (sessions.length > 0) {
        restoreSession();
      } else {
        // If still no sessions after delay, mark as processed
        sessionRestoredRef.current = true;
      }
    }, 1500); // Increased delay to ensure sessions are fully loaded

    return () => clearTimeout(timeoutId);
  }, [sessions.length, loggedOut, getActiveChatSession, saveActiveChatSession, reconnectChatWS, loadConversationHistory])

  // Handle WebSocket reconnection on unexpected disconnection
  useEffect(() => {
    if (!activeChatTicketId || !chatWsRef.current) return;

    const ws = chatWsRef.current;
    
    const handleClose = () => {
      // Only reconnect if it wasn't explicitly closed (end chat)
      // Check if the session is still active
      const session = sessions.find(s => s.id === activeChatTicketId);
      if (session && !isClosedStatus(session.status)) {
        console.log('Chat WS closed unexpectedly, attempting to reconnect...');
        reconnectChatWS(activeChatTicketId);
      }
    };

    const handleError = () => {
      console.error('Chat WS error, will attempt reconnect on close');
      setWsConnected(false);
    };

    ws.addEventListener('close', handleClose);
    ws.addEventListener('error', handleError);

    return () => {
      ws.removeEventListener('close', handleClose);
      ws.removeEventListener('error', handleError);
    };
  }, [activeChatTicketId, reconnectChatWS, sessions])

  function handleWS(msg: any){
    // handle incoming messages: new assignment, user msg, system
    // example:
    // if(msg.type === 'assignment') setSessions(prev => [msg.session,...prev])
  }

  async function setAgentStatus(nextStatus: string){
    const previousStatus = status
    setStatus(nextStatus)

    const agent = retrieveAgentInfo()
    if (!agent?.id) {
      console.warn('No agent info available to sync status')
      return
    }

    try {
      await updateAgentStatus(agent.id, nextStatus, { previous_status: previousStatus })
    } catch (err) {
      console.error('Failed to persist agent status', err)
      // revert UI if backend update fails
      setStatus(previousStatus)
      showAlert('Unable to update your status right now. Please try again.', 'error')
    }
  }


    function handleOpenNext() {
    if (!activeSessionId || sessions.length === 0) return;

    // Find index of current active session
    const currentIndex = sessions.findIndex(
      (s) => s.id == activeSessionId
    );

    // If found and there is a next one
    if (currentIndex !== -1 && currentIndex < sessions.length - 1) {
        const nextSession = sessions[currentIndex + 1];
        setActiveSessionId(nextSession.id);
    } else {
        showAlert("No more chats in the queue.", 'info');
    }
    }

  function handleMarkAway() {
    setAgentStatus('away');
  }

//   function handleViewReports() {
//     // Placeholder: show alert, replace with modal if needed
//     alert('Reports feature coming soon!');
//   }

  async function handleLogout() {
    const agent = retrieveAgentInfo()
    if (agent?.id) {
      try {
        await updateAgentStatus(agent.id, 'offline', { source: 'agent_panel_logout', previous_status: status })
      } catch (err) {
        console.error('Failed to mark agent offline on logout', err)
      }
    }
    // Close all connections on logout
    if(chatWsRef.current) {
      chatWsRef.current.close()
      chatWsRef.current = null
    }
    setLoggedOut(true)
    setStatus('offline')
    setSessions([])
    setActiveSessionId(null)
    setActiveChatTicketId(null)
    saveActiveChatSession(null)
    sessionRestoredRef.current = false // Reset for next login
    clearAgentInfo()
    if (onLogout) onLogout()
  }

  async function openSession(id: string|number){
    setActiveSessionId(id)
    // Always load conversation history (this includes both current and historical messages)
    await loadConversationHistory(id)
  }

  async function handleResumeChat(sessionId: string | number) {
    await openSession(sessionId)
    await openChatForSession(sessionId)
  }

  async function handleEndChatFromList(sessionId: string | number) {
    await openSession(sessionId)
    if (activeChatTicketId !== sessionId) {
      await openChatForSession(sessionId)
    }
    await endChatSession(sessionId)
  }

  function sendMessageToSession(sessionId: string|number, text: string){
    // Send via chat websocket if connected
    const targetSession = sessions.find(s => s.id == sessionId)
    if (!targetSession || isClosedStatus(targetSession.status)) {
      showAlert('Ticket is closed. You cannot send messages.', 'warning')
      return
    }
    if (isWaitingStatus(targetSession.status)) {
      showAlert('You must claim this ticket before sending messages.', 'warning')
      return
    }
    if(activeChatTicketId == sessionId && chatWsRef.current){
      sendChatMessage(chatWsRef.current, text)
    }
    // Add to local session messages for display
    let displayText = text
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object' && parsed.type === 'form_quick_reply') {
        displayText = parsed.heading || 'Form sent'
      }
    } catch {
      // Not JSON, keep original text
    }
    const agentMessage = {type: "message", sender:'agent', text: displayText, ts: Date.now()}
    setSessions(prev => prev.map(s => s.id == sessionId ? {...s, messages: [...s.messages, agentMessage]} : s))
    
    // Also update conversationHistory to keep ChatWindow in sync
    setConversationHistory(prev => ({
      ...prev,
      [String(sessionId)]: [...(prev[String(sessionId)] || []), agentMessage]
    }))
  }
  async function claimSession(sessionId: string|number){
    const agent = retrieveAgentInfo()
    if (!agent) return
    
    // Set agent status to busy immediately when claiming a session
    try {
      await updateAgentStatus(agent.id, 'busy', { source: 'agent_panel_claim_session', previous_status: status })
      setStatus('busy')
    } catch (err) {
      console.error('Failed to mark agent busy when claiming session', err)
    }

    if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
      try{
        sendClaimAction(wsRef.current, sessionId)
        // Auto open the chat window when claiming
        await openSession(sessionId)
        await openChatForSession(sessionId)
        setSessions((prev: any[]) => prev.map(s => s.id == sessionId ? { ...s, status: 'assigned' } : s))
        
        // Refresh tickets to get updated list from backend
        await refreshTickets()
      }catch(e){
        console.error('Failed to claim session', e)
      }
    } else {
      showAlert('Not connected to agent notifier websocket', 'error')
    }
  }

  async function openChatForSession(sessionId: string | number) {
  const agent = retrieveAgentInfo();
  if (!agent) return;

  // Set agent status to busy
  try {
    await updateAgentStatus(agent.id, 'busy', {
      source: 'agent_panel_open_chat',
      previous_status: status,
    });
    setStatus('busy');
  } catch (err) {
    console.error('Failed to mark agent busy when opening chat', err);
  }

  // Close WS if for different session
  if (chatWsRef.current && activeChatTicketId !== sessionId) {
    chatWsRef.current.close();
  }

  // Already connected?
  if (
    chatWsRef.current &&
    activeChatTicketId === sessionId &&
    chatWsRef.current.readyState === WebSocket.OPEN
  ) {
    console.log('Already connected to this session');
    return;
  }

  chatWsRef.current = openAgentChatWS(
    sessionId,
    agent.id,
    agent.display_name || agent.username || 'Agent',

    // ================================
    // 🔥 FINAL REAL FIXED HANDLER
    // ================================
    (msg) => {
      console.log("🔥 UI HANDLER: RAW WS MESSAGE:", msg);

      // 🔥 1) Normalize message (object or string)
      let data: any = null;

      if (typeof msg === "string") {
        try {
          data = JSON.parse(msg);
        } catch (e) {
          console.log("🔥 UI HANDLER: Agent raw text message:", msg);
          data = { type: "message", sender: "agent", text: msg, ts: Date.now() };
        }
      } else if (typeof msg === "object" && msg !== null) {
        console.log("🔥 UI HANDLER: WS message is already object:", msg);
        data = msg; // user messages come here!!
      } else {
        console.warn("🔥 UI HANDLER: Unknown WS message format:", msg);
        return;
      }

      console.log("🔥 UI HANDLER: PARSED DATA:", data);

      // 🔥 IGNORE system events
      if (data.type === "agent_joined" || data.type === "agent_claimed") {
        console.log("🔥 UI HANDLER: Ignoring system event:", data.type);
        return;
      }

      // 🔥 2) HISTORY BLOCK
      if (data.type === "message_history" && data.message) {
        const h = data.message;
        const historyMsg = {
          type: "message",
          sender:
            (h.sender_type || "").toLowerCase() === "agent" ? "agent" : "user",
          text: h.content || "",
          ts: h.created_at ? new Date(h.created_at).getTime() : Date.now(),
        };

        console.log("🔥 UI HANDLER: RENDER HISTORY:", historyMsg);

        setSessions((prev) =>
          prev.map((s) =>
            s.id == sessionId
              ? {
                  ...s,
                  messages: [...s.messages, historyMsg],
                  messagesLoaded: true,
                }
              : s
          )
        );

        return;
      }

      // 🔥 3) LIVE MESSAGE (USER OR AGENT)
      const liveMessage = {
        type: "message",
        sender: data.sender === "user" ? "user" : "agent",
        text: data.text || data.content || "",
        ts: data.ts || (data.created_at ? new Date(data.created_at).getTime() : Date.now()),
      };

      console.log("🔥 UI HANDLER: RENDER LIVE MESSAGE:", liveMessage);

      // UI add
      if (chatWindowRef.current) {
        chatWindowRef.current.addLiveMessage(liveMessage);
      }

      // Update in sessions list
      setSessions((prev) =>
        prev.map((s) =>
          s.id == sessionId
            ? { ...s, messages: [...s.messages, liveMessage] }
            : s
        )
      );

      // Update in conversationHistory
      setConversationHistory((prev) => ({
        ...prev,
        [String(sessionId)]: [
          ...(prev[String(sessionId)] || []),
          liveMessage,
        ],
      }));
    },

    (err) => {
      console.error("Chat error:", err);
      setWsConnected(false);
    }
  );

  if (chatWsRef.current) {
    chatWsRef.current.addEventListener("open", () => {
      console.log("Chat WS opened successfully");
      setWsConnected(true);
    });
  }

  setActiveChatTicketId(sessionId);
  saveActiveChatSession(sessionId);
}

  function releaseChatSession(){
    if(activeChatTicketId && chatWsRef.current){
      sendReleaseAction(chatWsRef.current, activeChatTicketId)
      chatWsRef.current.close()
      chatWsRef.current = null
      setActiveChatTicketId(null)
      saveActiveChatSession(null)
    }
    // Clear active session when releasing
    setActiveSessionId(null)
  }

  // End chat and allow user to chat with AI again
  async function endChatSession(ticketId?: string | number) {
    const closingTicketId = ticketId ?? activeChatTicketId
    
    // Show confirmation popup
    showConfirm('Are you sure you want to end this chat? The user will be able to chat with AI again.', async () => {
      if (closingTicketId) {
        try {
          await ticketsApi.closeTicket(closingTicketId.toString()); // Call the new API to close the ticket
        } catch (err) {
          console.error('Failed to close ticket:', err)
        }
      }
      releaseChatSession();
      
      // Refresh tickets to get updated list from backend
      await refreshTickets()

      const agent = retrieveAgentInfo();
      if (agent?.id) {
        try {
          // Check if there are any active chats after ending this one
          const activeChats = sessions.filter(s => s.id !== closingTicketId && !isClosedStatus(s.status));
          
          if (activeChats.length === 0) {
            // No active chats, change status to online
            await updateAgentStatus(agent.id, 'online', { source: 'agent_panel_end_chat', previous_status: status });
            setStatus('online');
          } else {
            // Still have active chats, keep as busy
            await updateAgentStatus(agent.id, 'busy', { source: 'agent_panel_end_chat', previous_status: status });
          }
        } catch (err) {
          console.error('Failed to update agent status after ending chat', err);
        }
      }

      // Persist ticket closed status to backend if API available
      try {
        if (closingTicketId && ticketsApi?.updateTicket) {
          await ticketsApi.updateTicket({ id: String(closingTicketId), status: 'closed' });
        }
      } catch (err) {
        console.warn('Failed to persist closed status to backend', err);
      }

      if (closingTicketId) {
        setSessions(prev => prev.map(s => s.id == closingTicketId ? { ...s, status: 'closed' } : s));
      }

      showAlert('Chat ended. User can now chat with AI again.', 'success');
    });
  }

  function resetQuickReplyDraft() {
    setQuickReplyDraft({ id: null, category: '', text: '', formFields: [] })
  }

  function startQuickReplyEdit(reply: AgentQuickReply) {
    const existingFields = Array.isArray((reply as any).form_schema?.fields)
      ? (reply as any).form_schema.fields.map((f: any, idx: number) => ({
          id: idx + 1,
          label: f.label || '',
          type: f.type || 'text',
          required: Boolean(f.required),
        }))
      : []

    setQuickReplyDraft({
      id: reply.id,
      category: reply.category || '',
      text: reply.template_text,
      formFields: existingFields,
    })
  }

  async function handleSaveQuickReply(event?: React.FormEvent<HTMLFormElement>) {
    if (event) {
      event.preventDefault()
    }
    if (!agentProfile?.id) {
      showAlert('Agent information not available. Please re-login.', 'error')
      return
    }
    if (!quickReplyDraft.text.trim()) {
      showAlert('Please enter a quick reply message.', 'warning')
      return
    }

    let formSchema: any | undefined
    if (quickReplyDraft.category === 'Form') {
      const validFields = quickReplyDraft.formFields.filter(f => f.label.trim())
      if (validFields.length === 0) {
        showAlert('Please add at least one form field or choose a different category.', 'warning')
        return
      }
      formSchema = {
        fields: validFields.map(f => ({
          label: f.label.trim(),
          type: f.type || 'text',
          required: f.required,
        })),
      }
    }
    setQuickReplySubmitting(true)
    try {
      if (quickReplyDraft.id) {
        // Update existing quick reply
        await updateAgentQuickReply(agentProfile.id, quickReplyDraft.id, {
          category: quickReplyDraft.category.trim() || null,
          template_text: quickReplyDraft.text.trim(),
          form_schema: formSchema,
        })
      } else {
        // Create new quick reply
        await createAgentQuickReply(agentProfile.id, {
          category: quickReplyDraft.category.trim() || null,
          template_text: quickReplyDraft.text.trim(),
          form_schema: formSchema,
        })
      }

      await loadQuickReplies(agentProfile.id)
      resetQuickReplyDraft()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save quick reply'
      showAlert(message, 'error')
    } finally {
      setQuickReplySubmitting(false)
    }
  }

  async function handleDeleteQuickReply(replyId: number) {
    if (!agentProfile?.id) {
      showAlert('Agent information not available. Please re-login.', 'error')
      return
    }
    
    // Use confirmation popup instead of window.confirm
    showConfirm('Delete this quick reply? This action cannot be undone.', async () => {
      try {
        await deleteAgentQuickReply(agentProfile.id, replyId)
        setQuickReplyTemplates(prev => prev.filter(reply => reply.id !== replyId))
        showAlert('Quick reply deleted successfully!', 'success')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete quick reply'
        showAlert(message, 'error')
      }
    });
  }

  // Transfer functions
  async function loadAvailableAgents() {
    try {
      const agents = await agentsApi.getAvailableAgents()
      const currentAgent = retrieveAgentInfo()
      // Filter out current agent from available agents
      const filteredAgents = agents.filter(agent => agent.id !== currentAgent?.id)
      setAvailableAgents(filteredAgents)
    } catch (err) {
      console.error('Failed to load available agents:', err)
      setAvailableAgents([])
    }
  }

  function openTransferPopup(ticketId: string | number) {
    setTransferTicketId(ticketId)
    setShowTransferPopup(true)
    setSelectedAgent(null)
    loadAvailableAgents()
  }

  function closeTransferPopup() {
    setShowTransferPopup(false)
    setTransferTicketId(null)
    setSelectedAgent(null)
    setAvailableAgents([])
  }

  async function handleTransfer() {
    if (!selectedAgent || !transferTicketId) return
    
    setTransferLoading(true)
    try {
      const agent = retrieveAgentInfo()
      
      // 1️⃣ First, change ticket status to "waiting" before transfer
      await ticketsApi.updateTicket({
        id: String(transferTicketId),
        status: 'waiting'
      })
      
      // 2️⃣ Update ticket agent assignment to new agent
      await ticketAgentsApi.updateTicketAgent({
        ticket_id: String(transferTicketId),
        assigned_agent_id: selectedAgent.id,
        actor_id: agent?.id
      })

      // Update the session status to show it's transferred
      setSessions(prev => prev.map(session => 
        session.id === transferTicketId 
          ? { ...session, status: 'waiting', transferred: true }
          : session
      ))

      // If this was the active chat, close it and remove from active
      if (activeSessionId === transferTicketId) {
        setActiveSessionId(null)
        setActiveChatTicketId(null)
        saveActiveChatSession(null)
        if(chatWsRef.current) {
          chatWsRef.current.close()
          chatWsRef.current = null
        }
      }

      // Show success message
      showAlert('Ticket transferred successfully!', 'success')
      closeTransferPopup()
      
      // Refresh tickets to get updated list from backend
      await refreshTickets()
    } catch (err) {
      console.error('Transfer failed:', err)
      showAlert('Failed to transfer ticket. Please try again.', 'error')
    } finally {
      setTransferLoading(false)
    }
  }

  // Notification functions
  function dismissNotification(notificationId: string) {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  function markAllAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function getUnreadCount() {
    return notifications.filter(n => !n.read).length
  }

  function formatTimestamp(timestamp: number) {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return formatDateTime12Hour(timestamp)
  }

  // Update agent status based on active tickets
  useEffect(() => {
    const hasActiveTicket = sessions.some(s => !isClosedStatus(s.status) && s.status !== 'waiting')
    const currentAgent = retrieveAgentInfo()
    
    if (!currentAgent) return // Skip if agent not logged in
    
    const updateStatus = async () => {
      try {
        if (hasActiveTicket && status !== 'busy') {
          // Change to busy if we have active tickets and not already busy
          await updateAgentStatus(currentAgent.id, 'busy', { 
            source: 'agent_panel_active_tickets', 
            previous_status: status 
          })
          setStatus('busy')
          console.log('Agent status changed to busy - has active tickets')
        } else if (!hasActiveTicket && status !== 'online') {
          // Change to online if no active tickets and not already online
          await updateAgentStatus(currentAgent.id, 'online', { 
            source: 'agent_panel_no_active_tickets', 
            previous_status: status 
          })
          setStatus('online')
          console.log('Agent status changed to online - no active tickets')
        }
      } catch (err) {
        console.error('Failed to update agent status:', err)
      }
    }
    
    updateStatus()
  }, [sessions, status])

  const activeSession = sessions.find(s => s.id == activeSessionId)
  const waitingCount = sessions.filter((s: any)=>s.status==='waiting').length
  const totalTicketsCount = sessions.length
  const nonClosedTicketsCount = sessions.filter((s: any)=>!isClosedStatus(s.status)).length
  const quickReplyOptions = quickReplyTemplates

  if (loggedOut) {
    return <AgentLogin onLogin={async (loginData: any) => {
      setLoggedOut(false)
      setStatus('online')
      // Clear current sessions; they will be populated from backend (active rooms + notifier)
      setSessions([])
      setActiveSessionId(null)
      setAgentName(loginData?.username || 'Agent')

      if (loginData?.id) {
        try {
          await updateAgentStatus(loginData.id, 'online', { source: 'agent_panel_login' })
        } catch (err) {
          console.error('Failed to sync agent status on login', err)
        }
      }

      return { success: true }
    }} />
  }

  return (
    <div className="agent-panel">
      {/* Navigation Bar */}
      <div className="agent-navbar agent-navbar">
        <div className="agent-navbar__inner">
          <div className="agent-navbar__brand">
            <img src={logo} alt="RealEstate CRM" className="agent-navbar__logo" />
            <span className="agent-navbar__brandName">RealEstate CRM</span>
          </div>

          <div className="agent-navbar__title">
            <h1>Agent Workspace</h1>
          </div>

          <div className="agent-navbar__meta">
            {/* Mobile Sidebar Toggle */}
            <button 
              className="notification-bell"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              style={{display: 'none'}}
              id="mobile-sidebar-toggle"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
            
            {/* Notifications */}
            <div className="notification-container">
              <button 
                className="notification-bell"
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  markAllAsRead()
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    <button 
                      className="notification-close"
                      onClick={() => setShowNotifications(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">No notifications</div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        >
                          <div className="notification-content">
                            <div className="notification-title">{notification.type}</div>
                            {notification.ticket_id && (
                              <div className="notification-ticket">Ticket #{notification.ticket_id}</div>
                            )}
                            <div className="notification-time">
                              {formatTimestamp(notification.timestamp)}
                            </div>
                          </div>
                          <button 
                            className="notification-dismiss"
                            onClick={() => dismissNotification(notification.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout - 3 Columns: 20% | 30% | 50% */}
      <div className="agent-grid">
        {/* Left Column (20%) - Agent Profile + Quick Replies */}
        <div className="left-column">
          {/* Agent Profile Section */}
          <div className="agent-profile">
            <div className="profile-header">
              <div className="profile-avatar">
                {agentName.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h2 className="profile-name">{agentName}</h2>
                <p className="profile-role">{agentRole}</p>
                <p className="profile-id">Agent ID: #{agentId}</p>
              </div>
            </div>
            
            <div className="profile-status">
              <span className="status-label">Status:</span>
              <span className={`status-indicator ${statusSynced ? status : 'offline'}`}>
                {statusSynced ? status : 'syncing...'}
              </span>
            </div>
            
            <div className="profile-actions">
              <select
                className="profile-select"
                value={status}
                onChange={e => setAgentStatus(e.target.value)}
              >
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
              <button className="logout-button modal-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          {/* Quick Replies Section */}
          <div className="quick-replies-section">
            <div className="section-title">
              <span>Quick Replies</span>
              {quickReplyTemplates.length > 0 && (
                <span className="ticket-count">{quickReplyTemplates.length}</span>
              )}
            </div>
            <p className="card-subtitle">Add canned responses to speed up replies.</p>
            
            {/* Quick Reply Action Buttons */}
            <div className="quick-reply-actions">
              <button 
                className="quick-reply-action-btn add-btn" 
                onClick={openAddQuickReplyModal}
              >
                Add Replies
              </button>
              
            </div>
            
            {quickRepliesError && <div className="quick-reply-error">{quickRepliesError}</div>}
            <div className="quick-replies-list">
              {quickRepliesLoading && <p className="card-subtitle">Loading quick replies…</p>}
              {!quickRepliesLoading && quickReplyTemplates.length === 0 && (
                <p className="card-placeholder">No quick replies yet.</p>
              )}
              {!quickRepliesLoading &&
                quickReplyTemplates.map(reply => (
                  <div key={reply.id} className="quick-reply-item">
                    <div>
                      {reply.category && <span className="quick-reply-category">{reply.category}</span>}
                      <p className="quick-reply-text">{reply.template_text}</p>
                    </div>
                    <div className="quick-reply-item-actions">
                      <button className="quick-reply-edit" type="button" onClick={() => openEditQuickReplyModal(reply)}>
                        Edit
                      </button>
                      <button className="quick-reply-delete" type="button" onClick={() => handleDeleteQuickReply(reply.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Middle Column (30%) - Tickets List */}
        <div className="tickets-list">
          <div className="section-title">
            <span>Tickets</span>
            <div className="ticket-counts">
              <span className="ticket-count total">{totalTicketsCount} total</span>
              <span className="ticket-count active">{nonClosedTicketsCount} active</span>
              {waitingCount > 0 && (
                <span className="ticket-count waiting">{waitingCount} waiting</span>
              )}
            </div>
          </div>
          <div className="conversation-list">
            {sessions.map(s => (
              <ConversationListItem
                key={s.id}
                session={s}
                onOpen={() => openSession(s.id)}
                onClaim={() => claimSession(s.id)}
                onResume={() => handleResumeChat(s.id)}
                onEnd={() => handleEndChatFromList(s.id)}
                onTransfer={() => openTransferPopup(s.id)}
                active={s.id===activeSessionId}
              />
            ))}
          </div>
        </div>

        {/* Right Column (50%) - Chat Window */}
        <div className="chat-window-container">
          {activeSession ? (
            <ChatWindow
              ref={chatWindowRef}
              session={activeSession}
              onSend={sendMessageToSession}
              quickReplies={quickReplyOptions}
              onEndChat={endChatSession}
              onClaimChat={claimSession}
              conversationHistory={conversationHistory[String(activeSession.id)] || []}
              loadingHistory={loadingHistory[String(activeSession.id)] || false}
            />
          ) : (
            <div className="preview-placeholder">Select a conversation to begin</div>
          )}
        </div>
      </div>

      {/* Transfer Popup */}
      {showTransferPopup && (
        <div className="transfer-modal">
          <div className="transfer-modal-content">
            <div className="transfer-modal-header">
              <h3>Transfer Ticket #{transferTicketId}</h3>
              <button className="transfer-modal-close" onClick={closeTransferPopup}>×</button>
            </div>
            <div className="transfer-modal-body">
              <p>Select an agent to transfer this ticket to:</p>
              {availableAgents.length === 0 ? (
                <p className="transfer-no-agents">No available agents found.</p>
              ) : (
                <div className="transfer-agent-list">
                  {availableAgents.map(agent => (
                    <div
                      key={agent.id}
                      className={`transfer-agent-item ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="transfer-agent-info">
                        <div className="transfer-agent-name">
                          {agent.display_name || agent.username}
                        </div>
                        <div className="transfer-agent-email">{agent.email}</div>
                        {agent.role && <div className="transfer-agent-role">{agent.role}</div>}
                      </div>
                      <div className="transfer-agent-radio">
                        <input
                          type="radio"
                          name="agent"
                          checked={selectedAgent?.id === agent.id}
                          onChange={() => setSelectedAgent(agent)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="transfer-modal-footer">
              <button
                className="transfer-btn-cancel"
                onClick={closeTransferPopup}
                disabled={transferLoading}
              >
                Cancel
              </button>
              <button
                className="transfer-btn-confirm"
                onClick={handleTransfer}
                disabled={!selectedAgent || transferLoading}
              >
                {transferLoading ? 'Transferring...' : 'Transfer Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* General Popup */}
      <GeneralPopup
        isOpen={popup.isOpen}
        onClose={closePopup}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onConfirm={popup.onConfirm}
      />
      
      {/* Quick Reply Modal */}
      <QuickReplyModal
        key={editingQuickReply ? `edit-${editingQuickReply.id}` : 'add'}
        isOpen={quickReplyModalOpen}
        onClose={closeQuickReplyModal}
        onSave={handleQuickReplySave}
        editingReply={editingQuickReply}
      />
    </div>
  )
}

interface ConversationListItemProps {
  session: any;
  onOpen: () => void;
  onClaim?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  onTransfer?: () => void;
  active: boolean;
}
function ConversationListItem({session, onOpen, onClaim, onResume, onEnd, onTransfer, active}: ConversationListItemProps){
  const waiting = isWaitingStatus(session.status)
  const closed = isClosedStatus(session.status)
  const open = isOpenStatus(session.status)
  const statusClass = getConversationStatusClass(session.status)
  
  // Format creation date
  const createdDate = session.created_at ? formatDateTime12Hour(session.created_at) : 'Now'

  return (
    <div className={`conversation-item ${statusClass}${active ? ' active' : ''}`} onClick={onOpen} style={{cursor: 'pointer'}}>
      <div className="conversation-item-text">
        <div className="conversation-name">
          Tech Support 
        </div>
        <div className="ticket-details">
          <div className="ticket-detail-item">
            <span className="ticket-label">Ticket Id:</span>
            <span className="ticket-value">{session.id}</span>
          </div>
          <div className="ticket-detail-item">
            <span className="ticket-label">Status:</span>
            <span className="ticket-value">{normalizeStatus(session.status) || 'waiting'}</span>
          </div>
          <div className="ticket-detail-item">
            <span className="ticket-label">Last Seen:</span>
            <span className="ticket-value">{session.lastMsgTime}</span>
          </div>
        </div>
        <div className="conversation-actions">
          {waiting && (
            <button className="conversation-btn btn-claim" onClick={(e) => {
              e.stopPropagation()
              onClaim && onClaim()
            }}>Claim</button>
          )}
          {open && (
            <>
              <button className="conversation-btn btn-send" onClick={(e) => {
                e.stopPropagation()
                onResume && onResume()
              }}>Send Msg</button>
              <button className="conversation-btn btn-transfer" onClick={(e) => {
                e.stopPropagation()
                onTransfer && onTransfer()
              }}>Transfer</button>
              <button className="conversation-btn btn-end" onClick={(e) => {
                e.stopPropagation()
                onEnd && onEnd()
              }}>End Chat</button>
            </>
          )}
          
        </div>
      </div>
      {/* <div className="conversation-time">{session.lastMsgTime}</div> */}
    </div>
  )
}

interface ChatWindowProps {
  session: any;
  onSend: (sessionId: string | number, text: string) => void;
  quickReplies: AgentQuickReply[];
  onEndChat?: (sessionId: string | number) => void;
  onClaimChat?: (sessionId: string | number) => void;
  conversationHistory?: any[];
  loadingHistory?: boolean;
}

interface ChatWindowRef {
  addLiveMessage: (message: any) => void;
}

const ChatWindow = forwardRef<ChatWindowRef, ChatWindowProps>(({session, onSend, quickReplies, onEndChat, onClaimChat, conversationHistory = [], loadingHistory = false}, ref) => {
  const [input, setInput] = useState('')
  const [allMessages, setAllMessages] = useState<any[]>([])
  const [selectedQuickReplyId, setSelectedQuickReplyId] = useState<string>('')
  const boxRef = useRef<HTMLDivElement>(null)
  const isClosed = isClosedStatus(session.status)
  
  // Get agent info for displaying real name
  const agent = retrieveAgentInfo();
  const agentDisplayName = agent?.display_name || agent?.username || 'Agent';

  // Initialize allMessages with conversationHistory when it changes or component loads
  useEffect(() => {
    setAllMessages(conversationHistory)
  }, [conversationHistory])

  // Function to add new live messages from WebSocket
  const addLiveMessage = useCallback((message: any) => {
    setAllMessages(prev => [...prev, message])
  }, [])

  // Expose the addLiveMessage function to parent component
  useImperativeHandle(ref, () => ({
    addLiveMessage
  }), [addLiveMessage])

  useEffect(()=>{
    if(boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [allMessages.length, loadingHistory, session.status])

  function send(){
    if(!input.trim() || isClosed) return
    onSend(session.id, input.trim())
    setInput('')
  }

  function handleQuickReplyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (!value) {
      setSelectedQuickReplyId('')
      return
    }

    setSelectedQuickReplyId(value)

    const replyId = Number(value)
    const reply = quickReplies.find(r => r.id === replyId)
    if (!reply) {
      return
    }

    const category = (reply.category || '').toLowerCase()

    // For form-type quick replies, send a JSON payload that the widget can render as a real form
    if (category === 'form' && reply.form_schema && Array.isArray((reply as any).form_schema.fields)) {
      const fields = (reply as any).form_schema.fields as any[]
      const title = reply.template_text || 'Form'
      const formFields = fields.map((f: any, idx: number) => ({
        label: typeof f.label === 'string' ? f.label : `Field ${idx + 1}`,
        type: typeof f.type === 'string' ? f.type : 'text',
        required: !!f.required,
      }))

      const payload = {
        type: 'form_quick_reply',
        heading: title,
        fields: formFields,
      }

      const message = JSON.stringify(payload)

      if (message && !isClosed) {
        onSend(session.id, message)
      }

      // Reset selection after sending
      setSelectedQuickReplyId('')
      return
    }

    // For non-form quick replies, just populate the input so agent can edit before sending
    setInput(reply.template_text || '')
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div>
          <div className="chat-title">{session.user.name}</div>
          <div className="chat-subtitle">{session.user.email} - {session.user.country}</div>
        </div>
        <div className="chat-subtitle">Since {session.startedAgo}</div>
      </div>

      <div ref={boxRef} className={`chat-messages${isClosed ? ' chat-messages-closed' : ''}`}>
        {loadingHistory && (
          <div className="chat-loading">Loading conversation history…</div>
        )}
        {!loadingHistory && conversationHistory.length === 0 && (
          <div className="chat-history-placeholder">No conversation history found for this ticket</div>
        )}
        {allMessages.map((m: any,i: number)=> (
          <div key={i} className={`chat-message ${m.sender === 'agent' ? 'agent' : 'user'}`}> 
            <div className="chat-message-sender">
              {m.sender === 'agent' ? (m.agentName || agentDisplayName) : 'User'}
            </div>
            <div>{m.text}</div>
            <div className="chat-message-time">{formatTime12Hour(m.ts)}</div>
          </div>
        ))}
        {/* {isClosed && (
          <div className="chat-closed-banner">Ticket is closed. Messaging is disabled.</div>
        )} */}
      </div>

      {isClosed ? (
        <div className="chat-closed-actions">
          <p className="card-placeholder">You cannot send messages on a closed ticket.</p>
        </div>
      ) : isWaitingStatus(session.status) ? (
        <div className="chat-claim-actions">
          <p className="card-placeholder">You must claim this ticket to start chatting.</p>
          <button onClick={() => onClaimChat && onClaimChat(session.id)} className="claim-chat-button">
            Claim to Chat
          </button>
        </div>
      ) : (
        <div className="chat-input-row">
          <select onChange={handleQuickReplyChange} value={selectedQuickReplyId} className="chat-select">
            <option value="">Quick reply…</option>
            {quickReplies.map((q) => (
              <option key={q.id} value={q.id}>{q.template_text}</option>
            ))}
          </select>
          <input
            className="chat-input"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey){e.preventDefault();send()}}}
            placeholder="Type your message..."
          />
          <button onClick={send} className="send-button" disabled={!input.trim()}>Send</button>
          {/* End Chat button for agent to end chat and allow user to chat with AI again */}
          <button onClick={() => onEndChat && onEndChat(session.id)} className="end-chat-button">End Chat</button>
        </div>
      )}
    </div>
  )
})

ChatWindow.displayName = 'ChatWindow'

interface CustomerInfoPanelProps {
  user: any;
}
function CustomerInfoPanel({user}: CustomerInfoPanelProps){
  if(!user) return null
  return (
    <div className="customer-info">
      <div className="customer-name">{user.name}</div>
      <div className="customer-subtitle">{user.email}</div>
      {/* <div className="customer-detail">Last seen: {user.lastSeen}</div> */}
      <div className="customer-detail">Past issues: {user.pastIssues}</div>
      {/* <button className="profile-button">Open Customer Profile</button> */}
    </div>
  )
}

// ---------------- End ----------------
