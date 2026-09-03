import React, { useState } from 'react';
import { CheckCheck, FileText, Download, Clock, AlertCircle, Ban, MoreVertical } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { ImageLightbox } from './ImageLightbox';
import { formatMessageTime } from '../../utils/dateUtils';
import { formatFileSize, isImageFile } from '../../utils/fileUtils';
import { MESSAGE_TYPES } from '../../utils/constants';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highlightTextMatches = (text, searchQuery, isSentByMe, keyPrefix = '') => {
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
          className="bg-amber-300 dark:bg-amber-400 text-slate-950 font-bold px-1 py-0.5 rounded-sm shadow-xs inline-block"
        >
          {part}
        </mark>
      );
    }
    return <React.Fragment key={`${keyPrefix}-txt-${i}`}>{part}</React.Fragment>;
  });
};

const renderFormattedText = (rawText, isSentByMe, searchQuery = '') => {
  if (!rawText) return null;

  // Split by URLs first
  const parts = rawText.split(URL_REGEX);

  return parts.map((part, index) => {
    if (URL_REGEX.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`underline font-medium break-all ${
            isSentByMe
              ? 'text-cyan-200 hover:text-white'
              : 'text-brand-600 dark:text-cyan-400 hover:underline'
          }`}
        >
          {highlightTextMatches(part, searchQuery, isSentByMe, `url-${index}`)}
        </a>
      );
    }

    // Split by inline code snippets (e.g. `code`)
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((subPart, subIndex) => {
      if (subPart.startsWith('`') && subPart.endsWith('`') && subPart.length > 2) {
        const codeContent = subPart.slice(1, -1);
        return (
          <code
            key={`${index}-${subIndex}`}
            className={`px-1.5 py-0.5 rounded text-[12px] font-mono ${
              isSentByMe
                ? 'bg-black/25 text-white'
                : 'bg-slate-200 dark:bg-dark-300 text-brand-600 dark:text-cyan-400'
            }`}
          >
            {highlightTextMatches(codeContent, searchQuery, isSentByMe, `code-${index}-${subIndex}`)}
          </code>
        );
      }
      return (
        <React.Fragment key={`${index}-${subIndex}`}>
          {highlightTextMatches(subPart, searchQuery, isSentByMe, `plain-${index}-${subIndex}`)}
        </React.Fragment>
      );
    });
  });
};

