import api from '../api/api';

export interface WebhookResponse {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  is_active: boolean;
}

export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: string[];
  secret?: string;
  is_active?: boolean;
}

export interface WebhookListResponse {
  webhooks: WebhookResponse[];
  total: number;
}

class WebhookService {
  async listWebhooks() {
    const res = await api.get<WebhookListResponse>('/v1/webhooks');
    return { data: res.data.webhooks, total: res.data.total };
  }

  async getWebhook(id: string) {
    const res = await api.get(`/v1/webhooks/${id}`);
    return res.data;
  }

  async createWebhook(webhook: CreateWebhookRequest) {
    const res = await api.post('/v1/webhooks', webhook);
    return res.data;
  }

  async updateWebhook(id: string, webhook: UpdateWebhookRequest) {
    const res = await api.put(`/v1/webhooks/${id}`, webhook);
    return res.data;
  }

  async deleteWebhook(id: string) {
    const res = await api.delete(`/v1/webhooks/${id}`);
    return res.data;
  }

  async testWebhook(id: string) {
    const res = await api.post(`/v1/webhooks/${id}/test`);
    return res.data;
  }
}

export const webhookService = new WebhookService();
