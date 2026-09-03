import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Calendar,
  Sparkles,
  Copy,
  Check,
  MessageSquare,
  ShieldCheck,
  Clock,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useChat } from '../../hooks/useChat';
import { useToast } from '../common/Toast';
import { userApi } from '../../api/userApi';
import { formatLastSeen, formatFullDateTime } from '../../utils/dateUtils';
import { format } from 'date-fns';
import { SOCKET_EVENTS, USER_STATUS } from '../../utils/constants';

export const UserProfileModal = ({
  isOpen,
  onClose,
  user: initialUser,
  userId: propUserId,
  onChatStarted,
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const { createDirectChat, selectConversation, activeConversation } = useChat();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(initialUser || null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [startingChat, setStartingChat] = useState(false);

  const targetUserId =
    (initialUser?._id || initialUser?.id || propUserId)?.toString() || null;
  const isSelf =
    targetUserId &&
    String(targetUserId) === String(currentUser?._id || currentUser?.id);

  // Synchronize and fetch fresh user profile data whenever modal opens
  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const res = await userApi.getUserById(targetUserId);
      if (res?.data?.user) {
        setProfile((prev) => ({
          ...prev,
          ...res.data.user,
        }));
      }
    } catch (err) {
      console.warn('Failed to load full user profile:', err.message);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (isOpen) {
      setProfile(initialUser || null);
      fetchProfile();
    } else {
      setCopiedField(null);
      setStartingChat(false);
    }
  }, [isOpen, initialUser, fetchProfile]);

  // Keep synced if viewing self and current user updates
  useEffect(() => {
    if (isOpen && isSelf && currentUser) {
      setProfile((prev) => ({
        ...prev,
        ...currentUser,
      }));
    }
  }, [isOpen, isSelf, currentUser]);

  // Real-time listener for live status and custom status updates
  useEffect(() => {
    if (!isOpen || !socket || !targetUserId) return;

    const handleStatusChange = ({ userId, status, customStatus, lastSeen, user: updatedUser }) => {
      if (String(userId) === String(targetUserId)) {
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: status !== undefined ? status : prev.status,
            customStatus: customStatus !== undefined ? customStatus : prev.customStatus,
            lastSeen: lastSeen !== undefined ? lastSeen : prev.lastSeen,
            ...(updatedUser || {}),
          };
        });
      }
    };

    socket.on(SOCKET_EVENTS.USER_STATUS_CHANGE, handleStatusChange);

    return () => {
      socket.off(SOCKET_EVENTS.USER_STATUS_CHANGE, handleStatusChange);
    };
  }, [isOpen, socket, targetUserId]);

  if (!isOpen) return null;

  const currentOnline = isSelf ? true : isUserOnline(targetUserId);
  const presenceStatus =
    currentOnline
      ? (profile?.status === USER_STATUS.AWAY || profile?.status === USER_STATUS.BUSY)
        ? profile.status
        : USER_STATUS.ONLINE
      : USER_STATUS.OFFLINE;

  const handleCopy = async (text, fieldName, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      addToast(`${label} copied to clipboard`, 'success');
      setTimeout(() => {
        setCopiedField((prev) => (prev === fieldName ? null : prev));
      }, 2000);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  const handleStartDirectChat = async () => {
    if (!targetUserId || isSelf) return;

    // If we are already in direct chat with this user, simply close modal
    const otherParticipantId =
      activeConversation?.type === 'direct'
        ? (activeConversation.participants || []).find((p) => {
            const pId = typeof p === 'object' ? (p._id || p.id) : p;
            return String(pId) !== String(currentUser?._id || currentUser?.id);
          })
        : null;

    const currentOtherId = typeof otherParticipantId === 'object' ? otherParticipantId?._id : otherParticipantId;

    if (currentOtherId && String(currentOtherId) === String(targetUserId)) {
      onClose();
      return;
    }

    setStartingChat(true);
    try {
      const res = await createDirectChat(targetUserId);
      if (res?.conversation?._id) {
        selectConversation(res.conversation);
        navigate(`/chat/${res.conversation._id}`);
        onClose();
        onChatStarted?.();
      } else {
        addToast('Unable to open conversation', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to start chat', 'error');
    } finally {
      setStartingChat(false);
    }
  };

  const displayName = profile?.name || 'User Profile';
  const username = profile?.username || '';
  const customStatus = profile?.customStatus || '';
  const avatar = profile?.avatar;

  let memberSinceFormatted = '';
  if (profile?.createdAt) {
    try {
      memberSinceFormatted = format(new Date(profile.createdAt), 'MMMM d, yyyy');
    } catch {
      memberSinceFormatted = '';
    }
  }

  const getPresenceBadge = () => {
    if (presenceStatus === USER_STATUS.ONLINE) {
      return (
        <Badge variant="success" size="sm" className="shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 badge-pulse" />
          <span>Active Now</span>
        </Badge>
      );
    }
    if (presenceStatus === USER_STATUS.AWAY) {
      return (
        <Badge variant="warning" size="sm" className="shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Away</span>
        </Badge>
      );
    }
    if (presenceStatus === USER_STATUS.BUSY) {
      return (
        <Badge variant="danger" size="sm" className="shadow-sm">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>Busy / Do Not Disturb</span>
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="sm" className="shadow-sm">
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        <span>{profile?.lastSeen ? formatLastSeen(profile.lastSeen) : 'Offline'}</span>
      </Badge>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile"
      subtitle={isSelf ? 'Your public contact card' : 'Member information & presence'}
      icon={User}
      maxWidth="max-w-md"
    >
      {loading && !profile ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          <span>Loading profile...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
        {/* Profile Card Header Banner */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-dark-100/90 dark:via-dark-200/80 dark:to-dark-100/60 p-5 shadow-sm">
          {/* Subtle ambient decorative backdrop */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

          <div className="flex flex-col items-center text-center relative z-10">
            <div className="relative mb-3.5">
              <Avatar
                src={avatar}
                name={displayName}
                size="2xl"
                isOnline={currentOnline}
                status={profile?.status}
                showStatus={true}
                className="shadow-xl ring-4 ring-white dark:ring-dark-300"
              />
            </div>

            <div className="flex items-center gap-1.5 justify-center max-w-full">
              <h3 className="text-lg font-extrabold font-display text-slate-900 dark:text-white truncate">
                {displayName}
              </h3>
              <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0" title="Verified Account" />
            </div>

            {username && (
              <button
                type="button"
                onClick={() => handleCopy(`@${username}`, 'username', 'Username')}
                className="group flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                title="Click to copy username"
              >
                <span>@{username}</span>
                {copiedField === 'username' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                )}
              </button>
            )}

            <div className="mt-3 flex items-center justify-center">
              {getPresenceBadge()}
            </div>
          </div>
        </div>

        {/* Custom Status Card */}
        {customStatus && (
          <div className="p-3.5 rounded-2xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 tracking-wider">
                Current Status
              </p>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 break-words italic">
                "{customStatus}"
              </p>
            </div>
          </div>
        )}

        {/* User Details List */}
        {(memberSinceFormatted || (!currentOnline && profile?.lastSeen)) && (
          <div className="space-y-1 rounded-2xl bg-slate-50 dark:bg-dark-100/50 border border-slate-200 dark:border-white/5 p-3.5 text-xs">
            {/* Member Joined Date */}
            {memberSinceFormatted && (
              <div
                className={`flex items-center justify-between py-1.5 ${
                  !currentOnline && profile?.lastSeen ? 'border-b border-slate-200/60 dark:border-white/5' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Joined:</span>
                  <span className="text-slate-900 dark:text-white">{memberSinceFormatted}</span>
                </div>
              </div>
            )}

            {/* Last Seen timestamp (when offline) */}
            {!currentOnline && profile?.lastSeen && (
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Last Seen:</span>
                  <span className="text-slate-900 dark:text-white">{formatFullDateTime(profile.lastSeen)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          {!isSelf && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={startingChat}
              icon={MessageSquare}
              onClick={handleStartDirectChat}
            >
              Direct Message
            </Button>
          )}
        </div>
      </div>
      )}
    </Modal>
  );
};

export default UserProfileModal;
