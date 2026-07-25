import React from 'react';
import { Bell, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Topbar = () => {
  const { profile } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <p className="topbar-welcome">{getGreeting()},</p>
          <h1 className="topbar-title">{profile?.full_name?.split(' ')[0] || 'MoneyTalk'}</h1>
        </div>
      </div>
      <div className="topbar-actions">
        <button type="button" className="icon-button" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <div className="topbar-profile">
          <div className="topbar-avatar">
            {profile?.full_name ? profile.full_name[0].toUpperCase() : <UserCircle size={20} />}
          </div>
          <div className="topbar-profile-meta">
            <span>{profile?.full_name || 'Guest User'}</span>
            <small>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</small>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
