import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Mic, Target, BarChart2 } from 'lucide-react';
import './Layout.css';
import { useModal } from '../../context/ModalContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ArrowLeftRight, label: 'History', path: '/transactions' },
  { icon: Mic, label: 'Talk', path: '/talk' },
  { icon: Target, label: 'Savings', path: '/savings' },
  { icon: BarChart2, label: 'Analytics', path: '/analytics' },
];

const MobileNavbar = () => {
  const { openVoiceModal } = useModal();

  const handleTalkClick = (e) => {
    e.preventDefault();
    openVoiceModal();
  };

  return (
    <nav className="mobile-navbar">
      {navItems.map((item) => {
        if (item.label === 'Talk') {
          return (
            <button
              key={item.path}
              type="button"
              className="mobile-nav-link mobile-nav-add"
              onClick={handleTalkClick}
            >
              <div className="mobile-add-button">
                <item.icon size={30} />
              </div>
            </button>
          );
        }

        return (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}>
            <item.icon size={22} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileNavbar;
