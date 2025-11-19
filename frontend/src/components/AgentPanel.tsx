import React, {useEffect, useRef, useState} from 'react'
import './agent_panel_styles.css'
import AgentLogin from './AgentLogin'
import { openAgentNotifierWS, openAgentChatWS, sendClaimAction, sendChatMessage, sendReleaseAction, retrieveAgentInfo, clearAgentInfo, updateAgentStatus, fetchActiveRooms, fetchAgentCurrentStatus, fetchAgentSkills, type AgentSkill } from '../api/agent'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
const DEFAULT_ROLE_LABEL = 'Technical Agent'

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
  const [quickReplies] = useState<string[]>(mockQuickReplies())
  const wsRef = useRef<any>(null)
  const [loggedOut, setLoggedOut] = useState(false)
  
  const [agentName, setAgentName] = useState<string>('Agent')
  const [agentRole, setAgentRole] = useState<string>(DEFAULT_ROLE_LABEL)
  const [agentSkills, setAgentSkills] = useState<AgentSkill[]>([])
  const [skillsSynced, setSkillsSynced] = useState<boolean>(false)
  const chatWsRef = useRef<WebSocket | null>(null)
  const [activeChatTicketId, setActiveChatTicketId] = useState<string | number | null>(null)

  useEffect(()=>{
    let isMounted = true
    setStatusSynced(false)
    setSkillsSynced(false)
    // Read agent info from localStorage and set display name
    const agent = retrieveAgentInfo()
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

    // Connect notifier websocket for agent notifications (new tickets, claims)
    if (agent && agent.id) {
      wsRef.current = openAgentNotifierWS(
        agent.id,
        (msg) => {
          console.log('Notifier message received:', msg)
          // Handle new ticket notifications
          if (msg.type === 'new_ticket') {
            setSessions(prev => [{ 
              id: msg.ticket_id, 
              user: { name: msg.user_name || 'User', email: msg.user_email || '' }, 
              topic: msg.category || 'tech', 
              status: 'waiting', 
              unread: 1, 
              lastMsgTime: 'now', 
              startedAgo: 'just now', 
              messages: [] 
            }, ...prev])
            // Set active session id from backend ACTIVE_ROOMS via notifier (if agent has no active session)
            if (!activeSessionId && msg.ticket_id) {
              setActiveSessionId(msg.ticket_id)
            }
          }
          // Handle ticket claimed notifications
          if (msg.type === 'ticket_claimed') {
            setSessions(prev => prev.map(s => s.id === msg.ticket_id ? { ...s, status: 'assigned' } : s))
          }
        },
        (err) => console.error('Notifier error:', err)
      )
    }

    // Fetch current active rooms from backend to initialize session list
    (async () => {
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
            messages: r.history || []
          }))
          // Merge with any existing sessions, dedupe by id
          setSessions(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const merged = [...mapped, ...prev.filter(p=>!existingIds.has(p.id))]
            return merged
          })
          // If no active session, pick the most recent backend room
          if (!activeSessionId && mapped.length > 0) {
            setActiveSessionId(mapped[0].id)
          }
        }
      } catch (e) {
        console.warn('Failed to fetch active rooms', e)
      }
    })()

    return ()=>{
      isMounted = false
      if(wsRef.current) wsRef.current.close()
      if(chatWsRef.current) chatWsRef.current.close()
    }
  },[agentId])

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

  function openSession(id: string|number){
    setActiveSessionId(id)
    // mark read, fetch history if necessary
  }

  function sendMessageToSession(sessionId: string|number, text: string){
    // Send via chat websocket if connected
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

  function claimSession(sessionId: string|number){
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

  function openChatForSession(sessionId: string|number){
    const agent = retrieveAgentInfo()
    if (!agent) return
    if(chatWsRef.current) chatWsRef.current.close()
    chatWsRef.current = openAgentChatWS(
      sessionId,
      agent.id,
      agent.display_name || agent.username || 'Agent',
      (msg) => {
        console.log('Chat message:', msg)
        if(msg.type === 'agent_joined' || msg.type === 'agent_claimed') return
        setSessions(prev => prev.map(s => s.id == sessionId ? {
          ...s,
          messages: [...s.messages, { sender: msg.type === 'text' || !msg.type ? 'user' : 'system', text: msg.text || JSON.stringify(msg), ts: Date.now() }]
        } : s))
      },
      (err) => console.error('Chat error:', err)
    )
    setActiveChatTicketId(sessionId)
  }

  function releaseChatSession(){
    if(activeChatTicketId && chatWsRef.current){
      sendReleaseAction(chatWsRef.current, activeChatTicketId)
      chatWsRef.current.close()
      chatWsRef.current = null
      setActiveChatTicketId(null)
    }
    // Clear active session when releasing
    setActiveSessionId(null)
  }

  // End chat and allow user to chat with AI again
  function endChatSession(){
    releaseChatSession();
    // Optionally, you can add logic here to notify the frontend/chatbot widget to switch back to AI mode
    // For example, you might trigger an event or update a shared state
    alert('Chat ended. User can now chat with AI again.');
  }

  const activeSession = sessions.find(s => s.id == activeSessionId)
  const waitingCount = sessions.filter((s: any)=>s.status==='waiting').length

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
      <header className="admin-navbar agent-navbar">
      <div className="admin-navbar__inner">
        <Link to="/agent" className="admin-navbar__brand">
          <img src={logo} alt="RealEstate CRM" className="admin-navbar__logo" />
          <span className="admin-navbar__brandName">RealEstate CRM</span>
        </Link>

        <div className="admin-navbar__title">
          <h1>Agent Workspace</h1>
          <p>Handle chats, claim tickets and assist customers</p>
        </div>

        <div className="admin-navbar__meta">
          {agentName && <div className="agent-name">{agentName}</div>}
          {onLogout && (
            <button className="agent-logout-btn" onClick={onLogout} style={{ marginLeft: 12 }}>
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
    <body>
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
                  <button
                    className="profile-btn modal-btn"
                    style={{ backgroundColor: '#ff9800', marginRight: 8 }}
                    onClick={releaseChatSession}
                  >
                    Release Chat
                  </button>
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

        <section className="agent-card grid-shortcuts shortcuts-card">
          <div className="card-heading">Shortcuts</div>
          <div className="shortcut-buttons">
            <button className="shortcut-btn primary" onClick={handleOpenNext}>Open Next</button>
            <button className="shortcut-btn success" onClick={handleMarkAway}>Mark Away</button>
            <button className="shortcut-btn Chat" onClick={releaseChatSession}>Release  All Chat</button>
            {/* <button className="shortcut-btn muted" onClick={handleViewReports}>View Reports</button> */}
          </div>
        </section>

        <section className="agent-card grid-conversations">
          <div className="card-heading">Conversations</div>
          <div className="conversation-list">
            {sessions.map(s => (
              <ConversationListItem key={s.id} session={s} onOpen={() => openSession(s.id)} onClaim={() => claimSession(s.id)} active={s.id===activeSessionId} />
            ))}
          </div>
        </section>

        <section className="agent-card grid-preview">
          {activeSession ? (
            <ChatWindow session={activeSession} onSend={sendMessageToSession} quickReplies={quickReplies} onEndChat={endChatSession} />
          ) : (
            <div className="preview-placeholder">Select a conversation to begin</div>
          )}
        </section>

      </div>
    </body>
    </div>
  )
}

interface ConversationListItemProps {
  session: any;
  onOpen: () => void;
  onClaim?: () => void;
  active: boolean;
}
function ConversationListItem({session, onOpen, onClaim, active}: ConversationListItemProps){
  return (
    <div className={`conversation-item${active ? ' active' : ''}`} onClick={onOpen} style={{cursor: 'pointer'}}>
      <div className="conversation-item-text">
        <div className="conversation-name">
          {session.user.name} <span className="conversation-id">#{session.id}</span>
        </div>
        <div className="conversation-meta">{session.topic} • {session.unread} new</div>
      </div>
      <div className="conversation-time">{session.lastMsgTime}</div>
      {session.status === 'waiting' && (
        <button className="claim-button" onClick={() => onClaim && onClaim()}>Claim</button>
      )}
    </div>
  )
}

interface ChatWindowProps {
  session: any;
  onSend: (sessionId: number, text: string) => void;
  quickReplies: string[];
}
interface ChatWindowProps {
  session: any;
  onSend: (sessionId: number, text: string) => void;
  quickReplies: string[];
  onEndChat?: () => void;
}
function ChatWindow({session, onSend, quickReplies, onEndChat}: ChatWindowProps){
  const [input, setInput] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    if(boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [session.messages.length])

  function send(){
    if(!input.trim()) return
    onSend(session.id, input.trim())
    setInput('')
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div>
          <div className="chat-title">{session.user.name}</div>
          <div className="chat-subtitle">{session.user.email} • {session.user.country}</div>
        </div>
        <div className="chat-subtitle">Since {session.startedAgo}</div>
      </div>

      <div ref={boxRef} className="chat-messages">
        {session.messages.map((m: any,i: number)=> (
          <div key={i} className={`chat-message ${m.sender === 'agent' ? 'agent' : 'user'}`}> 
            <div className="chat-message-sender">{m.sender === 'agent' ? 'Agent' : 'User'}</div>
            <div>{m.text}</div>
            <div className="chat-message-time">{new Date(m.ts).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>

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
        <button onClick={send} className="send-button">Send</button>
        {/* End Chat button for agent to end chat and allow user to chat with AI again */}
        <button onClick={onEndChat} className="end-chat-button" style={{marginLeft:8, backgroundColor:'#e53935', color:'#fff'}}>End Chat</button>
      </div>
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

// ---------------- Mock Data ----------------
function mockSessions(){
  return [
    { id: 201, user:{name:'Asha', email:'asha@example.com', country:'India', pastIssues:2}, topic:'technical', status:'assigned', unread:1, lastMsgTime:'2m', startedAgo:'5m', messages:[{sender:'user', text:'App crashed while uploading', ts: Date.now()-60000}, {sender:'agent', text:'Can you share the screenshot?', ts: Date.now()-30000}]},
    { id: 202, user:{name:'Rahul', email:'rahul@example.com', country:'India', pastIssues:1}, topic:'billing', status:'waiting', unread:2, lastMsgTime:'10m', startedAgo:'10m', messages:[{sender:'user', text:'I was charged twice', ts: Date.now()-600000}]},
    { id: 203, user:{name:'Nina', email:'nina@example.com', country:'USA', pastIssues:0}, topic:'general', status:'assigned', unread:0, lastMsgTime:'1h', startedAgo:'15m', messages:[{sender:'user', text:'How do I change my password?', ts: Date.now()-900000}]},
  ]
}

function mockQuickReplies(){
  return ['Hello — I can help with that.', 'Can you share a screenshot?', 'I am escalating this to tech team.', 'Please try clearing cache and retry.', 'I have updated your request.']
}


// ---------------- End ----------------
