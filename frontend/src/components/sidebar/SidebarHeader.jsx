import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, LogOut, Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useConfirm } from '../../context/ConfirmContext';
import { ProfileModal } from '../modals/ProfileModal';

export const SidebarHeader = ({ onStartDirectChat, onOpenCreateGroup }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isMuted, toggleMute } = useSoundEffects();
  const { confirm } = useConfirm();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogoutClick = async () => {
    const ok = await confirm({
      title: 'Log Out?',
      message: 'Are you sure you want to log out of CircleChat? You will need to sign in again to access your messages.',
      confirmText: 'Log Out',
      confirmVariant: 'danger',
      icon: LogOut,
    });
    if (ok) {
      await logout();
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      <div className="p-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-dark-200/60 backdrop-blur-md transition-colors duration-200">
        {/* User profile card & trigger */}
        <div
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-3 p-1.5 -ml-1 rounded-xl hover:bg-slate-200/60 dark:hover:bg-white/5 cursor-pointer transition-all min-w-0 flex-1"
        >
          <Avatar
            src={user?.avatar}
            name={user?.name}
            status={user?.presencePreference || (user?.status && user.status !== 'offline' ? user.status : 'online') || 'online'}
            isOnline={true}
            size="md"
            showStatus={true}
          />
          <div className="min-w-0 flex-1 text-left">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">{user?.name}</h3>
            <p className="text-[11px] text-brand-600 dark:text-brand-400/90 truncate font-medium">
              {user?.customStatus || `@${user?.username}`}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Audio Mute / Unmute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className={`p-2 rounded-xl transition-all ${
              isMuted
                ? 'text-rose-500 hover:bg-rose-500/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:bg-slate-200/60 dark:hover:bg-white/5'
            }`}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* New Group Button */}
          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-slate-200/60 dark:hover:bg-white/5 rounded-xl transition-all"
            title="Create New Group"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* New Direct Chat Button */}
          <button
            type="button"
            onClick={onStartDirectChat}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-slate-200/60 dark:hover:bg-white/5 rounded-xl transition-all"
            title="Start Direct Chat"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          {/* Quick theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-slate-200/60 dark:hover:bg-white/5 rounded-xl transition-all"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogoutClick}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default SidebarHeader;
