import React, { useEffect, useState } from 'react'
import { Alert, Button, Col, Row, Typography } from 'antd'
import {
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WalletOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { dashboardService, DashboardData, walletService } from '@/services'
import {
  BalanceMonitorCard,
  QuickActionsCard,
  RecentTransactionsCard,
  SecurityStatusCard,
  StatsCards,
  SystemAlertsCard,
  SystemStatusCard,
  TransactionStatsCard,
  UserInfoCard,
  VolumeStatsCard
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
      console.error('处理仪表盘数据时发生错误:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (url: string) => {
    navigate(url)
  }

  const formatExactVolume = (value: string | number | undefined) => {
    if (value === undefined || value === null || value === '') return '0.00000000'
    const num = typeof value === 'string' ? Number(value) : value
    if (Number.isNaN(num)) return '0.00000000'
    return Number(num).toLocaleString(undefined, {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    })
  }

  const walletTotal = Number(stats.wallets?.totalWallets ?? 0)
  const activeWallets = Number(stats.wallets?.activeWallets ?? 0)
  const totalTransactions = Number(stats.transactions?.totalTransactions ?? 0)
  const totalVolume = formatExactVolume(stats.transactions?.volumeStats?.totalVolume ?? '0')
  const unreadAlerts = alerts.length
  const securityScore = [stats.tenant.hasPassword, stats.tenant.hasSecondaryPassword, stats.tenant.has2FA].filter(Boolean).length
  const heroIndicators = [
    {
      label: '安全完成度',
      value: `${Math.round((securityScore / 3) * 100)}%`,
      helper: '主密钥 / 二级密码 / 2FA',
      icon: <SafetyCertificateOutlined />
    },
    {
      label: '活跃钱包',
      value: activeWallets.toString(),
      helper: `总钱包 ${walletTotal}`,
      icon: <WalletOutlined />
    },
    {
      label: '未读告警',
      value: unreadAlerts.toString(),
      helper: unreadAlerts > 0 ? '建议优先处理' : '当前无异常',
      icon: <ThunderboltOutlined />
    }
  ]

  return (
    <div className="relative overflow-hidden bg-[#f4f7fb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,_rgba(15,118,110,0.18),_rgba(15,118,110,0))]" />
        <div className="absolute right-[-80px] top-[40px] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,_rgba(30,64,175,0.18),_rgba(30,64,175,0))]" />
        <div className="absolute bottom-[-140px] left-[24%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.14),_rgba(56,189,248,0))]" />
      </div>

      <div className="relative space-y-6 p-4 md:p-6">
        <section className="overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_36%,#0ea5e9_100%)] px-5 py-5 text-white shadow-[0_30px_80px_rgba(29,78,216,0.22)] md:px-6 md:py-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-sky-100">
                Tenant Command Center
              </div>
              <Title level={1} className="!mb-2 !mt-3 !text-[28px] !font-semibold !tracking-tight !text-white md:!text-[34px]">
                资产运营总览
              </Title>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="primary"
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={loadDashboardData}
                  loading={loading}
                  className="!h-11 !rounded-full !border-0 !bg-white !px-5 !font-medium !text-slate-900 !shadow-none"
                >
                  刷新数据
                </Button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {heroIndicators.map(item => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between text-slate-200">
                      <span className="text-xs uppercase tracking-[0.18em]">{item.label}</span>
                      <span className="text-base">{item.icon}</span>
                    </div>
                    <div className="mt-2 text-[22px] font-semibold leading-none text-white">{item.value}</div>
                    <div className="mt-1 text-xs text-slate-300">{item.helper}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 self-end">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                <div className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Realtime Snapshot</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {[
                    { label: '总交易数', value: totalTransactions },
                    { label: '总交易量', value: totalVolume },
                    { label: '监控规则', value: balanceMonitorStats?.totalMonitors ?? 0 },
                    { label: '系统状态', value: systemStatus?.overall ?? 'unknown' }
                  ].map(item => (
                    <div key={item.label} className="rounded-2xl bg-black/15 px-4 py-3">
                      <div className="text-xs text-slate-300">{item.label}</div>
                      <div className="mt-1 break-all text-lg font-semibold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-sky-200/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.82))] p-4 text-slate-900">
                <div className="text-xs uppercase tracking-[0.26em] text-sky-700/70">Tenant Profile</div>
                <div className="mt-2 text-xl font-semibold tracking-tight">{stats.tenant.name || '未命名租户'}</div>
                <div className="mt-1 text-sm text-slate-600">{stats.tenant.email || '暂无邮箱信息'}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
                    状态 {stats.tenant.status === 1 ? '正常' : '异常'}
                  </div>
                  <div className="rounded-full bg-cyan-100 px-3 py-1 text-xs text-cyan-900">
                    订阅 {stats.tenant.computedStatus || '未知'}
                  </div>
                  <div className="rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-900">
                    登录 {stats.tenant.loginCount || 0} 次
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {systemStatus && systemStatus.overall !== 'healthy' && (
          <Alert
            message="系统状态异常"
            description={`当前系统状态: ${systemStatus.overall === 'error' ? '错误' : '警告'}`}
            type={systemStatus.overall === 'error' ? 'error' : 'warning'}
            showIcon
            className="rounded-2xl border-0 shadow-sm"
          />
        )}

        <UserInfoCard tenant={stats.tenant} />
        <StatsCards stats={stats} />

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="space-y-6">
            <div className="rounded-[28px] border border-[#d9e6f3] bg-white/90 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-6">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Operations</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">快捷动作</div>
                  <div className="mt-1 text-sm text-slate-500">把高频入口做成面板级快捷导航，减少二次查找。</div>
                </div>
              </div>
              <QuickActionsCard />
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <SecurityStatusCard tenant={stats.tenant} onNavigate={handleNavigate} />
              </Col>
              <Col xs={24} lg={12}>
                <TransactionStatsCard stats={stats} />
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <BalanceMonitorCard stats={balanceMonitorStats ?? undefined} />
              </Col>
              <Col xs={24} lg={12}>
                <VolumeStatsCard stats={stats} />
              </Col>
            </Row>

          </section>

          <section className="space-y-6">
            <RecentTransactionsCard
              recentTransactions={recentTransactions}
              loading={loading}
              onNavigate={handleNavigate}
            />
            <SystemAlertsCard alerts={alerts} onNavigate={handleNavigate} />
            <SystemStatusCard systemStatus={systemStatus} />
          </section>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
