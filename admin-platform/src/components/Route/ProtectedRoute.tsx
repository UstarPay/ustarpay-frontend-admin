import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermission?: string
  fallback?: ReactNode
}

/**
 * 受保护的路由组件
 * 用于保护需要登录或特定权限的页面
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  fallback,
}) => {
  const { isAuthenticated, hasPermission } = useAuthStore()
  const location = useLocation()

  // 未登录用户重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 检查权限
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // 如果有自定义fallback，使用fallback
    if (fallback) {
      return <>{fallback}</>
    }
    // 否则重定向到403页面
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
