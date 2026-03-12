import { authService } from '@/services'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import {
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  TransactionOutlined,
  UserOutlined,
  WalletOutlined,
  ControlOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Avatar, Badge, Button, Drawer, Dropdown, Layout, Menu, theme } from 'antd'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Header, Sider, Content } = Layout
const { useToken } = theme

// 菜单项类型
type MenuItem = Required<MenuProps>['items'][number]

// 菜单配置
const menuItems: MenuItem[] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/wallets',
    icon: <WalletOutlined />,
    label: '钱包管理',
    children: [
      {
        key: '/wallets/list',
        label: '钱包列表',
      },
      // {
      //   key: '/wallets/balances',
      //   label: '钱包资产',
      // },
      // {
      //   key: '/wallets/addresses',
      //   label: '地址管理',
      // },

    ],
  },
  {
    key: '/hot-wallets',
    icon: <WalletOutlined />,
    label: '热钱包管理',
    children: [
      {
        key: '/hot-wallets/list',
        label: '热钱包列表',
      },
    ],
  },
  {
    key: '/cold-wallets',
    icon: <WalletOutlined />,
    label: '冷钱包管理',
    children: [
      {
        key: '/cold-wallets/list',
        label: '冷钱包列表',
      },
    ],
  },
  {
    key: 'tasks',
    icon: <ControlOutlined />,
    label: '任务管理',
    children: [
      {
        key: '/wallets/monitor',
        label: '余额监控',
      },
      {
        key: '/collection/configs',
        label: '归集配置',
      },
      {
        key: '/collection/tasks',
        label: '归集任务',
      },
    ],
  },
  {
    key: '/transactions',
    icon: <TransactionOutlined />,
    label: '交易管理',
    children: [
      {
        key: '/transactions/list',
        label: '交易记录',
      },
      {
        key: '/transactions/internal',
        label: '内部转账',
      },
      // {
      //   key: '/transactions/pending',
      //   label: '待处理交易',
      // },
      {
        key: '/transactions/withdraw',
        label: '发起提现',
      },
    ],
  },
  {
    key: '/history',
    icon: <HistoryOutlined />,
    label: '历史记录',
    children: [
      {
        key: '/history/deposits',
        label: '充值记录',
      },
      {
        key: '/history/withdrawals',
        label: '提现记录',
      },
      {
        key: '/history/transfers',
        label: '转账记录',
      },
    ],
  },
  {
    key: '/security',
    icon: <SecurityScanOutlined />,
    label: '安全中心',
    children: [
      {
        key: '/security/2fa',
        label: '两步验证',
      },
      // { key: '/security/sessions', label: '登录会话' },
      // { key: '/security/logs', label: '操作日志' },
    ],
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
    children: [
      {
        key: '/settings/profile',
        label: '个人资料',
      },
      // 已隐藏
      // { key: '/settings/notifications', label: '通知设置' },
      // { key: '/settings/preferences', label: '偏好设置' },
      // { key: '/settings/api-keys', label: 'API密钥管理' },
      // { key: '/settings/config', label: '系统配置' },
    ],
  },
  // 已隐藏
  // {
  //   key: '/logs',
  //   icon: <HistoryOutlined />,
  //   label: '日志管理',
  //   children: [
  //     { key: '/logs/api', label: 'API日志' },
  //     { key: '/logs/webhook', label: 'Webhook日志' },
  //   ],
  // },
  // {
  //   key: '/analytics',
  //   icon: <BarChartOutlined />,
  //   label: '数据分析',
  //   children: [
  //     { key: '/analytics/stats', label: '统计报表' },
  //   ],
  // },
]

export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useToken()

  const { user, clearAuth } = useAuthStore()
  const { sidebar, setSidebarCollapsed, setSidebarMobile } = useAppStore()

  const [notifications] = useState(3) // 示例通知数量

  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      setSidebarMobile(isMobile)
      if (isMobile) {
        setSidebarCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarMobile, setSidebarCollapsed])

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const pathname = location.pathname
    // 尝试精确匹配
    if (menuItems.some(item => item?.key === pathname)) {
      return [pathname]
    }

    // 尝试匹配子菜单
    for (const item of menuItems) {
      if (item && 'children' in item && item.children) {
        for (const child of item.children) {
          if (child && 'key' in child && pathname.startsWith(child.key as string)) {
            return [child.key as string]
          }
        }
      }
    }

    // 默认匹配
    return [pathname]
  }

  // 获取展开的菜单项
  const getOpenKeys = () => {
    const pathname = location.pathname
    const openKeys: string[] = []

    for (const item of menuItems) {
      if (item && 'children' in item && item.children) {
        for (const child of item.children) {
          if (child && 'key' in child && pathname.startsWith(child.key as string)) {
            openKeys.push(item.key as string)
            break
          }
        }
      }
    }

    return openKeys
  }

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  // 处理用户下拉菜单点击
  const handleUserMenuClick = async ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        navigate('/settings/profile')
        break
      case 'settings':
        navigate('/settings/profile')
        break
      case 'logout':
        try {
          await authService.logout()
          navigate('/login')
        } catch (error) {
          console.error('Logout failed:', error)
          clearAuth()
          navigate('/login')
        }
        break
    }
  }

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  // 侧边栏内容
  const siderContent = (
    <Sider
      trigger={null}
      collapsible
      collapsed={sidebar.collapsed}
      width={256}
      style={{
        background: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
      }}
      className={sidebar.mobile ? 'fixed left-0 top-0 bottom-0 z-50' : ''}
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className="text-xl font-bold text-blue-600">
          {sidebar.collapsed ? 'TP' : '租户门户'}
        </div>
      </div>

      <Menu
        theme="light"
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  )

  return (
    <Layout className="min-h-screen">
      {/* 桌面端侧边栏 */}
      {!sidebar.mobile && siderContent}

      {/* 移动端侧边栏 */}
      {sidebar.mobile && (
        <Drawer
          title="导航菜单"
          placement="left"
          closable={false}
          open={!sidebar.collapsed}
          onClose={() => setSidebarCollapsed(true)}
          width={256}
          styles={{ body: { padding: 0 } }}
        >
          {siderContent}
        </Drawer>
      )}

      <Layout className={sidebar.mobile ? '' : `ml-${sidebar.collapsed ? '20' : '64'}`}>
        {/* 顶部导航栏 */}
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <Button
              type="text"
              icon={sidebar.collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setSidebarCollapsed(!sidebar.collapsed)}
              style={{
                fontSize: '16px',
                width: 40,
                height: 40,
              }}
            />

            {/* 面包屑导航可以在这里添加 */}
          </div>

          <div className="flex items-center gap-4">
            {/* 通知铃铛 */}
            <Badge count={notifications} >
              <Button
                type="text"
                icon={<BellOutlined />}
                size="large"
                onClick={() => navigate('/notifications')}
              />
            </Badge>

            {/* 用户信息下拉菜单 */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md hover:bg-gray-50">
                <Avatar

                  icon={<UserOutlined />}
                  src={user?.avatar}
                />
                <div className="hidden sm:block">
                  <div className="text-sm font-medium">{user?.name || '用户'}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* 主内容区域 */}
        <Content
          style={{
            padding: '24px',
            background: token.colorBgLayout,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
