import { api } from "./api";

export interface NotificationRecord {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  email: string;
  eventCode: string;
  type: string;
  channel: string;
  severity: string;
  title: string;
  body: string;
  route?: string;
  read: boolean;
  seen: boolean;
  createdAt: string;
  readAt?: string | null;
  seenAt?: string | null;
  deliveryStatus: string;
  totalDeliveries: number;
  deliveredCount: number;
  acceptedCount: number;
  pendingCount: number;
  failedCount: number;
  lastDeliveryAt?: string | null;
  payload?: Record<string, unknown>;
}

export interface NotificationUserSummary {
  userId: string;
  userName: string;
  email: string;
  notificationCount: number;
  unreadCount: number;
  failedCount: number;
  pendingCount: number;
  deliveredCount: number;
  lastNotificationAt?: string | null;
}

export interface NotificationDeliveryRecord {
  id: string;
  notificationId: string;
  deviceId?: string;
  channel: string;
  provider?: string;
  providerTicketId?: string;
  providerReceiptId?: string;
  deliveryStatus: string;
  errorCode?: string;
  errorMessage?: string;
  attemptCount: number;
  lastAttemptAt?: string | null;
  createdAt: string;
  updatedAt: string;
  platform?: string;
  locale?: string;
  deviceName?: string;
  deviceStatus?: string;
  expoPushTokenMasked?: string;
}

export interface NotificationRecordDetail {
  notification: NotificationRecord;
  deliveries: NotificationDeliveryRecord[];
}

export interface NotificationRecordListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  eventCode?: string;
  readStatus?: string;
  deliveryStatus?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface NotificationUserSummaryListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const notificationRecordService = {
  getUsers: async (params: NotificationUserSummaryListParams) => {
    return api.get<{
      items: NotificationUserSummary[];
      pagination: {
        page: number;
        pageSize: number;
        total: number;
      };
    }>("/notification-records/users", params);
  },

  getRecords: async (params: NotificationRecordListParams) => {
    return api.get<{
      items: NotificationRecord[];
      pagination: {
        page: number;
        pageSize: number;
        total: number;
      };
    }>("/notification-records", params);
  },

  getRecord: async (id: string) => {
    return api.get<NotificationRecordDetail>(`/notification-records/${id}`);
  },
};
