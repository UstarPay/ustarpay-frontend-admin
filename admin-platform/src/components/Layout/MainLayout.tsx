import { ReactNode, useState, useEffect, useMemo } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Badge, Space } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  ShopOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import Breadcrumb from '@/components/Common/Breadcrumb'

const { Header, Sider, Content } = Layout

interface MainLayoutProps {
  children: ReactNode
}

interface MenuItem {
  key: string
  icon?: React.ReactNode
  label: React.ReactNode
  children?: MenuItem[]
  permission?: string
}

// 菜单项配置 - 支持子菜单（移到组件外部避免重新创建）
const getMenuItems = (): MenuItem[] => [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: <Link to="/dashboard">仪表盘</Link>,
    permission: 'dashboard:view',
  },
  {
    key: 'tenant-management',
    icon: <ShopOutlined />,
    label: '租户管理',
    children: [
      {
        key: '/tenants',
        label: <Link to="/tenants">租户列表</Link>,
        permission: 'tenant:list',
      },
      {
        key: '/tenants/create',
        label: <Link to="/tenants/create">创建租户</Link>,
        permission: 'tenant:create',
      },
    ],
  },
  {
    key: 'card-merchant-management',
    icon: <ShopOutlined />,
    label: '卡商配置',
    children: [
      {
        key: '/tenants/card-merchants',
        label: <Link to="/tenants/card-merchants">卡商管理</Link>,
        permission: 'tenant:list',
      },
    ],
  },
  {
    key: 'rbac-management',
    icon: <SafetyOutlined />,
    label: 'RBAC管理',
    children: [
      {
        key: '/users',
        label: <Link to="/users">用户管理</Link>,
        permission: 'rbac:user-roles:users',
      },
      {
        key: '/roles',
        label: <Link to="/roles">角色管理</Link>,
        permission: 'rbac:roles:list',
      },
      {
        key: '/permissions',
        label: <Link to="/permissions">权限管理</Link>,
        permission: 'rbac:permissions:list',
      },
    ],
  },
  {
    key: 'blockchain-management',
    icon: <DatabaseOutlined />,
    label: '区块链管理',
    children: [
      {
        key: '/chains',
        label: <Link to="/chains">区块链网络</Link>,
        permission: 'chain:list',
      },
      {
        key: '/currencies',
        label: <Link to="/currencies">Token设置</Link>,
        permission: 'currency:list',
      },
    ],
  },
  {
    key: 'kms-config-management',
    icon: <KeyOutlined />,
    label: 'KMS配置管理',
    children: [
      {
        key: '/kms/aws',
        label: <Link to="/kms/aws">AWS KMS配置</Link>,
        permission: 'chain:list',
      },
    ],
  },
  {
    key: 'system-management',
    icon: <AppstoreOutlined />,
    label: '系统管理',
    children: [
      {
        key: '/login-logs',
        label: <Link to="/login-logs">登录日志</Link>,
        permission: 'rbac:login-logs:list',
      },
      {
        key: '/system',
        label: <Link to="/system">系统设置</Link>,
        permission: 'system:settings',
      },
      {
        key: '/system/sumsub',
        label: <Link to="/system/sumsub">Sumsub 閰嶇疆</Link>,
        permission: 'system:settings',
      },
      {
        key: '/system/email-delivery',
        label: <Link to="/system/email-delivery">邮件投递</Link>,
        permission: 'system:settings',
      },
      {
        key: '/security',
        label: <Link to="/security">安全设置</Link>,
        permission: 'security:settings',
      },
    ],
  },
]

