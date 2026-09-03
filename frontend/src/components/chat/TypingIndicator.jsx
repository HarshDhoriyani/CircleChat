import React from 'react';
import { Avatar } from '../common/Avatar';

export const TypingIndicator = ({ typingUsers = [] }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.name?.split(' ')[0] || 'Someone').join(', ');
  const isPlural = typingUsers.length > 1;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 animate-fade-in select-none">
      <div className="flex -space-x-1.5 overflow-hidden">
        {typingUsers.slice(0, 3).map((u) => (
          <Avatar key={u._id} src={u.avatar} name={u.name} size="xs" showStatus={false} />
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-brand-400 font-medium bg-dark-100/60 px-3 py-1 rounded-full border border-brand-500/20">
        <span>
          {names} {isPlural ? 'are' : 'is'} typing
        </span>
        <div className="flex items-center gap-0.5 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 typing-dot-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 typing-dot-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 typing-dot-3" />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
