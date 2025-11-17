import React, { useState } from "react";

type AgentLoginProps = {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
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
    const result = await onLogin(username, password);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message || "Invalid credentials");
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
            Username
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="admin-login-input"
              placeholder="agent"
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
