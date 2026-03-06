import { apiClient } from '@/services/http/axios-client';
import { ApiEnvelope, Dictionary } from '@/shared/types/api';

export const dashboardService = {
  async getDashboardSummary() {
    const response = await apiClient.get<ApiEnvelope<Dictionary>>('/dashboard/summary');
    return response.data.data;
  },
  async getBrokers() {
    const response = await apiClient.get<ApiEnvelope<Dictionary[]>>('/dashboard/brokers');
    return response.data.data;
  },
};
