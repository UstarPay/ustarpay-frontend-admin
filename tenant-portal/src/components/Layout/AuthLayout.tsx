import { ReactNode } from 'react'
import { Layout, Card, Typography, theme } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'

const { Content } = Layout
const { Title, Text } = Typography
const { useToken } = theme

interface AuthLayoutProps {
  children?: ReactNode
  title?: string
  subtitle?: string
}

export function AuthLayout({ title, subtitle }: AuthLayoutProps) {
  const { token } = useToken()
  const location = useLocation()
  
  // 检查是否是登录页面，登录页面使用全宽布局
  const isLoginPage = location.pathname === '/login'

  if (isLoginPage) {
    // 登录页面使用全宽布局，直接渲染子组件
    return <Outlet />
  }

  return (
    <Layout className="min-h-screen">
      <Content
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary}15 0%, ${token.colorPrimary}05 100%)`,
        }}
        className="flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md">
          {/* Logo 和标题区域 */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-xl text-2xl font-bold">
                TP
              </div>
            </div>
            <Title level={2} className="!mb-2">
              {title || '租户门户'}
            </Title>
            <Text type="secondary" className="text-base">
              {subtitle || '数字资产钱包管理平台'}
            </Text>
          </div>

          {/* 表单卡片 */}
          <Card
            style={{
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}
            className="backdrop-blur-sm"
          >
            <Outlet />
          </Card>

          {/* 底部信息 */}
          <div className="mt-8 text-center">
            <Text type="secondary" className="text-sm">
              © 2024 NH资产钱包托管系统. 保留所有权利.
            </Text>
          </div>
        </div>

        {/* 背景装饰 */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500 opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500 opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full bg-green-500 opacity-10 animate-pulse delay-500"></div>
        </div>
      </Content>
    </Layout>
  )
}
