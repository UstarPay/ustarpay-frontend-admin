
// 事件和通知类型
export interface SystemEvent {
    id: string
    type: EventType
    title: string
    description: string
    level: EventLevel
    source?: string
    createdAt: string
    acknowledged: boolean
  }
  
  export enum EventType {
    SECURITY = 'security',
    TRANSACTION = 'transaction',
    SYSTEM = 'system',
    USER = 'user',
  }
  
  export enum EventLevel {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical',
  }

// 通知类型
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  level: NotificationLevel
  read: boolean
  createdAt: string
  readAt?: string
  metadata?: Record<string, any>
}

export enum NotificationType {
  SYSTEM = 'system',
  TRANSACTION = 'transaction',
  SECURITY = 'security',
  WALLET = 'wallet',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
}

export enum NotificationLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface NotificationQueryParams {
  page?: number
  pageSize?: number
  type?: NotificationType
  level?: NotificationLevel
  read?: boolean
  startDate?: string
  endDate?: string
}

export interface NotificationStats {
  total: number
  unread: number
  byType: Record<NotificationType, number>
  byLevel: Record<NotificationLevel, number>
}