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

  const columns = [
    {
      title: '钱包',
      key: 'wallet',
      render: (_: any, record: WithdrawRecord) => (
        <Space size={4}>
          <Tag>{record.chain_code}</Tag>
          <Tag color="blue">{record.symbol}</Tag>
        </Space>
      )
    },
    {
      title: '来源地址',
      dataIndex: 'from_address',
      key: 'from_address',
      width: 160,
      render: (addr: string) => (
        addr ? (
          <Tooltip title={addr}>
            <Text code style={{ fontSize: '12px' }}>
              {addr.slice(0, 8)}...{addr.slice(-6)}
            </Text>
          </Tooltip>
        ) : <Text type="secondary">-</Text>
      )
    },
    {
      title: '接收地址',
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
      render: (amount: string, record: WithdrawRecord) => (
        <Text strong>{amount} {record.symbol}</Text>
      )
    },
    {
      title: '手续费',
      key: 'fee',
      render: (_: any, record: WithdrawRecord) => {
        const fee = parseFloat(record.block_fee) + parseFloat(record.withdraw_fee)
        return <Text>{fee > 0 ? fee.toString() : '0'}</Text>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number, record: WithdrawRecord) => {
        if (status === 3 && record.transaction_status === 0) {
          return <Tag color="processing">区块确认中</Tag>
        }
        return (
          <Tag color={getStatusColor(status)}>
            {getStatusText(status)}
          </Tag>
        )
      }
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
      title: '区块确认',
      dataIndex: 'confirmations',
      key: 'confirmations',
      align: 'center' as const,
      render: (confirmations: number) => (
        confirmations > 0 ? <Text>{confirmations}</Text> : <Text type="secondary">-</Text>
      )
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      width: 160,
      ellipsis: true,
      render: (note: string) => (
        note ? <Tooltip title={note}><Text>{note}</Text></Tooltip> : <Text type="secondary">-</Text>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(date)}</span>
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (date: string | null) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(date)}</span>
    },
    {
      title: '操作',
      key: 'actions',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, record: WithdrawRecord) => (
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
        <Title level={2}>提现记录</Title>
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
                title="总提现数"
                value={stats.totalWithdrawals}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总提现金额"
                value={stats.totalAmount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="今日提现"
                value={stats.todayWithdrawals}
                suffix={`笔 / ${stats.todayAmount}`}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总手续费"
                value={stats.totalFees}
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
              <Option value={WithdrawalStatus.PENDING}>待审核</Option>
              <Option value={WithdrawalStatus.APPROVED}>审核成功</Option>
              <Option value={WithdrawalStatus.REJECTED}>审核失败</Option>
              <Option value={WithdrawalStatus.COMPLETED}>交易成功</Option>
              <Option value={WithdrawalStatus.FAILED}>交易失败</Option>
              <Option value={WithdrawalStatus.CANCELLED}>已取消</Option>
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
          dataSource={withdrawals}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
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
        title="提现详情"
        placement="right"
        width={560}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {detailRecord && (
          <>
            {/* 基本信息 */}
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

            {/* 地址信息 */}
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

            {/* 业务信息 */}
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

            {/* 时间信息 */}
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