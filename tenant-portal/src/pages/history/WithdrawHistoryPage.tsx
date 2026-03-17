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
  Progress,
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
  ArrowUpOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { withdrawalService } from '@/services'
import { WITHDRAWAL_STATUS_LABELS, WITHDRAWAL_STATUS_COLORS, WithdrawalStatus } from '@shared/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

interface WithdrawRecord {
  id: string
  chain_code: string
  symbol: string
  address: string
  from_address: string
  amount: string
  block_fee: string
  withdraw_fee: string
  net_amount: string
  status: number
  transaction_status?: number | null
  tx_hash?: string
  confirmations: number
  note?: string
  business_id?: string
  failure_reason?: string
  created_at: string
  completed_at?: string | null
  requested_at?: string
  processed_at?: string | null
}

interface WithdrawStats {
  totalWithdrawals: number
  totalAmount: string
  totalFees: string
  pendingCount: number
  completedCount: number
  failedCount: number
  todayWithdrawals: number
  todayAmount: string
}

const mapApiItem = (item: any): WithdrawRecord => {
  const txStatus = item.transaction_status ?? item.transactionStatus
  return {
    id: item.id,
    chain_code: item.chain_code || '',
    symbol: item.symbol || '',
    address: item.address || '',
    from_address: item.from_address || '',
    amount: item.amount || '0',
    block_fee: item.block_fee || '0',
    withdraw_fee: item.withdraw_fee || '0',
    net_amount: item.net_amount || '0',
    status: typeof item.status === 'number' ? item.status : 0,
    transaction_status: txStatus != null ? (typeof txStatus === 'number' ? txStatus : parseInt(txStatus, 10)) : null,
    tx_hash: item.tx_hash || '',
    confirmations: item.confirmations || 0,
    note: item.note || '',
    business_id: item.business_id || '',
    failure_reason: item.failure_reason || '',
    created_at: item.created_at || item.requested_at || '',
    completed_at: item.completed_at,
    requested_at: item.requested_at,
    processed_at: item.processed_at,
  }
}

const formatDate = (date?: string | null) =>
  date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'

const formatTokenAmount = (amount?: string) => {
  const parsed = parseFloat(amount || '0')
  if (Number.isNaN(parsed)) return amount || '0'
  return parsed.toFixed(Math.min(8, (amount?.split('.')[1] || '').replace(/0+$/, '').length || 2))
}

