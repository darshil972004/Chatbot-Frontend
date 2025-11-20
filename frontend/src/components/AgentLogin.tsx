import React, { useState } from "react";
import { updateAgentStatus } from '../api/agent'


type AgentLoginProps = {
  onLogin: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
};

export default function AgentLogin({ onLogin }: AgentLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const loginIdentifier = username.trim();
    if (!loginIdentifier || !password.trim()) {
      setError("Please enter your username/email and password.");
      setIsSubmitting(false);
      return;
    }
    const result = await onLogin(loginIdentifier, password);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message || "Invalid credentials");
    } else {
      // On successful login, set agent status to online
      try {
        // Extract agent ID from the result data (passed by App.tsx)
        const agentInfo = typeof (result as any).data === 'object' ? (result as any).data : null;
        if (agentInfo?.id) {
          await updateAgentStatus(agentInfo.id, 'online', { source: 'agent_login_form' });
        }
      } catch (err) {
        console.error('Failed to update agent status on login', err);
        // Continue anyway, status will be set in AgentPanel
      }
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <h1 className="admin-login-heading">Agent Login</h1>
        <p className="admin-login-subtitle">
          Enter your credentials to access the agent dashboard.
        </p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <label className="admin-login-label">
            Username or Email
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="admin-login-input"
              placeholder="agent or agent@email.com"
              autoComplete="username"
              required
              autoFocus
            />
          </label>
          <label className="admin-login-label">
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
