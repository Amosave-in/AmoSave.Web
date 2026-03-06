import { apiClient, toSafeArray } from '@/services/http/axios-client';
import { ApiEnvelope, Dictionary } from '@/shared/types/api';

export const optionsService = {
  async getExpiries(underlying: string) {
    const response = await apiClient.get<ApiEnvelope<string[]>>(`/options/expiries/${underlying}`);
    return toSafeArray<string>(response.data.data);
  },
  async getOptionChain(payload: { userId?: string; underlying: string; expiry: string }) {
    const userId = payload.userId?.trim();
    const requestPayload = userId
      ? { userId, underlying: payload.underlying, expiry: payload.expiry }
      : { underlying: payload.underlying, expiry: payload.expiry };

    const response = await apiClient.post<ApiEnvelope<Dictionary>>('/options/chain', requestPayload);
    return response.data.data;
  },
  async calculateBlackScholes(payload: Dictionary) {
    const response = await apiClient.post<ApiEnvelope<Dictionary>>('/options/black-scholes', payload);
    return response.data.data;
  },
  async getMaxPain(payload: { underlying: string; expiry: string }) {
    const response = await apiClient.post<ApiEnvelope<Dictionary>>('/options/max-pain', payload);
    return response.data.data;
  },
  async getPcr(payload: { underlying: string; expiry: string }) {
    const response = await apiClient.post<ApiEnvelope<Dictionary>>('/options/pcr', payload);
    return response.data.data;
  },
};
