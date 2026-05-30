import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';
import Header from '../Components/Header';
import './DashboardLayout.css';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1080);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1080);

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1080;
      setIsMobile(mobile);
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarOpen]);

  return (
    <div className="dashboard-shell">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="page-content">
          {children}
        </main>
      </div>
      {isMobile && sidebarOpen ? (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} role="button" tabIndex={0} />
      ) : null}
    </div>
  );
};

export default DashboardLayout;


