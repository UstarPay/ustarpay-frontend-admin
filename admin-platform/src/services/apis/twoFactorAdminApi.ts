import { apiClient } from '@/services/apiClient'

export type TwoFactorAdminUserType = 'all' | 'app' | 'tenant'
export type TwoFactorAdminStatus =
  | 'all'
  | 'active'
  | 'pending'
  | 'disabled'
  | 'locked'
  | 'not_enabled'

export interface TwoFactorAdminUserSummary {
  userType: string
  userId: string
  tenantId?: string
  accountKind?: string
  username: string
  usernameMasked: string
  displayName: string
  emailMasked?: string
  phoneMasked?: string
  hasTwoFactor: boolean
  methodType?: string
  methodStatus: string
  pendingSetup: boolean
  hasLockedChallenge: boolean
  enabledAt?: string
  lastVerifiedAt?: string
  remainingRecovery: number
  lastChallengeAt?: string
  lastChallengeAttemptCount: number
}

export interface TwoFactorAdminMethodDetail {
  methodId: string
  methodType: string
  status: string
  issuer?: string
  accountName?: string
  setupStartedAt?: string
  enabledAt?: string
  disabledAt?: string
  disabledReason?: string
  lastVerifiedAt?: string
  remainingRecovery: number
}

export interface TwoFactorAdminRiskDetail {
  hasLockedChallenge: boolean
  lastChallengeAt?: string
  lastChallengeAttemptCount: number
  recentIp?: string
  recentUserAgent?: string
}

export interface TwoFactorAdminAuditEvent {
  id: string
  userType: string
  userId: string
  tenantId?: string
  accountKind?: string
  usernameMasked?: string
  displayName?: string
  emailMasked?: string
  phoneMasked?: string
  eventType: string
  eventResult: string
  relatedMethodId?: string
  relatedChallengeId?: string
  operatorAdminId?: string
  operatorAdminUsername?: string
  reason?: string
  ticketNo?: string
  ip?: string
  userAgent?: string
  payloadJson?: Record<string, unknown>
  createdAt: string
}

export interface TwoFactorAdminUserDetail {
  summary: TwoFactorAdminUserSummary
  method?: TwoFactorAdminMethodDetail
  risk: TwoFactorAdminRiskDetail
  recentEvents: TwoFactorAdminAuditEvent[]
  recentAdminActions: TwoFactorAdminAuditEvent[]
}

export interface TwoFactorAdminUserListResponse {
  items: TwoFactorAdminUserSummary[]
  total: number
  page: number
  pageSize: number
}

export interface TwoFactorAdminAuditEventListResponse {
  items: TwoFactorAdminAuditEvent[]
  total: number
  page: number
  pageSize: number
}

export interface TwoFactorAdminUserFilters {
  userType?: TwoFactorAdminUserType
  status?: TwoFactorAdminStatus
  keyword?: string
  page?: number
  pageSize?: number
}

export interface TwoFactorAdminAuditFilters {
  userType?: TwoFactorAdminUserType
  eventType?: string
  result?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface TwoFactorAdminActionPayload {
  reason: string
  ticketNo: string
}

export const twoFactorAdminApi = {
  async listUsers(
    filters: TwoFactorAdminUserFilters
  ): Promise<TwoFactorAdminUserListResponse> {
    const response = await apiClient.get<TwoFactorAdminUserListResponse>(
      '/security/2fa/users',
      {
        params: filters,
      }
    )
    return response.data
  },

  async getUserDetail(
    userType: string,
    userId: string
  ): Promise<TwoFactorAdminUserDetail> {
    const response = await apiClient.get<TwoFactorAdminUserDetail>(
      `/security/2fa/users/${userType}/${userId}`
    )
    return response.data
  },

  async resetUser(
    userType: string,
    userId: string,
    payload: TwoFactorAdminActionPayload
  ): Promise<TwoFactorAdminUserDetail> {
    const response = await apiClient.post<TwoFactorAdminUserDetail>(
      `/security/2fa/users/${userType}/${userId}/reset`,
      payload
    )
    return response.data
  },

  async unlockUser(
    userType: string,
    userId: string,
    payload: TwoFactorAdminActionPayload
  ): Promise<TwoFactorAdminUserDetail> {
    const response = await apiClient.post<TwoFactorAdminUserDetail>(
      `/security/2fa/users/${userType}/${userId}/unlock`,
      payload
    )
    return response.data
  },

  async listAuditEvents(
    filters: TwoFactorAdminAuditFilters
  ): Promise<TwoFactorAdminAuditEventListResponse> {
    const response = await apiClient.get<TwoFactorAdminAuditEventListResponse>(
      '/security/2fa/audit-events',
      {
        params: filters,
      }
    )
    return response.data
  },
}
