import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MessageItem } from './MessageItem';
import { MessageContextMenu } from './MessageContextMenu';
import { MessageInfoModal } from '../modals/MessageInfoModal';
import { UserProfileModal } from '../modals/UserProfileModal';
import { TypingIndicator } from './TypingIndicator';
import { getDateSeparatorLabel } from '../../utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useToast } from '../common/Toast';
import { Loader2, Sparkles } from 'lucide-react';
import { CONVERSATION_TYPES } from '../../utils/constants';
import { useConfirm } from '../../context/ConfirmContext';

export const MessageList = ({
  messages = [],
  loading = false,
  conversation,
  typingUsers = [],
  searchQuery = '',
  activeMatchId = null,
}) => {
  const { user } = useAuth();
  const { deleteMessageForMe, deleteMessageForEveryone, setEditingMessage } = useChat();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    message: null,
  });

  // Info Modal State
  const [infoModalMessage, setInfoModalMessage] = useState(null);

  // User Profile Modal State
  const [viewingProfileUser, setViewingProfileUser] = useState(null);

  const isGroup = conversation?.type === CONVERSATION_TYPES.GROUP;
  const isAdmin =
    conversation?.creator?._id === user?._id ||
    conversation?.admins?.some((a) => (typeof a === 'object' ? a._id : a) === user?._id);

  // Deduplicate messages by _id / tempId
  const uniqueMessages = useMemo(() => {
    const list = [];
    const seenIds = new Set();
    for (const m of messages) {
      const key = m._id || m.tempId;
      if (key && !seenIds.has(key)) {
        seenIds.add(key);
        list.push(m);
      }
    }
    return list;
  }, [messages]);

  // Auto-scroll to bottom (only when not actively searching)
  const scrollToBottom = useCallback(
    (behavior = 'smooth') => {
      if (!searchQuery.trim() && !activeMatchId) {
        messagesEndRef.current?.scrollIntoView({ behavior });
      }
    },
    [searchQuery, activeMatchId]
  );

  useEffect(() => {
    scrollToBottom('auto');
  }, [conversation?._id, scrollToBottom]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [uniqueMessages.length, typingUsers.length, scrollToBottom]);

  // When activeMatchId changes, smoothly center the matching message
  useEffect(() => {
    if (activeMatchId) {
      const el = document.getElementById(`msg-${activeMatchId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeMatchId]);

  const handleOpenContextMenu = (e, msg) => {
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message: msg,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleStartEdit = (msg) => {
    setEditingMessage(msg);
  };

  const handleDeleteForMe = async (messageId) => {
    const ok = await confirm({
      title: 'Delete Message for You?',
      message: 'Are you sure you want to delete this message from your chat history? Other participants will still see it.',
      confirmText: 'Delete for Me',
      confirmVariant: 'danger',
    });
    if (!ok) return;

    const res = await deleteMessageForMe(messageId);
    if (res.success) {
      addToast('Message deleted for you', 'info');
    } else {
      addToast(res.error || 'Failed to delete message', 'error');
    }
  };

  const handlePromptDeleteForEveryone = async (messageId) => {
    const ok = await confirm({
      title: 'Delete Message for Everyone?',
      message: 'Are you sure you want to delete this message for everyone in this chat? This action cannot be undone.',
      confirmText: 'Delete for Everyone',
      confirmVariant: 'danger',
    });
    if (!ok) return;

    try {
      const res = await deleteMessageForEveryone(messageId);
      if (res.success) {
        addToast('Message deleted for everyone', 'info');
      } else {
        addToast(res.error || 'Failed to delete message for everyone', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete message for everyone', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-dark-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading message history...</span>
      </div>
    );
  }

  if (uniqueMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-dark-400 relative overflow-hidden select-none">
        <div className="absolute w-72 h-72 rounded-full bg-brand-500/5 dark:bg-brand-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl brand-gradient-bg p-0.5 shadow-glow-sm mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-dark-300 rounded-[22px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            </div>
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {isGroup ? `Welcome to ${conversation?.name || 'this channel'}` : `Start chatting with ${conversation?.name || 'teammate'}`}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Send a message, attach photos or documents, or try "Catch Me Up" AI summarization as your conversation grows!
          </p>
        </div>
      </div>
    );
  }

  let lastDateLabel = null;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 py-4 space-y-2 bg-slate-50 dark:bg-dark-400 text-slate-900 dark:text-slate-100 transition-colors duration-200"
    >
      {uniqueMessages.map((msg, idx) => {
        const currentDateLabel = getDateSeparatorLabel(msg.createdAt);
        const showDateSeparator = currentDateLabel !== lastDateLabel;
        lastDateLabel = currentDateLabel;

        const isSentByMe = (msg.sender?._id || msg.sender) === user?._id;

        const prevMsg = uniqueMessages[idx - 1];
        const isSameSenderAsPrev =
          prevMsg && (prevMsg.sender?._id || prevMsg.sender) === (msg.sender?._id || msg.sender);

        const isMatch =
          searchQuery.trim() &&
          (msg.text?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            msg.attachments?.some((a) => a.name?.toLowerCase().includes(searchQuery.toLowerCase().trim())));

        const isActiveMatch = Boolean(
          activeMatchId && (msg._id === activeMatchId || msg.tempId === activeMatchId)
        );

        return (
          <React.Fragment key={msg._id || msg.tempId || idx}>
            {showDateSeparator && (
              <div className="flex items-center justify-center my-4 select-none relative z-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-200/80 dark:bg-dark-100/90 border border-slate-300/70 dark:border-white/10 px-3 py-0.5 rounded-full shadow-xs backdrop-blur-md">
                  {currentDateLabel}
                </span>
              </div>
            )}

            <MessageItem
              message={msg}
              isSentByMe={isSentByMe}
              isGroup={isGroup}
              conversation={conversation}
              showSenderHeader={!isSameSenderAsPrev}
              searchQuery={searchQuery}
              isActiveMatch={isActiveMatch}
              onContextMenu={handleOpenContextMenu}
              onOpenProfile={setViewingProfileUser}
            />
          </React.Fragment>
        );
      })}

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      <div ref={messagesEndRef} />

      {/* Floating Right-Click Context Menu */}
      {contextMenu.visible && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          isSentByMe={(contextMenu.message?.sender?._id || contextMenu.message?.sender) === user?._id}
          isAdmin={isAdmin}
          onClose={handleCloseContextMenu}
          onOpenInfo={(msg) => setInfoModalMessage(msg)}
          onStartEdit={handleStartEdit}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForEveryone={handlePromptDeleteForEveryone}
        />
      )}

      {/* WhatsApp Style Message Info Modal */}
      <MessageInfoModal
        isOpen={Boolean(infoModalMessage)}
        onClose={() => setInfoModalMessage(null)}
        message={infoModalMessage}
      />

      {/* User Profile Modal */}
      {viewingProfileUser && (
        <UserProfileModal
          isOpen={Boolean(viewingProfileUser)}
          onClose={() => setViewingProfileUser(null)}
          user={viewingProfileUser}
        />
      )}
    </div>
  );
};

export default MessageList;
