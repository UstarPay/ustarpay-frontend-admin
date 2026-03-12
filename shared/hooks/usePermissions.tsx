import React, { useMemo } from 'react'

export interface PermissionConfig {
  userPermissions: string[]
  userRoles: string[]
  rolePermissions: Record<string, string[]>
}

export interface UsePermissionsReturn {
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  canAccess: (requiredPermissions?: string[], requiredRoles?: string[]) => boolean
}

export function usePermissions(config: PermissionConfig): UsePermissionsReturn {
  const { userPermissions = [], userRoles = [], rolePermissions = {} } = config

  // 计算用户的所有权限（直接权限 + 角色权限）
  const allPermissions = useMemo(() => {
    const roleBasedPermissions = userRoles.flatMap(role => rolePermissions[role] || [])
    return [...new Set([...userPermissions, ...roleBasedPermissions])]
  }, [userPermissions, userRoles, rolePermissions])

  const hasPermission = (permission: string): boolean => {
    return allPermissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  const hasRole = (role: string): boolean => {
    return userRoles.includes(role)
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }

  const canAccess = (
    requiredPermissions: string[] = [],
    requiredRoles: string[] = []
  ): boolean => {
    // 如果没有要求，则允许访问
    if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
      return true
    }

    // 检查权限要求
    const hasRequiredPermissions = requiredPermissions.length === 0 || 
      hasAnyPermission(requiredPermissions)

    // 检查角色要求
    const hasRequiredRoles = requiredRoles.length === 0 || 
      hasAnyRole(requiredRoles)

    return hasRequiredPermissions && hasRequiredRoles
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    canAccess,
  }
}

// 权限检查 HOC 组件
export interface PermissionGuardProps {
  children: React.ReactNode
  permissions?: string[]
  roles?: string[]
  fallback?: React.ReactNode
  config: PermissionConfig
}

export function PermissionGuard({
  children,
  permissions = [],
  roles = [],
  fallback = null,
  config,
}: PermissionGuardProps) {
  const { canAccess } = usePermissions(config)

  if (!canAccess(permissions, roles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
