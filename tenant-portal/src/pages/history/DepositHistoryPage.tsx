import React, { useState, useEffect, useCallback } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Statistic,
  Select,
  DatePicker,
  Form,
  Tooltip,
  Drawer,
  Descriptions,
  Divider,
  message
} from 'antd'
import { 
  SearchOutlined, 
  ReloadOutlined,
  EyeOutlined,
  CopyOutlined,
  DownloadOutlined
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

/** 统计金额保留小数点后 8 位 */
const formatStatAmount = (amount: string): string => {
  const n = parseFloat(amount)
  if (Number.isNaN(n)) return amount
  return n.toFixed(8)
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

  const formatAmount = (raw: string) => {
    const n = parseFloat(raw)
    if (isNaN(n)) return raw
    return n.toFixed(Math.min(8, (raw.split('.')[1] || '').replace(/0+$/, '').length || 0))
  }

  const columns = [
    {
      title: '钱包',
      key: 'wallet',
      width: 110,
      render: (_: any, record: DepositRecord) => (
        <Space size={4}>
          <Tag>{record.chain_code}</Tag>
          <Tag color="blue">{record.symbol}</Tag>
        </Space>
      )
    },
    {
      title: '充值地址',
      dataIndex: 'address',
      key: 'address',
      width: 160,
      render: (address: string) => (
        address ? (
          <Tooltip title={address}>
            <Text code style={{ fontSize: '12px' }}>
              {address.slice(0, 8)}...{address.slice(-6)}
            </Text>
          </Tooltip>
        ) : <Text type="secondary">-</Text>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount: string, record: DepositRecord) => (
        <Tooltip title={`${amount} ${record.symbol}`}>
          <Text strong>{formatAmount(amount)} {record.symbol}</Text>
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: number) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '交易哈希',
      dataIndex: 'tx_hash',
      key: 'tx_hash',
      width: 180,
      render: (txHash: string) => (
        txHash ? (
          <Space size={2}>
            <Tooltip title={txHash}>
              <Text code style={{ fontSize: '12px', cursor: 'pointer' }}>
                {txHash.slice(0, 8)}...{txHash.slice(-6)}
              </Text>
            </Tooltip>
            <Button 
              type="text" 
              size="small" 
              icon={<CopyOutlined />}
              onClick={() => handleCopy(txHash, '已复制交易哈希')}
            />
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    },
    {
      title: '业务 ID',
      dataIndex: 'business_id',
      key: 'business_id',
      width: 130,
      ellipsis: true,
      render: (businessId: string) => (
        businessId ? (
          <Tooltip title={businessId}>
            <Text code style={{ fontSize: '12px' }}>{businessId.slice(0, 12)}...</Text>
          </Tooltip>
        ) : <Text type="secondary">-</Text>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(date)}</span>
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(date)}</span>
    },
    {
      title: '操作',
      key: 'actions',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, record: DepositRecord) => (
        <Tooltip title="查看详情">
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          />
        </Tooltip>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>充值记录</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => loadData(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            刷新
          </Button>
          <Button 
            icon={<DownloadOutlined />}
          >
            导出
          </Button>
        </Space>
      </div>

      {stats && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总充值数"
                value={stats.totalDeposits}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总充值金额"
                value={formatStatAmount(stats.totalAmount)}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="今日充值"
                value={stats.todayDeposits}
                suffix={`笔 / ${formatStatAmount(stats.todayAmount)}`}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="已确认"
                value={stats.confirmedCount}
                suffix={`/ ${stats.totalDeposits}`}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card className="mb-6">
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 0 }}
        >
          <Form.Item name="status" label="状态">
            <Select style={{ width: 120 }} placeholder="选择状态" allowClear>
              <Option value={DepositStatus.PENDING}>待确认</Option>
              <Option value={DepositStatus.CONFIRMED}>确认成功</Option>
              <Option value={DepositStatus.CONFIRMATION_FAILED}>确认失败</Option>
              <Option value={DepositStatus.COMPLETED}>交易成功</Option>
              <Option value={DepositStatus.FAILED}>交易失败</Option>
              <Option value={DepositStatus.CANCELLED}>已取消</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="symbol" label="币种">
            <Select style={{ width: 120 }} placeholder="选择币种" allowClear>
              <Option value="USDT">USDT</Option>
              <Option value="USDC">USDC</Option>
              <Option value="ETH">ETH</Option>
              <Option value="BTC">BTC</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="dateRange" label="时间范围">
            <RangePicker />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SearchOutlined />}
                loading={loading}
              >
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={deposits}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
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

      {/* 详情抽屉 */}
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
