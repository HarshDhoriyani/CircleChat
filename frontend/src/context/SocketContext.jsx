import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { SOCKET_EVENTS } from '../utils/constants';

export const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { token, user, clearAuthSession } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setOnlineUserIds(new Set());
      }
      return;
    }

    // Initialize socket connection with JWT authorization handshake
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('⚡ Socket connected to AetherChat real-time gateway:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
      console.warn('Socket connection error:', err.message);
      setIsConnected(false);

      // If token version was bumped or invalid, purge session
      if (
        err.message?.includes('Session terminated') ||
        err.message?.includes('Invalid authentication token')
      ) {
        localStorage.setItem(
          'session_terminated_notice',
          'You were logged out because this account was logged in from another device/location.'
        );
        clearAuthSession?.();
      }
    });

    // Handle force logout when account is logged in from another device/IP
    newSocket.on(SOCKET_EVENTS.SESSION_TERMINATED, ({ message }) => {
      console.warn('⚠️ Session terminated:', message);
      localStorage.setItem(
        'session_terminated_notice',
        message || 'You were logged out because this account was logged in from another device or location.'
      );
      clearAuthSession?.();
    });

    // Real-time online users roster
    newSocket.on(SOCKET_EVENTS.ONLINE_USERS_LIST, (userIds) => {
      if (Array.isArray(userIds)) {
        setOnlineUserIds(new Set(userIds.map((id) => id.toString())));
      }
    });

    // User presence updates
    newSocket.on(SOCKET_EVENTS.USER_STATUS_CHANGE, ({ userId, status }) => {
      if (!userId) return;
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        const idStr = userId.toString();
        if (status && status !== 'offline') {
          next.add(idStr);
        } else {
          next.delete(idStr);
        }
        return next;
      });
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [token, user, clearAuthSession]);

  // Emitters
  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId });
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, { conversationId });
    }
  }, []);

  const emitTypingStart = useCallback((conversationId) => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit(SOCKET_EVENTS.TYPING_START, { conversationId });
    }
  }, []);

  const emitTypingStop = useCallback((conversationId) => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
    }
  }, []);

  const emitMarkAsRead = useCallback((conversationId, messageId) => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit(SOCKET_EVENTS.MARK_AS_READ, { conversationId, messageId });
    }
  }, []);

  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      const idStr =
        typeof userId === 'object'
          ? (userId._id || userId.id || userId).toString()
          : userId.toString();
      return onlineUserIds.has(idStr);
    },
    [onlineUserIds]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserIds,
        isUserOnline,
        joinConversation,
        leaveConversation,
        emitTypingStart,
        emitTypingStop,
        emitMarkAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
