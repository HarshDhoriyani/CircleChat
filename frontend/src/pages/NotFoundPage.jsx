import React from 'react';
import { Link } from 'react-router-dom';
import { Home, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-dark-400 text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden transition-colors duration-200">
      {/* Ambient background aura */}
      <div className="absolute w-96 h-96 rounded-full bg-brand-500/15 blur-[120px] pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none -bottom-20 -right-20" />

      <div className="relative z-10 max-w-md w-full p-8 sm:p-10 rounded-3xl bg-white/80 dark:bg-dark-300/80 border border-slate-200/80 dark:border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl brand-gradient-bg flex items-center justify-center shadow-glow-md mx-auto mb-5">
          <span className="font-display font-black text-2xl text-white tracking-tight">404</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white mb-2 tracking-tight">
          Page Not Found
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
          The requested conversation or destination does not exist or has moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" icon={Home} className="w-full">
              Back to Home
            </Button>
          </Link>
          <Link to="/chat" className="w-full sm:w-auto">
            <Button variant="primary" size="md" icon={MessageSquare} className="w-full shadow-glow-sm">
              Open Chat
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
