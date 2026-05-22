import apiClient from './apiClient';

export const parcelService = {
  async getParcels() {
    const { data } = await apiClient.get('/parcels');
    return data?.parcels || [];
  },

  async getParcel(id) {
    const { data } = await apiClient.get(`/parcels/${id}`);
    return data?.parcel || data;
  },

  async createParcel(parcelData) {
    const { data } = await apiClient.post('/parcels', parcelData);
    return data?.parcel || data;
  },

  async updateParcel(id, parcelData) {
    const { data } = await apiClient.put(`/parcels/${id}`, parcelData);
    return data?.parcel || data;
  },

  async deleteParcel(id) {
    const { data } = await apiClient.delete(`/parcels/${id}`);
    return data;
  },

  async analyzeCrop(parcelId) {
    const { data } = await apiClient.post(`/parcels/${parcelId}/analyze-crop`);
    return data?.analysis || data;
  },

  async analyzeImage(imageUrl, parcelId = null) {
    const { data } = await apiClient.post('/parcels/analyze-image', { image_url: imageUrl, parcel_id: parcelId });
    return data?.analysis || data;
  },

  async getAnalysisHistory(parcelId = null) {
    const path = parcelId ? `/parcels/${parcelId}/analysis-history` : '/parcels/analysis-history';
    const { data } = await apiClient.get(path);
    return data?.history || data?.analyses || [];
  },

  async getAiStatus() {
    const { data } = await apiClient.get('/parcels/ai-status');
    return data;
  },
};

export default parcelService;
