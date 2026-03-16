import { api } from './api'

export interface TenantRbacUser {
  id: string
  username: string
  displayName: string
  email: string
  status: number
  isOwner: boolean
  isSuperAdmin: boolean
  remark?: string
  roleNames?: string
  lastLoginAt?: string
  createdAt: string
}

export interface TenantRbacRole {
  id: number
  roleCode: string
  roleName: string
  description?: string
  isSystem: boolean
  isActive: boolean
  permissionCount: number
  userCount: number
  createdAt: string
}

export interface TenantRbacModule {
  id: number
  moduleCode: string
  moduleName: string
  description?: string
  sort: number
  isActive: boolean
}

export interface TenantRbacPermission {
  id: number
  moduleId: number
  moduleCode: string
  moduleName: string
  permissionCode: string
  permissionName: string
  description?: string
  resource?: string
  action?: string
  sort: number
  isActive: boolean
}

export interface TenantRbacUserPayload {
  username: string
  displayName: string
  email: string
  password?: string
  status?: number
  remark?: string
  roleIds: number[]
}

export interface TenantRbacRolePayload {
  roleCode: string
  roleName: string
  description?: string
  isActive?: boolean
  permissionIds: number[]
}

export interface TenantRbacModulePayload {
  moduleCode: string
  moduleName: string
  description?: string
  sort?: number
  isActive?: boolean
}

export interface TenantRbacPermissionPayload {
  moduleId: number
  permissionCode: string
  permissionName: string
  description?: string
  resource?: string
  action?: string
  sort?: number
  isActive?: boolean
}

export const tenantRbacService = {
  getUsers: (params?: { page?: number; pageSize?: number; search?: string }) => api.get('/rbac/users', params),
  getUser: (id: string) => api.get(`/rbac/users/${id}`),
  createUser: (payload: TenantRbacUserPayload) => api.post('/rbac/users', payload),
  updateUser: (id: string, payload: Partial<TenantRbacUserPayload>) => api.put(`/rbac/users/${id}`, payload),
  deleteUser: (id: string) => api.delete(`/rbac/users/${id}`),

  getRoles: () => api.get('/rbac/roles'),
  getRole: (id: number) => api.get(`/rbac/roles/${id}`),
  createRole: (payload: TenantRbacRolePayload) => api.post('/rbac/roles', payload),
  updateRole: (id: number, payload: Partial<TenantRbacRolePayload>) => api.put(`/rbac/roles/${id}`, payload),
  deleteRole: (id: number) => api.delete(`/rbac/roles/${id}`),

  getModules: () => api.get('/rbac/modules'),
  createModule: (payload: TenantRbacModulePayload) => api.post('/rbac/modules', payload),
  updateModule: (id: number, payload: TenantRbacModulePayload) => api.put(`/rbac/modules/${id}`, payload),
  deleteModule: (id: number) => api.delete(`/rbac/modules/${id}`),

  getPermissions: (params?: { moduleId?: number }) => api.get('/rbac/permissions', params),
  getPermission: (id: number) => api.get(`/rbac/permissions/${id}`),
  createPermission: (payload: TenantRbacPermissionPayload) => api.post('/rbac/permissions', payload),
  updatePermission: (id: number, payload: TenantRbacPermissionPayload) => api.put(`/rbac/permissions/${id}`, payload),
  deletePermission: (id: number) => api.delete(`/rbac/permissions/${id}`),
}
