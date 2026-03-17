import React, { useState, useEffect, useCallback } from 'react'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { depositService } from '@/services'
import { DEPOSIT_STATUS_LABELS, DEPOSIT_STATUS_COLORS, DepositStatus } from '@shared/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

interface DepositRecord {
  id: string
  tenant_id: string
  chain_code: string
  symbol: string
  address: string
  amount: string
  status: number
  tx_hash?: string
  business_id?: string
  webhook_sent: boolean
  webhook_sent_at?: string | null
  created_at: string
  updated_at: string
}

interface DepositStats {
  totalDeposits: number
  totalAmount: string
  pendingCount: number
  confirmedCount: number
  failedCount: number
  todayDeposits: number
  todayAmount: string
}

const mapApiItem = (item: any): DepositRecord => ({
  id: item.id,
  tenant_id: item.tenant_id || '',
  chain_code: item.chain_code || '',
  symbol: item.symbol || '',
  address: item.address || '',
  amount: item.amount || '0',
  status: typeof item.status === 'number' ? item.status : 0,
  tx_hash: item.tx_hash || '',
  business_id: item.business_id || '',
  webhook_sent: !!item.webhook_sent,
  webhook_sent_at: item.webhook_sent_at,
  created_at: item.created_at || '',
  updated_at: item.updated_at || '',
})

const formatDate = (date?: string | null) =>
  date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'

const formatStatAmount = (amount: string): string => {
  const n = parseFloat(amount)
  if (Number.isNaN(n)) return amount
  return n.toFixed(8)
}

const formatAmount = (raw: string) => {
  const n = parseFloat(raw)
  if (Number.isNaN(n)) return raw
  return n.toFixed(Math.min(8, (raw.split('.')[1] || '').replace(/0+$/, '').length || 0))
}

const shortText = (value?: string | null, start = 8, end = 6) => {
  if (!value) return '-'
  if (value.length <= start + end) return value
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

const pageShellStyle: React.CSSProperties = {
  minHeight: '100%',
  padding: 24,
  background:
    'radial-gradient(circle at top left, rgba(14, 116, 144, 0.14), transparent 28%), radial-gradient(circle at top right, rgba(249, 115, 22, 0.12), transparent 24%), linear-gradient(180deg, #f7fbfc 0%, #eef4f7 100%)',
}

const heroCardStyle: React.CSSProperties = {
  borderRadius: 28,
  border: '1px solid rgba(15, 23, 42, 0.08)',
  background:
    'linear-gradient(135deg, rgba(7, 89, 133, 0.96) 0%, rgba(12, 74, 110, 0.94) 42%, rgba(23, 37, 84, 0.92) 100%)',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
  overflow: 'hidden',
}

const glassCardStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(255, 255, 255, 0.8)',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
  backdropFilter: 'blur(10px)',
}

const panelTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#64748b',
  marginBottom: 16,
}

