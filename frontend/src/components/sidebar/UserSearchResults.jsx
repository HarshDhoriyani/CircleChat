import React from 'react';
import { MessageSquare, User, Loader2 } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useSocket } from '../../hooks/useSocket';

export const UserSearchResults = ({ users, loading, onSelectUser }) => {
  const { isUserOnline } = useSocket();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500 mb-2" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Searching directory...</p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-100 flex items-center justify-center text-slate-400 mb-2">
          <User className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No teammates found</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different name or username</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <span>Teammates Directory ({users.length})</span>
      </div>

      {users.map((u) => {
        const isOnline = isUserOnline(u._id);
        return (
          <div
            key={u._id}
            onClick={() => onSelectUser(u._id)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-100/90 cursor-pointer border border-transparent hover:border-brand-500/20 transition-all duration-150"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={u.avatar}
                name={u.name}
                size="md"
                isOnline={isOnline}
                status={u.status}
              />
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{u.name}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">@{u.username}</p>
                {u.customStatus && (
                  <p className="text-[10px] text-brand-600 dark:text-brand-400/80 truncate mt-0.5">{u.customStatus}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              className="p-2 rounded-lg bg-brand-50 dark:bg-brand-600/10 hover:bg-brand-100 dark:hover:bg-brand-600/25 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20 transition-colors flex-shrink-0"
              title={`Message ${u.name}`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default UserSearchResults;
