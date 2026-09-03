import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarHeader } from '../components/sidebar/SidebarHeader';
import { ConversationList } from '../components/sidebar/ConversationList';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { EmptyChatState } from '../components/chat/EmptyChatState';
import { CreateGroupModal } from '../components/modals/CreateGroupModal';
import { UserSearchResults } from '../components/sidebar/UserSearchResults';
import { IncomingMessageToast } from '../components/chat/IncomingMessageToast';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { userApi } from '../api/userApi';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useChat } from '../hooks/useChat';
import { useDebounce } from '../hooks/useDebounce';
import { UserPlus, Search } from 'lucide-react';
import { SOCKET_EVENTS } from '../utils/constants';

export const ChatPage = () => {
  const { id: routeConvId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const {
    activeConversation,
    selectConversation,
    selectConversationById,
    messages,
    loadingMessages,
    sendMessage,
    typingUsers,
    createDirectChat,
    incomingNotifications,
    dismissNotification,
    openNotificationChat,
  } = useChat();

  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [directSearchQuery, setDirectSearchQuery] = useState('');
  const debouncedDirectSearch = useDebounce(directSearchQuery, 200);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch all users directory
  const loadUserDirectory = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await userApi.getAllUsers();
      const rawUsers = res.data?.users || [];
      const currentId = user?._id || user?.id;
      const map = new Map();
      rawUsers.forEach((u) => {
        if (!u || !u._id) return;
        if (currentId && String(u._id) === String(currentId)) return;
        if (!map.has(String(u._id))) {
          map.set(String(u._id), u);
        }
      });
      setAllUsers(Array.from(map.values()));
    } catch (err) {
      console.warn('Failed to load user directory:', err.message);
    } finally {
      setLoadingUsers(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadUserDirectory();
    }
  }, [user, loadUserDirectory]);

  // Real-time synchronization when a new user registers or user status changes
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewUserRegistered = ({ user: newUser }) => {
      const currentId = user?._id || user?.id;
      if (newUser && newUser._id && (!currentId || String(newUser._id) !== String(currentId))) {
        setAllUsers((prev) => {
          if (prev.some((u) => String(u._id) === String(newUser._id))) return prev;
          return [...prev, newUser];
        });
      }
    };

    const handleUserStatusChange = ({ userId, status, customStatus, user: updatedUser }) => {
      setAllUsers((prev) =>
        prev.map((u) => {
          if (String(u._id) === String(userId)) {
            return {
              ...u,
              ...(updatedUser || {}),
              status: status || u.status,
              customStatus: customStatus !== undefined ? customStatus : u.customStatus,
            };
          }
          return u;
        })
      );
    };

    socket.on(SOCKET_EVENTS.NEW_USER_REGISTERED, handleNewUserRegistered);
    socket.on(SOCKET_EVENTS.USER_STATUS_CHANGE, handleUserStatusChange);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_USER_REGISTERED, handleNewUserRegistered);
      socket.off(SOCKET_EVENTS.USER_STATUS_CHANGE, handleUserStatusChange);
    };
  }, [socket, user]);

  // Synchronize allUsers if current user profile updates
  useEffect(() => {
    if (!user?._id) return;
    setAllUsers((prev) =>
      prev.map((u) => {
        if (String(u._id) === String(user._id)) {
          return { ...u, ...user };
        }
        return u;
      })
    );
  }, [user]);

  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  // Compute matching message IDs in the active conversation
  const matchingMessageIds = useMemo(() => {
    if (!inChatSearchQuery.trim()) return [];
    const q = inChatSearchQuery.toLowerCase().trim();
    return (messages || [])
      .filter((m) => {
        if (m.isSystem) return m.text?.toLowerCase().includes(q);
        return (
          m.text?.toLowerCase().includes(q) ||
          m.attachments?.some((a) => a.name?.toLowerCase().includes(q))
        );
      })
      .map((m) => m._id || m.tempId);
  }, [messages, inChatSearchQuery]);

  // Adjust active match index whenever query or matches change
  useEffect(() => {
    setActiveMatchIndex(0);
  }, [inChatSearchQuery]);

  // Reset in-chat search query when active conversation changes
  useEffect(() => {
    setInChatSearchQuery('');
    setActiveMatchIndex(0);
  }, [activeConversation?._id]);

  const handleNextMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % matchingMessageIds.length);
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setActiveMatchIndex((prev) => (prev - 1 + matchingMessageIds.length) % matchingMessageIds.length);
  };

  const activeMatchId = matchingMessageIds[activeMatchIndex] || null;

  // Synchronize route param :id with active conversation
  useEffect(() => {
    if (routeConvId) {
      if (activeConversation?._id !== routeConvId) {
        selectConversationById?.(routeConvId);
      }
    }
  }, [routeConvId, activeConversation?._id, selectConversationById]);

  const handleSelectConversation = (conv) => {
    if (!conv) {
      selectConversation(null);
      navigate('/chat');
    } else {
      selectConversation(conv);
      navigate(`/chat/${conv._id}`);
    }
  };

  const handleOpenNotificationChat = useCallback(
    async (convId) => {
      if (!convId) return;
      const targetId = convId.toString();
      navigate(`/chat/${targetId}`);
      await openNotificationChat(targetId);
    },
    [navigate, openNotificationChat]
  );

  // Load teammates for direct chat picker
  const handleOpenDirectChatModal = () => {
    setIsNewChatModalOpen(true);
    setDirectSearchQuery('');
    loadUserDirectory();
  };

  const handleSelectDirectUser = async (userId) => {
    setIsNewChatModalOpen(false);
    const res = await createDirectChat(userId);
    if (res?.conversation?._id) {
      navigate(`/chat/${res.conversation._id}`);
    }
  };

  const filteredDirectUsers = useMemo(() => {
    const q = debouncedDirectSearch.toLowerCase().trim();
    const currentId = user?._id || user?.id;
    const map = new Map();
    (allUsers || []).forEach((u) => {
      if (!u || !u._id) return;
      if (currentId && String(u._id) === String(currentId)) return;
      if (!map.has(String(u._id))) {
        map.set(String(u._id), u);
      }
    });
    const uniqueUsers = Array.from(map.values());
    if (!q) return uniqueUsers;
    return uniqueUsers.filter((u) => {
      return (
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    });
  }, [allUsers, debouncedDirectSearch, user]);

  return (
    <div className="h-screen w-screen flex bg-slate-100 dark:bg-dark-400 text-slate-900 dark:text-slate-100 overflow-hidden select-none font-sans transition-colors duration-200">
      {/* 1. Left Sidebar Area */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-dark-300 border-r border-slate-200 dark:border-white/10 flex-shrink-0 z-20 transition-all ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        <SidebarHeader
          onStartDirectChat={handleOpenDirectChatModal}
          onOpenCreateGroup={() => setIsNewGroupModalOpen(true)}
        />

        <ConversationList
          onOpenCreateGroup={() => setIsNewGroupModalOpen(true)}
          onStartDirectChat={handleOpenDirectChatModal}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* 2. Right Main Chat Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-dark-300 relative ${
          !activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ErrorBoundary
          title="Unable to load conversation"
          onReset={() => handleSelectConversation(null)}
        >
          {activeConversation ? (
            <>
              <ChatHeader
                conversation={activeConversation}
                onBack={() => handleSelectConversation(null)}
                searchQuery={inChatSearchQuery}
                onSearchChange={setInChatSearchQuery}
                matchesCount={matchingMessageIds.length}
                currentMatchIndex={activeMatchIndex}
                onNextMatch={handleNextMatch}
                onPrevMatch={handlePrevMatch}
              />

              <MessageList
                messages={messages}
                loading={loadingMessages}
                conversation={activeConversation}
                typingUsers={typingUsers[activeConversation._id] || []}
                searchQuery={inChatSearchQuery}
                activeMatchId={activeMatchId}
              />

              <MessageInput
                conversationId={activeConversation._id}
                onSendMessage={sendMessage}
              />
            </>
          ) : (
            <EmptyChatState
              onStartDirectChat={handleOpenDirectChatModal}
              onOpenCreateGroup={() => setIsNewGroupModalOpen(true)}
            />
          )}
        </ErrorBoundary>
      </div>

      {/* Direct Chat User Picker Modal */}
      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        title="Start Direct Chat"
        subtitle="Select a teammate to start a private real-time chat"
        icon={UserPlus}
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          <Input
            placeholder="Search by name, username, or email..."
            icon={Search}
            value={directSearchQuery}
            onChange={(e) => setDirectSearchQuery(e.target.value)}
            autoFocus
          />

          <div className="max-h-72 overflow-y-auto pr-1">
            <UserSearchResults
              users={filteredDirectUsers}
              loading={loadingUsers}
              onSelectUser={handleSelectDirectUser}
            />
          </div>
        </div>
      </Modal>

      {/* Floating Incoming Message Popups */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0">
        {incomingNotifications.map((notif) => (
          <IncomingMessageToast
            key={notif.id}
            notification={notif}
            onOpenChat={handleOpenNotificationChat}
            onDismiss={dismissNotification}
          />
        ))}
      </div>

      {/* Group Creation Modal */}
      <CreateGroupModal
        isOpen={isNewGroupModalOpen}
        onClose={() => setIsNewGroupModalOpen(false)}
      />
    </div>
  );
};

export default ChatPage;
