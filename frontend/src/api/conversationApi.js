import axiosClient from './axiosClient';

export const conversationApi = {
  getConversations: () => axiosClient.get('/conversations'),
  getConversationById: (id) => axiosClient.get(`/conversations/${id}`),
  createDirectConversation: (recipientId) =>
    axiosClient.post('/conversations/direct', { recipientId }),
  createGroupConversation: ({ name, description, avatar, memberIds }) =>
    axiosClient.post('/conversations/group', { name, description, avatar, memberIds }),
  updateGroup: (id, { name, description, avatar }) =>
    axiosClient.patch(`/conversations/group/${id}`, { name, description, avatar }),
  addGroupMembers: (id, memberIds) =>
    axiosClient.post(`/conversations/group/${id}/members`, { memberIds }),
  removeGroupMember: (id, memberId) =>
    axiosClient.delete(`/conversations/group/${id}/members/${memberId}`),
  leaveGroup: (id) =>
    axiosClient.post(`/conversations/group/${id}/leave`),
};

export default conversationApi;
