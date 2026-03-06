import { apiClient, toSafeArray } from '@/services/http/axios-client';
import { ApiEnvelope, Dictionary } from '@/shared/types/api';

export const gttService = {
  async getTriggers() {
    const response = await apiClient.get<ApiEnvelope<Dictionary[]>>('/gtt');
    return toSafeArray<Dictionary>(response.data.data);
  },
  async getTrigger(id: string) {
    const response = await apiClient.get<ApiEnvelope<Dictionary>>(`/gtt/${id}`);
    return response.data.data;
  },
  async createTrigger(payload: Dictionary) {
    const response = await apiClient.post<ApiEnvelope<Dictionary>>('/gtt', payload);
    return response.data.data;
  },
  async modifyTrigger(id: string, payload: Dictionary) {
    const response = await apiClient.put<ApiEnvelope<Dictionary>>(`/gtt/${id}`, payload);
    return response.data.data;
  },
  async cancelTrigger(id: string) {
    const response = await apiClient.delete<ApiEnvelope<Dictionary>>(`/gtt/${id}`);
    return response.data.data;
  },
};