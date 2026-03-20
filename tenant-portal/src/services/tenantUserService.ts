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

export interface TenantAppUserKyc {
  id: string
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
}

export const tenantUserService = {
  getUsers: (params?: TenantUserListParams) => api.get('/app-users', params),
  getUser: (id: string) => api.get(`/app-users/${id}`),
  createUser: (payload: TenantUserSavePayload) => api.post('/app-users', payload),
  updateUser: (id: string, payload: Partial<TenantUserSavePayload>) => api.put(`/app-users/${id}`, payload),
  deleteUser: (id: string) => api.delete(`/app-users/${id}`),

  getKycs: (params?: TenantUserKycListParams) => api.get('/app-users/kyc', params),
  getKyc: (id: string) => api.get(`/app-users/kyc/${id}`),
  createKyc: (payload: TenantUserKycSavePayload) => api.post('/app-users/kyc', payload),
  updateKyc: (id: string, payload: Partial<TenantUserKycSavePayload>) => api.put(`/app-users/kyc/${id}`, payload),
  reviewKyc: (id: string, payload: TenantUserKycReviewPayload) => api.post(`/app-users/kyc/${id}/review`, payload),
  deleteKyc: (id: string) => api.delete(`/app-users/kyc/${id}`),
}
