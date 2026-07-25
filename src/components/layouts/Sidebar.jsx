import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Bot, Target, BarChart2, Settings, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
  { icon: Bot, label: 'AI Assistant', path: '/ai' },
  { icon: Target, label: 'Savings', path: '/savings' },
  { icon: BarChart2, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const Sidebar = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Sparkles size={20} />
          </div>
          <span>MoneyTalk</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="sidebar-logout">
        <button type="button" className="logout-button" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
