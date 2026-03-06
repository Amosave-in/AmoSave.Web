import { apiClient, toSafeArray } from '@/services/http/axios-client';
import { ApiEnvelope, Dictionary } from '@/shared/types/api';

export const mutualFundsService = {
  async getInstruments() {
    const response = await apiClient.get<ApiEnvelope<Dictionary[]>>('/mf/instruments');
    return toSafeArray<Dictionary>(response.data.data);
  },
  async getHoldings() {
    const response = await apiClient.get<ApiEnvelope<Dictionary[]>>('/mf/holdings');
    return toSafeArray<Dictionary>(response.data.data);
  },
  async getOrders() {
    const response = await apiClient.get<ApiEnvelope<Dictionary[]>>('/mf/orders');
    return toSafeArray<Dictionary>(response.data.data);
  },
  async getOrder(orderId: string) {
    const response = await apiClient.get<ApiEnvelope<Dictionary>>(`/mf/orders/${orderId}`);
    return response.data.data;
  },
  async placeOrder(payload: Dictionary) {
    const response = await apiClient.post<ApiEnvelope<Dictionary>>('/mf/orders', payload);
    return response.data.data;
  },
  async cancelOrder(orderId: string) {
    const response = await apiClient.delete<ApiEnvelope<Dictionary>>(`/mf/orders/${orderId}`);
    return response.data.data;
  },
  async getSips() {
    const response = await apiClient.get<ApiEnvelope<Dictionary[]>>('/mf/sips');
    return toSafeArray<Dictionary>(response.data.data);
  },
  async getSip(sipId: string) {
    const response = await apiClient.get<ApiEnvelope<Dictionary>>(`/mf/sips/${sipId}`);
    return response.data.data;
  },
  async createSip(payload: Dictionary) {
    const response = await apiClient.post<ApiEnvelope<Dictionary>>('/mf/sips', payload);
    return response.data.data;
  },
  async modifySip(sipId: string, payload: Dictionary) {
    const response = await apiClient.put<ApiEnvelope<Dictionary>>(`/mf/sips/${sipId}`, payload);
    return response.data.data;
  },
  async cancelSip(sipId: string) {
    const response = await apiClient.delete<ApiEnvelope<Dictionary>>(`/mf/sips/${sipId}`);
    return response.data.data;
  },
};