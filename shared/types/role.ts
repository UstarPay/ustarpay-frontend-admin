import { Permission, PermissionResponse } from "./permission"

// 角色类型 - 对应Go的AdminRole
export interface AdminRole {
  id: number
  role_name: string
  role_code: string
  description?: string
  is_system: boolean        // 系统内置角色不可删除
  is_active: boolean
  created_at: string
  updated_at: string
  permissions?: Permission[]
}

// 角色响应类型 - 对应Go的RoleResponse
export interface RoleResponse {
  id: number
  role_name: string
  role_code: string
  description: string
  is_system: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  permissions: PermissionResponse[]
}

// 创建角色请求 - 对应Go的CreateRoleRequest
export interface CreateRoleRequest {
  role_name: string
  role_code: string
  description: string
  permission_ids: number[]
}

// 更新角色请求 - 对应Go的UpdateRoleRequest
export interface UpdateRoleRequest {
  role_name?: string
  description?: string
  permission_ids?: number[]
  is_active?: boolean
}

// 分配角色请求 - 对应Go的AssignRoleRequest
export interface AssignRoleRequest {
  user_id: number
  role_ids: number[]
}

// 角色权限关联 - 对应Go的RolePermission
export interface RolePermission {
  id: number
  role_id: number
  permission_id: number
  created_at: string
  role?: AdminRole
  permission?: Permission
}

// 用户角色关联 - 对应Go的AdminUserRole
export interface AdminUserRole {
  id: number
  user_id: number
  role_id: number
  assigned_by?: number
  assigned_at: string
  role?: AdminRole
  assigned_by_user?: {
    id: number
    username: string
    full_name: string
  }
}

// 用户角色响应 - 对应Go的UserRoleResponse
export interface UserRoleResponse {
  user_id: number
  username: string
  full_name: string
  email: string
  status: string
  roles: RoleResponse[]
} 