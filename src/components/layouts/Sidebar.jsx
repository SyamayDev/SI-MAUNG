import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Bot, Target, BarChart2, Settings, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dasbor', path: '/dashboard' },
  { icon: ArrowLeftRight, label: 'Transaksi', path: '/transactions' },
  { icon: Bot, label: 'Asisten AI', path: '/ai' },
  { icon: Target, label: 'Tabungan', path: '/savings' },
  { icon: BarChart2, label: 'Analitik', path: '/analytics' },
  { icon: Settings, label: 'Pengaturan', path: '/settings' },
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
          <span>SI MAUNG</span>
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
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
