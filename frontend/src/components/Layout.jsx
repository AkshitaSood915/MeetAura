import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export function Layout({ children }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-aura-violet/30 selection:text-white">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {/* Footer ONLY on home page */}
      {isHomePage && <Footer />}
    </div>
  );
}

export default Layout;
