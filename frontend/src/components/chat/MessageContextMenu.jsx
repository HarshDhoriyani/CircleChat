import React, { useEffect, useRef } from 'react';
import { Info, Edit3, Copy, Trash2, Trash } from 'lucide-react';
import { useToast } from '../common/Toast';

export const MessageContextMenu = ({
  x,
  y,
  message,
  isSentByMe,
  isAdmin,
  onClose,
  onOpenInfo,
  onStartEdit,
  onDeleteForMe,
  onDeleteForEveryone,
}) => {
  const menuRef = useRef(null);
  const { addToast } = useToast();

  // Close on outside click, window resize, or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  if (!message) return null;

  const isDeleted = message.deletedForEveryone;
  const hasText = Boolean(message.text && !isDeleted);
  const canEdit = isSentByMe && !isDeleted && hasText;
  const canDeleteForEveryone = (isSentByMe || isAdmin) && !isDeleted;

  // Screen bounds collision detection
  const menuWidth = 200;
  const menuHeight = 220;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 16);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 16);

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      addToast('Message copied to clipboard', 'info');
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${Math.max(16, adjustedY)}px`, left: `${Math.max(16, adjustedX)}px` }}
      className="fixed z-50 w-52 bg-white dark:bg-dark-200 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl py-1.5 px-1 backdrop-blur-xl animate-scale-in text-xs select-none"
    >
      {/* 1. Message Info (WhatsApp style) */}
      {isSentByMe && !isDeleted && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenInfo(message);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-medium transition-colors text-left"
        >
          <Info className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Message Info</span>
        </button>
      )}

      {/* 2. Edit Message */}
      {canEdit && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onStartEdit(message);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-medium transition-colors text-left"
        >
          <Edit3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Edit Message</span>
        </button>
      )}

      {/* 3. Copy Text */}
      {hasText && (
        <button
          type="button"
          onClick={handleCopy}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-medium transition-colors text-left"
        >
          <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Copy Text</span>
        </button>
      )}

      <div className="my-1 border-t border-slate-200 dark:border-white/10" />

      {/* 4. Delete for Me */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onDeleteForMe(message._id);
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 font-medium transition-colors text-left"
      >
        <Trash2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span>Delete for Me</span>
      </button>

      {/* 5. Delete for Everyone */}
      {canDeleteForEveryone && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onDeleteForEveryone(message._id);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-medium transition-colors text-left"
        >
          <Trash className="w-4 h-4 text-rose-500" />
          <span>Delete for Everyone</span>
        </button>
      )}
    </div>
  );
};

export default MessageContextMenu;