export const MessageItem = ({
  message,
  isSentByMe,
  isGroup,
  conversation,
  showSenderHeader = true,
  searchQuery = '',
  isActiveMatch = false,
  onContextMenu,
  onOpenProfile,
}) => {
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // System Message
  if (message.isSystem || message.messageType === MESSAGE_TYPES.SYSTEM) {
    return (
      <div id={`msg-${message._id || message.tempId}`} className="flex justify-center my-3 select-none">
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-dark-100 px-3.5 py-1 rounded-full border border-slate-200 dark:border-white/5 shadow-xs">
          {highlightTextMatches(message.text, searchQuery, false, 'sys')}
        </span>
      </div>
    );
  }

  const isDeleted = message.deletedForEveryone;
  const senderName = message.sender?.name || 'User';
  const senderAvatar = message.sender?.avatar;

  // WhatsApp style read receipt status calculation
  const senderId = (message.sender?._id || message.sender)?.toString();
  let isAllRead = false;
  let readMembersCount = 0;
  let totalRecipientsCount = 0;

  if (isSentByMe) {
    if (isGroup) {
      // In group, count how many other participants exist
      const otherParticipants = (conversation?.participants || []).filter((p) => {
        const pId = (typeof p === 'object' ? p._id : p)?.toString();
        return pId && pId !== senderId;
      });
      totalRecipientsCount = otherParticipants.length;

      const readOtherUserIds = new Set();
      (message.readBy || []).forEach((r) => {
        const id = (typeof r === 'object' ? r._id : r)?.toString();
        if (id && id !== senderId) {
          readOtherUserIds.add(id);
        }
      });
      (message.readReceipts || []).forEach((r) => {
        const id = (typeof r.user === 'object' ? r.user?._id : r.user)?.toString();
        if (id && id !== senderId) {
          readOtherUserIds.add(id);
        }
      });

      readMembersCount = readOtherUserIds.size;
      // Double blue ticks ONLY when ALL other group members have read it!
      isAllRead = totalRecipientsCount > 0 && readMembersCount >= totalRecipientsCount;
    } else {
      // 1-to-1 Direct Chat
      const isReadByRecipient =
        (Array.isArray(message.readReceipts) &&
          message.readReceipts.some(
            (r) => (typeof r.user === 'object' ? r.user?._id : r.user)?.toString() !== senderId
          )) ||
        (Array.isArray(message.readBy) &&
          message.readBy.some(
            (r) => (typeof r === 'object' ? r._id : r)?.toString() !== senderId
          ));

      isAllRead = isReadByRecipient;
      readMembersCount = isReadByRecipient ? 1 : 0;
      totalRecipientsCount = 1;
    }
  }

  const handleContextMenu = (e) => {
    if (isDeleted) return;
    e.preventDefault();
    if (onContextMenu) {
      onContextMenu(e, message);
    }
  };

  const handleMoreClick = (e) => {
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, message);
    }
  };

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        className={`flex items-end gap-2.5 my-1.5 group relative ${
          isSentByMe ? 'justify-end' : 'justify-start'
        }`}
      >
        {/* Received sender avatar */}
        {!isSentByMe && (
          <Avatar
            src={senderAvatar}
            name={senderName}
            size="sm"
            showStatus={false}
            className={`mb-0.5 flex-shrink-0 ${onOpenProfile ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
            onClick={onOpenProfile && message.sender ? () => onOpenProfile(message.sender) : undefined}
          />
        )}

        {/* Action button on hover */}
        {!isDeleted && (
          <button
            type="button"
            onClick={handleMoreClick}
            className={`opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-opacity mb-1 self-center ${
              isSentByMe ? 'order-first mr-1' : 'order-last ml-1'
            }`}
            title="Message options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        )}

        {/* Bubble Container */}
        <div
          className={`flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${
            isSentByMe ? 'items-end' : 'items-start'
          }`}
        >
          {/* Group Sender Name Header */}
          {!isSentByMe && isGroup && showSenderHeader && (
            <span
              onClick={onOpenProfile && message.sender ? () => onOpenProfile(message.sender) : undefined}
              className={`text-[11px] font-bold text-brand-600 dark:text-brand-400 mb-1 ml-1 truncate max-w-xs ${
                onOpenProfile ? 'cursor-pointer hover:underline' : ''
              }`}
            >
              {senderName}
            </span>
          )}

          {/* Deleted Message State */}
          {isDeleted ? (
            <div
              id={`msg-${message._id || message.tempId}`}
              className={`px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 select-none border ${
                isActiveMatch
                  ? 'ring-2 ring-amber-400 dark:ring-amber-300 ring-offset-2 dark:ring-offset-dark-400 shadow-md shadow-amber-500/20'
                  : ''
              } ${
                isSentByMe
                  ? 'bg-slate-100/70 dark:bg-dark-100/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 rounded-br-xs'
                  : 'bg-slate-100/70 dark:bg-dark-100/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 rounded-bl-xs'
              }`}
            >
              <Ban className="w-3.5 h-3.5 opacity-70" />
              <span className="italic">This message was deleted</span>
              <span className="text-[10px] text-slate-400 ml-1">
                {formatMessageTime(message.createdAt)}
              </span>
            </div>
          ) : (
            /* Standard Message Bubble */
            <div
              id={`msg-${message._id || message.tempId}`}
              className={`relative px-4 py-2.5 text-sm break-words transition-all duration-300 ${
                isActiveMatch
                  ? 'ring-3 ring-amber-400 dark:ring-amber-300 ring-offset-2 dark:ring-offset-dark-400 shadow-xl shadow-amber-500/25 scale-[1.01]'
                  : ''
              } ${
                isSentByMe
                  ? 'bg-gradient-to-br from-brand-600 to-indigo-600 text-white rounded-2xl rounded-br-xs shadow-md shadow-brand-500/15'
                  : 'bg-white dark:bg-dark-100 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 rounded-2xl rounded-bl-xs shadow-xs'
              }`}
            >
              {/* Attachments Section */}
              {message.attachments?.length > 0 && (
                <div className="space-y-2 mb-2">
                  {message.attachments.map((att, idx) => {
                    const isImg = isImageFile(att.type, att.name);
                    if (isImg) {
                      return (
                        <div
                          key={idx}
                          onClick={() => setLightboxSrc(att.url)}
                          className="relative rounded-xl overflow-hidden cursor-pointer max-w-sm group/img bg-slate-100 dark:bg-dark-400/40 border border-slate-200 dark:border-white/10 hover:border-brand-500/40 transition-all"
                        >
                          <img
                            src={att.url}
                            alt={att.name || 'Attachment'}
                            className="w-full max-h-72 object-cover transition-transform duration-300 group-hover/img:scale-[1.02]"
                            loading="lazy"
                          />
                        </div>
                      );
                    }

                    // Document / File Card
                    return (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          isSentByMe
                            ? 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                            : 'bg-slate-50 dark:bg-dark-200/90 hover:bg-slate-100 dark:hover:bg-dark-200 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSentByMe
                              ? 'bg-white/15 text-white'
                              : 'bg-brand-50 dark:bg-white/10 text-brand-600 dark:text-white'
                          }`}
                        >
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs font-semibold truncate">
                            {highlightTextMatches(att.name, searchQuery, isSentByMe, `att-${idx}`)}
                          </p>
                          <p
                            className={`text-[10px] ${
                              isSentByMe ? 'text-white/80' : 'text-slate-500 dark:text-white/70'
                            }`}
                          >
                            {formatFileSize(att.size)}
                          </p>
                        </div>
                        <div
                          className={`p-1.5 rounded-lg flex-shrink-0 ${
                            isSentByMe
                              ? 'bg-white/15 hover:bg-white/25 text-white'
                              : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 text-slate-700 dark:text-white'
                          }`}
                        >
                          <Download className="w-4 h-4" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Message Text with URL Linkification, Search Highlighting & Inline Code Formatting */}
              {message.text && (
                <div className="whitespace-pre-wrap leading-relaxed select-text font-normal text-[13.5px]">
                  {renderFormattedText(message.text, isSentByMe, searchQuery)}
                </div>
              )}

              {/* Timestamp, Edited Tag & Status footer */}
              <div
                className={`flex items-center gap-1.5 mt-1 select-none text-[10px] ${
                  isSentByMe ? 'text-white/85 justify-end' : 'text-slate-400 dark:text-slate-400 justify-end'
                }`}
              >
                {message.isEdited && (
                  <span className="italic opacity-80 font-normal mr-0.5">edited</span>
                )}

                <span>{formatMessageTime(message.createdAt)}</span>

                {/* Status Ticks for Sent Messages */}
                {isSentByMe && (
                  <span className="flex items-center ml-0.5">
                    {message.pending ? (
                      <Clock className="w-3 h-3 text-white/70 animate-pulse" title="Sending..." />
                    ) : message.failed ? (
                      <AlertCircle className="w-3 h-3 text-rose-300" title="Failed to send" />
                    ) : isAllRead ? (
                      <CheckCheck
                        className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]"
                        title={isGroup ? `Read by all ${totalRecipientsCount} members` : 'Read'}
                      />
                    ) : (
                      <CheckCheck
                        className="w-3.5 h-3.5 text-white/70 stroke-[2]"
                        title={
                          isGroup
                            ? readMembersCount > 0
                              ? `Read by ${readMembersCount} of ${totalRecipientsCount} members`
                              : 'Delivered to group'
                            : 'Delivered'
                        }
                      />
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox for clicked images */}
      <ImageLightbox
        src={lightboxSrc}
        isOpen={Boolean(lightboxSrc)}
        onClose={() => setLightboxSrc(null)}
      />
    </>
  );
};

export default MessageItem;
