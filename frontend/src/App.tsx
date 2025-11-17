import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import ChatbotWidget from './components/ChatbotWidget'
import AdminLayout from './components/AdminPanel/AdminLayout'
import ChatbotConfig from './components/AdminPanel/ChatbotConfig'
import WorkflowManagement from './components/WorkflowManagement'
import WorkflowList from './components/WorkflowList'
import AdminPanel from './components/AdminPanel'
import AgentLogin from './components/AgentLogin'
import AgentPanelApp from './components/AgentPanel'
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

  // Simple agent login handler using mockAgents from AdminPanel
  const [agentLoggedIn, setAgentLoggedIn] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  const handleAgentLogin = async (username: string, password: string) => {
    let agents: any[] = [];
    if ((window as any).mockAgents) {
      agents = (window as any).mockAgents();
    } else {
      agents = [
        { username: 'rakesh', password: 'pass123', id: 1 },
        { username: 'maya', password: 'pass456', id: 2 },
        { username: 'arjun', password: 'pass789', id: 3 },
      ];
    }
    const found = agents.find(a => a.username === username && a.password === password);
    if (found) {
      setAgentLoggedIn(true);
      setAgentId(found.id ?? 1);
      return { success: true };
    }
    return { success: false, message: 'Invalid agent credentials.' };
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
            element={agentLoggedIn ? <AgentPanelApp agentId={agentId ?? 1} /> : <AgentLogin onLogin={handleAgentLogin} />}
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
            <Route path="chatbot" element={<ChatbotConfig />} />
            {/* Add more admin routes here as needed */}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </RecoilRoot>
  )
}
