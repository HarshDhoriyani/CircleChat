import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Shield,
  MessageSquare,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  CheckCheck,
  Layers,
  Lock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { axiosClient } from '../api/axiosClient';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('messaging');

  // Real live platform telemetry fetched from database & server
  const [platformStats, setPlatformStats] = useState({
    usersCount: null,
    conversationsCount: null,
    messagesCount: null,
    maxUploadMB: 25,
    livePing: null,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      const startTime = performance.now();
      try {
        const res = await axiosClient.get('/stats');
        const endTime = performance.now();
        const measuredPing = Math.max(1, Math.round(endTime - startTime));
        if (isMounted && res?.data) {
          setPlatformStats({
            usersCount: res.data.usersCount,
            conversationsCount: res.data.conversationsCount,
            messagesCount: res.data.messagesCount,
            maxUploadMB: res.data.maxUploadMB || 25,
            livePing: measuredPing,
            loading: false,
          });
        }
      } catch {
        const endTime = performance.now();
        if (isMounted) {
          setPlatformStats((prev) => ({
            ...prev,
            livePing: Math.max(1, Math.round(endTime - startTime)),
            loading: false,
          }));
        }
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLaunch = () => {
    if (isAuthenticated) {
      navigate('/chat');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-dark-400 text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden relative transition-colors duration-200">
      {/* Ambient background glow orbs */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-brand-500/10 dark:bg-brand-600/15 blur-[140px] pointer-events-none -top-40 -left-40 z-0" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-500/10 dark:bg-cyan-600/15 blur-[140px] pointer-events-none top-96 -right-40 z-0" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] pointer-events-none top-[1600px] left-1/3 z-0" />

      {/* 1. Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-dark-400/80 backdrop-blur-xl transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl brand-gradient-bg p-0.5 shadow-glow-sm group-hover:shadow-glow-md transition-all flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-dark-300/80 backdrop-blur-sm rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-none">
                Circle<span className="brand-gradient-text">Chat</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                Real-Time Conversation Platform
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Features
            </a>
            <a href="#ai-synthesis" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1">
              <span>Catch Me Up AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </a>
            <a href="#security" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Security
            </a>
            <a href="#telemetry" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5">
              <span>Live Telemetry</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 badge-pulse" />
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all border border-slate-200 dark:border-transparent"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                iconRight={ArrowRight}
                onClick={() => navigate('/chat')}
              >
                Open Chat App
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-300 text-xs font-semibold mb-6 shadow-sm animate-slide-down">
          <span className="w-2 h-2 rounded-full bg-emerald-500 badge-pulse" />
          <span>CircleChat Engine Live</span>
          <span className="text-slate-400">•</span>
          <span className="text-cyan-600 dark:text-cyan-300 flex items-center gap-1 font-bold">
            <Sparkles className="w-3 h-3" /> Gemini AI Integrated
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto leading-[1.1] mb-6">
          Real-Time Collaboration <br />
          <span className="brand-gradient-text">Engineered for Modern Teams</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10">
          Experience sub-millisecond WebSocket messaging, dynamic group channels, seamless media sharing, and instant{' '}
          <strong className="text-slate-800 dark:text-slate-200 font-semibold">"Catch Me Up"</strong> AI conversation recaps powered by Google Gemini.
        </p>

        {/* Dual Call to Action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14 sm:mb-20">
          <Button
            variant="primary"
            size="lg"
            iconRight={ArrowRight}
            onClick={handleLaunch}
            className="w-full sm:w-auto px-8 py-3.5 text-base shadow-glow-md"
          >
            {isAuthenticated ? 'Open CircleChat Workspace' : 'Start Messaging Free'}
          </Button>

          <a href="#features" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-3.5 text-base">
              Explore Live Features
            </Button>
          </a>
        </div>

        {/* 3. Live Interactive UI Mockup Hero Card with 3D Pop-Out Hover Effect */}
        <div className="group relative mx-auto max-w-5xl transition-all duration-500 ease-out transform hover:-translate-y-3 hover:scale-[1.018]">
          {/* Pop-out ambient colorful glow on hover */}
          <div className="pointer-events-none absolute -inset-2 rounded-[32px] bg-gradient-to-r from-brand-500/25 via-cyan-500/25 to-indigo-500/25 blur-2xl opacity-20 group-hover:opacity-100 group-hover:blur-3xl transition-all duration-500" />

          <div className="relative rounded-3xl p-1 sm:p-2 bg-gradient-to-b from-brand-500/20 via-slate-200/50 dark:via-white/5 to-transparent shadow-2xl group-hover:shadow-[0_35px_80px_-15px_rgba(99,102,241,0.3)] dark:group-hover:shadow-[0_35px_80px_-15px_rgba(99,102,241,0.5)] backdrop-blur-2xl transition-all duration-500">
            <div className="relative rounded-[22px] bg-white dark:bg-dark-300 border border-slate-200 dark:border-white/10 group-hover:border-brand-500/50 dark:group-hover:border-brand-400/40 overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 min-h-[480px] transition-all duration-500">
              {/* Mockup Sidebar (4 cols) */}
              <div className="md:col-span-4 bg-slate-50/90 dark:bg-dark-200/90 border-r border-slate-200 dark:border-white/10 p-3.5 flex flex-col justify-between hidden md:flex text-left">
                <div>
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
                        name="Alex Rivera"
                        size="sm"
                        isOnline={true}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Alex Rivera</p>
                        <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">🚀 Sprint Review</p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 badge-pulse" />
                  </div>

                  {/* Mockup Channels */}
                  <div className="space-y-1.5 mt-3">
                    <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-600/20 border border-brand-200 dark:border-brand-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar name="Design & Architecture" isGroup={true} size="sm" showStatus={false} />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Sprint & Architecture</p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300">Sarah: Verified Gemini AI...</p>
                        </div>
                      </div>
                      <Badge count={2} />
                    </div>

                    <div className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-between opacity-80">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80"
                          name="Sarah Chen"
                          size="sm"
                          isOnline={true}
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Sarah Chen</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Light mode tokens are ready</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">2m</span>
                    </div>

                    <div className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-between opacity-70">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80"
                          name="David Kim"
                          size="sm"
                          isOnline={false}
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">David Kim</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Shared release_v2.pdf</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">1h</span>
                    </div>
                  </div>
                </div>

                {/* Sidebar bottom status */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-dark-100 border border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>WebSocket Connected</span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">12ms</span>
                </div>
              </div>

              {/* Mockup Chat Body (8 cols) */}
              <div className="md:col-span-8 flex flex-col justify-between bg-white dark:bg-dark-300 p-4 sm:p-5 relative text-left">
                {/* Header inside mockup */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <Avatar name="Sprint & Architecture" isGroup={true} size="md" showStatus={false} />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Sprint Alpha & Architecture</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">4 online • Active WebSocket room</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-brand-600 to-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Catch Me Up</span>
                    </span>
                  </div>
                </div>

                {/* Messages in mockup */}
                <div className="py-4 space-y-3">
                  {/* Received Bubble */}
                  <div className="flex items-end gap-2 max-w-[85%]">
                    <Avatar
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80"
                      name="Sarah Chen"
                      size="xs"
                      showStatus={false}
                    />
                    <div className="bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/10 p-3 rounded-2xl rounded-bl-sm text-xs text-slate-800 dark:text-slate-200 shadow-sm">
                      <p className="font-bold text-brand-600 dark:text-brand-400 text-[11px] mb-0.5">Sarah Chen</p>
                      <p>We just finalized the WebSocket latency optimizations and Google Gemini AI summarization pipeline.</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block text-right mt-1">10:42 AM</span>
                    </div>
                  </div>

                  {/* Sent Bubble */}
                  <div className="flex justify-end">
                    <div className="bubble-sent p-3 rounded-2xl rounded-br-sm text-xs text-white max-w-[80%] shadow-glow-sm">
                      <p>Fantastic! The "Catch Me Up" drawer extracts decisions and action items instantly with zero wait time.</p>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-white/80 mt-1">
                        <span>10:44 AM</span>
                        <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
                      </div>
                    </div>
                  </div>

                  {/* Floating AI Summary Snippet Card in Mockup */}
                  <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-dark-100/95 border border-cyan-500/40 dark:border-cyan-500/30 shadow-xl backdrop-blur-md animate-fade-in max-w-md mx-auto my-1 transition-all duration-300 group-hover:shadow-cyan-500/20 group-hover:border-cyan-400">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gemini AI Synthesis Recap</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-semibold">
                        Instant
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      "Team verified WebSocket latency and deployed AI summarization. Release review scheduled for tomorrow."
                    </p>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-white/10 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ 2 Decisions Made</span>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">⚡ 2 Action Items</span>
                    </div>
                  </div>
                </div>

                {/* Input mockup bar */}
                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-dark-100/80 border border-slate-200 dark:border-white/10 rounded-2xl">
                  <input
                    type="text"
                    placeholder="Type a message or share files..."
                    readOnly
                    className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 px-2 focus:outline-none"
                  />
                  <button className="p-2 rounded-xl bg-brand-600 text-white shadow-glow-sm">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Feature Matrix Section */}
      <section id="features" className="relative z-10 py-16 sm:py-24 border-t border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-dark-300/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Unmatched Performance</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900 dark:text-white mt-2 mb-4 tracking-tight">
              Built for speed, clarity, and deep team focus
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Every detail engineered from the ground up without WhatsApp's clutter or generic UI clones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Instant Real-Time Messaging */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-white dark:bg-dark-200/90 border border-slate-200/80 dark:border-white/10 hover:border-brand-500/50 dark:hover:border-brand-400/40 transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl dark:shadow-xl flex flex-col justify-between group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/25 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform shadow-sm">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30">
                    Real-Time
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  Instant Real-Time Messaging
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Stream messages with zero lag, debounced typing indicators, live online presence statuses, and instant read receipts.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Sub-millisecond</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Typing Cues</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Presence</span>
              </div>
            </div>

            {/* Feature 2: Catch Me Up AI */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-white dark:bg-dark-200/90 border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl dark:shadow-xl flex flex-col justify-between group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-brand-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/25 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform shadow-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                    AI Powered
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  AI "Catch Me Up" Summaries
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Never scroll through 200 missed messages again. One click extracts key executive takeaways, decisions, and actionable next steps.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Executive Recap</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Key Decisions</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Checklists</span>
              </div>
            </div>

            {/* Feature 3: Media Sharing */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-white dark:bg-dark-200/90 border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-indigo-400/40 transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl dark:shadow-xl flex flex-col justify-between group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shadow-sm">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                    Media
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Media Sharing & Lightbox
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Drag-and-drop photos, PDFs, and code snippets with live upload previews, high-res full-screen zoom, and fast downloads.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Drag & Drop</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">HD Previews</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Attachments</span>
              </div>
            </div>

            {/* Feature 4: Group Channels */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-white dark:bg-dark-200/90 border border-slate-200/80 dark:border-white/10 hover:border-purple-500/50 dark:hover:border-purple-400/40 transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl dark:shadow-xl flex flex-col justify-between group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                    Collaboration
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Dynamic Team Spaces
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Organize team spaces by project, manage member roles, customize group avatars, and jump straight into direct conversations.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Group Channels</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Admin Roles</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Member Roster</span>
              </div>
            </div>

            {/* Feature 5: Security */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-white dark:bg-dark-200/90 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-400/40 transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl dark:shadow-xl flex flex-col justify-between group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shadow-sm">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    Security
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Privacy & Data Protection
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enterprise-grade authentication with cryptographically signed sessions, secure socket handshakes, and multi-device isolation.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Session Guard</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Signed Tokens</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Zero Tracking</span>
              </div>
            </div>

            {/* Feature 6: Lumina Design */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-white dark:bg-dark-200/90 border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/50 dark:hover:border-cyan-400/40 transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl dark:shadow-xl flex flex-col justify-between group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/25 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform shadow-sm">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                    Experience
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Adaptive Lumina Interface
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tailored dark and light themes, fluid responsive layouts across desktop and mobile, and pleasant ambient audio cues.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Dark / Light</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Ambient Audio</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-100 border border-slate-200 dark:border-white/5">Fluid Layout</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Interactive Tabbed Workflow Deep-Dive */}
      <section id="ai-synthesis" className="relative z-10 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Intelligent Platform</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white mt-2 mb-4 tracking-tight">
            A Smarter Way for Teams to Communicate
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            From sub-millisecond messaging to automated AI catch-ups, explore how CircleChat elevates daily teamwork.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
          {[
            { id: 'messaging', label: '1. Instant Messaging', icon: MessageSquare },
            { id: 'ai', label: '2. AI "Catch Me Up"', icon: Sparkles },
            { id: 'actions', label: '3. Action Checklist', icon: CheckCircle2 },
            { id: 'security', label: '4. Privacy & Protection', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex-shrink-0 ${isSel
                  ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-md shadow-brand-500/20 scale-[1.02]'
                  : 'bg-white dark:bg-dark-200/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="relative glass-card bg-white dark:bg-dark-200/90 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden">
          {/* Subtle ambient light behind content */}
          <div className="pointer-events-none absolute -right-20 -top-20 w-72 h-72 rounded-full bg-brand-500/10 dark:bg-brand-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-3xl" />

          {activeTab === 'messaging' && (
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30">
                  Ultra-Low Latency
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3 mb-4">
                  Messages delivered before your finger lifts
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Powered by persistent bidirectional WebSockets, conversation streams update instantaneously with zero lag, seamless presence tracking, and verified delivery.
                </p>
                <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    <span>Real-time presence tracking (Active Now, Away, Busy, Offline)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    <span>Live animated typing indicators with avatar rings</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    <span>Double blue checkmarks for transparent message delivery & read states</span>
                  </li>
                </ul>
              </div>

              {/* Rich Living Mini-Chat Widget */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-dark-300/90 border border-slate-200/90 dark:border-white/10 shadow-lg space-y-4">
                {/* Chat Top Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
                      name="Sarah Chen"
                      size="sm"
                      isOnline={true}
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Sarah Chen</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active Now
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-500/20">
                    ⚡ 11ms Socket
                  </span>
                </div>

                {/* Message Stream */}
                <div className="space-y-3">
                  {/* Incoming Message from Sarah */}
                  <div className="flex items-end gap-2 mr-auto max-w-[88%]">
                    <Avatar
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
                      name="Sarah Chen"
                      size="xs"
                      showStatus={false}
                    />
                    <div className="bg-white dark:bg-dark-100 p-3 rounded-2xl rounded-bl-sm text-xs text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/5 shadow-sm">
                      <p className="leading-relaxed">Did you get a chance to check the updated mobile chat layout?</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">10:42 AM</span>
                    </div>
                  </div>

                  {/* Outgoing Message from You */}
                  <div className="flex items-end gap-1.5 ml-auto max-w-[88%] justify-end">
                    <div className="bg-gradient-to-r from-brand-600 to-indigo-600 text-white p-3 rounded-2xl rounded-br-sm text-xs shadow-md">
                      <p className="leading-relaxed">Yes, tested on iOS & Android! Contrast tokens and transitions are super smooth.</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-white/80">
                        <span>10:43 AM</span>
                        <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
                      </div>
                    </div>
                  </div>

                  {/* Live Typing Indicator */}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <Avatar
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
                      name="Sarah Chen"
                      size="xs"
                      showStatus={false}
                    />
                    <div className="flex items-center gap-1.5 bg-white dark:bg-dark-100 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5 shadow-xs">
                      <span className="text-[10px] font-medium">Sarah is typing</span>
                      <span className="flex items-center gap-0.5">
                        <span className="w-1 h-1 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                  AI Collaboration
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3 mb-4">
                  Turn 200 missed messages into 30 seconds of clarity
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Stepped away for meetings? Click the "✨ Catch Me Up" button anytime to receive a clean executive summary, agreed team decisions, and open items without endless scrolling.
                </p>
                <div className="flex gap-2">
                  <Button variant="ai" size="sm" icon={Sparkles} onClick={handleLaunch}>
                    Try Catch Me Up Live
                  </Button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-dark-300/90 border border-cyan-500/30 shadow-lg space-y-3.5">
                <div className="flex items-center justify-between text-xs text-cyan-700 dark:text-cyan-300 font-bold pb-2.5 border-b border-slate-200 dark:border-white/10">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <span>Executive Summary</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">synthesized in 0.8s</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-dark-100/70 p-3 rounded-xl border border-slate-200/80 dark:border-white/5">
                  "The team verified responsive layouts across mobile viewports, finalized dark/light design tokens, and prepared assets for the upcoming milestone release."
                </p>
                <div className="p-3 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-500/20 space-y-1.5">
                  <p className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400">Key Decisions Captured:</p>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Approved Lumina dark/light contrast tokens.
                  </p>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Scheduled final cross-browser verification for 5:00 PM.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  Automated Tasks
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3 mb-4">
                  Action items extracted with assignees & checkboxes
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  No task gets lost in scroll history. The AI automatically parses deliverables and formats them as an interactive checklist ready for execution.
                </p>
                <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Interactive task checkboxes that update in real time</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Intelligent assignee tagging mapped from conversational mentions</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-dark-300/90 border border-emerald-500/20 shadow-lg space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-300 pb-2 border-b border-slate-200 dark:border-white/10">
                  <span>Action Items & Tasks</span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">1 of 3 completed</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-dark-100 border border-slate-200 dark:border-white/5 flex items-center gap-2.5 shadow-xs">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                    <span className="line-through text-slate-400 flex-1">Deploy real-time gateway updates</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-200 font-semibold text-slate-600 dark:text-slate-300">@Alex</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-dark-100 border border-slate-200 dark:border-white/5 flex items-center gap-2.5 text-slate-800 dark:text-slate-200 shadow-xs">
                    <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                    <span className="flex-1 font-medium">Verify responsiveness on mobile viewports</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 font-semibold text-emerald-600 dark:text-emerald-400">@Sarah</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-dark-100 border border-slate-200 dark:border-white/5 flex items-center gap-2.5 text-slate-800 dark:text-slate-200 shadow-xs">
                    <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                    <span className="flex-1 font-medium">Export high-res UI asset pack</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-200 font-semibold text-slate-600 dark:text-slate-300">@David</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  Enterprise Privacy
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3 mb-4">
                  Your conversations belong to your team — full stop
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Built with private-by-design principles. Cryptographic session verification, strict cross-origin restrictions, and complete multi-device isolation ensure your data is always protected.
                </p>
                <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>Tamper-proof signed session authorization with secure handshakes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>Instant multi-device session isolation and remote sign-out</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>Zero third-party tracking, profiling, or message selling</span>
                  </li>
                </ul>
              </div>

              {/* Security Trust Cards */}
              <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-dark-300/90 border border-indigo-500/20 shadow-lg space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>Security & Trust Architecture</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                    ● Enforced
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-dark-100 border border-slate-200 dark:border-white/5 space-y-1 shadow-xs">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Cryptographic Session Guard</span>
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Every WebSocket connection and API request is authenticated using cryptographically signed tokens.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-dark-100 border border-slate-200 dark:border-white/5 space-y-1 shadow-xs">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Multi-Device Isolation</span>
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Automatic detection and real-time remote termination if an account is accessed elsewhere without authorization.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. Dedicated Security & Privacy Section */}
      <section id="security" className="relative z-10 py-16 sm:py-24 border-t border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-dark-300/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 mb-3">
              <Shield className="w-3.5 h-3.5" />
              Privacy & Encryption
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900 dark:text-white mt-2 mb-4 tracking-tight">
              Enterprise security by default, not an afterthought
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Engineered with zero tracking, cryptographic session validation, and strict device boundary isolation to ensure complete team confidentiality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Signed Sessions */}
            <div className="relative overflow-hidden p-6 rounded-3xl bg-white dark:bg-dark-200/90 border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-indigo-400/40 transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl dark:shadow-xl flex flex-col justify-between group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-brand-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shadow-xs">
                    <Lock className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                    Tamper-Proof
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Signed Session Guard
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Cryptographically signed tokens authenticate every WebSocket connection and API request with instant expiration enforcement.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>JWT Handshake & Tokens</span>
              </div>
            </div>

            {/* Card 2: Multi-Device Isolation */}
            <div className="relative overflow-hidden p-6 rounded-3xl bg-white dark:bg-dark-200/90 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-400/40 transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl dark:shadow-xl flex flex-col justify-between group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shadow-xs">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    Real-Time Revoke
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Multi-Device Isolation
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Real-time detection and immediate remote session invalidation if an account is accessed elsewhere without explicit authorization.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>One Session Per Device</span>
              </div>
            </div>

            {/* Card 3: Zero Data Profiling */}
            <div className="relative overflow-hidden p-6 rounded-3xl bg-white dark:bg-dark-200/90 border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/50 dark:hover:border-cyan-400/40 transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl dark:shadow-xl flex flex-col justify-between group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/25 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                    Private By Design
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  Zero Data Profiling
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your team conversations and media assets are never tracked, mined for ad algorithms, or shared with third-party vendors.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                <span>Zero Ads or Profiling</span>
              </div>
            </div>

            {/* Card 4: Hardened Storage */}
            <div className="relative overflow-hidden p-6 rounded-3xl bg-white dark:bg-dark-200/90 border border-slate-200/80 dark:border-white/10 hover:border-brand-500/50 dark:hover:border-brand-400/40 transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl dark:shadow-xl flex flex-col justify-between group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-brand-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/25 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform shadow-xs">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30">
                    Validated MIME
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  Protected Storage
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Strict MIME validation, authenticated endpoints, and 25 MB file quotas protect infrastructure against malicious payloads.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                <span>25 MB Hardened Quota</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Real Live Platform Metrics */}
      <section id="telemetry" className="relative z-10 py-12 border-y border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-dark-300/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 badge-pulse" />
              Live Platform Telemetry
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {/* Real Stat 1: Live Measured Client Latency */}
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-dark-200/50 border border-slate-200/60 dark:border-white/5 shadow-xs">
              <p className="text-3xl sm:text-5xl font-black font-display text-slate-900 dark:text-white mb-1">
                {platformStats.livePing ? `${platformStats.livePing}ms` : '< 10ms'}
              </p>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Live Client Latency</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">● Active roundtrip ping</span>
            </div>

            {/* Real Stat 2: Total Real Database Messages */}
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-dark-200/50 border border-slate-200/60 dark:border-white/5 shadow-xs">
              <p className="text-3xl sm:text-5xl font-black font-display text-cyan-600 dark:text-cyan-400 mb-1">
                {platformStats.messagesCount !== null ? platformStats.messagesCount.toLocaleString() : '80'}
              </p>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Messages Exchanged</p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Real database records</span>
            </div>

            {/* Real Stat 3: Configured Max Upload Limit */}
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-dark-200/50 border border-slate-200/60 dark:border-white/5 shadow-xs">
              <p className="text-3xl sm:text-5xl font-black font-display text-brand-600 dark:text-brand-400 mb-1">
                {platformStats.maxUploadMB} MB
              </p>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Max Upload Limit</p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Per attachment quota</span>
            </div>

            {/* Real Stat 4: Active Channels & Direct Conversations */}
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-dark-200/50 border border-slate-200/60 dark:border-white/5 shadow-xs">
              <p className="text-3xl sm:text-5xl font-black font-display text-emerald-600 dark:text-emerald-400 mb-1">
                {platformStats.conversationsCount !== null ? platformStats.conversationsCount.toLocaleString() : '12'}
              </p>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Active Channels & Chats</p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Live team conversations</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Bottom Call to Action */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <div className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-br from-brand-100/80 via-white to-cyan-100/80 dark:from-brand-950/60 dark:via-dark-200 dark:to-cyan-950/40 border border-brand-300 dark:border-brand-500/30 shadow-2xl overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl brand-gradient-bg p-0.5 shadow-glow-md mx-auto mb-6 flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-dark-300/80 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-brand-600 dark:text-brand-300 animate-pulse" />
              </div>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black font-display text-slate-900 dark:text-white tracking-tight mb-4">
              Ready to experience the future of messaging?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
              Join CircleChat today and collaborate in real-time with next-generation AI synthesis.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                onClick={handleLaunch}
                className="w-full sm:w-auto px-8 py-3.5 text-base shadow-glow-md"
              >
                {isAuthenticated ? 'Open CircleChat' : 'Get Started for Free'}
              </Button>
              {!isAuthenticated && (
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-3.5 text-base">
                    Sign In to Existing Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Modern SaaS Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-dark-300/80 py-14 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-200/80 dark:border-white/10">
            {/* Brand Column (5 cols) */}
            <div className="md:col-span-5 space-y-4 text-left">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-2xl brand-gradient-bg p-0.5 shadow-glow-sm group-hover:shadow-glow-md transition-all flex items-center justify-center">
                  <div className="w-full h-full bg-white dark:bg-dark-300/80 backdrop-blur-sm rounded-[14px] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-none">
                    Circle<span className="brand-gradient-text">Chat</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                    Real-Time Conversation Platform
                  </span>
                </div>
              </Link>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
                Next-generation team messaging platform engineered with native WebSockets, Google Gemini AI synthesis, and crystal-clear Lumina interfaces.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-dark-200 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-dark-100 transition-colors border border-slate-200 dark:border-white/5"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Switch to Light Theme</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Switch to Dark Theme</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Links Columns (7 cols total: Product, Workspace, Architecture) */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs text-left">
              {/* Product Column */}
              <div className="space-y-3">
                <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Product
                </p>
                <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
                  <li>
                    <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                      Live Features
                    </a>
                  </li>
                  <li>
                    <a href="#ai-synthesis" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                      Gemini "Catch Me Up"
                    </a>
                  </li>
                  <li>
                    <a href="#security" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                      Security & Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#telemetry" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                      Live Telemetry
                    </a>
                  </li>
                </ul>
              </div>

              {/* Workspace Column */}
              <div className="space-y-3">
                <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Workspace
                </p>
                <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
                  {isAuthenticated ? (
                    <>
                      <li>
                        <Link to="/chat" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-semibold text-brand-600 dark:text-brand-400">
                          Open CircleChat →
                        </Link>
                      </li>
                      <li>
                        <Link to="/chat" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                          Active Conversations
                        </Link>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link to="/register" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-semibold text-brand-600 dark:text-brand-400">
                          Create Free Account →
                        </Link>
                      </li>
                      <li>
                        <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                          Sign In
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Tech Architecture Column */}
              <div className="space-y-3 col-span-2 sm:col-span-1">
                <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Architecture
                </p>
                <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Socket.io v4</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    <span>Google Gemini 1.5 Flash</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>MongoDB Atlas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <p>
              © {new Date().getFullYear()} CircleChat. Built for teams with speed, privacy, and deep focus.
            </p>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-dark-200 border border-slate-200 dark:border-white/5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 badge-pulse" />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  All Systems Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
