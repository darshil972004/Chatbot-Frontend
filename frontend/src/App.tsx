import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import ChatbotWidget from './components/ChatbotWidget';
import AdminLayout from './components/AdminPanel/AdminLayout';
import ChatbotConfig from './components/AdminPanel/ChatbotConfig';
import WorkflowManagement from './components/WorkflowManagement';
import WorkflowList from './components/WorkflowList';
import './components/chatbot.css';

function Home() {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20, display: 'flex', gap: '12px' }}>
        <Link to="/workflows" style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
          View Workflows
        </Link>
        <Link to="/workflow" style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
          Create New Workflow
        </Link>
      </div>
      <ChatbotWidget />
    </div>
  );
}

function WorkflowPage() {
  return <WorkflowManagement />;
}

export default function App() {
  return (
    <RecoilRoot>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workflows" element={<WorkflowList />} />
          <Route path="/workflow" element={<WorkflowPage />} />
          <Route path="/workflow/:workflowId" element={<WorkflowPage />} />
          {/* Admin routes */}
          <Route path="/admin-panel" element={<AdminLayout />}>
            <Route index element={<Navigate to="chatbot" replace />} />
            <Route path="chatbot" element={<ChatbotConfig />} />
            {/* Add more admin routes here as needed */}
          </Route>
        </Routes>
      </Router>
    </RecoilRoot>
  );
}
