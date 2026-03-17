import { BaseEntity } from "./base"

// 权限模块类型 - 对应Go的PermissionModule
export interface PermissionModule {
  id: number
  module_name: string
  module_code: string
  description?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

// 权限类型 - 对应Go的Permission
export interface Permission {
  id: number
  module_id: number
  permission_name: string
  permission_code: string
  resource?: string          // 资源路径或API端点
  action?: string           // create, read, update, delete, execute
  description?: string
  sort_order: number
  is_active: boolean
  created_at: string
  module?: PermissionModule
}

// 权限响应类型 - 对应Go的PermissionResponse
export interface PermissionResponse {
  id: number
  module_id: number
  module_name: string
  permission_name: string
  permission_code: string
  resource: string
  action: string
  description: string
  is_active: boolean
}

// 路由权限映射 - 对应Go的RoutePermission
export interface RoutePermission {
  method: string
  path: string
  permission: string
  description: string
  is_sensitive: boolean
}

// 路由权限配置 - 对应Go的RoutePermissionConfig
export interface RoutePermissionConfig {
  route_permissions: RoutePermission[]
  last_updated: string
}

// =================== 权限模块CRUD操作类型 ===================

// 创建权限模块请求
export interface CreatePermissionModuleRequest {
  module_name: string
  module_code: string
  description?: string
  sort_order: number
  is_active: boolean
}

// 更新权限模块请求
export interface UpdatePermissionModuleRequest {
  module_name?: string
  module_code?: string
  description?: string
  sort_order?: number
  is_active?: boolean
}

// =================== 权限CRUD操作类型 ===================

// 创建权限请求
export interface CreatePermissionRequest {
  module_id: number
  permission_name: string
  permission_code: string
  resource?: string
  action?: string
  description?: string
  sort_order: number
  is_active: boolean
}

// 更新权限请求
export interface UpdatePermissionRequest {
  module_id?: number
  permission_name?: string
  permission_code?: string
  resource?: string
  action?: string
  description?: string
  sort_order?: number
  is_active?: boolean
}

