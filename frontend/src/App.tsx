import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ChatbotWidget from './components/ChatbotWidget'
import WorkflowManagement from './components/WorkflowManagement'
import WorkflowList from './components/WorkflowList'
import AdminPanel from './components/AdminPanel'
import AgentLogin from './components/AgentLogin'
import AgentPanelApp from './components/AgentPanel'
import { agentLogin, storeAgentInfo, clearAgentInfo } from './api/agent'
import './components/chatbot.css'

const ADMIN_USERNAME = (window as any).VITE_ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = (window as any).VITE_ADMIN_PASSWORD || 'admin123'

function PublicHome() {
  return (
      <ChatbotWidget />
  )
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
    const result = await agentLogin(username, password);
    if (result.success && result.data) {
      setAgentLoggedIn(true);
      setAgentId(result.data.id ?? 1);
      storeAgentInfo(result.data);
      return { success: true };
    }
    return {
      success: false,
      message: result.error?.message || 'Invalid agent credentials.',
    };
  };

  const handleAgentLogout = () => {
    setAgentLoggedIn(false);
    setAgentId(null);
    clearAgentInfo();
  };
  
  return (
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
