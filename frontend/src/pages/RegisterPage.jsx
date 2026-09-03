import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import { DEFAULT_AVATARS } from '../utils/constants';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, authError, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to /chat
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-cyan-500' };
      case 4:
      default:
        return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
    }
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    const derivedUsername = username.trim() || email.split('@')[0];

    const res = await register({
      name: name.trim(),
      username: derivedUsername,
      email: email.trim(),
      password,
      avatar: selectedAvatar,
    });

    setLoading(false);

    if (res.success) {
      addToast(`Account created! Welcome to CircleChat, ${res.user.name}`, 'success');
      navigate('/chat');
    } else {
      setError(res.error || 'Registration failed');
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
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-white/80 dark:bg-dark-300/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-6">
        {/* Left Side: Avatar Live Preview & Benefits (Hidden on small screens) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-3xl glass-card bg-white dark:bg-dark-200/60 border border-slate-200 dark:border-white/10 h-full min-h-[560px] shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl brand-gradient-bg p-0.5 shadow-glow-sm flex items-center justify-center">
                <div className="w-full h-full bg-white dark:bg-dark-300/80 rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
              </div>
              <span className="font-display font-black text-xl text-slate-900 dark:text-white">
                Circle<span className="brand-gradient-text">Chat</span>
              </span>
            </div>

            <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight leading-snug mb-2">
              Join your team in real time.
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Customize your profile and start collaborating with AI-powered conversation summaries.
            </p>

            {/* Live Profile Card Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-100/90 border border-brand-500/30 mb-6 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 tracking-wider mb-2.5">
                Live Profile Preview
              </p>
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedAvatar}
                  name={name || 'Your Name'}
                  size="lg"
                  isOnline={true}
                  showStatus={true}
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{name || 'Your Display Name'}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{username || 'username'}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">● Ready to collaborate</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                <span>Instant channel & direct messaging</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <span>Google Gemini AI Catch Me Up</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Encrypted JWT security</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-100/90 border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-500" />
              <span>Real-Time Engine</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Free Forever</span>
          </div>
        </div>

        {/* Right Side: Registration Form Card (7 cols) */}
        <div className="lg:col-span-7 glass-card bg-white dark:bg-dark-200/95 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl animate-scale-in">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Create your account
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Start chatting with your team in less than 30 seconds
            </p>
          </div>

          {(error || authError) && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{error || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Full Name"
                placeholder="Alex Rivera"
                icon={User}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />

              <Input
                label="Username (Optional)"
                placeholder="alex_dev"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={30}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="alex@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Strength:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-dark-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Avatar Selector Gallery */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Choose Profile Avatar
              </label>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {DEFAULT_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`relative rounded-full overflow-hidden p-0.5 transition-all flex-shrink-0 ${
                      selectedAvatar === av
                        ? 'ring-2 ring-brand-500 scale-110 shadow-glow-sm'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={av} alt="Preset" className="w-10 h-10 object-cover rounded-full" />
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              iconRight={ArrowRight}
              className="w-full mt-2"
            >
              Complete Registration
            </Button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/10 pt-4">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-brand-600 dark:text-brand-400 hover:text-brand-500 font-bold underline underline-offset-4 decoration-brand-500/40 transition-colors"
            >
              Sign in to account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
