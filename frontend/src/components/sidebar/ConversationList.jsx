import React, { useState, useEffect } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { ConversationTabs } from './ConversationTabs';
import { ConversationItem } from './ConversationItem';
import { UserSearchResults } from './UserSearchResults';
import { Button } from '../common/Button';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { userApi } from '../../api/userApi';
import { CONVERSATION_TYPES } from '../../utils/constants';

export const ConversationList = ({ onOpenCreateGroup, onStartDirectChat, onSelectConversation }) => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    loadingConversations,
    activeFilter,
    setActiveFilter,
    typingUsers,
    createDirectChat,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Search users API when query is typed
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchedUsers([]);
      setLoadingSearch(false);
      return;
    }

    const performSearch = async () => {
      setLoadingSearch(true);
      try {
        const res = await userApi.searchUsers(debouncedSearch);
        const raw = res.data?.users || [];
        const currentId = user?._id || user?.id;
        const map = new Map();
        raw.forEach((u) => {
          if (!u || !u._id) return;
          if (currentId && String(u._id) === String(currentId)) return;
          if (!map.has(String(u._id))) {
            map.set(String(u._id), u);
          }
        });
        setSearchedUsers(Array.from(map.values()));
      } catch (err) {
        console.warn('Search failed:', err.message);
      } finally {
        setLoadingSearch(false);
      }
    };

    performSearch();
  }, [debouncedSearch, user]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // Tab filter
    if (activeFilter === 'direct' && conv.type !== CONVERSATION_TYPES.DIRECT) return false;
    if (activeFilter === 'group' && conv.type !== CONVERSATION_TYPES.GROUP) return false;
    if (activeFilter === 'unread' && (!conv.unreadCount || conv.unreadCount <= 0)) return false;

    // Search query filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      if (conv.type === CONVERSATION_TYPES.GROUP) {
        return conv.name?.toLowerCase().includes(q) || conv.description?.toLowerCase().includes(q);
      }
      const other = (conv.participants || []).find(
        (p) => (typeof p === 'object' ? p._id : p) !== user?._id
      );
      return (
        other?.name?.toLowerCase().includes(q) ||
        other?.username?.toLowerCase().includes(q) ||
        other?.email?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const handleSelectUserFromSearch = async (recipientId) => {
    setSearchQuery('');
    const res = await createDirectChat(recipientId);
    if (res?.conversation && onSelectConversation) {
      onSelectConversation(res.conversation);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-dark-300 transition-colors duration-200">
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* Tabs Filter (hidden while actively searching) */}
      {!searchQuery.trim() && (
        <ConversationTabs
          activeTab={activeFilter}
          onTabChange={setActiveFilter}
          unreadTotal={totalUnread}
        />
      )}

      {/* List Container */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {/* If user is actively typing a search query, show user search results on top */}
        {searchQuery.trim() ? (
          <div className="space-y-3">
            {/* Conversation Matches */}
            {filteredConversations.length > 0 && (
              <div>
                <div className="px-5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Chats ({filteredConversations.length})
                </div>
                {filteredConversations.map((conv) => (
                  <ConversationItem
                    key={conv._id}
                    conversation={conv}
                    isSelected={activeConversation?._id === conv._id}
                    searchQuery={searchQuery}
                    onClick={() => {
                      selectConversation(conv);
                      setSearchQuery('');
                      if (setIsSearchActive) setIsSearchActive(false);
                    }}
                    typingUsers={typingUsers[conv._id] || []}
                  />
                ))}
              </div>
            )}

            {/* Direct Users Directory Matches */}
            <UserSearchResults
              users={searchedUsers}
              loading={loadingSearch}
              onSelectUser={handleSelectUserFromSearch}
            />
          </div>
        ) : loadingConversations && conversations.length === 0 ? (
          /* Loading Skeleton */
          <div className="space-y-2 px-3.5 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-dark-100/40 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-dark-50/60 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-1/2 h-3 bg-slate-200 dark:bg-dark-50/60 rounded" />
                  <div className="w-3/4 h-2 bg-slate-200 dark:bg-dark-50/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          /* Empty List State */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3 shadow-sm">
              <MessageSquarePlus className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">
              {activeFilter === 'unread' ? 'No unread messages' : 'No conversations yet'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
              {activeFilter === 'unread'
                ? "You're all caught up! Select any chat to send messages."
                : 'Start a direct chat with a teammate or create a group channel.'}
            </p>
            {activeFilter !== 'unread' && (
              <div className="flex gap-2 mt-4">
                <Button size="xs" variant="primary" onClick={onStartDirectChat}>
                  New Chat
                </Button>
                <Button size="xs" variant="secondary" onClick={onOpenCreateGroup}>
                  Create Group
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Normal Conversation Rows */
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv._id}
              conversation={conv}
              isSelected={activeConversation?._id === conv._id}
              onClick={() => (onSelectConversation ? onSelectConversation(conv) : selectConversation(conv))}
              typingUsers={typingUsers[conv._id] || []}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
