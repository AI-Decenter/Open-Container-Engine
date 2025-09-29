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

// Helper function to transform string events to enum format expected by backend
const transformEventsForBackend = (events: string[]): string[] => {
  const eventMap: Record<string, string> = {
    'deployment_started': 'DeploymentStarted',
    'deployment_completed': 'DeploymentCompleted',
    'deployment_failed': 'DeploymentFailed',
    'deployment_deleted': 'DeploymentDeleted',
    'deployment_scaling': 'DeploymentScaling',
    'deployment_scaled': 'DeploymentScaled',
    'deployment_start_failed': 'DeploymentStartFailed',
    'deployment_stop_failed': 'DeploymentStopFailed',
    'deployment_stopped': 'DeploymentStopped',
    'all': 'All',
  };

  return events.map(event => eventMap[event] || event);
};

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
    const payload = {
      ...webhook,
      events: transformEventsForBackend(webhook.events),
    };
    const res = await api.post('/v1/webhooks', payload);
    return res.data;
  }

  async updateWebhook(id: string, webhook: UpdateWebhookRequest) {
    const payload = {
      ...webhook,
      events: webhook.events ? transformEventsForBackend(webhook.events) : undefined,
    };
    const res = await api.put(`/v1/webhooks/${id}`, payload);
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
