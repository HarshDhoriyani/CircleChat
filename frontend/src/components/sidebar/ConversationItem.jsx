import React from 'react';
import { Image, FileText, Ban } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { formatSidebarTime } from '../../utils/dateUtils';
import { CONVERSATION_TYPES } from '../../utils/constants';

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highlightTextMatches = (text, searchQuery, keyPrefix = '') => {
  if (!text || typeof text !== 'string' || !searchQuery || !searchQuery.trim()) {
    return text;
  }

  const query = searchQuery.trim();
  const escaped = escapeRegExp(query);
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark
          key={`${keyPrefix}-match-${i}`}
          className="bg-amber-300 dark:bg-amber-400 text-slate-950 font-bold px-0.5 rounded-xs"
        >
          {part}
        </mark>
      );
    }
    return <React.Fragment key={`${keyPrefix}-txt-${i}`}>{part}</React.Fragment>;
  });
};

export const ConversationItem = ({
  conversation,
  isSelected,
  onClick,
  typingUsers = [],
  searchQuery = '',
}) => {
  const { user: currentUser } = useAuth();
  const { isUserOnline } = useSocket();

  const isGroup = conversation.type === CONVERSATION_TYPES.GROUP;

  // For direct chats, locate the other participant
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

  const lastMsg = conversation.lastMessage;
  const isTyping = typingUsers.length > 0;

  // Format preview snippet
  const renderMessagePreview = () => {
    if (isTyping) {
      const typingName = typingUsers[0]?.name?.split(' ')[0] || 'Someone';
      return (
        <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-medium text-xs">
          <span>{typingName} is typing</span>
          <div className="flex items-center gap-0.5">
            <span className="w-1 h-1 rounded-full bg-brand-500 typing-dot-1" />
            <span className="w-1 h-1 rounded-full bg-brand-500 typing-dot-2" />
            <span className="w-1 h-1 rounded-full bg-brand-500 typing-dot-3" />
          </div>
        </div>
      );
    }

    if (!lastMsg) {
      return <span className="text-slate-400 dark:text-slate-500 italic">No messages yet</span>;
    }

    // If deleted for current user
    const isDeletedForMe =
      Array.isArray(lastMsg.deletedFor) &&
      lastMsg.deletedFor.some(
        (id) => (typeof id === 'object' ? id._id || id : id)?.toString() === currentUser?._id?.toString()
      );

    if (isDeletedForMe) {
      return <span className="text-slate-400 dark:text-slate-500 italic">No messages yet</span>;
    }

    if (lastMsg.deletedForEveryone) {
      return (
        <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 italic">
          <Ban className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>This message was deleted</span>
        </span>
      );
    }

    const isSentByMe = (lastMsg.sender?._id || lastMsg.sender) === currentUser?._id;
    const senderPrefix = isGroup && !isSentByMe ? `${lastMsg.sender?.name?.split(' ')[0] || 'User'}: ` : isSentByMe ? 'You: ' : '';

    if (lastMsg.attachments?.length > 0) {
      const firstAtt = lastMsg.attachments[0];
      const isImg = firstAtt.type?.startsWith('image/');
      return (
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
          <span>{senderPrefix}</span>
          {isImg ? <Image className="w-3.5 h-3.5 text-brand-500" /> : <FileText className="w-3.5 h-3.5 text-cyan-500" />}
          <span>{highlightTextMatches(firstAtt.name || (isImg ? 'Photo' : 'Document'), searchQuery, 'att')}</span>
        </span>
      );
    }

    return (
      <span className="text-slate-600 dark:text-slate-400 truncate">
        {senderPrefix}
        {highlightTextMatches(lastMsg.text || '', searchQuery, 'txt')}
      </span>
    );
  };

  const unreadCount = conversation.unreadCount || 0;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-150 mx-2 select-none ${
        isSelected
          ? 'bg-brand-50 dark:bg-brand-600/15 border border-brand-300 dark:border-brand-500/30 shadow-sm'
          : 'hover:bg-slate-100 dark:hover:bg-dark-100/80 border border-transparent'
      }`}
    >
      {/* Avatar with live status dot */}
      <Avatar
        src={avatarSrc}
        name={displayName}
        size="md"
        isGroup={isGroup}
        isOnline={isOnline}
        status={otherParticipant?.status}
        showStatus={!isGroup}
      />

      {/* Main Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h4
            className={`text-xs font-bold truncate ${
              isSelected ? 'text-brand-600 dark:text-white' : 'text-slate-900 dark:text-slate-200'
            }`}
          >
            {displayName}
          </h4>

          {lastMsg?.createdAt && (
            <span
              className={`text-[10px] flex-shrink-0 ${
                unreadCount > 0 ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {formatSidebarTime(lastMsg.createdAt)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="truncate flex-1 text-[11px] leading-relaxed">
            {renderMessagePreview()}
          </div>

          {unreadCount > 0 && <Badge count={unreadCount} />}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
