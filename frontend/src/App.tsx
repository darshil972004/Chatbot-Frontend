import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ChatbotWidget from './components/ChatbotWidget'
import WorkflowManagement from './components/WorkflowManagement'
import WorkflowList from './components/WorkflowList'
import AdminPanel from './components/AdminPanel'
import './components/chatbot.css'

const ADMIN_USERNAME = (window as any).VITE_ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = (window as any).VITE_ADMIN_PASSWORD || 'admin123'

function PublicHome() {
  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 12 }}>Chatbot</h1>
      <p style={{ marginBottom: 20, maxWidth: 560, color: '#475569' }}>
        Welcome! Use the chatbot below to explore property information. Workflow management tools are available from the admin panel.
      </p>
      <ChatbotWidget />
    </div>
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
