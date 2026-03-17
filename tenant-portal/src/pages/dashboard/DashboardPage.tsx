import React, { useState, useEffect } from 'react'
import {
  Button,
  Typography,
  Alert,
  Row,
  Col
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { dashboardService, DashboardData, walletService } from '@/services'
import {
  UserInfoCard,
  SecurityAlert,
  SecurityStatusCard,
  StatsCards,
  TransactionStatsCard,
  VolumeStatsCard,
  SystemStatusCard,
  RecentTransactionsCard,
  SystemAlertsCard,
  BalanceMonitorCard,
  QuickActionsCard
} from './components'

const { Title, Text } = Typography

interface RecentTransaction {
  id: string
  type: string
  amount: string
  currency: string
  status: string
  createdAt: string
  user?: string
  address?: string
}

interface SystemAlert {
  id: string
  type: string
  title: string
  message: string
  createdAt: string
  isRead: boolean
  severity: number
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardData>({
    transactions: {
      coinStats: null,
      totalTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0,
      successTransactions: 0,
      typeStats: null,
      volumeStats: {
        totalVolume: '0',
        depositVolume: '0',
        withdrawVolume: '0'
      }
    },
    wallets: {
      totalWallets: 0,
      activeWallets: 0,
      coinStats: null,
      typeStats: null
    },
    tenant: {
      id: '',
      name: '',
      email: '',
      status: 0,
      apiKey: '',
      apiSecret: '',
      allowedIps: [],
      webhookUrl: '',
      webhookSecret: '',
      hasPassword: false,
      hasSecondaryPassword: false,
      has2FA: false,
      createdAt: '',
      updatedAt: '',
      subscriptionId: '',
      overallStatus: '',
      createdBy: '',
      updatedBy: '',
      loginCount: 0
    }
  })
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [balanceMonitorStats, setBalanceMonitorStats] = useState<{
    totalMonitors: number
    activeMonitors: number
    triggeredAlerts: number
    lastAlertTime?: string
  } | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const results = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getRecentTransactions({ limit: 10 }),
        dashboardService.getAlerts({ limit: 5, unread_only: true }),
        dashboardService.getSystemStatus(),
        walletService.getBalanceMonitorStats()
      ])

      // 分别解构每个结果并判断其状态
      const [statsResult, transactionsResult, alertsResult, statusResult, monitorStatsResult] = results

      if (statsResult.status === 'fulfilled' && statsResult.value?.data) {
        setStats(statsResult.value.data)
      }

      if (transactionsResult.status === 'fulfilled') {
        setRecentTransactions(transactionsResult.value.data || [])
      }

      if (alertsResult.status === 'fulfilled') {
        setAlerts(alertsResult.value.data || [])
      }

      if (statusResult.status === 'fulfilled') {
        setSystemStatus(statusResult.value.data)
      }

      if (monitorStatsResult.status === 'fulfilled' && monitorStatsResult.value?.data) {
        const d = monitorStatsResult.value.data
        setBalanceMonitorStats({
          totalMonitors: d.totalMonitors ?? 0,
          activeMonitors: d.activeMonitors ?? 0,
          triggeredAlerts: d.triggeredAlerts ?? 0
        })
      }

    } catch (error) {
      // 此 catch 仅在 Promise.allSettled 本身失败时才会触发（极少）
      console.error('处理仪表盘数据时发生错误:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (url: string) => {
    navigate(url)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2}>仪表盘</Title>
          <Text type="secondary">欢迎使用NH资产钱包托管系统</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadDashboardData}
          loading={loading}
        >
          刷新数据
        </Button>
      </div>

      {/* 用户基本信息 */}
      <UserInfoCard tenant={stats.tenant} />

      {/* 安全设置提醒 */}
      {/* <SecurityAlert tenant={stats.tenant} onNavigate={handleNavigate} /> */}

      {/* 系统状态警告 */}
      {systemStatus && systemStatus.overall !== 'healthy' && (
        <Alert
          message="系统状态异常"
          description={`当前系统状态: ${systemStatus.overall === 'error' ? '错误' : '警告'}`}
          type={systemStatus.overall === 'error' ? 'error' : 'warning'}
          showIcon
          className="mb-6"
        />
      )}

      {/* 主要统计卡片 */}
      <StatsCards stats={stats} />

      {/* 快速操作 */}
      <div className="mb-6">
        <QuickActionsCard />
      </div>

      {/* 安全设置状态和交易统计 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <SecurityStatusCard tenant={stats.tenant} onNavigate={handleNavigate} />
        </Col>
        <Col xs={24} lg={12}>
          <TransactionStatsCard stats={stats} />
        </Col>
      </Row>

      {/* 余额监控和交易量统计 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <BalanceMonitorCard stats={balanceMonitorStats ?? undefined} />
        </Col>
        <Col xs={24} lg={12}>
          <VolumeStatsCard stats={stats} />
        </Col>
      </Row>

      {/* 系统状态 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24}>
          <SystemStatusCard systemStatus={systemStatus} />
        </Col>
      </Row>

      {/* 最近交易和系统警报 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <RecentTransactionsCard 
            recentTransactions={recentTransactions}
            loading={loading}
            onNavigate={handleNavigate}
          />
        </Col>
        <Col xs={24} lg={8}>
          <SystemAlertsCard alerts={alerts} onNavigate={handleNavigate} />
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPage