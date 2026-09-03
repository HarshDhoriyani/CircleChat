import React from 'react';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'direct', label: 'Direct' },
  { id: 'group', label: 'Groups' },
  { id: 'unread', label: 'Unread' },
];

export const ConversationTabs = ({ activeTab, onTabChange, unreadTotal = 0 }) => {
  return (
    <div className="flex items-center gap-1.5 px-3.5 pb-2 overflow-x-auto border-b border-slate-200 dark:border-white/5 no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0 ${
              isActive
                ? 'bg-brand-50 dark:bg-brand-600/30 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500/40 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
            }`}
          >
            <span>{tab.label}</span>
            {tab.id === 'unread' && unreadTotal > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadTotal}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ConversationTabs;
