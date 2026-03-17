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
  createdAt: string
  updatedAt: string
  firstName?: string
  lastName?: string
  nationality?: string
  phone?: string
  addressCountry?: string
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
  deleteKyc: (id: string) => api.delete(`/app-users/kyc/${id}`),
}

