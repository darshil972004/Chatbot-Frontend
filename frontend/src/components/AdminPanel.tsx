import { FormEvent, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import ChatbotWidget from './ChatbotWidget';

type AdminPanelProps = {
  isAdmin: boolean;
  onLogin: (username: string, password: string) => { success: boolean; message?: string };
  onLogout: () => void;
};

export default function AdminPanel({ isAdmin, onLogin, onLogout }: AdminPanelProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await onLogin(username.trim(), password);
      if (result.success) {
        setUsername('');
        setPassword('');
        setError(null);
      } else {
        setError(result.message || 'Invalid username or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Admin Panel Login</h1>
          <p style={styles.subtitle}>
            Enter your credentials to access workflow management tools.
          </p>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                style={styles.input}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </label>
            <label style={styles.label}>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={styles.input}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </label>
            {error && <div style={styles.error}>{error}</div>}
            <button type="submit" style={styles.primaryButton} disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, width: '100%', maxWidth: '960px' }}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.heading}>Admin Panel</h1>
            <p style={styles.subtitle}>
              Manage chatbot workflows and preview the user experience.
            </p>
          </div>
          <button style={styles.secondaryButton} onClick={onLogout}>
            Log out
          </button>
        </header>

        <div style={styles.actions}>
          <Link to="/workflows" style={styles.linkButton}>
            View Saved Workflows
          </Link>
          <Link to="/workflow" style={styles.linkButtonSecondary}>
            Create New Workflow
          </Link>
        </div>

        <section style={styles.chatbotPanel}>
          <h2 style={styles.subheading}>Chatbot Preview</h2>
          <ChatbotWidget />
        </section>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: '32px 16px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
    padding: '32px',
  },
  heading: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#0f172a',
  },
  subheading: {
    margin: '0 0 16px 0',
    fontSize: '20px',
    fontWeight: 600,
    color: '#1f2937',
  },
  subtitle: {
    margin: '12px 0 24px',
    fontSize: '16px',
    color: '#475569',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  label: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: 600,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#0f172a',
    outline: 'none',
  },
  primaryButton: {
    marginTop: '12px',
    padding: '12px 18px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '10px 16px',
    backgroundColor: '#e2e8f0',
    color: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  linkButton: {
    padding: '12px 20px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
  },
  linkButtonSecondary: {
    padding: '12px 20px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#b91c1c',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '28px',
  },
  chatbotPanel: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0',
  },
};


