import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import './AdminPanel.css';

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
