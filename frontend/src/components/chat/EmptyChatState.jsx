import React from 'react';
import { Users, Sparkles, Shield, Zap, UserPlus } from 'lucide-react';
import { Button } from '../common/Button';

export const EmptyChatState = ({ onStartDirectChat, onOpenCreateGroup }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-dark-300 text-slate-900 dark:text-slate-100 relative overflow-hidden select-none transition-colors duration-200">
      {/* Ambient Glow Background Effect */}
      <div className="absolute w-96 h-96 rounded-full bg-brand-500/10 dark:bg-brand-600/10 blur-3xl pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 dark:bg-cyan-600/10 blur-3xl pointer-events-none -bottom-20 -right-20" />

      <div className="relative z-10 max-w-md flex flex-col items-center">
        {/* Logo & Brand Icon */}
        <div className="w-20 h-20 rounded-3xl brand-gradient-bg p-0.5 shadow-glow-md mb-6 animate-pulse-subtle flex items-center justify-center">
          <div className="w-full h-full bg-white dark:bg-dark-300/80 backdrop-blur-sm rounded-[22px] flex items-center justify-center">
            <Sparkles className="w-9 h-9 text-brand-600 dark:text-brand-400" />
          </div>
        </div>

        <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight mb-2">
          Welcome to <span className="brand-gradient-text">CircleChat</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          Real-time messaging, group channels, document collaboration, and AI-powered conversation summaries at your fingertips.
        </p>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <Button
            variant="primary"
            size="md"
            icon={UserPlus}
            onClick={onStartDirectChat}
          >
            Start New Chat
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={Users}
            onClick={onOpenCreateGroup}
          >
            Create Group
          </Button>
        </div>

        {/* Key Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full text-left">
          <div className="p-3 rounded-2xl bg-white dark:bg-dark-200/60 border border-slate-200 dark:border-white/5 flex flex-col gap-1 shadow-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Real-Time</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Sub-millisecond WebSockets</span>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-dark-200/60 border border-slate-200 dark:border-white/5 flex flex-col gap-1 shadow-sm">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Catch Me Up</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Gemini AI Synthesis</span>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-dark-200/60 border border-slate-200 dark:border-white/5 flex flex-col gap-1 col-span-2 sm:col-span-1 shadow-sm">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-200">JWT Security</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Encrypted token auth</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyChatState;
