import apiClient from './apiClient';

export const assistantService = {
  async getConversations() {
    const { data } = await apiClient.get('/assistant/conversations');
    return data;
  },

  async createConversation() {
    const { data } = await apiClient.post('/assistant/conversations');
    return data;
  },

  async updateConversation(id, updates) {
    const { data } = await apiClient.put(`/assistant/conversations/${id}`, updates);
    return data;
  },

  async deleteConversation(id) {
    const { data } = await apiClient.delete(`/assistant/conversations/${id}`);
    return data;
  },

  async getMessages(conversationId) {
    const { data } = await apiClient.get(`/assistant/conversations/${conversationId}/messages`);
    return data;
  },

  async sendChatMessage(message, history = [], conversationId = null) {
    const { data } = await apiClient.post('/assistant/chat', { message, history, conversationId });
    return data;
  },
};

export default assistantService;
