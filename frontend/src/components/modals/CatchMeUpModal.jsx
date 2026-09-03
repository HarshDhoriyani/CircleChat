import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, CheckSquare, Calendar, AlertCircle, Copy, Check, RefreshCw, Layers } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { aiApi } from '../../api/aiApi';
import { useToast } from '../common/Toast';
import { useSoundEffects } from '../../hooks/useSoundEffects';

export const CatchMeUpModal = ({ isOpen, onClose, conversation }) => {
  const { addToast } = useToast();
  const { playSound } = useSoundEffects();

  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkedActions, setCheckedActions] = useState({});

  const fetchSummary = useCallback(
    async (onlyUnread = unreadOnly) => {
      if (!conversation?._id) return;
      setLoading(true);
      setError(null);

      try {
        const res = await aiApi.getCatchMeUpSummary(conversation._id, {
          unreadOnly: onlyUnread,
          messageLimit: 50,
        });

        if (res?.data?.summary) {
          setSummaryData(res.data.summary);
          playSound('ai');
        } else {
          setError('No summary data returned from AI processor');
        }
      } catch (err) {
        console.error('Catch Me Up error:', err);
        setError(err.message || 'Failed to synthesize conversation with AI');
      } finally {
        setLoading(false);
      }
    },
    [conversation?._id, unreadOnly, playSound]
  );

  useEffect(() => {
    if (isOpen && conversation?._id) {
      fetchSummary(unreadOnly);
    } else {
      setSummaryData(null);
      setError(null);
      setCheckedActions({});
    }
  }, [isOpen, conversation?._id, unreadOnly, fetchSummary]);

  const handleToggleTask = (taskId) => {
    setCheckedActions((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleCopySummary = () => {
    if (!summaryData) return;

    let text = `✨ CircleChat AI Recap — ${conversation?.name || 'Conversation'}\n\n`;
    text += `📝 SUMMARY:\n${summaryData.summary}\n\n`;

    if (summaryData.decisions?.length > 0) {
      text += `🎯 KEY DECISIONS:\n`;
      summaryData.decisions.forEach((d) => (text += `• ${d}\n`));
      text += '\n';
    }

    if (summaryData.actionItems?.length > 0) {
      text += `✅ ACTION ITEMS:\n`;
      summaryData.actionItems.forEach((act) => {
        const isDone = checkedActions[act.id] ?? act.done;
        text += `[${isDone ? 'x' : ' '}] ${act.task} (@${act.assignee || 'Team'})\n`;
      });
      text += '\n';
    }

    if (summaryData.deadlines?.length > 0) {
      text += `📅 DEADLINES & DATES:\n`;
      summaryData.deadlines.forEach((dl) => (text += `• ${dl.event} — ${dl.date}\n`));
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('Summary copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catch Me Up"
      subtitle={`Google Gemini AI synthesis for "${conversation?.name || 'this chat'}"`}
      icon={Sparkles}
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-5">
        {/* Controls header */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-dark-300/80 p-3 rounded-xl border border-slate-200 dark:border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUnreadOnly(false);
                fetchSummary(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                !unreadOnly
                  ? 'bg-brand-100 dark:bg-brand-600/30 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Full Recent Context
            </button>
            <button
              type="button"
              onClick={() => {
                setUnreadOnly(true);
                fetchSummary(true);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                unreadOnly
                  ? 'bg-brand-100 dark:bg-brand-600/30 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Unread Messages Only
            </button>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => fetchSummary(unreadOnly)}
            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 disabled:opacity-50"
            title="Re-synthesize conversation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Loading State with AI Shimmer */}
        {loading && (
          <div className="flex flex-col gap-4 py-8 px-4 items-center justify-center text-center">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-glow-cyan animate-pulse">
                <Sparkles className="w-7 h-7 text-white animate-spin" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Reading conversation stream...</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Gemini AI is extracting critical decisions, pending tasks, and key takeaways for you.
              </p>
            </div>
            <div className="w-full max-w-md h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-dark-100 border border-slate-300 dark:border-white/5 mt-2">
              <div className="h-full w-full ai-shimmer" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to synthesize summary</p>
              <p className="text-xs text-rose-500/80 mt-1">{error}</p>
            </div>
            <Button size="xs" variant="danger" onClick={() => fetchSummary(unreadOnly)}>
              Try Again
            </Button>
          </div>
        )}

        {/* Content Body */}
        {!loading && !error && summaryData && (
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* 1. Executive Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-dark-200 border border-brand-200 dark:border-brand-500/20">
              <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 font-semibold text-xs tracking-wider uppercase mb-2">
                <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Executive Summary</span>
              </div>
              <p className="text-sm text-slate-900 dark:text-slate-200 leading-relaxed">{summaryData.summary}</p>
            </div>

            {/* 2. Key Decisions */}
            {summaryData.decisions?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-200/80 border border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-3">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span>Important Decisions Made</span>
                </div>
                <ul className="space-y-2">
                  {summaryData.decisions.map((decision, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                      <span className="leading-relaxed">{decision}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3. Action Items */}
            {summaryData.actionItems?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-200/80 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-wider uppercase">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    <span>Action Items & Tasks</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {Object.values(checkedActions).filter(Boolean).length} / {summaryData.actionItems.length} checked
                  </span>
                </div>
                <div className="space-y-2">
                  {summaryData.actionItems.map((act) => {
                    const isChecked = checkedActions[act.id] ?? act.done;
                    return (
                      <div
                        key={act.id}
                        onClick={() => handleToggleTask(act.id)}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/20 text-slate-400'
                            : 'bg-white dark:bg-dark-100/60 border-slate-200 dark:border-white/5 text-slate-900 dark:text-slate-200 hover:border-brand-500/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-dark-300 cursor-pointer"
                        />
                        <div className="flex-1 text-xs">
                          <p className={`leading-relaxed ${isChecked ? 'line-through opacity-75 text-slate-400' : 'font-medium'}`}>
                            {act.task}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                              Assigned: {act.assignee || 'Team'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Deadlines & Dates */}
            {summaryData.deadlines?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-200/80 border border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs tracking-wider uppercase mb-3">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Key Dates & Deadlines</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {summaryData.deadlines.map((dl, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white dark:bg-dark-100/60 border border-amber-300/40 dark:border-amber-500/15 flex flex-col justify-between gap-1"
                    >
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-200 leading-snug">{dl.event}</span>
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-300/90">{dl.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state notice when no decisions or tasks are found */}
            {!summaryData.decisions?.length &&
              !summaryData.actionItems?.length &&
              !summaryData.deadlines?.length && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-200/50 border border-slate-200 dark:border-white/5 text-center text-xs text-slate-500 dark:text-slate-400">
                  No specific action items, deadlines, or formal decisions were detected in these messages.
                </div>
              )}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
          <Button
            size="sm"
            variant="ghost"
            icon={copied ? Check : Copy}
            onClick={handleCopySummary}
            disabled={loading || !summaryData}
          >
            {copied ? 'Copied' : 'Copy Summary'}
          </Button>

          <Button size="sm" variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CatchMeUpModal;
