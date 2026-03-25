import { api } from './api'

export interface TenantAppUser {
  id: string
  userName: string
  email: string
  phone?: string
  countryCode?: string
  status: number
  isKycInternal: number
  isKycGenuine: number
  invitedUid?: string
  registerTime: string
  lastLoginTime?: string
  remark?: string
}

export interface TenantInvitationRelation {
  id: string
  inviteCode: string
  bindSource: string
  boundAt: string
  inviteeId: string
  inviteeUserName: string
  inviteeEmail: string
  inviteeRegisterTime: string
  inviteeKycStatus: number
  inviterId: string
  inviterUserName: string
  inviterEmail: string
}

export interface TenantInvitationGroup {
  inviterId: string
  inviterUserName: string
  inviterEmail: string
  inviteeCount: number
  kycPassedCount: number
  latestBoundAt?: string
  invitees: TenantInvitationRelation[]
}

export interface TenantInvitationUserSummary {
  id: string
  userName: string
  email: string
  invitationCode?: string
  registerTime: string
  isKycInternal: number
  boundAt?: string
  bindSource?: string
}

export interface TenantInvitationDetail {
  user: TenantInvitationUserSummary
  inviter?: TenantInvitationUserSummary
  invitees: TenantInvitationUserSummary[]
  inviteeCount: number
}

export interface TenantAppUserKyc {
  id: string
  level?: 'l1' | 'l2'
  recordSource?: 'local' | 'sumsub'
  userId: string
  userName: string
  email?: string
  businessId: string
  status: number
  rejectReason?: string
  failureReason?: string
  submittedAt: string
  approvedAt?: string
  rejectedAt?: string
  createdAt: string
  updatedAt: string
  firstName?: string
  lastName?: string
  nationality?: string
  phone?: string
  addressCountry?: string
  operatorId?: string
  operatorUsername?: string
  operatorDisplayName?: string
  providerStatus?: string
  reviewAnswer?: string
  applicantId?: string
  actionId?: string
  externalActionId?: string
}

export interface TenantAppUserKycDetail extends TenantAppUserKyc {
  documentType?: string
  documentCountry?: string
  fullName?: string
  gender?: string
  dob?: string
  placeOfBirth?: string
  countryOfBirth?: string
  residenceCountry?: string
  taxResidenceCountry?: string
  addressStreet?: string
  addressBuildingNumber?: string
  addressFlatNumber?: string
  addressTown?: string
  addressState?: string
  addressPostCode?: string
  addressFormattedAddress?: string
  tin?: string
  metadata?: Record<string, any>
  idCardFrontUrl?: string
  idCardBackUrl?: string
  selfieUrl?: string
}

export interface TenantAppUserKycUserSummary {
  userId: string
  userName: string
  email?: string
  phone?: string
  latestStatus: number
  latestSubmittedAt?: string
  latestApprovedAt?: string
  latestRejectedAt?: string
  submissionCount: number
}

export interface TenantUserListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  kycStatus?: string
}

export interface TenantUserKycListParams {
  page?: number
  pageSize?: number
  level?: 'l1' | 'l2'
  userId?: string
  search?: string
  status?: string
  userName?: string
  businessId?: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  nationality?: string
  addressCountry?: string
  operator?: string
  submittedFrom?: string
  submittedTo?: string
  approvedFrom?: string
  approvedTo?: string
  rejectedFrom?: string
  rejectedTo?: string
}

export interface TenantUserKycUserListParams {
  page?: number
  pageSize?: number
  level?: 'l1' | 'l2'
  search?: string
  status?: string
}

export interface TenantInvitationListParams {
  page?: number
  pageSize?: number
  search?: string
  inviter?: string
  invitee?: string
  inviteCode?: string
  bindSource?: string
}

export interface TenantUserSavePayload {
  userName: string
  accountLevel?: number
  profilePhoto?: string
  gender?: number
  profession?: string
  countryCode?: string
  birthDay?: string
  loginPassword?: string
  transactionPin?: string
  invitationCode?: string
  inviterCode?: string
  email: string
  phoneAreaCode?: number
  phone?: string
  status?: number
  remark?: string
}

export interface TenantUserKycSavePayload {
  userId: string
  businessId?: string
  firstName?: string
  lastName?: string
  fullName?: string
  gender?: string
  dob?: string
  placeOfBirth?: string
  countryOfBirth?: string
  nationality?: string
  email?: string
  phone?: string
  addressCountry?: string
  addressStreet?: string
  addressBuildingNumber?: string
  addressFlatNumber?: string
  addressTown?: string
  addressState?: string
  addressPostCode?: string
  addressFormattedAddress?: string
  tin?: string
  metadata?: Record<string, any>
  idCardFrontUrl?: string
  idCardBackUrl?: string
  status: number
  rejectReason?: string
}

export interface TenantUserKycReviewPayload {
  action: 'approve' | 'reject'
  rejectReason?: string
  level?: 'l1' | 'l2'
}

export const tenantUserService = {
  getUsers: (params?: TenantUserListParams) => api.get('/app-users', params),
  getUser: (id: string) => api.get(`/app-users/${id}`),
  getInvitationGroups: (params?: TenantInvitationListParams) => api.get('/app-users/invitations/groups', params),
  getInvitations: (params?: TenantInvitationListParams) => api.get('/app-users/invitations', params),
  getUserInvitations: (id: string) => api.get(`/app-users/${id}/invitations`),
  createUser: (payload: TenantUserSavePayload) => api.post('/app-users', payload),
  updateUser: (id: string, payload: Partial<TenantUserSavePayload>) => api.put(`/app-users/${id}`, payload),
  deleteUser: (id: string) => api.delete(`/app-users/${id}`),

  getKycs: (params?: TenantUserKycListParams) => api.get('/app-users/kyc', params),
  getKycUsers: (params?: TenantUserKycUserListParams) => api.get('/app-users/kyc/users', params),
  getUserKycSubmissions: (userId: string, params?: TenantUserKycListParams) =>
    api.get(`/app-users/kyc/users/${userId}/submissions`, params),
  getKycSubmissionDetail: (id: string, level?: 'l1' | 'l2') =>
    api.get<TenantAppUserKycDetail>(`/app-users/kyc/submissions/${id}`, level ? { level } : undefined),
  getKyc: (id: string, level?: 'l1' | 'l2') =>
    api.get<TenantAppUserKycDetail>(`/app-users/kyc/${id}`, level ? { level } : undefined),
  createKyc: (payload: TenantUserKycSavePayload) => api.post('/app-users/kyc', payload),
  updateKyc: (id: string, payload: Partial<TenantUserKycSavePayload>) => api.put(`/app-users/kyc/${id}`, payload),
  reviewKyc: (id: string, payload: TenantUserKycReviewPayload) =>
    api.post(`/app-users/kyc/${id}/review`, payload, payload.level ? { config: { params: { level: payload.level } } } : undefined),
  deleteKyc: (id: string, level?: 'l1' | 'l2') =>
    api.delete(`/app-users/kyc/${id}`, level ? { config: { params: { level } } } : undefined),
}
