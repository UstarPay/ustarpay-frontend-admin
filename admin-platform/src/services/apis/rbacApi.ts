import { apiClient } from '../apiClient'
import { 
  Permission, 
  PermissionModule, 
  PermissionResponse,
  RoutePermission,
  RoutePermissionConfig,
  CreatePermissionModuleRequest,
  UpdatePermissionModuleRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest
} from '../../../../shared/types/permission'
import { 
  AdminRole, 
  RoleResponse, 
  CreateRoleRequest, 
  UpdateRoleRequest, 
  AssignRoleRequest,
  UserRoleResponse 
} from '../../../../shared/types/role'
import { 
  AdminLoginLog, 
  LoginLogQueryParams 
} from '../../../../shared/types/loginLog'
import { PaginatedResponse } from '../../../../shared/types'

// =================== 权限管理API ===================

export const permissionApi = {
  // =================== 权限模块管理 ===================
  
  /**
   * 创建权限模块
   */
  async createPermissionModule(data: CreatePermissionModuleRequest): Promise<PermissionModule> {
    const response = await apiClient.post<PermissionModule>('/rbac/modules', data)
    return response.data
  },

  /**
   * 获取权限模块列表
   */
  async getPermissionModules(): Promise<PermissionModule[]> {
    const response = await apiClient.get<PermissionModule[]>('/rbac/modules')
    return response.data
  },

  /**
   * 获取权限模块详情
   */
  async getPermissionModuleById(id: number): Promise<PermissionModule> {
    const response = await apiClient.get<PermissionModule>(`/rbac/modules/${id}`)
    return response.data
  },

  /**
   * 更新权限模块
   */
  async updatePermissionModule(id: number, data: UpdatePermissionModuleRequest): Promise<PermissionModule> {
    const response = await apiClient.put<PermissionModule>(`/rbac/modules/${id}`, data)
    return response.data
  },

  /**
   * 删除权限模块
   */
  async deletePermissionModule(id: number): Promise<void> {
    await apiClient.delete(`/rbac/modules/${id}`)
  },

  // =================== 权限管理 ===================

  /**
   * 创建权限
   */
  async createPermission(data: CreatePermissionRequest): Promise<Permission> {
    const response = await apiClient.post<Permission>('/rbac/permissions', data)
    return response.data
  },

  /**
   * 获取权限列表
   */
  async getPermissions(moduleId?: number): Promise<Permission[]> {
    const params = moduleId ? { module_id: moduleId } : {}
    const response = await apiClient.get<Permission[]>('/rbac/permissions', { params })
    return response.data
  },

  /**
   * 获取权限详情
   */
  async getPermissionById(id: number): Promise<Permission> {
    const response = await apiClient.get<Permission>(`/rbac/permissions/${id}`)
    return response.data
  },

  /**
   * 更新权限
   */
  async updatePermission(id: number, data: UpdatePermissionRequest): Promise<Permission> {
    const response = await apiClient.put<Permission>(`/rbac/permissions/${id}`, data)
    return response.data
  },

  /**
   * 删除权限
   */
  async deletePermission(id: number): Promise<void> {
    await apiClient.delete(`/rbac/permissions/${id}`)
  },

  // =================== 其他功能 ===================

  /**
   * 获取路由权限配置
   */
  async getRoutePermissions(): Promise<RoutePermissionConfig> {
    const response = await apiClient.get<RoutePermissionConfig>('/rbac/route-permissions')
    return response.data
  },

  /**
   * 获取用户权限
   */
  async getUserPermissions(userId: number): Promise<Permission[]> {
    const response = await apiClient.get<Permission[]>(`/rbac/user-roles/users/${userId}/permissions`)
    return response.data
  },

  /**
   * 检查用户权限
   */
  async checkUserPermission(userId: number, permissionCode: string): Promise<boolean> {
    const response = await apiClient.get<{ has_permission: boolean }>(
      `/rbac/user-roles/users/${userId}/permissions/check`,
      { params: { permission_code: permissionCode } }
    )
    return response.data.has_permission
  }
}

// =================== 角色管理API ===================

export const roleApi = {
  /**
   * 创建角色
   */
  async createRole(data: CreateRoleRequest): Promise<AdminRole> {
    const response = await apiClient.post<AdminRole>('/rbac/roles', data)
    return response.data
  },

  /**
   * 获取角色列表
   */
  async getRoles(includeInactive = false): Promise<AdminRole[]> {
    const params = includeInactive ? { include_inactive: true } : {}
    const response = await apiClient.get<AdminRole[]>('/rbac/roles', { params })
    return response.data
  },

  /**
   * 根据ID获取角色
   */
  async getRoleById(id: number): Promise<AdminRole> {
    const response = await apiClient.get<AdminRole>(`/rbac/roles/${id}`)
    return response.data
  },

  /**
   * 更新角色
   */
  async updateRole(id: number, data: UpdateRoleRequest): Promise<AdminRole> {
    const response = await apiClient.put<AdminRole>(`/rbac/roles/${id}`, data)
    return response.data
  },

  /**
   * 删除角色
   */
  async deleteRole(id: number): Promise<void> {
    await apiClient.delete(`/rbac/roles/${id}`)
  }
}

// =================== 用户角色管理API ===================

export const userRoleApi = {
  /**
   * 为用户分配角色
   */
  async assignRolesToUser(data: AssignRoleRequest): Promise<void> {
    await apiClient.post('/rbac/user-roles/users', data)
  },

  /**
   * 获取用户角色
   */
  async getUserRoles(userId: number): Promise<AdminRole[]> {
    const response = await apiClient.get<AdminRole[]>(`/rbac/user-roles/users/${userId}/roles`)
    return response.data
  },

  /**
   * 获取所有用户及其角色
   */
  async getUsersWithRoles(): Promise<UserRoleResponse[]> {
    const response = await apiClient.get<UserRoleResponse[]>('/rbac/user-roles/users/roles')
    return response.data
  },

  /**
   * 移除用户角色
   */
  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await apiClient.delete(`/rbac/user-roles/users/${userId}/roles/${roleId}`)
  }
}

// =================== 登录日志API ===================

export const loginLogApi = {
  /**
   * 获取登录日志
   */
  async getLoginLogs(params: LoginLogQueryParams = {}): Promise<PaginatedResponse<AdminLoginLog>> {
    const response = await apiClient.get<PaginatedResponse<AdminLoginLog>>('/rbac/login-logs', { params })
    return response.data
  }
}

// =================== 组合API ===================

export const rbacApi = {
  permission: permissionApi,
  role: roleApi,
  userRole: userRoleApi,
  loginLog: loginLogApi
}

export default rbacApi
