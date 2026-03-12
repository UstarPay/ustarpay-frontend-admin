import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface PublicRouteProps {
  children: ReactNode
  redirectTo?: string
}

/**
 * 公开路由组件
 * 用于登录页等公开页面，已登录用户会被重定向
 */
const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated } = useAuthStore()

  // 已登录用户重定向到指定页面
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export default PublicRoute
