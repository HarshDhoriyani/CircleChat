import axiosClient from './axiosClient';

export const messageApi = {
  getMessages: (conversationId, { page = 1, limit = 50 } = {}) =>
    axiosClient.get(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`),
  sendMessage: (conversationId, { text, attachments = [], tempId }) =>
    axiosClient.post(`/conversations/${conversationId}/messages`, {
      text,
      attachments,
      tempId,
    }),
  editMessage: (conversationId, messageId, text) =>
    axiosClient.patch(`/conversations/${conversationId}/messages/${messageId}`, { text }),
  deleteMessage: (conversationId, messageId, type = 'me') =>
    axiosClient.delete(`/conversations/${conversationId}/messages/${messageId}?type=${type}`),
  getMessageInfo: (conversationId, messageId) =>
    axiosClient.get(`/conversations/${conversationId}/messages/${messageId}/info`),
  markAsRead: (conversationId) =>
    axiosClient.post(`/conversations/${conversationId}/read`),
};

export default messageApi;