/**
 * 主布局组件
 * 包含侧边栏导航、顶部栏等
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout, hasPermission } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar, notifications } = useAppStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [openKeys, setOpenKeys] = useState<string[]>([])

  const menuItems = useMemo(() => getMenuItems(), [])

  // 过滤有权限的菜单项 - 使用useMemo缓存结果
  const filteredMenuItems = useMemo(() => {
    const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
      return items
        .map(item => {
          if (item.children) {
            const filteredChildren = filterMenuItems(item.children)
            if (filteredChildren.length > 0) {
              return { ...item, children: filteredChildren }
            }
            return null
          } else {
            return !item.permission || hasPermission(item.permission) ? item : null
          }
        })
        .filter(Boolean) as MenuItem[]
    }

    return filterMenuItems(menuItems)
  }, [menuItems, hasPermission])

  const findMenuPath = (items: MenuItem[], targetPath: string, parents: string[] = []): string[] => {
    let bestMatch: { parents: string[]; matchedKey: string } | null = null

    for (const item of items) {
      if (item.children && item.children.length > 0) {
        const matched = findMenuPath(item.children, targetPath, [...parents, item.key])
        if (matched.length > 0) {
          const selectedKey = findSelectedKey(item.children, targetPath)
          if (selectedKey && (!bestMatch || selectedKey.length > bestMatch.matchedKey.length)) {
            bestMatch = { parents: matched, matchedKey: selectedKey }
          }
        }
      } else if (targetPath === item.key || targetPath.startsWith(item.key + '/')) {
        if (!bestMatch || item.key.length > bestMatch.matchedKey.length) {
          bestMatch = { parents, matchedKey: item.key }
        }
      }
    }
    return bestMatch?.parents || []
  }

  const findSelectedKey = (items: MenuItem[], targetPath: string): string | null => {
    let bestMatch: string | null = null

    for (const item of items) {
      if (item.children && item.children.length > 0) {
        const matched = findSelectedKey(item.children, targetPath)
        if (matched && (!bestMatch || matched.length > bestMatch.length)) {
          bestMatch = matched
        }
      } else if (targetPath === item.key || targetPath.startsWith(item.key + '/')) {
        if (!bestMatch || item.key.length > bestMatch.length) {
          bestMatch = item.key
        }
      }
    }
    return bestMatch
  }

  // 根据当前路由自动展开对应的子菜单
  useEffect(() => {
    setOpenKeys(findMenuPath(filteredMenuItems, location.pathname))
  }, [location.pathname, filteredMenuItems])

  // 获取当前选中的菜单项 - 使用useMemo缓存
  const selectedKeys = useMemo(() => {
    const matched = findSelectedKey(filteredMenuItems, location.pathname)
    return matched ? [matched] : [location.pathname]
  }, [location.pathname, filteredMenuItems])

  // 处理子菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys)
  }

  // 用户下拉菜单
  const userMenuItems = [
    // {
    //   key: 'profile',
    //   icon: <UserOutlined />,
    //   label: '个人资料',
    //   onClick: () => navigate('/profile'),
    // },
    // {
    //   key: 'settings',
    //   icon: <SettingOutlined />,
    //   label: '个人设置',
    //   onClick: () => navigate('/settings'),
    // },
    // {
    //   type: 'divider' as const,
    // },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  return (
    <Layout className="min-h-screen">
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        theme="dark"
        width={256}
        className="min-h-screen"
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <h1 className={`text-white font-bold transition-all duration-200 ${sidebarCollapsed ? 'text-lg' : 'text-xl'
            }`}>
            {sidebarCollapsed ? 'U卡' : 'U卡服务管理系统'}
          </h1>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={sidebarCollapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          items={filteredMenuItems as any}
          className="border-none"
          inlineIndent={20}
        />
      </Sider>

      {/* 主内容区域 */}
      <Layout className="flex-1">
        {/* 顶部栏 */}
        <Header className="bg-white border-b border-gray-200 px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              className="text-lg"
            />
          </div>

          <div className="flex items-center space-x-4">
            {/* 通知 */}
            <Badge count={notifications.length} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                size="large"
                onClick={() => {
                  // 处理通知点击
                }}
              />
            </Badge>

            {/* 用户信息 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <Avatar
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  size="small"
                />
                <span className="hidden md:inline-block text-sm text-gray-700">
                  {user?.fullName || user?.userName}
                </span>
              </Space>
            </Dropdown>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content className="bg-gray-50 min-h-[calc(100vh-64px)]">
          {/* 面包屑导航 */}
          <div className="px-6 pt-4 pb-2">
            <Breadcrumb />
            {/* 页面内容 */}
            <div className="min-h-[calc(100vh-120px)]">
              {children}
            </div>
          </div>


        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
