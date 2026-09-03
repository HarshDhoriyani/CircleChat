import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Loader2, Edit3, X, Check } from 'lucide-react';
import { FileUploadPreview } from './FileUploadPreview';
import { useSocket } from '../../hooks/useSocket';
import { useChat } from '../../hooks/useChat';
import { uploadApi } from '../../api/uploadApi';
import { ACCEPTED_FILE_TYPES } from '../../utils/fileUtils';
import { useToast } from '../common/Toast';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🚀', '🎉', '💡', '✨', '👏', '😂', '🙏'];

export const MessageInput = ({ conversationId, onSendMessage, disabled = false }) => {
  const { emitTypingStart, emitTypingStop } = useSocket();
  const { editingMessage, setEditingMessage, editMessage } = useChat();
  const { addToast } = useToast();

  const [text, setText] = useState('');
  const [queuedFiles, setQueuedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Synchronize when entering editing mode
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '');
      setQueuedFiles([]);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
      }, 50);
    }
  }, [editingMessage]);

  // Reset when conversationId changes
  useEffect(() => {
    setText('');
    setQueuedFiles([]);
    setShowEmojiPicker(false);
    setEditingMessage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [conversationId, setEditingMessage]);

  // Handle typing indicator debounced stop
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    // Emit typing start only in normal compose mode
    if (!editingMessage) {
      if (!isTyping) {
        setIsTyping(true);
        emitTypingStart(conversationId);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        emitTypingStop(conversationId);
      }, 2000);
    }
  };

  // Handle File Selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        addToast(`"${file.name}" exceeds maximum allowed size of 25MB`, 'error');
        continue;
      }
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      validFiles.push({
        rawFile: file,
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl,
      });
    }

    setQueuedFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveQueuedFile = (index) => {
    setQueuedFiles((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const insertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Send or Edit message submission
  const handleSend = async (e) => {
    if (e) e.preventDefault();

    const trimmedText = text.trim();
    if (!trimmedText && queuedFiles.length === 0) return;
    if (uploading || savingEdit || disabled) return;

    // Handle Edit Submission
    if (editingMessage) {
      setSavingEdit(true);
      try {
        const res = await editMessage(editingMessage._id, trimmedText);
        if (res?.success) {
          addToast('Message updated', 'success');
          setText('');
        } else {
          addToast(res?.error || 'Failed to update message', 'error');
        }
      } catch (err) {
        addToast(err.message || 'Failed to update message', 'error');
      } finally {
        setSavingEdit(false);
      }
      return;
    }

    // Normal Send
    if (isTyping) {
      setIsTyping(false);
      emitTypingStop(conversationId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    const outgoingText = trimmedText;
    const outgoingFiles = [...queuedFiles];

    // Instantly reset input box for fluid 60fps UX
    setText('');
    setQueuedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    let uploadedAttachments = [];

    if (outgoingFiles.length > 0) {
      setUploading(true);
      try {
        const uploadPromises = outgoingFiles.map((item) =>
          uploadApi.uploadFile(item.rawFile)
        );
        const results = await Promise.all(uploadPromises);
        uploadedAttachments = results.map((res) => res.data?.file).filter(Boolean);
      } catch (err) {
        addToast(err.message || 'Failed to upload attachments', 'error');
        setText(outgoingText);
        setQueuedFiles(outgoingFiles);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    try {
      await onSendMessage({
        text: outgoingText,
        attachments: uploadedAttachments,
      });
    } catch (err) {
      addToast(err.message || 'Failed to deliver message', 'error');
      // Restore text if send failed completely
      setText(outgoingText);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    } else if (e.key === 'Escape' && editingMessage) {
      handleCancelEdit();
    }
  };

  const canSend = (text.trim().length > 0 || queuedFiles.length > 0) && !uploading && !savingEdit && !disabled;

  return (
    <div className="relative border-t border-slate-200 dark:border-white/10 bg-white dark:bg-dark-300 transition-colors duration-200">
      {/* Inline Editing Mode Banner */}
      {editingMessage && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-brand-500/10 border-b border-brand-500/20 text-xs text-brand-700 dark:text-brand-300 animate-slide-up">
          <div className="flex items-center gap-2 truncate pr-2">
            <Edit3 className="w-4 h-4 flex-shrink-0 text-brand-600 dark:text-brand-400" />
            <span className="font-bold">Edit Message:</span>
            <span className="truncate text-slate-700 dark:text-slate-300 italic font-normal">
              "{editingMessage.text}"
            </span>
          </div>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Queued Attachments Preview Tray */}
      {!editingMessage && (
        <FileUploadPreview
          files={queuedFiles}
          onRemoveFile={handleRemoveQueuedFile}
          uploading={uploading}
        />
      )}

      {/* Quick Emoji Bar Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 sm:left-6 mb-2 p-2 bg-white dark:bg-dark-100 border border-slate-200 dark:border-white/15 rounded-2xl shadow-xl flex items-center gap-1 z-20 animate-scale-in">
          {QUICK_EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => insertEmoji(emoji)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-lg transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Composer Toolbar */}
      <div className="max-w-6xl mx-auto flex items-end gap-2 p-3 sm:p-4">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
        />

        {/* Input Capsule Box */}
        <div className="flex-1 bg-slate-100 dark:bg-dark-100/90 border border-slate-200 dark:border-white/10 focus-within:bg-white dark:focus-within:bg-dark-100 focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/15 rounded-2xl flex items-center px-3 py-1.5 transition-all duration-200 shadow-inner">
          {/* Attachment button (disabled in edit mode) */}
          {!editingMessage && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || disabled}
              className="p-2 rounded-xl text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-200/60 dark:hover:bg-white/5 transition-colors disabled:opacity-50 flex-shrink-0"
              title="Attach images or documents (up to 25MB)"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          )}

          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className={`p-2 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0 mr-1 ${
              showEmojiPicker
                ? 'text-amber-500 bg-amber-500/10'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-200/60 dark:hover:bg-white/5'
            }`}
            title="Add emoji"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Auto-expanding Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || uploading || savingEdit}
            placeholder={
              editingMessage
                ? 'Edit your message... (Enter to save, Esc to cancel)'
                : 'Type a message... (Enter to send, Shift+Enter for new line)'
            }
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none resize-none max-h-32 overflow-y-auto leading-relaxed py-1.5 px-1"
          />
        </div>

        {/* Send / Save Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={`p-3 rounded-2xl flex items-center justify-center transition-all duration-150 flex-shrink-0 ${
            canSend
              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/25 active:scale-95 cursor-pointer'
              : 'bg-slate-200 dark:bg-dark-100 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-white/5 cursor-not-allowed opacity-60'
          }`}
          title={editingMessage ? 'Save changes' : 'Send message'}
        >
          {uploading || savingEdit ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : editingMessage ? (
            <Check className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
