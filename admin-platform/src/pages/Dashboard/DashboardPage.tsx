import { Row, Col, Card, Statistic, Typography, Space, Divider } from 'antd'
import {
  ShopOutlined,
  TeamOutlined,
  WalletOutlined,
  TransactionOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import type { DashboardStats } from '@shared/types'
import { adminApi } from '@/services/apis/adminApi'

const { Title, Text } = Typography

/**
 * 仪表盘页面
 */
const DashboardPage: React.FC = () => {
  // 获取仪表盘统计数据
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await adminApi.getDashboardStats()
      return response
    },
  })

  const statisticCards = [
    {
      title: '总租户数',
      value: stats?.totalTenants || 0,
      icon: <ShopOutlined className="text-blue-500" />,
      color: 'blue',
      suffix: '个',
    },
    {
      title: '活跃租户',
      value: stats?.activeTenants || 0,
      icon: <TeamOutlined className="text-green-500" />,
      color: 'green',
      suffix: '个',
    },
    {
      title: '总钱包数',
      value: stats?.totalWallets || 0,
      icon: <WalletOutlined className="text-purple-500" />,
      color: 'purple',
      suffix: '个',
    },
    {
      title: '总交易数',
      value: stats?.totalTransactions || 0,
      icon: <TransactionOutlined className="text-orange-500" />,
      color: 'orange',
      suffix: '笔',
    },
  ]

  return (
    <>
      <Helmet>
        <title>仪表盘 - U卡服务管理系统</title>
      </Helmet>

      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <Title level={2} className="mb-2">
            仪表盘
          </Title>
          <Text type="secondary">欢迎使用U卡服务管理系统管理平台</Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          {statisticCards.map((card, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                loading={isLoading}
                className="hover:shadow-md transition-shadow"
              >
                <Statistic
                  title={card.title}
                  value={card.value}
                  suffix={card.suffix}
                  prefix={card.icon}
                  valueStyle={{ fontSize: '24px', fontWeight: 600 }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* 详细统计 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="交易统计" loading={isLoading} className="h-full">
              <Space direction="vertical" size="large" className="w-full">
                <div>
                  <div className="flex justify-between items-center">
                    <Text>总交易量</Text>
                    <Text strong className="text-lg">
                      {stats?.totalVolume || '0'} USDT
                    </Text>
                  </div>
                  <Divider className="my-3" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Text>今日交易</Text>
                    <Space>
                      <ArrowUpOutlined className="text-green-500" />
                      <Text strong>{stats?.dailyTransactions || 0} 笔</Text>
                    </Space>
                  </div>
                  <div className="flex justify-between items-center">
                    <Text>今日交易量</Text>
                    <Space>
                      <ArrowUpOutlined className="text-green-500" />
                      <Text strong>{stats?.dailyVolume || '0'} USDT</Text>
                    </Space>
                  </div>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="系统状态" loading={isLoading} className="h-full">
              <Space direction="vertical" size="large" className="w-full">
                <div className="flex justify-between items-center">
                  <Text>系统状态</Text>
                  <Space>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <Text strong className="text-green-600">
                      正常运行
                    </Text>
                  </Space>
                </div>

                <Divider className="my-3" />

                <div className="flex justify-between items-center">
                  <Text>服务状态</Text>
                  <Space
                    direction="vertical"
                    size="small"
                    className="text-right"
                  >
                    <Space>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <Text className="text-sm">API 服务</Text>
                    </Space>
                    <Space>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <Text className="text-sm">数据库</Text>
                    </Space>
                    <Space>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <Text className="text-sm">区块链同步</Text>
                    </Space>
                  </Space>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 快速操作 */}
        <Card title="快速操作">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card
                hoverable
                className="text-center cursor-pointer"
                onClick={() => (window.location.href = '/tenants')}
              >
                <ShopOutlined className="text-4xl text-blue-500 mb-4" />
                <div className="font-medium">管理租户</div>
                <Text type="secondary">添加、编辑租户信息</Text>
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card
                hoverable
                className="text-center cursor-pointer"
                onClick={() => (window.location.href = '/users')}
              >
                <TeamOutlined className="text-4xl text-green-500 mb-4" />
                <div className="font-medium">用户管理</div>
                <Text type="secondary">管理平台用户</Text>
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card
                hoverable
                className="text-center cursor-pointer"
                onClick={() => (window.location.href = '/system')}
              >
                <TransactionOutlined className="text-4xl text-purple-500 mb-4" />
                <div className="font-medium">系统设置</div>
                <Text type="secondary">配置系统参数</Text>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </>
  )
}

export default DashboardPage
