import { apiClient } from '@/services/http/axios-client';
import { ApiEnvelope } from '@/shared/types/api';

export type KiteCredential = {
  id: number;
  username: string;
  email: string;
  kiteApiKey: string;
  kiteApiSecretMasked: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateKiteCredentialRequest = {
  username: string;
  email: string;
  kiteApiKey: string;
  kiteApiSecret: string;
};

export type UpdateKiteCredentialRequest = {
  username?: string;
  email?: string;
  kiteApiKey?: string;
  kiteApiSecret?: string;
  isActive?: boolean;
};

export const kiteUsersService = {
  async getCredentials(): Promise<KiteCredential[]> {
    const res = await apiClient.get<ApiEnvelope<KiteCredential[]>>('/kite-user/credentials');
    return res.data.data ?? [];
  },

  async getCredential(id: number): Promise<KiteCredential> {
    const res = await apiClient.get<ApiEnvelope<KiteCredential>>(`/kite-user/credentials/${id}`);
    return res.data.data;
  },

  async createCredential(req: CreateKiteCredentialRequest): Promise<KiteCredential> {
    const res = await apiClient.post<ApiEnvelope<KiteCredential>>('/kite-user/credentials', req);
    return res.data.data;
  },

  async updateCredential(id: number, req: UpdateKiteCredentialRequest): Promise<KiteCredential> {
    const res = await apiClient.put<ApiEnvelope<KiteCredential>>(`/kite-user/credentials/${id}`, req);
    return res.data.data;
  },

  async deleteCredential(id: number): Promise<void> {
    await apiClient.delete(`/kite-user/credentials/${id}`);
  },

  async getLoginUrl(req: CreateKiteCredentialRequest): Promise<string> {
    const res = await apiClient.post<ApiEnvelope<{ loginUrl: string }>>('/kite-user/login-url', {
      username: req.username,
      email: req.email,
      kiteApiKey: req.kiteApiKey,
      kiteApiSecret: req.kiteApiSecret,
    });
    return res.data.data.loginUrl;
  },
};

