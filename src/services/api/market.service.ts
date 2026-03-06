import { apiClient, toSafeArray } from '@/services/http/axios-client';
import { ApiEnvelope, Dictionary } from '@/shared/types/api';

export const marketService = {
  async getInstruments() {
    const response = await apiClient.get<ApiEnvelope<Dictionary[]>>('/marketdata/instruments');
    return toSafeArray<Dictionary>(response.data.data);
  },
  async getQuotes(symbols: string[]) {
    const response = await apiClient.get<ApiEnvelope<Dictionary>>('/marketdata/quotes', {
      params: { i: symbols },
    });
    return response.data.data;
  },
  async getOHLC(symbols: string[]) {
    const response = await apiClient.get<ApiEnvelope<Dictionary>>('/marketdata/ohlc', {
      params: { i: symbols },
    });
    return response.data.data;
  },
  async getLTP(symbols: string[]) {
    const response = await apiClient.get<ApiEnvelope<Dictionary>>('/marketdata/ltp', {
      params: { i: symbols },
    });
    return response.data.data;
  },
  async getHistorical(params: Dictionary) {
    const { instrumentToken, interval, ...queryParams } = params as {
      instrumentToken: string;
      interval: string;
      [key: string]: unknown;
    };
    const response = await apiClient.get<ApiEnvelope<Dictionary[]>>(
      `/marketdata/historical/${instrumentToken}/${interval}`,
      { params: queryParams },
    );
    return toSafeArray<Dictionary>(response.data.data);
  },
  async getTriggerRange(params: Dictionary) {
    const response = await apiClient.get<ApiEnvelope<Dictionary>>('/marketdata/trigger-range', { params });
    return response.data.data;
  },
};
