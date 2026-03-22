import { api } from "./api";

export interface NotificationTemplate {
  id: string;
  tenantId: string;
  eventCode: string;
  channel: string;
  locale: string;
  titleTemplate: string;
  bodyTemplate: string;
  route?: string | null;
  enabled: boolean;
  version: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationTemplatePayload {
  eventCode: string;
  channel?: string;
  locale: string;
  titleTemplate: string;
  bodyTemplate: string;
  route?: string;
  enabled?: boolean;
}

export interface UpdateNotificationTemplatePayload {
  titleTemplate: string;
  bodyTemplate: string;
  route?: string;
  enabled: boolean;
}

export const notificationTemplateService = {
  getTemplates: async () => {
    return api.get<NotificationTemplate[]>("/notification-templates");
  },

  syncDefaultTemplates: async () => {
    return api.post<NotificationTemplate[]>(
      "/notification-templates/defaults/sync",
    );
  },

  createTemplate: async (payload: CreateNotificationTemplatePayload) => {
    return api.post<NotificationTemplate>("/notification-templates", payload);
  },

  updateTemplate: async (
    id: string,
    payload: UpdateNotificationTemplatePayload,
  ) => {
    return api.put<NotificationTemplate>(
      `/notification-templates/${id}`,
      payload,
    );
  },

  deleteTemplate: async (id: string) => {
    return api.delete<void>(`/notification-templates/${id}`);
  },
};
