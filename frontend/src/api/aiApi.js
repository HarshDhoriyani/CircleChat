import axiosClient from './axiosClient';

export const aiApi = {
  /**
   * Generates structured Catch Me Up summary for a conversation
   */
  getCatchMeUpSummary: (conversationId, { unreadOnly = false, messageLimit = 40 } = {}) =>
    axiosClient.post('/ai/catch-me-up', {
      conversationId,
      unreadOnly,
      messageLimit,
    }),

  getConversationSummary: (conversationId, { unreadOnly = false, messageLimit = 40 } = {}) =>
    axiosClient.post(`/conversations/${conversationId}/summary`, {
      unreadOnly,
      messageLimit,
    }),
};

export default aiApi;
