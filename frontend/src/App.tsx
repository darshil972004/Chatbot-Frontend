import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import ChatbotWidget from './components/ChatbotWidget';
import AdminLayout from './components/AdminPanel/AdminLayout';
import ChatbotConfig from './components/AdminPanel/ChatbotConfig';
import './components/chatbot.css';

export default function App() {
  return (
    <RecoilRoot>
      <Router>
        <Routes>
          {/* Public route for the chatbot widget */}
          <Route path="/" element={
            <div style={{ padding: 20 }}>
              <ChatbotWidget />
            </div>
          } />
          
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
