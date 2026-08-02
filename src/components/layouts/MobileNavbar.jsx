import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Target, BarChart2, Mic } from 'lucide-react';
import './Layout.css';
// import { useModal } from '../../context/ModalContext';
// import VoiceTransactionModal from '../voice/VoiceTransactionModal';

const navItemsLeft = [
  { icon: LayoutDashboard, label: 'Dasbor', path: '/dashboard' },
  { icon: ArrowLeftRight, label: 'Riwayat', path: '/transactions' },
];

const navItemsRight = [
  { icon: Target, label: 'Tabungan', path: '/savings' },
  { icon: BarChart2, label: 'Analitik', path: '/analytics' },
];

const MobileNavbar = () => {
  // const { openModal } = useModal();

  const handleVoiceClick = () => {
    console.log('Voice button clicked!');
    // openModal(<VoiceTransactionModal />);
  };

  const renderNavLink = (item) => (
    <NavLink
      key={item.path}
      to={item.path}
      className={({ isActive }) =>
        `mobile-nav-link ${isActive ? 'active' : ''}`
      }
    >
      <item.icon size={22} strokeWidth={1.5} />
      <span className="mobile-nav-label">{item.label}</span>
    </NavLink>
  );

  return (
    <nav className="mobile-navbar">
      {navItemsLeft.map(renderNavLink)}

      <div className="mobile-fab-placeholder">
        <button
          type="button"
          className="mobile-fab"
          aria-label="Bicara dengan SI MAUNG"
          onClick={handleVoiceClick}
        >
          <Mic size={24} />
        </button>
      </div>

      {navItemsRight.map(renderNavLink)}
    </nav>
  );
};

export default MobileNavbar;
