import React, {useEffect, useRef, useState} from 'react'
import AgentLogin from './components/AgentLogin'

// Single-file Agent Panel UI (Tailwind-ready)
// - Replace mock data with API/WebSocket integration
// - Designed to slot into your existing frontend project

export default function AgentPanelApp({agentId = 1}){
  const [status, setStatus] = useState('online') // online, away, busy, offline
  const [sessions, setSessions] = useState(mockSessions())
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [quickReplies] = useState(mockQuickReplies())
  const [kb] = useState(mockKB())
  const wsRef = useRef(null)
  const [loggedOut, setLoggedOut] = useState(false)

  useEffect(()=>{
    // TODO: connect to WebSocket here
    // wsRef.current = new WebSocket(`${process.env.REACT_APP_WS_URL}/ws/agent/${agentId}`)
    // wsRef.current.onmessage = (e) => handleWS(JSON.parse(e.data))

    return ()=>{
      // if(wsRef.current) wsRef.current.close()
    }
  },[agentId])

  function handleWS(msg){
    // handle incoming messages: new assignment, user msg, system
    // example:
    // if(msg.type === 'assignment') setSessions(prev => [msg.session,...prev])
  }

  function setAgentStatus(s){
    setStatus(s)
    // TODO: call API to update status
  }

  function openSession(id){
    setActiveSessionId(id)
    // mark read, fetch history if necessary
  }

  function sendMessageToSession(sessionId, text){
    // send via websocket or REST
    setSessions(prev => prev.map(s => s.id === sessionId ? {...s, messages: [...s.messages, {sender:'agent', text, ts: Date.now()}]} : s))
  }

  function quickReply(sessionId, tpl){
    sendMessageToSession(sessionId, tpl)
  }

  function handleLogout() {
    setLoggedOut(true)
    setStatus('offline')
    setSessions([])
    setActiveSessionId(null)
  }

  const activeSession = sessions.find(s => s.id === activeSessionId)

  if (loggedOut) {
    return <AgentLogin onLogin={() => setLoggedOut(false)} />
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <AgentSidebar status={status} setStatus={setAgentStatus} sessions={sessions} onSelect={openSession} />
        </div>

        <div className="col-span-6">
          <div className="bg-white rounded shadow p-4 flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Agent Workspace</h2>
              <p className="text-sm text-slate-500">Logged in as Agent #{agentId} — Role: Technical</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded text-sm ${status==='online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{status}</div>
              <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5 bg-white rounded shadow p-3">
              <h3 className="font-semibold mb-2">Conversations</h3>
              <div className="space-y-2 max-h-[520px] overflow-auto">
                {sessions.map(s => (
                  <ConversationListItem key={s.id} session={s} onOpen={() => openSession(s.id)} active={s.id===activeSessionId} />
                ))}
              </div>
            </div>

            <div className="col-span-7 bg-white rounded shadow p-3 flex flex-col">
              {activeSession ? (
                <ChatWindow session={activeSession} onSend={sendMessageToSession} quickReplies={quickReplies} kb={kb} />
              ) : (
                <div className="flex-1 grid place-items-center text-slate-500">Select a conversation to begin</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <div className="bg-white rounded shadow p-4 mb-4">
            <h3 className="font-semibold mb-2">Customer Info</h3>
            {activeSession ? (
              <CustomerInfoPanel user={activeSession.user} />
            ) : (
              <div className="text-sm text-slate-500">No customer selected</div>
            )}
          </div>

          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Knowledge base</h3>
            <div className="space-y-2 text-sm">
              {kb.map(k=> (
                <div key={k.id} className="p-2 border rounded cursor-pointer">{k.title}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentSidebar({status, setStatus, sessions, onSelect}){
  const waiting = sessions.filter(s=>s.status==='waiting').length
  return (
    <div className="sticky top-6">
      <div className="bg-white rounded shadow p-3 mb-4">
        <h4 className="font-semibold">Availability</h4>
        <div className="flex gap-2 mt-2">
          <button onClick={()=>setStatus('online')} className={`px-3 py-1 rounded ${status==='online' ? 'bg-green-600 text-white':'bg-gray-100'}`}>Online</button>
          <button onClick={()=>setStatus('away')} className={`px-3 py-1 rounded ${status==='away' ? 'bg-yellow-400 text-white':'bg-gray-100'}`}>Away</button>
          <button onClick={()=>setStatus('busy')} className={`px-3 py-1 rounded ${status==='busy' ? 'bg-orange-500 text-white':'bg-gray-100'}`}>Busy</button>
        </div>

        <div className="mt-4 text-sm text-slate-600">Waiting queue: <strong>{waiting}</strong></div>
      </div>

      <div className="bg-white rounded shadow p-3">
        <h4 className="font-semibold">Shortcuts</h4>
        <div className="flex flex-col gap-2 mt-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded">Open Next</button>
          <button className="px-3 py-2 bg-emerald-600 text-white rounded">Mark Away</button>
          <button className="px-3 py-2 bg-gray-100 rounded">View Reports</button>
        </div>
      </div>
    </div>
  )
}

function ConversationListItem({session, onOpen, active}){
  return (
    <div onClick={onOpen} className={`p-2 rounded cursor-pointer flex justify-between items-center ${active ? 'bg-sky-50': 'hover:bg-slate-50'}`}>
      <div>
        <div className="font-medium">{session.user.name} <span className="text-xs text-slate-400">#{session.id}</span></div>
        <div className="text-xs text-slate-500">{session.topic} • {session.unread} new</div>
      </div>
      <div className="text-xs text-slate-400">{session.lastMsgTime}</div>
    </div>
  )
}

function ChatWindow({session, onSend, quickReplies, kb}){
  const [input, setInput] = useState('')
  const boxRef = useRef(null)

  useEffect(()=>{
    if(boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [session.messages.length])

  function send(){
    if(!input.trim()) return
    onSend(session.id, input.trim())
    setInput('')
  }

  return (
    <div className="flex flex-col h-[560px]">
      <div className="flex items-center justify-between pb-2 border-b mb-3">
        <div>
          <div className="font-semibold">{session.user.name}</div>
          <div className="text-xs text-slate-500">{session.user.email} • {session.user.country}</div>
        </div>
        <div className="text-xs text-slate-500">Since {session.startedAgo}</div>
      </div>

      <div ref={boxRef} className="flex-1 overflow-auto p-2 chat-box bg-slate-50 rounded">
        {session.messages.map((m,i)=> (
          <div key={i} className={`mb-2 ${m.sender === 'agent' ? 'text-right' : 'text-left'}`}>
            <div className={`${m.sender === 'agent' ? 'inline-block bg-blue-600 text-white' : 'inline-block bg-white text-slate-900'} p-2 rounded-md max-w-[70%]`}>
              <div className="text-sm">{m.text}</div>
              <div className="text-xs text-slate-300 mt-1">{new Date(m.ts).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <div className="flex gap-2 mb-2">
          {quickReplies.slice(0,5).map((q,i)=> (
            <button key={i} onClick={()=>onSend(session.id, q)} className="text-sm px-3 py-1 bg-gray-100 rounded">{q}</button>
          ))}
        </div>

        <div className="flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Type a reply..." className="input flex-1" onKeyDown={(e)=> e.key==='Enter' && send()} />
          <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
        </div>

        <div className="mt-2 text-xs text-slate-500">KB suggestions:</div>
        <div className="mt-1 flex gap-2 flex-wrap">
          {kb.map(k=> (<div key={k.id} className="px-2 py-1 border rounded text-sm">{k.tag}</div>))}
        </div>
      </div>
    </div>
  )
}

function CustomerInfoPanel({user}){
  if(!user) return null
  return (
    <div className="text-sm">
      <div className="font-medium mb-2">{user.name}</div>
      <div className="text-xs text-slate-500">{user.email}</div>
      <div className="mt-2 text-sm">Last seen: {user.lastSeen}</div>
      <div className="mt-2 text-sm">Past issues: {user.pastIssues}</div>
      <div className="mt-3">
        <button className="px-3 py-2 bg-blue-600 text-white rounded w-full">Open Customer Profile</button>
      </div>
    </div>
  )
}

// ---------------- Mock Data ----------------
function mockSessions(){
  return [
    { id: 201, user:{name:'Asha', email:'asha@example.com', country:'India', lastSeen:'2m ago', pastIssues:2}, topic:'technical', status:'assigned', unread:1, lastMsgTime:'2m', startedAgo:'5m', messages:[{sender:'user', text:'App crashed while uploading', ts: Date.now()-60000}, {sender:'agent', text:'Can you share the screenshot?', ts: Date.now()-30000}]},
    { id: 202, user:{name:'Rahul', email:'rahul@example.com', country:'India', lastSeen:'10m ago', pastIssues:1}, topic:'billing', status:'waiting', unread:2, lastMsgTime:'10m', startedAgo:'10m', messages:[{sender:'user', text:'I was charged twice', ts: Date.now()-600000}]},
    { id: 203, user:{name:'Nina', email:'nina@example.com', country:'USA', lastSeen:'1h ago', pastIssues:0}, topic:'general', status:'assigned', unread:0, lastMsgTime:'1h', startedAgo:'15m', messages:[{sender:'user', text:'How do I change my password?', ts: Date.now()-900000}]},
  ]
}

function mockQuickReplies(){
  return ['Hello — I can help with that.', 'Can you share a screenshot?', 'I am escalating this to tech team.', 'Please try clearing cache and retry.', 'I have updated your request.']
}

function mockKB(){
  return [
    {id:1, title:'Reset password', tag:'password'},
    {id:2, title:'Upload limits', tag:'upload'},
    {id:3, title:'Refund process', tag:'billing'},
  ]
}

// ---------------- End ----------------
