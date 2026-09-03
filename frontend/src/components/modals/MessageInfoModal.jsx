import React, { useState, useEffect } from 'react';
import {
  Info,
  CheckCheck,
  Clock,
  Loader2,
  AlertCircle,
  Users,
  EyeOff,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { useChat } from '../../hooks/useChat';
import { formatFullDateTime } from '../../utils/dateUtils';

export const MessageInfoModal = ({ isOpen, onClose, message }) => {
  const { getMessageInfo } = useChat();

  const [loading, setLoading] = useState(false);
  const [infoData, setInfoData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !message?._id) {
      setInfoData(null);
      setError('');
      return;
    }

    const fetchInfo = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getMessageInfo(message._id);
        const data = res?.data || res;
        setInfoData(data || null);
      } catch (err) {
        console.error('Failed to get message info:', err);
        setError(err.message || 'Failed to load delivery and read receipts');
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [isOpen, message?._id, getMessageInfo]);

  if (!message) return null;

  const isGroup = infoData?.isGroup;
  const readList = infoData?.readBy || [];
  const notReadList = infoData?.notReadYet || [];
  const deliveredList = infoData?.deliveredTo || [];
  const totalCount =
    infoData?.totalParticipantsCount || readList.length + notReadList.length;
  const isAllRead =
    infoData?.isAllRead || (totalCount > 0 && readList.length >= totalCount);
  const readPercentage =
    totalCount > 0 ? Math.round((readList.length / totalCount) * 100) : 0;

  // Direct chat recipient & receipts
  const directRecipient =
    infoData?.directRecipient ||
    readList[0]?.user ||
    notReadList[0]?.user ||
    deliveredList[0]?.user;
  const directRead = readList[0];
  const directDelivered = deliveredList[0] || notReadList[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Message Info"
      subtitle={
        isGroup
          ? 'Group delivery status & read receipts'
          : 'Delivery & read receipt status'
      }
      icon={Info}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-4">
        {/* 1. Message Preview Bubble */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/15">
          {message.text && (
            <p className="text-sm whitespace-pre-wrap leading-relaxed select-text font-normal">
              {message.text}
            </p>
          )}

          {message.attachments?.length > 0 && (
            <div className="text-xs text-white/85 mt-1">
              📎 {message.attachments.length} attachment
              {message.attachments.length > 1 ? 's' : ''}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-white/80 mt-2 pt-2 border-t border-white/15">
            <span>Sent: {formatFullDateTime(message.createdAt)}</span>
            {message.isEdited && <span className="italic">(edited)</span>}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600 dark:text-brand-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Loading receipts...
            </span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* DIRECT 1-TO-1 CHAT VIEW (WhatsApp Style Read & Delivered) */}
        {/* ========================================================= */}
        {!loading && !error && infoData && !isGroup && (
          <div className="space-y-4">
            {/* Recipient User Card */}
            {directRecipient && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-dark-100/90 border border-slate-200 dark:border-white/10">
                <Avatar
                  src={directRecipient.avatar}
                  name={directRecipient.name}
                  size="md"
                  status={directRecipient.status}
                  showStatus
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {directRecipient.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    @{directRecipient.username}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                  {directRead ? (
                    <span className="text-cyan-600 dark:text-cyan-400 flex items-center gap-1 font-bold">
                      <CheckCheck className="w-3.5 h-3.5 text-cyan-500" /> Read
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5 text-slate-400" /> Delivered
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* WhatsApp-Style Timestamps Card */}
            <div className="bg-slate-50 dark:bg-dark-100/90 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden divide-y divide-slate-200/70 dark:divide-white/5">
              {/* 1. READ / SEEN ROW */}
              <div className="p-3.5 flex items-start gap-3 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCheck className="w-4 h-4 text-cyan-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Read
                    </span>
                    {directRead?.readAt ? (
                      <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                        {formatFullDateTime(directRead.readAt)}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">
                        Not read yet
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {directRead?.readAt
                      ? 'Recipient opened and viewed this message'
                      : 'Recipient has not opened this conversation yet'}
                  </p>
                </div>
              </div>

              {/* 2. DELIVERED / REACHED ROW */}
              <div className="p-3.5 flex items-start gap-3 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Delivered
                    </span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {formatFullDateTime(
                        directDelivered?.deliveredAt ||
                          directRead?.deliveredAt ||
                          message.createdAt
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Message was received by recipient's device
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GROUP CHAT VIEW (Read By & Haven't Read Yet Lists)        */}
        {/* ========================================================= */}
        {!loading && !error && infoData && isGroup && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {/* Group Read Receipts Stats Bar */}
            {totalCount > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-100/90 border border-slate-200 dark:border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Read by {readList.length} of {totalCount} members
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isAllRead
                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <CheckCheck
                      className={`w-3.5 h-3.5 ${
                        isAllRead ? 'text-cyan-500' : 'text-slate-400'
                      }`}
                    />
                    <span>{isAllRead ? 'Read by all' : `${readPercentage}%`}</span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-dark-50/80 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isAllRead
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                        : 'bg-gradient-to-r from-brand-600 to-indigo-500'
                    }`}
                    style={{ width: `${Math.max(readPercentage, 4)}%` }}
                  />
                </div>
              </div>
            )}

            {/* SECTION A: READ BY */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <CheckCheck className="w-4 h-4 text-cyan-500" />
                  <span>Read by ({readList.length})</span>
                </div>
                {isAllRead && (
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">
                    ✓ Double Blue Ticked
                  </span>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-dark-100 rounded-2xl p-2 border border-slate-200 dark:border-white/5 divide-y divide-slate-200/70 dark:divide-white/5">
                {readList.length === 0 ? (
                  <div className="py-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 opacity-60" />
                    <span>No one has read this message yet</span>
                  </div>
                ) : (
                  readList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={item.user?.avatar}
                          name={item.user?.name}
                          size="sm"
                          status={item.user?.status}
                          showStatus
                        />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.user?.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            @{item.user?.username}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 pl-2">
                        <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 justify-end">
                          <CheckCheck className="w-3.5 h-3.5 text-cyan-500" />
                          <span>{formatFullDateTime(item.readAt)}</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECTION B: HAVEN'T READ YET */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Haven't read yet ({notReadList.length})</span>
              </div>

              <div className="bg-slate-50 dark:bg-dark-100 rounded-2xl p-2 border border-slate-200 dark:border-white/5 divide-y divide-slate-200/70 dark:divide-white/5">
                {notReadList.length === 0 ? (
                  <div className="py-3 text-center text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 font-medium">
                    <CheckCheck className="w-4 h-4 text-emerald-500" />
                    <span>Everyone in the group has read this message!</span>
                  </div>
                ) : (
                  notReadList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-2 opacity-90"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={item.user?.avatar}
                          name={item.user?.name}
                          size="sm"
                          status={item.user?.status}
                          showStatus
                        />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.user?.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            @{item.user?.username}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 pl-2">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                          Delivered:{' '}
                          {formatFullDateTime(
                            item.deliveredAt || message.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Close */}
        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-white/10">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MessageInfoModal;

