import { api } from './api'

export interface TenantUserAddressBook {
  id: string
  userId: string
  userName: string
  email?: string
  chainCode: string
  chainNetwork?: string
  symbol: string
  label: string
  address: string
  remark?: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface TenantUserAddressBookListParams {
  page?: number
  pageSize?: number
  search?: string
  userId?: string
  chainCode?: string
  symbol?: string
}

export interface TenantUserAddressBookSavePayload {
  userId: string
  chainCode: string
  chainNetwork?: string
  symbol: string
  label: string
  address: string
  remark?: string
  status?: number
}

export const tenantAddressBookService = {
  getAddressBooks: (params?: TenantUserAddressBookListParams) => api.get('/app-users/address-books', params),
  getAddressBook: (id: string) => api.get(`/app-users/address-books/${id}`),
  createAddressBook: (payload: TenantUserAddressBookSavePayload) => api.post('/app-users/address-books', payload),
  updateAddressBook: (id: string, payload: Partial<TenantUserAddressBookSavePayload>) =>
    api.put(`/app-users/address-books/${id}`, payload),
  deleteAddressBook: (id: string) => api.delete(`/app-users/address-books/${id}`),
}