const shortText = (value?: string | null, start = 8, end = 6) => {
  if (!value) return '-'
  if (value.length <= start + end) return value
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

const sumFees = (record: WithdrawRecord) => {
  const block = parseFloat(record.block_fee || '0')
  const withdraw = parseFloat(record.withdraw_fee || '0')
  return (Number.isNaN(block) ? 0 : block) + (Number.isNaN(withdraw) ? 0 : withdraw)
}

const pageStyle: React.CSSProperties = {
  minHeight: '100%',
  padding: 24,
  background:
    'radial-gradient(circle at 10% 0%, rgba(56, 189, 248, 0.14), transparent 24%), radial-gradient(circle at 92% 8%, rgba(34, 197, 94, 0.10), transparent 22%), linear-gradient(180deg, #f7fbff 0%, #eff6ff 40%, #fff 100%)',
}

const heroStyle: React.CSSProperties = {
  borderRadius: 30,
  border: '1px solid rgba(30, 64, 175, 0.10)',
  background:
    'linear-gradient(130deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 64, 175, 0.95) 38%, rgba(8, 47, 73, 0.94) 100%)',
  boxShadow: '0 24px 70px rgba(30, 64, 175, 0.18)',
  overflow: 'hidden',
}

const softPanelStyle: React.CSSProperties = {
  borderRadius: 26,
  border: '1px solid rgba(96, 165, 250, 0.16)',
  background: 'rgba(255, 255, 255, 0.86)',
  boxShadow: '0 18px 46px rgba(30, 64, 175, 0.08)',
  backdropFilter: 'blur(12px)',
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#1d4ed8',
  marginBottom: 14,
}

const WithdrawHistoryPage: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawRecord[]>([])
  const [stats, setStats] = useState<WithdrawStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [searchForm] = Form.useForm()
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<WithdrawRecord | null>(null)

  const loadData = useCallback(async (page = 1, pageSize = 20, extraParams?: Record<string, any>) => {
    try {
      setLoading(true)

      const params = { page, pageSize, include_transaction_status: 'true', ...extraParams }
      const withdrawalsData = await withdrawalService.getWithdrawals(params)
      const items = withdrawalsData.data?.items || []
      setWithdrawals(items.map(mapApiItem))
      setPagination({
        current: withdrawalsData.data?.page || page,
        pageSize: withdrawalsData.data?.pageSize || pageSize,
        total: withdrawalsData.data?.total || 0,
      })

      try {
        const statsData = await withdrawalService.getWithdrawalStats()
        if (statsData.data) {
          setStats({
            totalWithdrawals: statsData.data.totalWithdrawals ?? 0,
            totalAmount: statsData.data.totalAmount ?? '0',
            totalFees: statsData.data.totalFees ?? '0',
            pendingCount: statsData.data.pendingWithdrawals ?? 0,
            completedCount: statsData.data.completedWithdrawals ?? 0,
            failedCount: statsData.data.failedWithdrawals ?? 0,
            todayWithdrawals: statsData.data.todayWithdrawals ?? 0,
            todayAmount: statsData.data.todayAmount ?? '0',
          })
        }
      } catch {
        // stats endpoint may not be available; ignore
      }
    } catch (error) {
      console.error('加载提现记录失败:', error)
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

  const handleViewDetail = (record: WithdrawRecord) => {
    setDetailRecord(record)
    setDetailOpen(true)
  }

  const getStatusColor = (status: number): string => {
    return WITHDRAWAL_STATUS_COLORS[status as WithdrawalStatus] || 'default'
  }

  const getStatusText = (status: number): string => {
    return WITHDRAWAL_STATUS_LABELS[status as WithdrawalStatus] || `未知(${status})`
  }

  const progressRate = stats && stats.totalWithdrawals > 0 ? Math.round((stats.completedCount / stats.totalWithdrawals) * 100) : 0
  const failureRate = stats && stats.totalWithdrawals > 0 ? Math.round((stats.failedCount / stats.totalWithdrawals) * 100) : 0

  const columns = [
    {
      title: '提现概览',
      key: 'overview',
      width: 250,
      render: (_: any, record: WithdrawRecord) => (
        <div className="py-1">
          <Space size={[6, 6]} wrap>
            <Tag bordered={false} style={{ borderRadius: 999, paddingInline: 10, background: '#dbeafe', color: '#1d4ed8' }}>
              {record.chain_code || '未知链'}
            </Tag>
            <Tag bordered={false} style={{ borderRadius: 999, paddingInline: 10, background: '#dcfce7', color: '#166534' }}>
              {record.symbol || '-'}
            </Tag>
          </Space>
          <div className="mt-3">
            <Text strong style={{ fontSize: 15, color: '#1e3a8a' }}>
              {formatTokenAmount(record.amount)} {record.symbol}
            </Text>
          </div>
          <div className="mt-1">
            <Text type="secondary" style={{ fontSize: 12 }}>
              实际到账 {formatTokenAmount(record.net_amount)} {record.symbol}
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
      title: '地址路径',
      key: 'addresses',
      width: 280,
      render: (_: any, record: WithdrawRecord) => (
        <div
          style={{
            borderRadius: 18,
            padding: 12,
            border: '1px solid rgba(96, 165, 250, 0.18)',
            background: 'linear-gradient(180deg, rgba(239, 246, 255, 0.98), rgba(255, 255, 255, 0.96))',
          }}
        >
          <div className="mb-2">
            <Text type="secondary" style={{ fontSize: 11 }}>来源地址</Text>
            <div>
              {record.from_address ? (
                <Tooltip title={record.from_address}>
                  <Text code style={{ fontSize: 12 }}>{shortText(record.from_address, 10, 8)}</Text>
                </Tooltip>
              ) : (
                <Text type="secondary">-</Text>
              )}
            </div>
          </div>
          <div className="mb-2">
            <Text type="secondary" style={{ fontSize: 11 }}>接收地址</Text>
            <div>
              {record.address ? (
                <Tooltip title={record.address}>
                  <Text code style={{ fontSize: 12 }}>{shortText(record.address, 10, 8)}</Text>
                </Tooltip>
              ) : (
                <Text type="secondary">-</Text>
              )}
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>交易哈希</Text>
            <div className="flex items-center gap-1">
              {record.tx_hash ? (
                <>
                  <Tooltip title={record.tx_hash}>
                    <Text code style={{ fontSize: 12 }}>{shortText(record.tx_hash, 10, 8)}</Text>
                  </Tooltip>
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record.tx_hash || '', '已复制交易哈希')} />
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
      title: '费用与确认',
      key: 'fees',
      width: 180,
      render: (_: any, record: WithdrawRecord) => (
        <div className="py-1">
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>总手续费</Text>
            <div style={{ color: '#1e3a8a', fontWeight: 700 }}>{formatTokenAmount(String(sumFees(record)))}</div>
          </div>
          <div className="mt-3">
            <Text type="secondary" style={{ fontSize: 11 }}>区块确认</Text>
            <div style={{ color: '#0f172a', fontWeight: 600 }}>
              {record.confirmations > 0 ? record.confirmations : '-'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '处理状态',
      key: 'status',
      width: 180,
      render: (_: any, record: WithdrawRecord) => (
        <div>
          {record.status === 3 && record.transaction_status === 0 ? (
            <Tag color="processing" style={{ borderRadius: 999, paddingInline: 10 }}>区块确认中</Tag>
          ) : (
            <Tag color={getStatusColor(record.status)} style={{ borderRadius: 999, paddingInline: 10 }}>
              {getStatusText(record.status)}
            </Tag>
          )}
          {record.failure_reason && (
            <div className="mt-2">
              <Text style={{ color: '#dc2626', fontSize: 12 }}>{record.failure_reason}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '时间线',
      key: 'timeline',
      width: 210,
      render: (_: any, record: WithdrawRecord) => (
        <div style={{ borderLeft: '2px solid #bfdbfe', paddingLeft: 12 }}>
          <div className="mb-3">
            <Text type="secondary" style={{ fontSize: 11 }}>申请时间</Text>
            <div style={{ whiteSpace: 'nowrap', color: '#0f172a', fontWeight: 500 }}>{formatDate(record.requested_at || record.created_at)}</div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>完成时间</Text>
            <div style={{ whiteSpace: 'nowrap', color: '#0f172a', fontWeight: 500 }}>{formatDate(record.completed_at)}</div>
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 90,
      fixed: 'right' as const,
      render: (_: any, record: WithdrawRecord) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
          style={{
            height: 36,
            borderRadius: 999,
            paddingInline: 14,
            background: 'rgba(59, 130, 246, 0.10)',
            color: '#1d4ed8',
          }}
        >
          详情
        </Button>
      ),
    },
  ]

  return (
    <div style={pageStyle}>
      <Card bordered={false} bodyStyle={{ padding: 0 }} style={heroStyle} className="mb-6">
        <div
          style={{
            padding: 28,
            background:
              'radial-gradient(circle at 82% 18%, rgba(125, 211, 252, 0.24), transparent 18%), radial-gradient(circle at 12% 22%, rgba(96, 165, 250, 0.18), transparent 18%)',
          }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} xl={9}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    marginBottom: 18,
                    color: '#dbeafe',
                  }}
                >
                  <WarningOutlined />
                  <Text style={{ color: '#dbeafe', marginBottom: 0 }}>Withdrawal Monitor</Text>
                </div>
                <Title level={2} style={{ color: '#eff6ff', marginBottom: 12 }}>
                  提现记录
                </Title>
                <Text style={{ color: 'rgba(219, 234, 254, 0.86)', fontSize: 14, lineHeight: 1.8 }}>
                  重点关注出金处理进度、手续费消耗和失败记录，适合管理员做审核跟踪、异常定位与到账核对。
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
                      borderColor: 'rgba(219, 234, 254, 0.18)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#eff6ff',
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
                      background: '#bfdbfe',
                      color: '#1e3a8a',
                      fontWeight: 700,
                    }}
                  >
                    导出记录
                  </Button>
                </div>
              </div>
            </Col>
            <Col xs={24} xl={15}>
              <div
                style={{
                  borderRadius: 26,
                  padding: 18,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                }}
              >
                <Row gutter={[14, 14]}>
                  <Col xs={24} md={10}>
                    <div
                      style={{
                        height: '100%',
                        minHeight: 150,
                        borderRadius: 22,
                        padding: 18,
                        background: 'rgba(30, 64, 175, 0.24)',
                      }}
                    >
                      <Text style={{ color: 'rgba(219, 234, 254, 0.76)', fontSize: 12 }}>累计提现金额</Text>
                      <div className="mt-2">
                        <Title level={1} style={{ color: '#eff6ff', margin: 0, fontSize: 30, lineHeight: 1.1 }}>
                          {stats?.totalAmount ?? '--'}
                        </Title>
                      </div>
                      <div className="mt-2">
                        <Text style={{ color: '#93c5fd', fontSize: 13 }}>
                          {stats ? `${stats.totalWithdrawals} 笔提现记录` : '等待统计返回'}
                        </Text>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} md={14}>
                    <div className="grid grid-cols-1 gap-3">
                      <div
                        style={{
                          borderRadius: 18,
                          padding: '14px 16px',
                          background: 'rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <Text style={{ color: 'rgba(219, 234, 254, 0.78)' }}>今日提现</Text>
                          <ArrowUpOutlined style={{ color: '#93c5fd' }} />
                        </div>
                        <div className="mt-1">
                          <Text style={{ color: '#eff6ff', fontSize: 22, fontWeight: 700 }}>
                            {stats ? `${stats.todayWithdrawals} 笔` : '--'}
                          </Text>
                        </div>
                        <Text style={{ color: 'rgba(219, 234, 254, 0.66)', fontSize: 12 }}>
                          {stats ? `${stats.todayAmount} 当日出金` : '等待统计'}
                        </Text>
                      </div>
                      <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12}>
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 18,
                              padding: '14px 16px',
                              background: 'rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <Text style={{ color: 'rgba(219, 234, 254, 0.78)' }}>完成率</Text>
                              <CheckCircleOutlined style={{ color: '#86efac' }} />
                            </div>
                            <div className="mt-2">
                              <Progress percent={progressRate} strokeColor="#86efac" trailColor="rgba(255,255,255,0.12)" showInfo={false} />
                            </div>
                            <div className="mt-2">
                              <Text style={{ color: '#eff6ff', fontSize: 18, fontWeight: 700 }}>{progressRate}%</Text>
                            </div>
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 18,
                              padding: '14px 16px',
                              background: 'rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <Text style={{ color: 'rgba(219, 234, 254, 0.78)' }}>失败占比</Text>
                              <WarningOutlined style={{ color: '#fca5a5' }} />
                            </div>
                            <div className="mt-2">
                              <Progress percent={failureRate} strokeColor="#fda4af" trailColor="rgba(255,255,255,0.12)" showInfo={false} />
                            </div>
                            <div className="mt-2">
                              <Text style={{ color: '#eff6ff', fontSize: 18, fontWeight: 700 }}>{failureRate}%</Text>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </div>
      </Card>

      <Row gutter={[20, 20]}>
        <Col xs={24} xxl={6}>
          <Card bordered={false} style={softPanelStyle} bodyStyle={{ padding: 22 }}>
            <div style={sectionLabelStyle}>Screening</div>
            <Form form={searchForm} layout="vertical" onFinish={handleSearch}>
              <Form.Item name="status" label="状态">
                <Select placeholder="选择状态" allowClear size="large">
                  <Option value={WithdrawalStatus.PENDING}>待审核</Option>
                  <Option value={WithdrawalStatus.APPROVED}>审核成功</Option>
                  <Option value={WithdrawalStatus.REJECTED}>审核失败</Option>
                  <Option value={WithdrawalStatus.COMPLETED}>交易成功</Option>
                  <Option value={WithdrawalStatus.FAILED}>交易失败</Option>
                  <Option value={WithdrawalStatus.CANCELLED}>已取消</Option>
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
                <Button size="large" block onClick={handleReset}>
                  重置条件
                </Button>
              </Space>
            </Form>

            <Divider style={{ margin: '22px 0' }} />

            <div style={sectionLabelStyle}>Risk Focus</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xxl:grid-cols-1">
              {[
                { label: '待处理', value: stats?.pendingCount ?? 0, bg: '#eff6ff', color: '#1d4ed8' },
                { label: '已完成', value: stats?.completedCount ?? 0, bg: '#ecfdf5', color: '#15803d' },
                { label: '失败', value: stats?.failedCount ?? 0, bg: '#fef2f2', color: '#dc2626' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 18,
                    padding: 16,
                    background: item.bg,
                    border: `1px solid ${item.color}22`,
                  }}
                >
                  <Text style={{ color: item.color, fontSize: 12 }}>{item.label}</Text>
                  <div className="mt-1">
                    <Text style={{ color: '#111827', fontSize: 26, fontWeight: 700 }}>{item.value}</Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} xxl={18}>
          <Card bordered={false} style={softPanelStyle} bodyStyle={{ padding: 0 }}>
            <div
              style={{
                padding: '20px 22px 14px',
                borderBottom: '1px solid rgba(96, 165, 250, 0.14)',
                background: 'linear-gradient(180deg, rgba(239, 246, 255, 0.90), rgba(255, 255, 255, 0.92))',
              }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div style={sectionLabelStyle}>Review Queue</div>
                  <Title level={4} style={{ margin: 0, color: '#1e3a8a' }}>
                    提现处理列表
                  </Title>
                  <Text type="secondary">
                    当前显示 {withdrawals.length} 条记录，分页总数 {pagination.total}。
                  </Text>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div
                    style={{
                      borderRadius: 999,
                      padding: '8px 14px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
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
              dataSource={withdrawals}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1180 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                onChange: (page, pageSize) => loadData(page, pageSize),
              }}
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        title="提现详情"
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
                {detailRecord.status === 3 && detailRecord.transaction_status === 0 ? (
                  <Tag color="processing">区块确认中</Tag>
                ) : (
                  <Tag color={getStatusColor(detailRecord.status)}>
                    {getStatusText(detailRecord.status)}
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="提现金额" span={1}>
                <Text strong>{detailRecord.amount} {detailRecord.symbol}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="实际到账" span={1}>
                <Text strong>{detailRecord.net_amount} {detailRecord.symbol}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="链上手续费" span={1}>
                {detailRecord.block_fee}
              </Descriptions.Item>
              <Descriptions.Item label="提现手续费" span={1}>
                {detailRecord.withdraw_fee}
              </Descriptions.Item>
              <Descriptions.Item label="区块确认数" span={2}>
                {detailRecord.confirmations}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="地址信息" column={1} bordered size="small">
              <Descriptions.Item label="来源地址">
                <Space>
                  <Text code copyable={{ onCopy: () => message.success('已复制') }} style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                    {detailRecord.from_address || '-'}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="接收地址">
                <Space>
                  <Text code copyable={{ onCopy: () => message.success('已复制') }} style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                    {detailRecord.address}
                  </Text>
                </Space>
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
              <Descriptions.Item label="提现 ID">
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
              <Descriptions.Item label="备注">
                {detailRecord.note || '-'}
              </Descriptions.Item>
              {detailRecord.failure_reason && (
                <Descriptions.Item label="失败原因">
                  <Text type="danger">{detailRecord.failure_reason}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <Descriptions title="时间信息" column={1} bordered size="small">
              <Descriptions.Item label="申请时间">
                {formatDate(detailRecord.requested_at)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDate(detailRecord.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="处理时间">
                {formatDate(detailRecord.processed_at)}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {formatDate(detailRecord.completed_at)}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default WithdrawHistoryPage
