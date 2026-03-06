import { apiClient, toSafeArray } from '@/services/http/axios-client';
import { ApiEnvelope, Dictionary } from '@/shared/types/api';

type PositionsResponse = { net: Dictionary[]; day: Dictionary[] } | Dictionary[];

export const portfolioService = {
  async getPositions() {
    const response = await apiClient.get<ApiEnvelope<PositionsResponse>>('/portfolio/positions');
    const data = response.data.data;
    // API returns { net: [], day: [] } — use net (complete picture); fallback for flat array shape
    if (Array.isArray(data)) return data;
    return toSafeArray<Dictionary>((data as { net?: unknown }).net);
  },
  async getHoldings() {
    const response = await apiClient.get<ApiEnvelope<Dictionary[]>>('/portfolio/holdings');
    return toSafeArray<Dictionary>(response.data.data);
  },
  async getAuctions() {
    const response = await apiClient.get<ApiEnvelope<Dictionary[]>>('/portfolio/holdings/auctions');
    return toSafeArray<Dictionary>(response.data.data);
  },
  async convertPosition(payload: Dictionary) {
    const response = await apiClient.put<ApiEnvelope<Dictionary>>('/portfolio/positions', payload);
    return response.data.data;
  },
};
