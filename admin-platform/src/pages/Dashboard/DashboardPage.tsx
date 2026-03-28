import { ArrowRightOutlined, ArrowUpOutlined, ShopOutlined, TeamOutlined, TransactionOutlined, WalletOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Col, Divider, Row, Space, Typography } from 'antd'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import type { DashboardStats } from '@shared/types'
import { adminApi } from '@/services/apis/adminApi'

const { Title, Text } = Typography

const gradientCardClass =
  'overflow-hidden rounded-[28px] border-0 bg-[linear-gradient(135deg,#06142f_0%,#0f2d64_52%,#1f4f9c_100%)] text-white shadow-[0_20px_48px_rgba(7,22,53,0.24)]'

const panelCardClass =
  'overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]'

const formatVolume = (value?: string) => {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) {
    return value || '0'
  }
  return numeric.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * 仪表盘页面
 */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate()

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
      helper: '当前平台已接入租户',
      suffix: '个',
      icon: <ShopOutlined className="text-lg text-sky-100" />,
    },
    {
      title: '活跃租户',
      value: stats?.activeTenants || 0,
      helper: '近期开通并可正常使用',
      suffix: '个',
      icon: <TeamOutlined className="text-lg text-cyan-100" />,
    },
    {
      title: '总钱包数',
      value: stats?.totalWallets || 0,
      helper: '平台累计托管钱包数量',
      suffix: '个',
      icon: <WalletOutlined className="text-lg text-blue-100" />,
    },
    {
      title: '总交易数',
      value: stats?.totalTransactions || 0,
      helper: '全量交易记录累计',
      suffix: '笔',
      icon: <TransactionOutlined className="text-lg text-indigo-100" />,
    },
  ]

  const quickActions = [
    {
      title: '租户管理',
      description: '查看租户接入状态、配置卡商与权限结构。',
      icon: <ShopOutlined className="text-3xl text-sky-200" />,
      path: '/tenants',
    },
    {
      title: '平台用户',
      description: '维护后台用户、角色授权与访问范围。',
      icon: <TeamOutlined className="text-3xl text-cyan-200" />,
      path: '/users',
    },
    {
      title: '系统设置',
      description: '集中处理系统参数、策略开关与基础配置。',
      icon: <TransactionOutlined className="text-3xl text-blue-200" />,
      path: '/system',
    },
  ]

  const systemHealth = Number(stats?.systemHealth || 0)
  const alertCount = Number(stats?.alertCount || 0)
  const overallStatus = systemHealth >= 95 ? '健康' : systemHealth >= 80 ? '关注中' : '需排查'
  const overallStatusColor =
    systemHealth >= 95 ? 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.95)]' :
    systemHealth >= 80 ? 'bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.95)]' :
    'bg-rose-400 shadow-[0_0_14px_rgba(251,113,133,0.95)]'
  const overallTextColor = systemHealth >= 95 ? '!text-emerald-600' : systemHealth >= 80 ? '!text-amber-600' : '!text-rose-600'

  return (
    <>
      <Helmet>
        <title>仪表盘 - U卡服务管理系统</title>
      </Helmet>

      <div className="space-y-6">
        <Card className={gradientCardClass} loading={isLoading} bodyStyle={{ padding: 0 }}>
          <div className="relative overflow-hidden px-6 py-6 lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.26),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(147,197,253,0.22),transparent_28%)]" />
            <div className="relative grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.32em] text-sky-100/90">
                  Dashboard Overview
                </div>
                <div>
                  <Title level={2} className="!mb-2 !text-white">
                    U卡服务管理系统
                  </Title>
                  <Text className="text-sm !text-sky-100/85">
                    聚合查看租户、钱包、交易与平台运行情况，快速进入关键业务操作。
                  </Text>
                </div>
                <Space size={[12, 12]} wrap>
                  <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-sky-100/75">总交易量</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{formatVolume(stats?.totalVolume)} USDT</div>
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-sky-100/75">今日交易</div>
                    <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                      {stats?.dailyTransactions || 0} 笔
                      <ArrowUpOutlined className="text-sm text-emerald-300" />
                    </div>
                  </div>
                </Space>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-xs uppercase tracking-[0.18em] text-sky-100/75">今日交易量</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{formatVolume(stats?.dailyVolume)} USDT</div>
                  <div className="mt-2 text-xs text-sky-100/70">用于快速判断当日业务波动</div>
                </div>
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-xs uppercase tracking-[0.18em] text-sky-100/75">系统状态</div>
                  <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                    <span className={`h-2.5 w-2.5 rounded-full ${overallStatusColor}`} />
                    {overallStatus}
                  </div>
                  <div className="mt-2 text-xs text-sky-100/70">健康度 {systemHealth.toFixed(1)}%，当前活跃告警 {alertCount} 条</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          {statisticCards.map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.title}>
              <Card className={gradientCardClass} loading={isLoading} bodyStyle={{ padding: 0 }}>
                <div className="relative overflow-hidden px-5 py-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.18),transparent_36%)]" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-sky-100/75">{card.title}</div>
                        <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
                          {card.value}
                          <span className="ml-1 text-base font-medium text-sky-100/80">{card.suffix}</span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/10">
                        {card.icon}
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-sky-100/78">{card.helper}</div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <Card className={panelCardClass} loading={isLoading} bodyStyle={{ padding: 24 }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Transaction Snapshot</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">交易概览</div>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">实时汇总</div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-[24px] bg-[linear-gradient(135deg,#06142f_0%,#12336b_100%)] p-5 text-white">
                  <div className="text-xs uppercase tracking-[0.18em] text-sky-100/75">累计交易额</div>
                  <div className="mt-3 text-3xl font-semibold">{formatVolume(stats?.totalVolume)} USDT</div>
                  <div className="mt-2 text-sm text-sky-100/80">平台维度累计交易金额统计</div>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">日内变化</div>
                  <div className="mt-3 flex items-center gap-2 text-3xl font-semibold text-slate-900">
                    {stats?.dailyTransactions || 0}
                    <span className="text-base font-medium text-slate-500">笔</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                    <ArrowUpOutlined />
                    今日交易量 {formatVolume(stats?.dailyVolume)} USDT
                  </div>
                </div>
              </div>

              <Divider className="my-6" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">总交易数</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{stats?.totalTransactions || 0}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">总钱包数</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{stats?.totalWallets || 0}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">活跃租户</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{stats?.activeTenants || 0}</div>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} xl={10}>
            <Card className={panelCardClass} loading={isLoading} bodyStyle={{ padding: 24 }}>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">System Health</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">系统状态</div>

              <div className="mt-6 rounded-[24px] bg-[linear-gradient(135deg,#071932_0%,#0f2f68_52%,#1d4e89_100%)] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-sky-100/75">总体状态</div>
                    <div className="mt-2 text-2xl font-semibold">{overallStatus}</div>
                  </div>
                  <span className={`h-3 w-3 rounded-full ${overallStatusColor}`} />
                </div>
                <div className="mt-3 text-sm text-sky-100/78">基于服务健康检查与当前活跃告警动态计算，不再使用静态默认值。</div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <Text className="!text-slate-700">系统健康度</Text>
                  <Space size={8}>
                    <Text strong className="!text-slate-900">
                      {systemHealth.toFixed(1)}%
                    </Text>
                  </Space>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <Text className="!text-slate-700">活跃告警</Text>
                  <Space size={8}>
                    <Text strong className={overallTextColor}>
                      {alertCount} 条
                    </Text>
                  </Space>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <Text className="!text-slate-700">数据更新时间</Text>
                  <Space size={8}>
                    <Text strong className="!text-slate-900">
                      {stats?.timestamp ? new Date(stats.timestamp * 1000).toLocaleString('zh-CN') : '-'}
                    </Text>
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card className={panelCardClass} bodyStyle={{ padding: 24 }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Quick Access</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">快捷操作</div>
              <div className="mt-2 text-sm text-slate-500">将常用后台入口收敛到一个区域，减少跨菜单跳转。</div>
            </div>
          </div>

          <Row gutter={[16, 16]} className="mt-2">
            {quickActions.map((action) => (
              <Col xs={24} md={8} key={action.title}>
                <Card
                  hoverable
                  className="h-full rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.1)]"
                  bodyStyle={{ padding: 24 }}
                  onClick={() => navigate(action.path)}
                >
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#071a34_0%,#1e4d93_100%)]">
                        {action.icon}
                      </div>
                      <div className="mt-5 text-xl font-semibold text-slate-900">{action.title}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-500">{action.description}</div>
                    </div>
                    <Button type="text" className="!px-0 !text-[#1d4e89] hover:!text-[#163d6c]">
                      进入页面 <ArrowRightOutlined />
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    </>
  )
}

export default DashboardPage
