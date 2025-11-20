import React, {useCallback, useEffect, useRef, useState} from 'react'
import './agent_panel_styles.css'
import AgentLogin from './AgentLogin'
import { openAgentNotifierWS, openAgentChatWS, sendClaimAction, sendChatMessage, sendReleaseAction, retrieveAgentInfo, clearAgentInfo, updateAgentStatus, fetchActiveRooms, fetchAgentCurrentStatus, fetchAgentSkills, fetchAgentQuickReplies, createAgentQuickReply, deleteAgentQuickReply, updateAgentQuickReply, type AgentSkill, type AgentQuickReply } from '../api/agent'
import { ticketsApi, ticketMessagesApi } from '../api/ticketsApi'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
const DEFAULT_ROLE_LABEL = 'Technical Agent'

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
  const [quickReplyDraft, setQuickReplyDraft] = useState<{ id: number | null; category: string; text: string }>({
    id: null,
    category: '',
    text: '',
  })
  const [quickReplySubmitting, setQuickReplySubmitting] = useState<boolean>(false)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [wsConnected, setWsConnected] = useState<boolean>(false)

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

  // Auto-reconnect WebSocket with exponential backoff
  const reconnectChatWS = useCallback(async (sessionId: string | number, maxRetries = 5) => {
    const agent = retrieveAgentInfo();
    if (!agent?.id) return;

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

  const loadQuickReplies = useCallback(async (agentIdentifier: number | string) => {
    if (!agentIdentifier && agentIdentifier !== 0) {
      setQuickReplyTemplates([])
      setQuickRepliesLoading(false)
      return
    }
    setQuickRepliesLoading(true)
    setQuickRepliesError(null)
    try {
      const replies = await fetchAgentQuickReplies(agentIdentifier)
      setQuickReplyTemplates(Array.isArray(replies) ? replies : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load quick replies'
      setQuickRepliesError(message)
    } finally {
      setQuickRepliesLoading(false)
    }
  }, [])

  const loadTicketMessages = useCallback(async (ticketId: string | number) => {
    if (!ticketId) return
    setSessions(prev =>
      prev.map(session =>
        session.id === ticketId ? { ...session, loadingMessages: true } : session
      )
    )
    try {
      const messages = await ticketMessagesApi.getTicketMessages(String(ticketId), 200, 0)
      const formatted = Array.isArray(messages)
        ? messages.map(msg => ({
            sender: (msg.sender_type || '').toLowerCase() === 'agent' ? 'agent' : 'user',
            text: msg.content || '',
            ts: msg.created_at ? new Date(msg.created_at).getTime() : Date.now(),
          }))
        : []

      setSessions(prev =>
        prev.map(session =>
          session.id === ticketId
            ? { ...session, messages: formatted, messagesLoaded: true, loadingMessages: false }
            : session
        )
      )
    } catch (err) {
      console.error('Failed to load ticket messages', err)
      setSessions(prev =>
        prev.map(session =>
          session.id === ticketId ? { ...session, loadingMessages: false } : session
        )
      )
    }
  }, [])

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
          const mapped = tickets.map((ticket: any) => ({
            id: ticket.id,
            user: { 
              name: `User ${ticket.user_id || 'Unknown'}`, 
              email: '',
              country: '',
              pastIssues: 0
            },
            topic: ticket.category || 'tech',
            status: ticket.status === 'open' || ticket.status === 'in_progress' ? 'assigned' : 
                    ticket.status === 'waiting' ? 'waiting' : ticket.status || 'waiting',
            unread: 0,
            lastMsgTime: ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'now',
            startedAgo: ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'just now',
            messages: [],
            messagesLoaded: false,
            loadingMessages: false,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority
          }))
          
          // Merge with any existing sessions, dedupe by id
          setSessions(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const merged = [...mapped, ...prev.filter(p=>!existingIds.has(p.id))]
            return merged
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
      if(chatWsRef.current) chatWsRef.current.close()
    }
  },[agentId, loggedOut, loadQuickReplies])

  // On mount, check if there's an active chat session to reconnect to
  useEffect(() => {
    if (loggedOut) return;

    const activeChatSession = getActiveChatSession();
    if (activeChatSession) {
      console.log(`Reconnecting to active chat session: ${activeChatSession}`);
      reconnectChatWS(activeChatSession);
    }
  }, []); // Only run on mount

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
      alert('Unable to update your status right now. Please try again.')
    }
  }

  async function openSession(id: string|number){
    setActiveSessionId(id)
    const session = sessions.find(s => s.id === id)
    if (session && !session.messagesLoaded && !session.loadingMessages) {
      await loadTicketMessages(id)
    }
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
      alert('Ticket is closed. You cannot send messages.')
      return
    }
    if(activeChatTicketId == sessionId && chatWsRef.current){
      sendChatMessage(chatWsRef.current, text)
    }
    // Add to local session messages for display
    setSessions(prev => prev.map(s => s.id == sessionId ? {...s, messages: [...s.messages, {sender:'agent', text, ts: Date.now()}]} : s))
  }

  function quickReply(sessionId: string|number, tpl: string){
    sendMessageToSession(sessionId, tpl)
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
        alert("No more chats in the queue.");
    }
    }

  function handleMarkAway() {
    setAgentStatus('away');
  }

  function resetQuickReplyDraft() {
    setQuickReplyDraft({ id: null, category: '', text: '' })
  }

  function startQuickReplyEdit(reply: AgentQuickReply) {
    setQuickReplyDraft({
      id: reply.id,
      category: reply.category || '',
      text: reply.template_text,
    })
  }

  async function handleSaveQuickReply(event?: React.FormEvent<HTMLFormElement>) {
    if (event) {
      event.preventDefault()
    }
    if (!agentProfile?.id) {
      alert('Agent information not available. Please re-login.')
      return
    }
    if (!quickReplyDraft.text.trim()) {
      alert('Please enter a quick reply message.')
      return
    }
    setQuickReplySubmitting(true)
    try {
      if (quickReplyDraft.id) {
        // Update existing quick reply
        await updateAgentQuickReply(agentProfile.id, quickReplyDraft.id, {
          category: quickReplyDraft.category.trim() || null,
          template_text: quickReplyDraft.text.trim(),
        })
      } else {
        // Create new quick reply
        await createAgentQuickReply(agentProfile.id, {
          category: quickReplyDraft.category.trim() || null,
          template_text: quickReplyDraft.text.trim(),
        })
      }

      await loadQuickReplies(agentProfile.id)
      resetQuickReplyDraft()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save quick reply'
      alert(message)
    } finally {
      setQuickReplySubmitting(false)
    }
  }

  async function handleDeleteQuickReply(replyId: number) {
    if (!agentProfile?.id) {
      alert('Agent information not available. Please re-login.')
      return
    }
    if (!window.confirm('Delete this quick reply? This action cannot be undone.')) {
      return
    }
    try {
      await deleteAgentQuickReply(agentProfile.id, replyId)
      setQuickReplyTemplates(prev => prev.filter(reply => reply.id !== replyId))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete quick reply'
      alert(message)
    }
  }

  async function handleLogout() {
    const agent = retrieveAgentInfo()
    if (agent?.id) {
      try {
        await updateAgentStatus(agent.id, 'offline', { source: 'agent_panel_logout', previous_status: status })
      } catch (err) {
        console.error('Failed to mark agent offline on logout', err)
      }
    }
    setLoggedOut(true)
    setStatus('offline')
    setSessions([])
    setActiveSessionId(null)
    clearAgentInfo()
    if (onLogout) onLogout()
  }

  interface ConversationListItemProps {
    session: any;
    onOpen: () => void;
    onClaim?: () => void;
    active: boolean;
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
        openChatForSession(sessionId)
        setSessions((prev: any[]) => prev.map(s => s.id == sessionId ? { ...s, status: 'assigned' } : s))
      }catch(e){
        console.error('Failed to claim session', e)
      }
    } else {
      alert('Not connected to agent notifier websocket')
    }
  }

  async function openChatForSession(sessionId: string|number){
    const agent = retrieveAgentInfo()
    if (!agent) return
    
    // Set agent status to busy immediately when opening a chat
    try {
      await updateAgentStatus(agent.id, 'busy', { source: 'agent_panel_open_chat', previous_status: status })
      setStatus('busy')
    } catch (err) {
      console.error('Failed to mark agent busy when opening chat', err)
    }

    if(chatWsRef.current) chatWsRef.current.close()
    chatWsRef.current = openAgentChatWS(
      sessionId,
      agent.id,
      agent.display_name || agent.username || 'Agent',
      (msg) => {
        console.log('Chat message:', msg)
        if(msg.type === 'agent_joined' || msg.type === 'agent_claimed') return
        if(msg.type === 'message_history' && msg.message) {
          const historyEntry = msg.message
          setSessions(prev => prev.map(s => s.id == sessionId ? {
            ...s,
            messages: [
              ...s.messages,
              {
                sender: (historyEntry.sender_type || '').toLowerCase() === 'agent' ? 'agent' : 'user',
                text: historyEntry.content || '',
                ts: historyEntry.created_at ? new Date(historyEntry.created_at).getTime() : Date.now()
              }
            ],
            messagesLoaded: true
          } : s))
          return
        }
        setSessions(prev => prev.map(s => s.id == sessionId ? {
          ...s,
          messages: [...s.messages, { sender: msg.type === 'text' || !msg.type ? 'user' : 'system', text: msg.text || JSON.stringify(msg), ts: Date.now() }]
        } : s))
      },
      (err) => {
        console.error('Chat error:', err)
        // On connection error, attempt to reconnect
        if (chatWsRef.current?.readyState === WebSocket.CLOSED) {
          console.log('Chat WS closed unexpectedly, attempting reconnect...');
          reconnectChatWS(sessionId);
        }
      }
    )
    setActiveChatTicketId(sessionId)
    saveActiveChatSession(sessionId)
    setWsConnected(true)
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
  async function endChatSession(ticketId?: string | number){
    const closingTicketId = ticketId ?? activeChatTicketId
    releaseChatSession();

    const agent = retrieveAgentInfo()
    if (agent?.id) {
      try {
        await updateAgentStatus(agent.id, 'online', { source: 'agent_panel_end_chat', previous_status: status })
        setStatus('online')
      } catch (err) {
        console.error('Failed to mark agent online after ending chat', err)
      }
    }

    if (closingTicketId) {
      setSessions(prev => prev.map(s => s.id == closingTicketId ? { ...s, status: 'closed' } : s))
    }

    alert('Chat ended. User can now chat with AI again.');
  }

  const activeSession = sessions.find(s => s.id == activeSessionId)
  const waitingCount = sessions.filter((s: any)=>s.status==='waiting').length
  const quickReplyOptions = quickReplyTemplates.map(reply => reply.template_text)

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
      <div className="admin-navbar agent-navbar">
        <div className="admin-navbar__inner">
          <div className="admin-navbar__brand">
            <img src={logo} alt="RealEstate CRM" className="admin-navbar__logo" />
            <span className="admin-navbar__brandName">RealEstate CRM</span>
          </div>

          <div className="admin-navbar__title">
            <h1>Agent Workspace</h1>
            <p>Handle chats, claim tickets and assist customers</p>
          </div>

          <div className="admin-navbar__meta">
            {/* Removed Last reviewed */}
          </div>
        </div>
      </div>
      <div className="agent-grid">
        {/* Agent profile header with full profile content inline */}
        <div className="agent-header-profile">
          <div className="profile-avatar modal-avatar" style={{ margin: '0 12px 0 0' }}>
            {agentName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div className="profile-name modal-name">{agentName}</div>
            <div className="profile-role modal-role">{agentRole}</div>
            {/* <div className="profile-skills">
              <span className="profile-skills-label">Skills:</span>
              {!skillsSynced && <span className="profile-skills-empty">Syncing…</span>}
              {skillsSynced && agentSkills.length === 0 && (
                <span className="profile-skills-empty">Not assigned</span>
              )}
              {skillsSynced && agentSkills.length > 0 && agentSkills.map(skill => (
                <span key={skill.id ?? skill.name} className="skill-pill">
                  {skill.name}
                </span>
              ))}
            </div> */}
            <div className="profile-status modal-status">
              Status: <span className={`status-pill ${statusSynced ? status : 'offline'}`}>{statusSynced ? status : 'syncing...'}</span>
            </div>
            <div className="profile-actions" style={{ marginTop: 10 }}>
              <select
                className="profile-select modal-select"
                value={status}
                onChange={e => setAgentStatus(e.target.value)}
                disabled={!statusSynced}
              >
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
              {/* <button className="profile-btn modal-btn">View Profile</button> */}
              {activeChatTicketId && (
                <>
                  {/* <button
                    className="profile-btn modal-btn"
                    style={{ backgroundColor: '#ff9800', marginRight: 8 }}
                    onClick={releaseChatSession}
                  >
                    Release Chat
                  </button> */}
                    {/* <button
                      className="profile-btn modal-btn"
                      style={{ backgroundColor: '#e53935' }}
                      onClick={endChatSession}
                    >
                      End Chat
                    </button> */}
                </>
              )}
              <button className="logout-button modal-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>

        <section className="agent-card grid-workspace workspace-card">
          <div className="workspace-header">
            <div>
              <p className="workspace-title">Agent Workspace</p>
              <p className="workspace-meta">Logged in as Agent #{agentId} — Role: {agentRole}</p>
              {skillsSynced && (
                <p className="workspace-meta">
                  Skills: {agentSkills.length > 0 ? agentSkills.map(skill => skill.name).join(', ') : 'Not assigned'}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="agent-card grid-customer">
          <div className="card-heading">Customer Info</div>
          {activeSession ? (
            <CustomerInfoPanel user={activeSession.user} />
          ) : (
            <p className="card-placeholder">No customer selected</p>
          )}
        </section>

        <section className="agent-card grid-conversations">
          <div className="card-heading">Conversations</div>
          <div className="conversation-list">
            {sessions.map(s => (
              <ConversationListItem
                key={s.id}
                session={s}
                onOpen={() => openSession(s.id)}
                onClaim={() => claimSession(s.id)}
                onResume={() => handleResumeChat(s.id)}
                onEnd={() => handleEndChatFromList(s.id)}
                active={s.id===activeSessionId}
              />
            ))}
          </div>
        </section>

        <section className="agent-card grid-preview">
          {activeSession ? (
            <ChatWindow
              session={activeSession}
              onSend={sendMessageToSession}
              quickReplies={quickReplyOptions}
              onEndChat={endChatSession}
            />
          ) : (
            <div className="preview-placeholder">Select a conversation to begin</div>
          )}
        </section>

        <section className="agent-card grid-knowledge quick-replies-card">
          <div className="card-heading">Quick Reply Manager</div>
          <p className="card-subtitle">Add canned responses to speed up replies.</p>
          <form className="quick-reply-form" onSubmit={handleSaveQuickReply}>
            <div className="quick-reply-fields">
              <input
                className="quick-reply-input"
                placeholder="Category (optional)"
                value={quickReplyDraft.category}
                onChange={e => setQuickReplyDraft(prev => ({ ...prev, category: e.target.value }))}
                disabled={quickReplySubmitting}
              />
              <textarea
                className="quick-reply-textarea"
                placeholder="Quick reply text"
                value={quickReplyDraft.text}
                onChange={e => setQuickReplyDraft(prev => ({ ...prev, text: e.target.value }))}
                disabled={quickReplySubmitting}
                rows={2}
                required
              />
            </div>
            <div className="quick-reply-actions-row">
              <button type="submit" className="profile-btn modal-btn" disabled={quickReplySubmitting}>
                {quickReplyDraft.id ? 'Update Reply' : 'Add Reply'}
              </button>
              {quickReplyDraft.id && (
                <button
                  type="button"
                  className="quick-reply-cancel-btn"
                  onClick={resetQuickReplyDraft}
                  disabled={quickReplySubmitting}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
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
                    <button className="quick-reply-edit" type="button" onClick={() => startQuickReplyEdit(reply)}>
                      Edit
                    </button>
                    <button className="quick-reply-delete" type="button" onClick={() => handleDeleteQuickReply(reply.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  )
}

interface ConversationListItemProps {
  session: any;
  onOpen: () => void;
  onClaim?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  active: boolean;
}
function ConversationListItem({session, onOpen, onClaim, onResume, onEnd, active}: ConversationListItemProps){
  const displayTitle = session.title || session.topic || 'Ticket'
  const waiting = isWaitingStatus(session.status)
  const closed = isClosedStatus(session.status)
  const open = isOpenStatus(session.status)
  const statusClass = getConversationStatusClass(session.status)

  return (
    <div className={`conversation-item ${statusClass}${active ? ' active' : ''}`} onClick={onOpen} style={{cursor: 'pointer'}}>
      <div className="conversation-item-text">
        <div className="conversation-name">
          {displayTitle} <span className="conversation-id">#{session.id}</span>
        </div>
        <div className="conversation-meta">
          {session.priority && `${session.priority} • `}
          {normalizeStatus(session.status) || 'waiting'} • {session.unread} new
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
              <button className="conversation-btn btn-end" onClick={(e) => {
                e.stopPropagation()
                onEnd && onEnd()
              }}>End Chat</button>
            </>
          )}
          {closed && (
            <span className="conversation-badge badge-closed">Closed</span>
          )}
        </div>
      </div>
      <div className="conversation-time">{session.lastMsgTime}</div>
    </div>
  )
}

interface ChatWindowProps {
  session: any;
  onSend: (sessionId: string | number, text: string) => void;
  quickReplies: string[];
  onEndChat?: (sessionId: string | number) => void;
}
function ChatWindow({session, onSend, quickReplies, onEndChat}: ChatWindowProps){
  const [input, setInput] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)
  const isClosed = isClosedStatus(session.status)
  const messages = Array.isArray(session.messages) ? session.messages : []

  useEffect(()=>{
    if(boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [messages.length, session.loadingMessages, session.status])

  function send(){
    if(!input.trim() || isClosed) return
    onSend(session.id, input.trim())
    setInput('')
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
        {session.loadingMessages && (
          <div className="chat-loading">Loading ticket conversation…</div>
        )}
        {messages.map((m: any,i: number)=> (
          <div key={i} className={`chat-message ${m.sender === 'agent' ? 'agent' : 'user'}`}> 
            <div className="chat-message-sender">{m.sender === 'agent' ? 'Agent' : 'User'}</div>
            <div>{m.text}</div>
            <div className="chat-message-time">{new Date(m.ts).toLocaleTimeString()}</div>
          </div>
        ))}
        {isClosed && (
          <div className="chat-closed-banner">Ticket is closed. Messaging is disabled.</div>
        )}
      </div>

      {isClosed ? (
        <div className="chat-closed-actions">
          <p className="card-placeholder">You cannot send messages on a closed ticket.</p>
        </div>
      ) : (
        <div className="chat-input-row">
          <select onChange={e=>setInput(e.target.value)} value={input} className="chat-select">
            <option value="">Quick reply…</option>
            {quickReplies.map((q: string,i: number)=> (
              <option key={i} value={q}>{q}</option>
            ))}
          </select>
          <input
            className="chat-input"
            value={input}
            onChange={e=>setInput(e.target.value)}
            placeholder="Type a reply..."
            onKeyDown={(e)=> e.key==='Enter' && send()}
          />
          <button onClick={send} className="send-button" disabled={!input.trim()}>Send</button>
          {/* End Chat button for agent to end chat and allow user to chat with AI again */}
          <button onClick={() => onEndChat && onEndChat(session.id)} className="end-chat-button">End Chat</button>
        </div>
      )}
    </div>
  )
}

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
