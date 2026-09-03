import React, { useEffect } from 'react';
import { X, ArrowRight, Image, FileText } from 'lucide-react';
import { Avatar } from '../common/Avatar';

export const IncomingMessageToast = ({ notification, onOpenChat, onDismiss }) => {
  const notifId = notification?.id;

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!notifId) return;
    const timer = setTimeout(() => {
      onDismiss(notifId);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notifId, onDismiss]);

  if (!notification) return null;

  const { conversationId, message, conversation } = notification;
  const targetConvId =
    conversationId ||
    conversation?._id ||
    conversation?.id ||
    message?.conversationId;

  const sender = message?.sender || {};
  const isGroup = conversation?.type === 'group';
  const hasImage = message?.attachments?.some((a) => a.type?.startsWith('image/'));
  const hasFile = message?.attachments?.length > 0 && !hasImage;

  const handleOpen = (e) => {
    e.stopPropagation();
    if (targetConvId) {
      onOpenChat(targetConvId.toString());
      onDismiss(notification.id);
    }
  };

  return (
    <div
      onClick={handleOpen}
      className="group pointer-events-auto w-full max-w-sm sm:max-w-md bg-white/95 dark:bg-dark-200/95 border border-brand-500/30 dark:border-brand-400/25 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-glow-sm cursor-pointer animate-slide-down flex items-start gap-3 relative overflow-hidden"
    >
      {/* Subtle brand glow accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-cyan-400 to-brand-600" />

      {/* Sender Avatar */}
      <div className="flex-shrink-0 mt-0.5 relative">
        <Avatar
          src={isGroup && conversation?.avatar ? conversation.avatar : sender.avatar}
          name={sender.name || 'User'}
          size="md"
          isOnline={true}
        />
        {isGroup && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center text-[9px] shadow-sm">
            #
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {sender.name || 'Teammate'}
            {isGroup && conversation?.name && (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 ml-1 truncate">
                in <span className="text-brand-600 dark:text-brand-400 font-semibold">{conversation.name}</span>
              </span>
            )}
          </p>
        </div>

        {/* Message preview snippet */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed break-words">
          {message.text ? (
            message.text
          ) : hasImage ? (
            <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-medium">
              <Image className="w-3.5 h-3.5 inline" /> Sent a photo
            </span>
          ) : hasFile ? (
            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-medium">
              <FileText className="w-3.5 h-3.5 inline" /> Sent an attachment
            </span>
          ) : (
            'Sent a message'
          )}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] font-semibold text-brand-600 dark:text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Open Chat</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default IncomingMessageToast;
