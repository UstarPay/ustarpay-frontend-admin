import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, Spin } from 'antd'
import { Helmet } from 'react-helmet-async'

import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'

// 布局组件
import MainLayout from '@/components/Layout/MainLayout'
import AuthLayout from '@/components/Layout/AuthLayout'

// 页面组件
import LoginPage from '@/pages/Auth/LoginPage'
import DashboardPage from '@/pages/Dashboard/DashboardPage'
import TenantListPage from '@/pages/Tenant/TenantListPage'
import TenantCreatePage from '@/pages/Tenant/TenantCreatePage'
import TenantDetailPage from '@/pages/Tenant/TenantDetailPage'
import { TenantEditPage } from '@/pages/Tenant'
import { CardMerchantListPage } from '@/pages/Tenant'
import {
  TenantPlanListPage,
  TenantPlanSubscriptionListPage,
} from '@/pages/TenantPlan'
import UserListPage from '@/pages/User/UserListPage'
import RoleListPage from '@/pages/Role/RoleListPage'
import PermissionListPage from '@/pages/Permission/PermissionListPage'
import ChainListPage from '@/pages/Chain/ChainListPage'
import CurrencyListPage from '@/pages/Currency/CurrencyListPage'
import AWSKMSConfigPage from '@/pages/KMS/AWSKMSConfigPage'
import LoginLogPage from '@/pages/LoginLog/LoginLogPage'
import SystemSettingsPage from '@/pages/System/SystemSettingsPage'
import SumsubConfigPage from '@/pages/System/SumsubConfigPage'
import EmailDeliveryPage from '@/pages/System/EmailDeliveryPage'
import SecuritySettingsPage from '@/pages/Security/SecuritySettingsPage'
import TwoFactorManagementPage from '@/pages/Security/TwoFactorManagementPage'
import NotFoundPage from '@/pages/Error/NotFoundPage'
import ForbiddenPage from '@/pages/Error/ForbiddenPage'

// 路由守卫组件
import ProtectedRoute from '@/components/Route/ProtectedRoute'
import PublicRoute from '@/components/Route/PublicRoute'

function App() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const { globalLoading, theme } = useAppStore()

  useEffect(() => {
    // 初始化主题
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // 显示全局加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="正在加载...">
          <div className="w-20 h-20" />
        </Spin>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>U卡服务管理系统 - 平台管理</title>
        <meta name="description" content="企业级数字资产钱包托管平台管理后台" />
      </Helmet>

      {/* 全局加载遮罩 */}
      {globalLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <Spin size="large" tip="处理中...">
            <div className="w-20 h-20" />
          </Spin>
        </div>
      )}

      <Layout className="min-h-screen">
        <Routes>
          {/* 公开路由 - 未登录时可访问 */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              </PublicRoute>
            }
          />

          {/* 受保护的路由 - 需要登录 */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    {/* 仪表盘 */}
                    <Route
                      path="/"
                      element={<Navigate to="/dashboard" replace />}
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute requiredPermission="dashboard:view">
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 租户管理 */}
                    <Route
                      path="/tenants"
                      element={
                        <ProtectedRoute requiredPermission="tenant:list">
                          <TenantListPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tenants/create"
                      element={
                        <ProtectedRoute requiredPermission="tenant:create">
                          <TenantCreatePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tenants/card-merchants"
                      element={
                        <ProtectedRoute requiredPermission="tenant:list">
                          <CardMerchantListPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tenants/:id"
                      element={
                        <ProtectedRoute requiredPermission="tenant:detail">
                          <TenantDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tenants/:id/edit"
                      element={
                        <ProtectedRoute requiredPermission="tenant:update">
                          <TenantEditPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 租户计划管理 */}
                    <Route
                      path="/tenant-plans"
                      element={
                        <ProtectedRoute requiredPermission="tenant:plans:list">
                          <TenantPlanListPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tenant-plan-subscriptions"
                      element={
                        <ProtectedRoute requiredPermission="tenant:plans:subscription:list">
                          <TenantPlanSubscriptionListPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 用户管理 */}
                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute requiredPermission="rbac:user-roles:users">
                          <UserListPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 角色管理 */}
                    <Route
                      path="/roles"
                      element={
                        <ProtectedRoute requiredPermission="rbac:roles:list">
                          <RoleListPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 权限管理 */}
                    <Route
                      path="/permissions"
                      element={
                        <ProtectedRoute requiredPermission="rbac:permissions:list">
                          <PermissionListPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 区块链网络管理 */}
                    <Route
                      path="/chains"
                      element={
                        <ProtectedRoute requiredPermission="chain:list">
                          <ChainListPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 数字货币管理 */}
                    <Route
                      path="/currencies"
                      element={
                        <ProtectedRoute requiredPermission="currency:list">
                          <CurrencyListPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/kms/aws"
                      element={
                        <ProtectedRoute requiredPermission="chain:list">
                          <AWSKMSConfigPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 登录日志 */}
                    <Route
                      path="/login-logs"
                      element={
                        <ProtectedRoute requiredPermission="rbac:login-logs:list">
                          <LoginLogPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 系统设置 */}
                    <Route
                      path="/system"
                      element={
                        <ProtectedRoute requiredPermission="system:settings">
                          <SystemSettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/system/sumsub"
                      element={
                        <ProtectedRoute requiredPermission="system:settings">
                          <SumsubConfigPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/system/email-delivery"
                      element={
                        <ProtectedRoute requiredPermission="system:settings">
                          <EmailDeliveryPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 安全设置 */}
                    <Route
                      path="/security"
                      element={
                        <ProtectedRoute requiredPermission="security:settings">
                          <SecuritySettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/security/2fa"
                      element={
                        <ProtectedRoute requiredPermission="system:settings">
                          <TwoFactorManagementPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 错误页面 */}
                    <Route path="/403" element={<ForbiddenPage />} />
                    <Route path="/404" element={<NotFoundPage />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* 根路径重定向 */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Layout>
    </>
  )
}

export default App
