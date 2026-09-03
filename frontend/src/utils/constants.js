export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Client Emitters
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  SEND_MESSAGE: 'send_message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  MARK_AS_READ: 'mark_as_read',

  // Server Emitters
  RECEIVE_MESSAGE: 'receive_message',
  MESSAGE_SENT: 'message_sent',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
  USER_STATUS_CHANGE: 'user_status_change',
  ONLINE_USERS_LIST: 'online_users_list',
  MESSAGE_READ: 'message_read',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  NEW_USER_REGISTERED: 'new_user_registered',
  SESSION_TERMINATED: 'session_terminated',
  CONVERSATION_UPDATED: 'conversation_updated',
  GROUP_MEMBER_ADDED: 'group_member_added',
  GROUP_MEMBER_REMOVED: 'group_member_removed',
  ERROR: 'error',
};

export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
  BUSY: 'busy',
};

export const CONVERSATION_TYPES = {
  DIRECT: 'direct',
  GROUP: 'group',
};

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
};

export const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
];

export const DEFAULT_GROUP_AVATARS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=256&q=80',
];
