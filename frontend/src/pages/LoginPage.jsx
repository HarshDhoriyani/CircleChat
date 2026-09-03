import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Zap,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, authError, isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');

  useEffect(() => {
    const notice = localStorage.getItem('session_terminated_notice');
    if (notice) {
      setSessionNotice(notice);
      localStorage.removeItem('session_terminated_notice');
    }
  }, []);

  // If already logged in, redirect to /chat
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/chat', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!emailOrUsername.trim() || !password) {
      setError('Please provide your email/username and password');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login({
      email: emailOrUsername.trim(),
      password,
    });

    setLoading(false);

    if (res.success) {
      addToast(`Welcome back, ${res.user.name}!`, 'success');
      navigate('/chat');
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-slate-50 dark:bg-dark-400 text-slate-900 dark:text-slate-100 relative overflow-hidden select-none font-sans transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-brand-500/10 dark:bg-brand-600/15 blur-[140px] pointer-events-none -top-40 -left-40 z-0" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-500/10 dark:bg-cyan-600/15 blur-[140px] pointer-events-none -bottom-40 -right-40 z-0" />

      {/* Back to Home Link */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white transition-colors z-20 px-3 py-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-white/5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Side: Brand Showcase (5 cols) */}
        <div className="hidden lg:flex flex-col justify-between h-full space-y-8 lg:col-span-5 pr-4">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl brand-gradient-bg p-0.5 shadow-glow-sm">
                <div className="w-full h-full bg-white dark:bg-dark-300 rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
              </div>
              <div>
                <span className="text-xl font-black font-display tracking-tight text-slate-900 dark:text-white">
                  Circle<span className="text-brand-600 dark:text-brand-400">Chat</span>
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-brand-600 dark:text-cyan-400">
                  Real-Time Workspace
                </span>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold font-display leading-tight text-slate-900 dark:text-slate-100 mb-4">
              Real-time teamwork with <span className="brand-gradient-text">Gemini AI</span> synthesis.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Connect with teammates, create topic rooms, share rich media, and get up to speed in seconds with AI Catch Me Up summaries.
            </p>

            {/* Micro Highlights */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-cyan-400 flex-shrink-0" />
                <span>Zero-latency WebSockets & presence</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-cyan-400 flex-shrink-0" />
                <span>Google Gemini AI conversation synthesis</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>JWT cryptographic single-session security</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-100/90 border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Real-Time Engine</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">● Operational</span>
          </div>
        </div>

        {/* Right Side: Login Form Card (7 cols) */}
        <div className="lg:col-span-7 glass-card bg-white dark:bg-dark-200/95 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl animate-scale-in">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Sign in to your CircleChat account to continue
            </p>
          </div>

          {/* Session Termination Notice */}
          {sessionNotice && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5 animate-slide-up">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold">Security Notice</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{sessionNotice}</p>
              </div>
            </div>
          )}

          {(error || authError) && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{error || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email or Username"
              placeholder="alex@example.com or alex_dev"
              icon={Mail}
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Sign In to Workspace
              </Button>
            </div>
          </form>

          {/* Footer Navigation */}
          <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="text-brand-600 dark:text-cyan-400 font-bold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
