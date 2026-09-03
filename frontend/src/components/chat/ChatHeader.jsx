import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Users, Search, X, ChevronUp, ChevronDown, User } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { CatchMeUpModal } from '../modals/CatchMeUpModal';
import { GroupInfoModal } from '../modals/GroupInfoModal';
import { UserProfileModal } from '../modals/UserProfileModal';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { formatLastSeen } from '../../utils/dateUtils';
import { CONVERSATION_TYPES } from '../../utils/constants';

export const ChatHeader = ({
  conversation,
  onBack,
  searchQuery = '',
  onSearchChange,
  matchesCount = 0,
  currentMatchIndex = 0,
  onNextMatch,
  onPrevMatch,
}) => {
  const { user: currentUser } = useAuth();
  const { isUserOnline } = useSocket();

  const [isCatchMeUpOpen, setIsCatchMeUpOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(Boolean(searchQuery.trim()));

  // Reset all modals and search bar whenever the active conversation changes
  useEffect(() => {
    setIsCatchMeUpOpen(false);
    setIsGroupInfoOpen(false);
    setIsUserProfileOpen(false);
    setShowSearchInput(false);
  }, [conversation?._id]);

  if (!conversation) return null;

  const isGroup = conversation.type === CONVERSATION_TYPES.GROUP;

  // Find other participant for direct chat
  const otherParticipant = !isGroup
    ? (conversation.participants || []).find((p) => {
        const pId = typeof p === 'object' ? (p._id || p.id) : p;
        const currentId = currentUser?._id || currentUser?.id;
        return String(pId) !== String(currentId);
      })
    : null;

  const displayName = isGroup
    ? conversation.name || 'Group Channel'
    : otherParticipant?.name || 'User';

  const avatarSrc = isGroup ? conversation.avatar : otherParticipant?.avatar;
  const isOnline = isGroup ? false : isUserOnline(otherParticipant?._id || otherParticipant);

  const subtitle = isGroup
    ? `${conversation.participants?.length || 0} participants`
    : isOnline
    ? otherParticipant?.status === 'busy'
      ? 'Busy'
      : otherParticipant?.status === 'away'
      ? 'Away'
      : 'Online'
    : otherParticipant?.lastSeen
    ? formatLastSeen(otherParticipant.lastSeen)
    : 'Offline';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch?.();
      } else {
        onNextMatch?.();
      }
    } else if (e.key === 'Escape') {
      onSearchChange?.('');
      setShowSearchInput(false);
    }
  };

  return (
    <>
      <div className="h-16 px-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white/90 dark:bg-dark-200/60 backdrop-blur-md z-10 select-none transition-colors duration-200 gap-2">
        {/* Left Side: Back button (Mobile) + Avatar & Status */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {!showSearchInput ? (
            <div
              onClick={() => (isGroup ? setIsGroupInfoOpen(true) : setIsUserProfileOpen(true))}
              className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
              title={isGroup ? 'View group info' : `View ${displayName}'s profile`}
            >
              <Avatar
                src={avatarSrc}
                name={displayName}
                size="md"
                isGroup={isGroup}
                isOnline={isOnline}
                status={otherParticipant?.status}
                showStatus={!isGroup}
              />

              <div className="min-w-0 text-left">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                  <span>{displayName}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 font-medium">
                  {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 badge-pulse" />}
                  <span>{subtitle}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-dark-100/90 border border-brand-500/40 rounded-xl px-3 py-1.5 animate-scale-in max-w-lg">
              <Search className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onKeyDown={handleKeyDown}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search messages in this chat..."
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />

              {/* Match Counter & Match Navigation Chevrons */}
              {searchQuery.trim() && (
                <div className="flex items-center gap-1 flex-shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-dark-200/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/5">
                  <span>
                    {matchesCount > 0
                      ? `${currentMatchIndex + 1} of ${matchesCount}`
                      : 'No matches'}
                  </span>
                  {matchesCount > 0 && (
                    <div className="flex items-center ml-1 border-l border-slate-200 dark:border-white/10 pl-1 gap-0.5">
                      <button
                        type="button"
                        onClick={onPrevMatch}
                        title="Previous match (Shift + Enter)"
                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={onNextMatch}
                        title="Next match (Enter)"
                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  onSearchChange?.('');
                  setShowSearchInput(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* In-Chat Search Button */}
          <button
            type="button"
            onClick={() => {
              setShowSearchInput(!showSearchInput);
              if (showSearchInput) onSearchChange?.('');
            }}
            className={`p-2 rounded-xl transition-all ${
              showSearchInput
                ? 'text-brand-600 bg-brand-500/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
            title="Search messages in chat"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* ✨ Catch Me Up AI Button */}
          <Button
            size="sm"
            variant="ai"
            icon={Sparkles}
            onClick={() => setIsCatchMeUpOpen(true)}
            className="shadow-glow-cyan text-xs"
          >
            <span className="hidden sm:inline">Catch Me Up</span>
            <span className="sm:hidden">AI</span>
          </Button>

          {/* Details Button: Group Info or Direct User Profile */}
          {isGroup ? (
            <button
              type="button"
              onClick={() => setIsGroupInfoOpen(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
              title="Group Details & Members"
            >
              <Users className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsUserProfileOpen(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
              title={`View ${displayName}'s profile`}
            >
              <User className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* AI Synthesis Modal */}
      <CatchMeUpModal
        isOpen={isCatchMeUpOpen}
        onClose={() => setIsCatchMeUpOpen(false)}
        conversation={conversation}
      />

      {/* Group Info Modal */}
      {isGroup && (
        <GroupInfoModal
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          conversation={conversation}
        />
      )}

      {/* User Profile Modal (Direct Chat) */}
      {!isGroup && otherParticipant && (
        <UserProfileModal
          isOpen={isUserProfileOpen}
          onClose={() => setIsUserProfileOpen(false)}
          user={otherParticipant}
        />
      )}
    </>
  );
};

export default ChatHeader;
