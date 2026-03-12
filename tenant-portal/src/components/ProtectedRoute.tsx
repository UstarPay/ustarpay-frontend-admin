import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Result, Spin } from 'antd'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requiredPermissions?: string[]
  requiredRoles?: string[]
  fallback?: ReactNode
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredPermissions = [],
  requiredRoles = [],
  fallback
}: ProtectedRouteProps) {
  const location = useLocation()
  const { 
    isAuthenticated, 
    isLoading, 
    hasPermission, 
    hasAnyPermission, 
    hasRole, 
    hasAnyRole 
  } = useAuthStore()

  // 显示加载状态
  if (isLoading) {
    return (
      <Spin size="large" tip="加载中...">
        <div style={{ minHeight: 80 }} />
      </Spin>
    )
  }

  // 需要认证但未登录
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate 
        to="login" 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // 检查权限
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    )
    
    if (!hasAllPermissions) {
      return fallback || (
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此页面"
          extra={
            <div className="text-gray-500 text-sm mt-4">
              需要权限: {requiredPermissions.join(', ')}
            </div>
          }
        />
      )
    }
  }

  // 检查角色
  if (requiredRoles.length > 0) {
    const hasAllRoles = requiredRoles.every(role => hasRole(role))
    
    if (!hasAllRoles) {
      return fallback || (
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您的角色权限不足"
          extra={
            <div className="text-gray-500 text-sm mt-4">
              需要角色: {requiredRoles.join(', ')}
            </div>
          }
        />
      )
    }
  }

  return <>{children}</>
}

// 权限检查组件
interface PermissionGuardProps {
  children: ReactNode
  permissions?: string[]
  roles?: string[]
  fallback?: ReactNode
  mode?: 'all' | 'any' // all: 需要所有权限, any: 需要任一权限
}

export function PermissionGuard({
  children,
  permissions = [],
  roles = [],
  fallback = null,
  mode = 'all'
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasRole, hasAnyRole } = useAuthStore()

  // 检查权限
  let hasRequiredPermissions = true
  if (permissions.length > 0) {
    if (mode === 'all') {
      hasRequiredPermissions = permissions.every(permission => hasPermission(permission))
    } else {
      hasRequiredPermissions = hasAnyPermission(permissions)
    }
  }

  // 检查角色
  let hasRequiredRoles = true
  if (roles.length > 0) {
    if (mode === 'all') {
      hasRequiredRoles = roles.every(role => hasRole(role))
    } else {
      hasRequiredRoles = hasAnyRole(roles)
    }
  }

  // 如果没有权限或角色，显示fallback或不显示
  if (!hasRequiredPermissions || !hasRequiredRoles) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// 匿名访问组件（未登录用户才能访问，如登录页）
interface AnonymousRouteProps {
  children: ReactNode
  redirectTo?: string
}

export function AnonymousRoute({ 
  children, 
  redirectTo = '/dashboard' 
}: AnonymousRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore()

  // 显示加载状态
  if (isLoading) {
    return (
      <Spin size="large" tip="加载中...">
        <div style={{ minHeight: 80 }} />
      </Spin>
    )
  }

  // 已登录用户重定向
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
