import { User } from '../models/User.js';
import { SOCKET_EVENTS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

// In-memory store mapping userId -> Set of active socket IDs
const activeUsersMap = new Map();

export const handlePresence = (io, socket) => {
  const userId = socket.userId;
  if (!userId) return;

  // 1. Register socket ID for this user & join personal user room
  if (!activeUsersMap.has(userId)) {
    activeUsersMap.set(userId, new Set());
  }
  activeUsersMap.get(userId).add(socket.id);
  socket.join(`user:${userId}`);

  logger.info(`⚡ User connected: ${socket.user?.name} (@${socket.user?.username}) [${socket.id}]`);

  // 2. Mark user status in DB using their chosen presencePreference
  const userPref =
    socket.user?.presencePreference ||
    (socket.user?.status && socket.user?.status !== 'offline' ? socket.user.status : 'online') ||
    'online';
  User.findByIdAndUpdate(userId, { status: userPref }).catch(() => {});

  // 3. Send current list of online users to the newly connected client
  const onlineUserIds = Array.from(activeUsersMap.keys());
  socket.emit(SOCKET_EVENTS.ONLINE_USERS_LIST, onlineUserIds);

  // 4. Broadcast to all clients that this user is now online with their preferred status
  socket.broadcast.emit(SOCKET_EVENTS.USER_STATUS_CHANGE, {
    userId,
    status: userPref,
    presencePreference: userPref,
  });

  // 5. Handle Disconnection
  socket.on(SOCKET_EVENTS.DISCONNECT, async (reason) => {
    logger.info(`🔌 Socket disconnected: ${socket.user?.name} [${socket.id}] reason: ${reason}`);

    const userSockets = activeUsersMap.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);

      // If user has no other active browser tabs/sockets open, mark offline
      if (userSockets.size === 0) {
        activeUsersMap.delete(userId);

        await User.findByIdAndUpdate(userId, {
          status: 'offline',
          lastSeen: new Date(),
        }).catch(() => {});

        socket.broadcast.emit(SOCKET_EVENTS.USER_STATUS_CHANGE, {
          userId,
          status: 'offline',
        });
      }
    }
  });
};

export const getOnlineUsers = () => {
  return Array.from(activeUsersMap.keys());
};
