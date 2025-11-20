import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import ChatbotWidget from './components/ChatbotWidget'
import AdminLayout from './components/AdminPanel/AdminLayout'
import WorkflowManagement from './components/WorkflowManagement'
import WorkflowList from './components/WorkflowList'
import AdminPanel from './components/AdminPanel'
import AgentLogin from './components/AgentLogin'
import AgentPanelApp from './components/AgentPanel'
import { agentLogin, storeAgentInfo, clearAgentInfo, updateAgentStatus } from './api/agent'
import './components/chatbot.css'

const ADMIN_USERNAME = (window as any).VITE_ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = (window as any).VITE_ADMIN_PASSWORD || 'admin123'

function PublicHome() {
  return (
    <div>
      <ChatbotWidget />
    </div>
  )
}

function WorkflowPage() {
  return <WorkflowManagement />;
}
export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.localStorage.getItem('adminLoggedIn') === 'true'
  })

  const handleAdminLogin = (username: string, password: string) => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('adminLoggedIn', 'true')
      }
      setIsAdmin(true)
      return { success: true as const }
    }

    return {
      success: false as const,
      message: 'Invalid username or password.',
    }
  }

  const handleAdminLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('adminLoggedIn')
    }
    setIsAdmin(false)
  }

  // Agent login state (persisted in localStorage)
  const [agentLoggedIn, setAgentLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return !!window.localStorage.getItem('agent')
  })
  const [agentId, setAgentId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem('agent')
      return raw ? (JSON.parse(raw).id ?? null) : null
    } catch (e) {
      return null
    }
  })
  const handleAgentLogin = async (username: string, password: string) => {
    const result = await agentLogin(username, password)
    if (result.success && result.data) {
      setAgentLoggedIn(true)
      setAgentId(result.data.id ?? 1)
      storeAgentInfo(result.data)

      if (result.data.id != null) {
        try {
          await updateAgentStatus(result.data.id, 'online', {
            source: 'agent_login',
          })
        } catch (err) {
          console.error('Failed to mark agent online on login', err)
        }
      }

      return { success: true, data: result.data }
    }
    return {
      success: false,
      message: result.error?.message || 'Invalid agent credentials.',
    }
  }

  const handleAgentLogout = () => {
    setAgentLoggedIn(false);
    setAgentId(null);
    clearAgentInfo();
  };
  
  return (
    <RecoilRoot>
      <Router>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route
            path="/admin"
            element={
              <AdminPanel
                isAdmin={isAdmin}
                onLogin={handleAdminLogin}
                onLogout={handleAdminLogout}
              />
            }
          />
          <Route
            path="/agent"
            element={agentLoggedIn ? <AgentPanelApp agentId={agentId ?? 1} onLogout={handleAgentLogout} /> : <AgentLogin onLogin={handleAgentLogin} />}
          />
          <Route
            path="/workflows"
            element={isAdmin ? <WorkflowList /> : <Navigate to="/admin" replace />}
          />
          <Route
            path="/workflow"
            element={isAdmin ? <WorkflowManagement /> : <Navigate to="/admin" replace />}
          />
          <Route
            path="/workflow/:workflowId"
            element={isAdmin ? <WorkflowManagement /> : <Navigate to="/admin" replace />}
          />
          {/* Admin routes */}
          <Route path="/admin-panel" element={isAdmin ? <AdminLayout /> : <Navigate to="/admin" replace />}>
            <Route index element={<Navigate to="chatbot" replace />} />
            {/* <Route path="chatbot" element={<ChatbotConfig />} /> */}
            {/* Add more admin routes here as needed */}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </RecoilRoot>
  )
}
