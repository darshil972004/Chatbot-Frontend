import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const AdminNavbar: React.FC = () => {
  return (
    <header className="admin-navbar">
      <div className="admin-navbar__inner">
        <div className="admin-navbar__brand">
          <img src={logo} alt="RealEstate CRM" className="admin-navbar__logo" />
          <span className="admin-navbar__brandName">RealEstate CRM</span>
        </div>

        <div className="admin-navbar__title">
          <h1>Chatbot Administration</h1>
          <p>Configure conversational flows and capture requirements</p>
        </div>

        <div className="admin-navbar__meta">
          {/* Removed Last reviewed */}
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