const DepositHistoryPage: React.FC = () => {
  const [deposits, setDeposits] = useState<DepositRecord[]>([])
  const [stats, setStats] = useState<DepositStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [searchForm] = Form.useForm()
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<DepositRecord | null>(null)

  const loadData = useCallback(async (page = 1, pageSize = 20, extraParams?: Record<string, any>) => {
    try {
      setLoading(true)

      const params = { page, pageSize, ...extraParams }
      const depositsData = await depositService.getDeposits(params)
      const items = depositsData.data?.items || []
      setDeposits(items.map(mapApiItem))
      setPagination({
        current: depositsData.data?.page || page,
        pageSize: depositsData.data?.pageSize || pageSize,
        total: depositsData.data?.total || 0,
      })

      try {
        const statsData = await depositService.getDepositStats()
        const raw = statsData.data as Record<string, any> | undefined
        if (raw) {
          setStats({
            totalDeposits: Number(raw.total_deposits ?? raw.totalDeposits ?? 0),
            totalAmount: String(raw.total_amount ?? raw.totalAmount ?? '0'),
            pendingCount: Number(raw.pending_deposits ?? raw.pendingDeposits ?? 0),
            confirmedCount: Number(raw.completed_deposits ?? raw.completedDeposits ?? 0),
            failedCount: Number(raw.failed_deposits ?? raw.failedDeposits ?? 0),
            todayDeposits: Number(raw.today_deposits ?? raw.todayDeposits ?? 0),
            todayAmount: String(raw.today_amount ?? raw.todayAmount ?? '0'),
          })
        }
      } catch {
        // stats endpoint may not be available; ignore
      }
    } catch (error) {
      console.error('加载充值记录失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSearch = async (values: any) => {
    const params: Record<string, any> = {}
    if (values.status !== undefined && values.status !== null) params.status = values.status
    if (values.symbol) params.symbol = values.symbol
    if (values.dateRange?.length === 2) {
      params.start_date = values.dateRange[0].format('YYYY-MM-DD')
      params.end_date = values.dateRange[1].format('YYYY-MM-DD')
    }
    await loadData(1, pagination.pageSize, params)
  }

  const handleReset = () => {
    searchForm.resetFields()
    loadData(1, pagination.pageSize)
  }

  const handleCopy = (text: string, label = '已复制') => {
    navigator.clipboard.writeText(text)
    message.success(label)
  }

  const handleViewDetail = (record: DepositRecord) => {
    setDetailRecord(record)
    setDetailOpen(true)
  }

  const getStatusColor = (status: number): string => {
    return DEPOSIT_STATUS_COLORS[status as DepositStatus] || 'default'
  }

  const getStatusText = (status: number): string => {
    return DEPOSIT_STATUS_LABELS[status as DepositStatus] || `未知(${status})`
  }

  const confirmationRate =
    stats && stats.totalDeposits > 0
      ? `${Math.round((stats.confirmedCount / stats.totalDeposits) * 100)}%`
      : '0%'

  const pendingRatio =
    stats && stats.totalDeposits > 0
      ? `${Math.round((stats.pendingCount / stats.totalDeposits) * 100)}%`
      : '0%'

  const statusCards = [
    {
      label: '今日入账',
      value: stats ? `${stats.todayDeposits} 笔` : '--',
      subtext: stats ? `${formatStatAmount(stats.todayAmount)} 今日累计` : '等待统计',
      accent: '#f59e0b',
      icon: <ThunderboltOutlined />,
    },
    {
      label: '已确认占比',
      value: confirmationRate,
      subtext: stats ? `${stats.confirmedCount} / ${stats.totalDeposits}` : '等待统计',
      accent: '#10b981',
      icon: <CheckCircleOutlined />,
    },
    {
      label: '待确认占比',
      value: pendingRatio,
      subtext: stats ? `${stats.pendingCount} 笔在链上处理中` : '等待统计',
      accent: '#38bdf8',
      icon: <ClockCircleOutlined />,
    },
  ]

  const columns = [
    {
      title: '入金概览',
      key: 'manifest',
      width: 260,
      render: (_: any, record: DepositRecord) => (
        <div className="py-1">
          <Space size={[6, 6]} wrap>
            <Tag
              bordered={false}
              style={{ borderRadius: 999, paddingInline: 10, background: '#e0f2fe', color: '#075985' }}
            >
              {record.chain_code || '未知链'}
            </Tag>
            <Tag
              bordered={false}
              style={{ borderRadius: 999, paddingInline: 10, background: '#ecfccb', color: '#3f6212' }}
            >
              {record.symbol || '-'}
            </Tag>
          </Space>
          <div className="mt-3">
            <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
              {formatAmount(record.amount)} {record.symbol}
            </Text>
          </div>
          <div className="mt-1">
            <Text type="secondary" style={{ fontSize: 12 }}>
              业务号 {shortText(record.business_id, 10, 4)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '地址信息',
      key: 'trace',
      width: 260,
      render: (_: any, record: DepositRecord) => (
        <div
          style={{
            borderRadius: 16,
            border: '1px dashed rgba(14, 116, 144, 0.25)',
            background: 'linear-gradient(180deg, rgba(240, 249, 255, 0.95), rgba(248, 250, 252, 0.9))',
            padding: 12,
          }}
        >
          <div className="mb-2">
            <Text type="secondary" style={{ fontSize: 11 }}>
              充值地址
            </Text>
            <div>
              <Tooltip title={record.address}>
                <Text code style={{ fontSize: 12 }}>
                  {shortText(record.address, 10, 8)}
                </Text>
              </Tooltip>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              交易哈希
            </Text>
            <div className="flex items-center gap-1">
              {record.tx_hash ? (
                <>
                  <Tooltip title={record.tx_hash}>
                    <Text code style={{ fontSize: 12 }}>
                      {shortText(record.tx_hash, 10, 8)}
                    </Text>
                  </Tooltip>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(record.tx_hash || '', '已复制交易哈希')}
                  />
                </>
              ) : (
                <Text type="secondary">待生成</Text>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '状态信息',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: number, record: DepositRecord) => (
        <div>
          <Tag color={getStatusColor(status)} style={{ borderRadius: 999, paddingInline: 10 }}>
            {getStatusText(status)}
          </Tag>
        </div>
      ),
    },
    {
      title: '时间信息',
      key: 'time',
      width: 210,
      render: (_: any, record: DepositRecord) => (
        <div className="py-1">
          <div style={{ borderLeft: '2px solid #cbd5e1', paddingLeft: 12 }}>
            <div className="mb-3">
              <Text type="secondary" style={{ fontSize: 11 }}>
                创建时间
              </Text>
              <div style={{ whiteSpace: 'nowrap', color: '#0f172a', fontWeight: 500 }}>{formatDate(record.created_at)}</div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                更新时间
              </Text>
              <div style={{ whiteSpace: 'nowrap', color: '#0f172a', fontWeight: 500 }}>{formatDate(record.updated_at)}</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 90,
      fixed: 'right' as const,
      render: (_: any, record: DepositRecord) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
          style={{
            height: 36,
            borderRadius: 999,
            paddingInline: 14,
            background: 'rgba(14, 116, 144, 0.08)',
            color: '#0f766e',
          }}
        >
          详情
        </Button>
      ),
    },
  ]

  return (
    <div style={pageShellStyle}>
      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={heroCardStyle}
        className="mb-6"
      >
        <div
          style={{
            padding: 28,
            background:
              'radial-gradient(circle at 20% 20%, rgba(125, 211, 252, 0.22), transparent 22%), radial-gradient(circle at 85% 15%, rgba(251, 191, 36, 0.18), transparent 18%)',
          }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} xl={10}>
              <div style={{ color: '#e2e8f0' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1px solid rgba(148, 163, 184, 0.24)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    marginBottom: 18,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#22c55e',
                      boxShadow: '0 0 18px rgba(34, 197, 94, 0.8)',
                    }}
                  />
                  <Text style={{ color: '#e2e8f0', marginBottom: 0 }}>Deposit Oversight</Text>
                </div>
                <Title level={2} style={{ color: '#f8fafc', marginBottom: 12 }}>
                  充值记录
                </Title>
                <Text style={{ color: 'rgba(226, 232, 240, 0.82)', fontSize: 14, lineHeight: 1.8 }}>
                  集中查看入金记录，支持按状态、币种和时间范围快速筛选，便于核对到账状态、追踪交易信息与处理进度。
                </Text>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => loadData(pagination.current, pagination.pageSize)}
                    loading={loading}
                    style={{
                      height: 42,
                      borderRadius: 999,
                      paddingInline: 18,
                      borderColor: 'rgba(226, 232, 240, 0.18)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#f8fafc',
                    }}
                  >
                    刷新数据
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    style={{
                      height: 42,
                      borderRadius: 999,
                      paddingInline: 18,
                      borderColor: 'transparent',
                      background: '#f59e0b',
                      color: '#111827',
                      fontWeight: 600,
                    }}
                  >
                    导出记录
                  </Button>
                </div>
              </div>
            </Col>
            <Col xs={24} xl={14}>
              <Row gutter={[14, 14]}>
                <Col xs={24} md={12}>
                  <div
                    style={{
                      minHeight: 98,
                      borderRadius: 24,
                      padding: 16,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Text style={{ color: 'rgba(226, 232, 240, 0.72)', fontSize: 12 }}>总入金量</Text>
                    <div className="mt-2">
                      <Title level={1} style={{ color: '#f8fafc', margin: 0, fontSize: 26, lineHeight: 1.1 }}>
                        {stats?.totalDeposits ?? '--'}
                      </Title>
                    </div>
                    <div className="mt-1">
                      <Text style={{ color: '#bae6fd', fontSize: 12 }}>
                        {stats ? `${formatStatAmount(stats.totalAmount)} 累计到账` : '等待统计返回'}
                      </Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-1">
                    {statusCards.map((item) => (
                      <div
                        key={item.label}
                        style={{
                          borderRadius: 20,
                          padding: '12px 14px',
                          background: 'rgba(15, 23, 42, 0.18)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <Text style={{ color: 'rgba(226, 232, 240, 0.72)', fontSize: 12 }}>{item.label}</Text>
                            <div style={{ marginTop: 2 }}>
                              <Text style={{ color: '#f8fafc', fontSize: 19, fontWeight: 700, lineHeight: 1.2 }}>{item.value}</Text>
                            </div>
                            <div style={{ marginTop: 2 }}>
                              <Text style={{ color: 'rgba(226, 232, 240, 0.68)', fontSize: 11 }}>{item.subtext}</Text>
                            </div>
                          </div>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: `${item.accent}22`,
                              color: item.accent,
                              fontSize: 15,
                            }}
                          >
                            {item.icon}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      </Card>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={7}>
          <Card bordered={false} style={glassCardStyle} bodyStyle={{ padding: 22 }}>
            <div style={panelTitleStyle}>Filter Panel</div>
            <Form form={searchForm} layout="vertical" onFinish={handleSearch}>
              <Form.Item name="status" label="状态">
                <Select placeholder="选择状态" allowClear size="large">
                  <Option value={DepositStatus.PENDING}>待确认</Option>
                  <Option value={DepositStatus.CONFIRMED}>确认成功</Option>
                  <Option value={DepositStatus.CONFIRMATION_FAILED}>确认失败</Option>
                  <Option value={DepositStatus.COMPLETED}>交易成功</Option>
                  <Option value={DepositStatus.FAILED}>交易失败</Option>
                  <Option value={DepositStatus.CANCELLED}>已取消</Option>
                </Select>
              </Form.Item>

              <Form.Item name="symbol" label="币种">
                <Select placeholder="选择币种" allowClear size="large">
                  <Option value="USDT">USDT</Option>
                  <Option value="USDC">USDC</Option>
                  <Option value="ETH">ETH</Option>
                  <Option value="BTC">BTC</Option>
                </Select>
              </Form.Item>

              <Form.Item name="dateRange" label="时间范围">
                <RangePicker style={{ width: '100%' }} size="large" />
              </Form.Item>

              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading} size="large" block>
                  应用筛选
                </Button>
                <Button onClick={handleReset} size="large" block>
                  重置条件
                </Button>
              </Space>
            </Form>

            <Divider style={{ margin: '22px 0' }} />

            <div style={panelTitleStyle}>Status Summary</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                { label: '待确认', value: stats?.pendingCount ?? 0, tone: '#0ea5e9', bg: '#e0f2fe' },
                { label: '已确认', value: stats?.confirmedCount ?? 0, tone: '#16a34a', bg: '#dcfce7' },
                { label: '失败', value: stats?.failedCount ?? 0, tone: '#dc2626', bg: '#fee2e2' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 18,
                    padding: 16,
                    background: item.bg,
                    border: `1px solid ${item.tone}22`,
                  }}
                >
                  <Text style={{ color: item.tone, fontSize: 12 }}>{item.label}</Text>
                  <div className="mt-1">
                    <Text style={{ fontSize: 26, lineHeight: 1.2, fontWeight: 700, color: '#0f172a' }}>{item.value}</Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={17}>
          <Card bordered={false} style={glassCardStyle} bodyStyle={{ padding: 0 }}>
            <div
              style={{
                padding: '20px 22px 14px',
                borderBottom: '1px solid rgba(148, 163, 184, 0.14)',
                background:
                  'linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(248, 250, 252, 0.72))',
              }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div style={panelTitleStyle}>Record Board</div>
                  <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                    入金记录列表
                  </Title>
                  <Text type="secondary">
                    当前显示 {deposits.length} 条记录，分页总数 {pagination.total}。
                  </Text>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div
                    style={{
                      borderRadius: 999,
                      padding: '8px 14px',
                      background: '#f1f5f9',
                      color: '#334155',
                      fontSize: 12,
                    }}
                  >
                    当前页 #{pagination.current}
                  </div>
                  <div
                    style={{
                      borderRadius: 999,
                      padding: '8px 14px',
                      background: '#ecfeff',
                      color: '#0f766e',
                      fontSize: 12,
                    }}
                  >
                    最近刷新 {dayjs().format('HH:mm:ss')}
                  </div>
                </div>
              </div>
            </div>

            <Table
              columns={columns}
              dataSource={deposits}
              rowKey="id"
              loading={loading}
              scroll={{ x: 980 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                onChange: (page, pageSize) => loadData(page, pageSize),
              }}
              rowClassName={(_, index) => (index % 2 === 0 ? 'deposit-manifest-row-even' : 'deposit-manifest-row-odd')}
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        title="充值详情"
        placement="right"
        width={560}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {detailRecord && (
          <>
            <Descriptions title="基本信息" column={2} bordered size="small">
              <Descriptions.Item label="链" span={1}>
                <Tag>{detailRecord.chain_code}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="币种" span={1}>
                <Tag color="blue">{detailRecord.symbol}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                <Tag color={getStatusColor(detailRecord.status)}>
                  {getStatusText(detailRecord.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="充值金额" span={2}>
                <Text strong>{detailRecord.amount} {detailRecord.symbol}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="地址 & 交易" column={1} bordered size="small">
              <Descriptions.Item label="充值地址">
                <Text code copyable={{ onCopy: () => message.success('已复制') }} style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {detailRecord.address}
                </Text>
              </Descriptions.Item>
              {detailRecord.tx_hash && (
                <Descriptions.Item label="交易哈希">
                  <Text code copyable={{ onCopy: () => message.success('已复制') }} style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                    {detailRecord.tx_hash}
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <Descriptions title="业务信息" column={1} bordered size="small">
              <Descriptions.Item label="充值 ID">
                <Text code copyable={{ onCopy: () => message.success('已复制') }} style={{ fontSize: '12px' }}>
                  {detailRecord.id}
                </Text>
              </Descriptions.Item>
              {detailRecord.business_id && (
                <Descriptions.Item label="业务 ID">
                  <Text code copyable={{ onCopy: () => message.success('已复制') }} style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                    {detailRecord.business_id}
                  </Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Webhook 状态">
                <Tag color={detailRecord.webhook_sent ? 'green' : 'default'}>
                  {detailRecord.webhook_sent ? '已发送' : '未发送'}
                </Tag>
                {detailRecord.webhook_sent_at && (
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {formatDate(detailRecord.webhook_sent_at)}
                  </Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="时间信息" column={1} bordered size="small">
              <Descriptions.Item label="创建时间">
                {formatDate(detailRecord.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {formatDate(detailRecord.updated_at)}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default DepositHistoryPage
