import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

type Props = {
  agentName?: string
  onLogout?: () => void
}

const AgentNavbar: React.FC<Props> = ({ agentName, onLogout }) => {
  return (
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
  )
}

export default AgentNavbar
