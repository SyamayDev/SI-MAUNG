import React from 'react';
import { Outlet } from 'react-router-dom';
import useResponsive from '../../hooks/useResponsive';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNavbar from './MobileNavbar';
import './Layout.css';

const PageContainer = () => {
  const isMobile = useResponsive();

  return (
    <div className="layout-wrapper">
      {!isMobile && <Sidebar />}
      <div className="page-frame">
        <Topbar />
        <main className={`main-content ${isMobile ? 'mobile-content-padding' : ''}`}>
          <Outlet />
        </main>
      </div>
      {isMobile && <MobileNavbar />}
    </div>
  );
}

export default PageContainer;