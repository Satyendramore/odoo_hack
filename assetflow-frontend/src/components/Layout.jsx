import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function Layout() {
  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1">
        <Topbar />
        <main className="flex-grow-1 p-4 af-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
