import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { conversationApi } from '../api/conversationApi';
import { messageApi } from '../api/messageApi';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { SOCKET_EVENTS } from '../utils/constants';

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation, emitMarkAsRead } = useSocket();
  const { playSound } = useSoundEffects();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { [conversationId]: [user1, user2] }
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'direct' | 'group' | 'unread'
  const [editingMessage, setEditingMessage] = useState(null);

  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // 1. Fetch conversations list (defaults to background silent fetch without flickering skeletons)
  const fetchConversations = useCallback(async (showLoading = false) => {
    if (!user) return;
    if (showLoading) {
      setLoadingConversations(true);
    }
    try {
      const res = await conversationApi.getConversations();
      const list = res.data?.conversations || [];
      setConversations(list);

      // If active conversation exists, update reference only if meaningful metadata changed
      if (activeConversationRef.current) {
        const updated = list.find((c) => c._id === activeConversationRef.current._id);
        if (updated) {
          setActiveConversation((prev) => {
            if (!prev) return updated;
            const participantsEqual =
              prev.participants?.length === updated.participants?.length &&
              prev.participants?.every((p, idx) => {
                const u = updated.participants?.[idx];
                const pId = (p?._id || p)?.toString();
                const uId = (u?._id || u)?.toString();
                return pId === uId && p?.avatar === u?.avatar && p?.name === u?.name && p?.status === u?.status;
              });

            if (
              prev._id === updated._id &&
              prev.name === updated.name &&
              prev.avatar === updated.avatar &&
              prev.description === updated.description &&
              participantsEqual
            ) {
              return prev;
            }
            return updated;
          });
        }
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err.message);
    } finally {
      if (showLoading) {
        setLoadingConversations(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations(true);
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
      setEditingMessage(null);
    }
  }, [user, fetchConversations]);

  // Synchronize active conversation and messages when current user updates profile (avatar, name, etc.)
  useEffect(() => {
    if (!user?._id) return;
    const currentId = user._id.toString();

    setConversations((prev) =>
      prev.map((c) => {
        if (!c.participants) return c;
        const hasSelf = c.participants.some((p) => (p._id || p).toString() === currentId);
        if (!hasSelf) return c;
        return {
          ...c,
          participants: c.participants.map((p) => {
            const pId = (p._id || p).toString();
            if (pId === currentId) {
              return { ...(typeof p === 'object' ? p : {}), ...user };
            }
            return p;
          }),
        };
      })
    );

    setActiveConversation((prev) => {
      if (!prev || !prev.participants) return prev;
      const hasSelf = prev.participants.some((p) => (p._id || p).toString() === currentId);
      if (!hasSelf) return prev;
      return {
        ...prev,
        participants: prev.participants.map((p) => {
          const pId = (p._id || p).toString();
          if (pId === currentId) {
            return { ...(typeof p === 'object' ? p : {}), ...user };
          }
          return p;
        }),
      };
    });

    setMessages((prev) =>
      prev.map((m) => {
        const senderId = (typeof m.sender === 'object' ? m.sender?._id : m.sender)?.toString();
        if (senderId === currentId) {
          return {
            ...m,
            sender: {
              ...(typeof m.sender === 'object' ? m.sender : {}),
              name: user.name,
              avatar: user.avatar,
              username: user.username,
            },
          };
        }
        return m;
      })
    );
  }, [user]);

  // 2. Fetch messages for active conversation
  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    setLoadingMessages(true);
    try {
      const res = await messageApi.getMessages(convId, { page: 1, limit: 50 });
      const msgs = res.data?.messages || [];
      setMessages(msgs);

      // Mark as read in API and emit
      messageApi.markAsRead(convId).catch(() => {});
      emitMarkAsRead(convId);

      // Reset unread count locally
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.warn('Failed to load messages:', err.message);
    } finally {
      setLoadingMessages(false);
    }
  }, [emitMarkAsRead]);

  // 3. Select active conversation
  const selectConversation = useCallback(
    (conv) => {
      setEditingMessage(null);
      if (!conv) {
        if (activeConversationRef.current) {
          leaveConversation(activeConversationRef.current._id);
        }
        setActiveConversation(null);
        setMessages([]);
        return;
      }

      if (activeConversationRef.current?._id === conv._id) return;

      if (activeConversationRef.current) {
        leaveConversation(activeConversationRef.current._id);
      }

      setActiveConversation(conv);
      joinConversation(conv._id);
      fetchMessages(conv._id);
    },
    [joinConversation, leaveConversation, fetchMessages]
  );

  // Select conversation by ID (handles deep linking & direct route access)
  const selectConversationById = useCallback(
    async (convId) => {
      if (!convId) {
        selectConversation(null);
        return;
      }
      const targetId = convId.toString();
      if (activeConversationRef.current?._id?.toString() === targetId) return;

      const existing = conversations.find((c) => (c._id || c.id)?.toString() === targetId);
      if (existing) {
        selectConversation(existing);
      } else {
        try {
          const res = await conversationApi.getConversationById(targetId);
          if (res.data?.conversation) {
            const fetched = res.data.conversation;
            setConversations((prev) => {
              if (prev.some((c) => (c._id || c.id)?.toString() === targetId)) {
                return prev;
              }
              return [fetched, ...prev];
            });
            selectConversation(fetched);
          }
        } catch {
          selectConversation(null);
        }
      }
    },
    [conversations, selectConversation]
  );

  const [incomingNotifications, setIncomingNotifications] = useState([]);

  // Auto request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const dismissNotification = useCallback((id) => {
    setIncomingNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const openNotificationChat = useCallback(
    async (convId) => {
      if (!convId) return;
      const targetId = convId.toString();

      // Navigate to the target chat route
      navigate(`/chat/${targetId}`);

      // Dismiss any incoming notification popups matching this conversation
      setIncomingNotifications((prev) =>
        prev.filter((n) => {
          const nId = (n.conversationId || n.conversation?._id || n.message?.conversationId)?.toString();
          return nId !== targetId;
        })
      );

      const existing = conversations.find((c) => (c._id || c.id)?.toString() === targetId);
      if (existing) {
        selectConversation(existing);
      } else {
        try {
          const res = await conversationApi.getConversationById(targetId);
          if (res.data?.conversation) {
            const fetched = res.data.conversation;
            setConversations((prev) => {
              if (prev.some((c) => (c._id || c.id)?.toString() === targetId)) {
                return prev;
              }
              return [fetched, ...prev];
            });
            selectConversation(fetched);
          }
        } catch {
          fetchConversations();
        }
      }
    },
    [conversations, selectConversation, fetchConversations, navigate]
  );

  // 4. Socket Listeners for Real-Time Synchronization
  useEffect(() => {
    if (!socket || !user) return;

    const handleReceiveMessage = ({ conversationId, message, conversation }) => {
      const isCurrentChat = activeConversationRef.current?._id === conversationId;
      const isFromMe = (message.sender?._id || message.sender) === user._id;

      if (isCurrentChat) {
        setMessages((prev) => {
          // Check if message already exists by _id or tempId
          const existingIndex = prev.findIndex(
            (m) =>
              (message._id && m._id === message._id) ||
              (message.tempId && (m.tempId === message.tempId || m._id === message.tempId))
          );

          if (existingIndex !== -1) {
            const next = [...prev];
            next[existingIndex] = message;
            return next;
          }

          // If from me and text matches pending message
          if (isFromMe) {
            const pendingIndex = prev.findIndex((m) => m.pending && m.text === message.text);
            if (pendingIndex !== -1) {
              const next = [...prev];
              next[pendingIndex] = message;
              return next;
            }
          }

          return [...prev, message];
        });

        if (!isFromMe) {
          playSound('receive');
          messageApi.markAsRead(conversationId).catch(() => {});
          emitMarkAsRead(conversationId);
        }
      } else {
        if (!isFromMe) {
          playSound('notification');

          // Add popup toast notification
          setIncomingNotifications((prev) => [
            ...prev.slice(-2), // Keep up to 3 recent notifications
            {
              id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              conversationId,
              message,
              conversation,
            },
          ]);

          // Trigger native Web Desktop Notification if tab is backgrounded
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted' &&
            document.hidden
          ) {
            try {
              new Notification(message.sender?.name || 'New Message', {
                body:
                  message.text ||
                  (message.attachments?.length ? 'Sent an attachment' : 'Sent a message'),
                icon: message.sender?.avatar || undefined,
              });
            } catch {}
          }
        }
      }

      // Update sidebar conversation preview & unread count
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === conversationId);
        if (index === -1) {
          fetchConversations(false);
          return prev;
        }

        const conv = prev[index];
        const updated = {
          ...conv,
          lastMessage: message,
          updatedAt: message.createdAt || new Date().toISOString(),
          unreadCount: isCurrentChat || isFromMe ? 0 : (conv.unreadCount || 0) + 1,
        };

        const list = [...prev];
        list.splice(index, 1);
        return [updated, ...list];
      });
    };

    const handleMessageEdited = ({ conversationId, message }) => {
      if (activeConversationRef.current?._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === message._id ? { ...m, ...message } : m))
        );
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId && c.lastMessage?._id === message._id
            ? { ...c, lastMessage: message }
            : c
        )
      );
    };

    const handleMessageDeleted = ({ conversationId, messageId, deleteType }) => {
      const isCurrentChat = activeConversationRef.current?._id === conversationId;
      if (isCurrentChat) {
        if (deleteType === 'everyone') {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === messageId
                ? {
                    ...m,
                    deletedForEveryone: true,
                    text: 'This message was deleted',
                    attachments: [],
                  }
                : m
            )
          );
        } else {
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        }
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c._id !== conversationId) return c;
          if (deleteType === 'everyone' && c.lastMessage?._id === messageId) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                deletedForEveryone: true,
                text: 'This message was deleted',
                attachments: [],
              },
            };
          }
          return c;
        })
      );

      fetchConversations(false);
    };

    const handleUserTyping = ({ conversationId, user: typingUser }) => {
      if (typingUser._id === user._id) return;
      setTypingUsers((prev) => {
        const list = prev[conversationId] || [];
        if (!list.some((u) => u._id === typingUser._id)) {
          return { ...prev, [conversationId]: [...list, typingUser] };
        }
        return prev;
      });
    };

    const handleUserStopTyping = ({ conversationId, user: stoppingUser }) => {
      setTypingUsers((prev) => {
        const list = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: list.filter((u) => u._id !== stoppingUser._id),
        };
      });
    };

    const handleMessageRead = ({ conversationId, userId: readerId }) => {
      if (activeConversationRef.current?._id === conversationId) {
        const now = new Date().toISOString();
        setMessages((prev) =>
          prev.map((msg) => {
            const currentReadBy = Array.isArray(msg.readBy) ? msg.readBy : [];
            const idList = currentReadBy.map((id) => (typeof id === 'object' ? id._id : id)?.toString());
            const readerIdStr = readerId?.toString();
            if (!idList.includes(readerIdStr)) {
              const updatedReadReceipts = Array.isArray(msg.readReceipts) ? [...msg.readReceipts] : [];
              if (!updatedReadReceipts.some((r) => (typeof r.user === 'object' ? r.user?._id : r.user)?.toString() === readerIdStr)) {
                updatedReadReceipts.push({ user: readerId, timestamp: now });
              }
              return {
                ...msg,
                readBy: [...currentReadBy, readerId],
                readReceipts: updatedReadReceipts,
              };
            }
            return msg;
          })
        );
      }
    };

    const handleConversationUpdated = () => {
      fetchConversations(false);
    };

    const handleGroupMemberRemoved = ({ conversationId, memberId, conversation: updatedConv }) => {
      const memberIdStr = (typeof memberId === 'object' ? memberId?._id || memberId : memberId)?.toString();
      const currentUserIdStr = user._id?.toString();

      if (memberIdStr === currentUserIdStr) {
        if (activeConversationRef.current?._id === conversationId) {
          setActiveConversation(null);
          setMessages([]);
        }
        setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      } else {
        if (updatedConv) {
          setConversations((prev) =>
            prev.map((c) => (c._id === conversationId ? { ...c, ...updatedConv } : c))
          );
          if (activeConversationRef.current?._id === conversationId) {
            setActiveConversation((prev) => (prev ? { ...prev, ...updatedConv } : prev));
            fetchMessages(conversationId);
          }
        } else {
          fetchConversations(false);
        }
      }
    };

    const handleGroupMemberAdded = ({ conversationId, conversation: updatedConv }) => {
      fetchConversations(false);
      if (activeConversationRef.current?._id === conversationId && updatedConv) {
        setActiveConversation((prev) => (prev ? { ...prev, ...updatedConv } : prev));
        fetchMessages(conversationId);
      }
    };

    const handleUserStatusChange = ({ userId, status, customStatus, lastSeen, user: updatedUser }) => {
      if (!userId) return;
      const targetId = userId.toString();
      const patchParticipant = (p) => {
        if (!p) return p;
        const pId = (p._id || p).toString();
        if (pId === targetId) {
          return {
            ...(typeof p === 'object' ? p : {}),
            ...(updatedUser || {}),
            status: status || p.status,
            customStatus: customStatus !== undefined ? customStatus : p.customStatus,
            lastSeen: lastSeen || new Date().toISOString(),
          };
        }
        return p;
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (!c.participants) return c;
          const hasTarget = c.participants.some((p) => (p._id || p).toString() === targetId);
          if (!hasTarget) return c;
          return {
            ...c,
            participants: c.participants.map(patchParticipant),
          };
        })
      );

      setActiveConversation((prev) => {
        if (!prev || !prev.participants) return prev;
        const hasTarget = prev.participants.some((p) => (p._id || p).toString() === targetId);
        if (!hasTarget) return prev;
        return {
          ...prev,
          participants: prev.participants.map(patchParticipant),
        };
      });

      // Also update messages in real-time if avatar or name changed
      if (updatedUser?.avatar || updatedUser?.name) {
        setMessages((prev) =>
          prev.map((m) => {
            const senderId = (typeof m.sender === 'object' ? m.sender?._id : m.sender)?.toString();
            if (senderId === targetId) {
              return {
                ...m,
                sender: {
                  ...(typeof m.sender === 'object' ? m.sender : {}),
                  ...(updatedUser || {}),
                },
              };
            }
            return m;
          })
        );
      }
    };

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
    socket.on(SOCKET_EVENTS.USER_STOP_TYPING, handleUserStopTyping);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
    socket.on(SOCKET_EVENTS.CONVERSATION_UPDATED, handleConversationUpdated);
    socket.on(SOCKET_EVENTS.GROUP_MEMBER_REMOVED, handleGroupMemberRemoved);
    socket.on(SOCKET_EVENTS.GROUP_MEMBER_ADDED, handleGroupMemberAdded);
    socket.on(SOCKET_EVENTS.USER_STATUS_CHANGE, handleUserStatusChange);

    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
      socket.off(SOCKET_EVENTS.USER_STOP_TYPING, handleUserStopTyping);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
      socket.off(SOCKET_EVENTS.CONVERSATION_UPDATED, handleConversationUpdated);
      socket.off(SOCKET_EVENTS.GROUP_MEMBER_REMOVED, handleGroupMemberRemoved);
      socket.off(SOCKET_EVENTS.GROUP_MEMBER_ADDED, handleGroupMemberAdded);
      socket.off(SOCKET_EVENTS.USER_STATUS_CHANGE, handleUserStatusChange);
    };
  }, [socket, user, emitMarkAsRead, fetchConversations, fetchMessages, playSound]);

  // 5. Send message action (Optimistic UI with rock-solid deduplication)
  const sendMessage = async ({ text, attachments = [] }) => {
    if (!activeConversation) return;

    const tempId = 'temp_' + Date.now();
    const optimisticMessage = {
      _id: tempId,
      tempId,
      conversationId: activeConversation._id,
      sender: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
      },
      text: text?.trim() || '',
      attachments,
      messageType: attachments.length > 0 ? (attachments[0].type?.startsWith('image/') ? 'image' : 'file') : 'text',
      readBy: [user._id],
      createdAt: new Date().toISOString(),
      pending: true,
    };

    // Optimistic append & sound
    setMessages((prev) => [...prev, optimisticMessage]);
    playSound('send');

    try {
      const res = await messageApi.sendMessage(activeConversation._id, {
        text,
        attachments,
        tempId,
      });

      const confirmedMessage = res.data?.message;

      if (confirmedMessage) {
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.tempId === tempId || m._id === tempId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = confirmedMessage;
            return next;
          }
          if (!prev.some((m) => m._id === confirmedMessage._id)) {
            return [...prev, confirmedMessage];
          }
          return prev;
        });

        // Update conversation sidebar position
        setConversations((prev) => {
          const index = prev.findIndex((c) => c._id === activeConversation._id);
          if (index === -1) return prev;
          const target = { ...prev[index], lastMessage: confirmedMessage, updatedAt: confirmedMessage.createdAt };
          const updated = [...prev];
          updated.splice(index, 1);
          return [target, ...updated];
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, failed: true, pending: false } : m))
      );
      throw err;
    }
  };

  // 6. Edit message action
  const editMessage = async (messageId, newText) => {
    if (!activeConversation || !messageId) return;

    try {
      const res = await messageApi.editMessage(activeConversation._id, messageId, newText);
      const updatedMessage = res.data?.message;

      if (updatedMessage) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, ...updatedMessage } : m))
        );
      }
      setEditingMessage(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 7. Delete message for me
  const deleteMessageForMe = async (messageId) => {
    if (!activeConversation || !messageId) return;

    try {
      await messageApi.deleteMessage(activeConversation._id, messageId, 'me');

      setMessages((prev) => {
        const remainingMessages = prev.filter((m) => m._id !== messageId);
        setConversations((prevConvs) =>
          prevConvs.map((c) => {
            if (c._id !== activeConversation._id) return c;
            if (c.lastMessage?._id === messageId) {
              const nextLastMsg =
                remainingMessages.length > 0
                  ? remainingMessages[remainingMessages.length - 1]
                  : null;
              return {
                ...c,
                lastMessage: nextLastMsg,
              };
            }
            return c;
          })
        );
        return remainingMessages;
      });

      fetchConversations(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 8. Delete message for everyone
  const deleteMessageForEveryone = async (messageId) => {
    if (!activeConversation || !messageId) return;

    try {
      await messageApi.deleteMessage(activeConversation._id, messageId, 'everyone');

      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? {
                ...m,
                deletedForEveryone: true,
                text: 'This message was deleted',
                attachments: [],
              }
            : m
        )
      );

      setConversations((prev) =>
        prev.map((c) => {
          if (c._id !== activeConversation._id) return c;
          if (c.lastMessage?._id === messageId) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                deletedForEveryone: true,
                text: 'This message was deleted',
                attachments: [],
              },
            };
          }
          return c;
        })
      );

      fetchConversations(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 9. Get Message Info
  const getMessageInfo = async (messageId) => {
    if (!activeConversation || !messageId) return null;
    const res = await messageApi.getMessageInfo(activeConversation._id, messageId);
    return res?.data || res;
  };

  // 10. Direct chat creation helper
  const createDirectChat = async (recipientId) => {
    try {
      const res = await conversationApi.createDirectConversation(recipientId);
      const conv = res.data?.conversation;
      if (conv) {
        await fetchConversations();
        selectConversation(conv);
        return { success: true, conversation: conv };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 11. Group chat creation helper
  const createGroupChat = async ({ name, description, avatar, memberIds }) => {
    try {
      const res = await conversationApi.createGroupConversation({
        name,
        description,
        avatar,
        memberIds,
      });
      const conv = res.data?.conversation;
      if (conv) {
        await fetchConversations();
        selectConversation(conv);
        return { success: true, conversation: conv };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 12. Group metadata update
  const updateGroupChat = async (groupId, data) => {
    try {
      const res = await conversationApi.updateGroup(groupId, data);
      const conv = res.data?.conversation;
      if (conv) {
        setActiveConversation(conv);
        fetchConversations();
        return { success: true, conversation: conv };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 13. Add group members
  const addMembersToGroup = async (groupId, memberIds) => {
    try {
      const res = await conversationApi.addGroupMembers(groupId, memberIds);
      const conv = res.data?.conversation;
      if (conv) {
        setActiveConversation(conv);
        fetchConversations();
        fetchMessages(groupId);
        return { success: true, conversation: conv };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 14. Remove group member
  const removeMemberFromGroup = async (groupId, memberId) => {
    try {
      const res = await conversationApi.removeGroupMember(groupId, memberId);
      const conv = res.data?.conversation?.conversation || res.data?.conversation;
      if (conv) {
        if (activeConversationRef.current?._id === groupId) {
          setActiveConversation(conv);
          fetchMessages(groupId);
        }
        fetchConversations(false);
        return { success: true, conversation: conv };
      }
      fetchConversations(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 15. Leave group
  const leaveGroupChat = async (groupId) => {
    try {
      await conversationApi.leaveGroup(groupId);
      if (activeConversationRef.current?._id === groupId) {
        setActiveConversation(null);
        setMessages([]);
      }
      setConversations((prev) => prev.filter((c) => c._id !== groupId));
      fetchConversations(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loadingConversations,
        loadingMessages,
        typingUsers,
        activeFilter,
        editingMessage,
        setEditingMessage,
        setActiveFilter,
        fetchConversations,
        selectConversation,
        selectConversationById,
        sendMessage,
        editMessage,
        deleteMessageForMe,
        deleteMessageForEveryone,
        getMessageInfo,
        incomingNotifications,
        dismissNotification,
        openNotificationChat,
        createDirectChat,
        createGroupChat,
        updateGroupChat,
        addMembersToGroup,
        removeMemberFromGroup,
        leaveGroupChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
