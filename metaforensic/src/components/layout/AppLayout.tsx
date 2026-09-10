import React from 'react';
import { Outlet, Link } from '@tanstack/react-router';
import { Shield, Trash, Home, Download, BarChart2 } from 'lucide-react';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--color-charcoal-900)] text-slate-200 flex flex-col font-sans selection:bg-[var(--color-accent-cyan)] selection:text-white">
      <header className="border-b border-[var(--color-charcoal-700)] bg-[var(--color-charcoal-800)] px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-[var(--color-accent-green)]" />
          <span className="font-semibold tracking-widest text-sm text-slate-300">METAFORENSIC</span>
        </div>
        <nav className="flex space-x-6 text-sm">
          <Link
            to="/"
            className="[&.active]:text-[var(--color-accent-cyan)] text-slate-400 hover:text-slate-200 transition-colors flex items-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>HOME</span>
          </Link>
          <Link
            to="/analysis"
            className="[&.active]:text-[var(--color-accent-cyan)] text-slate-400 hover:text-slate-200 transition-colors flex items-center space-x-2"
          >
            <BarChart2 className="w-4 h-4" />
            <span>ANALYSIS</span>
          </Link>
          <Link
            to="/privacy"
            className="[&.active]:text-[var(--color-accent-cyan)] text-slate-400 hover:text-slate-200 transition-colors flex items-center space-x-2"
          >
            <Shield className="w-4 h-4" />
            <span>PRIVACY</span>
          </Link>
          <Link
            to="/cleaner"
            className="[&.active]:text-[var(--color-accent-cyan)] text-slate-400 hover:text-slate-200 transition-colors flex items-center space-x-2"
          >
            <Trash className="w-4 h-4" />
            <span>CLEANER</span>
          </Link>
          <Link
            to="/export"
            className="[&.active]:text-[var(--color-accent-cyan)] text-slate-400 hover:text-slate-200 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT</span>
          </Link>
        </nav>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};
