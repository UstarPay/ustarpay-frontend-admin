import React, { useState, useEffect } from 'react'
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
  Badge
} from 'antd'
import { 
  SearchOutlined, 
  ReloadOutlined,
  EyeOutlined,
  CopyOutlined,
  DownloadOutlined,
  SwapOutlined
} from '@ant-design/icons'
import { internalTransferService } from '@/services'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

interface InternalTransferRecord {
  id: string
  fromWalletId: string
  fromWalletName: string
  toWalletId: string
  toWalletName: string
  amount: string
  currency: string
  fee: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  txHash?: string
  blockNumber?: number
  confirmations?: number
  requiredConfirmations: number
  createdAt: string
  completedAt?: string
  memo?: string
  transferType: 'hot_to_cold' | 'cold_to_hot' | 'hot_to_hot' | 'cold_to_cold'
}

interface TransferStats {
  totalTransfers: number
  totalAmount: string
  totalFees: string
  pendingCount: number
  processingCount: number
  completedCount: number
  failedCount: number
  todayTransfers: number
  todayAmount: string
  hotToColdCount: number
  coldToHotCount: number
}

const InternalTransferPage: React.FC = () => {
  const [transfers, setTransfers] = useState<InternalTransferRecord[]>([])
  const [stats, setStats] = useState<TransferStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [transfersData, statsData] = await Promise.all([
        internalTransferService.getInternalTransfers(),
        internalTransferService.getTransferStats()
      ])
      
      setTransfers((transfersData.data?.items || []).map((transfer: any) => ({
        id: transfer.id,
        fromWalletId: transfer.fromWalletId,
        fromWalletName: transfer.fromWalletName || '钱包' + transfer.fromWalletId.slice(0, 8),
        toWalletId: transfer.toWalletId,
        toWalletName: transfer.toWalletName || '钱包' + transfer.toWalletId.slice(0, 8),
        amount: transfer.amount,
        currency: transfer.currency,
        fee: transfer.fee,
        status: transfer.status as any,
        txHash: transfer.txHash,
        blockNumber: transfer.blockNumber,
        confirmations: transfer.confirmations,
        requiredConfirmations: transfer.requiredConfirmations,
        createdAt: transfer.createdAt,
        completedAt: transfer.completedAt,
        memo: transfer.memo,
        transferType: transfer.transferType as any
      })))
      setStats({
        totalTransfers: statsData.data.totalTransfers,
        totalAmount: statsData.data.totalAmount,
        totalFees: statsData.data.totalFees,
        pendingCount: statsData.data.pendingTransfers,
        processingCount: 0, // 简化处理
        completedCount: statsData.data.completedTransfers,
        failedCount: statsData.data.failedTransfers,
        todayTransfers: statsData.data.todayTransfers,
        todayAmount: statsData.data.todayAmount,
        hotToColdCount: 0, // 简化处理
        coldToHotCount: 0 // 简化处理
      })
    } catch (error) {
      console.error('加载内部转账记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (values: any) => {
    try {
      setLoading(true)
      const params = {
        fromWalletId: values.fromWalletId || undefined,
        toWalletId: values.toWalletId || undefined,
        status: values.status || undefined,
        currency: values.currency || undefined,
        transferType: values.transferType || undefined,
        dateRange: values.dateRange ? [
          values.dateRange[0].format('YYYY-MM-DD'),
          values.dateRange[1].format('YYYY-MM-DD')
        ] : undefined
      }
      
      const response = await internalTransferService.searchTransfers(params)
      setTransfers((response.data?.items || []).map((transfer: any) => ({
        id: transfer.id,
        fromWalletId: transfer.fromWalletId,
        fromWalletName: transfer.fromWalletName || '钱包' + transfer.fromWalletId.slice(0, 8),
        toWalletId: transfer.toWalletId,
        toWalletName: transfer.toWalletName || '钱包' + transfer.toWalletId.slice(0, 8),
        amount: transfer.amount,
        currency: transfer.currency,
        fee: transfer.fee,
        status: transfer.status as any,
        txHash: transfer.txHash,
        blockNumber: transfer.blockNumber,
        confirmations: transfer.confirmations,
        requiredConfirmations: transfer.requiredConfirmations,
        createdAt: transfer.createdAt,
        completedAt: transfer.completedAt,
        memo: transfer.memo,
        transferType: transfer.transferType as any
      })))
    } catch (error) {
      console.error('搜索内部转账记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'processing': return 'processing'
      case 'pending': return 'warning'
      case 'failed': return 'error'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'processing': return '处理中'
      case 'pending': return '待处理'
      case 'failed': return '失败'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  const getTransferTypeColor = (type: string) => {
    switch (type) {
      case 'hot_to_cold': return 'blue'
      case 'cold_to_hot': return 'green'
      case 'hot_to_hot': return 'orange'
      case 'cold_to_cold': return 'purple'
      default: return 'default'
    }
  }

  const getTransferTypeText = (type: string) => {
    switch (type) {
      case 'hot_to_cold': return '热钱包→冷钱包'
      case 'cold_to_hot': return '冷钱包→热钱包'
      case 'hot_to_hot': return '热钱包→热钱包'
      case 'cold_to_cold': return '冷钱包→冷钱包'
      default: return type
    }
  }

  const columns = [
    {
      title: '转账类型',
      dataIndex: 'transferType',
      key: 'transferType',
      render: (type: string) => (
        <Tag color={getTransferTypeColor(type)}>
          {getTransferTypeText(type)}
        </Tag>
      )
    },
    {
      title: '来源钱包',
      dataIndex: 'fromWalletName',
      key: 'fromWalletName',
      render: (name: string, record: InternalTransferRecord) => (
        <Space>
          <Text>{name}</Text>
          <Tag>{record.currency.toUpperCase()}</Tag>
        </Space>
      )
    },
    {
      title: '目标钱包',
      dataIndex: 'toWalletName',
      key: 'toWalletName',
      render: (name: string, record: InternalTransferRecord) => (
        <Space>
          <Text>{name}</Text>
          <Tag>{record.currency.toUpperCase()}</Tag>
        </Space>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string, record: InternalTransferRecord) => (
        <Text strong>{amount} {record.currency.toUpperCase()}</Text>
      )
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      key: 'fee',
      render: (fee: string, record: InternalTransferRecord) => (
        <Text>{fee} {record.currency.toUpperCase()}</Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: InternalTransferRecord) => (
        <Space>
          <Tag color={getStatusColor(status)}>
            {getStatusText(status)}
          </Tag>
          {(status === 'pending' || status === 'processing') && (
            <Badge 
              count={`${record.confirmations || 0}/${record.requiredConfirmations}`} 
              style={{ backgroundColor: '#1890ff' }}
            />
          )}
        </Space>
      )
    },
    {
      title: '交易哈希',
      dataIndex: 'txHash',
      key: 'txHash',
      render: (txHash: string) => (
        txHash ? (
          <Space>
            <Tooltip title={txHash}>
              <Text code style={{ fontSize: '12px', cursor: 'pointer' }}>
                {txHash.slice(0, 8)}...{txHash.slice(-8)}
              </Text>
            </Tooltip>
            <Button 
              type="text" 
              size="small" 
              icon={<CopyOutlined />}
              onClick={() => handleCopyTxHash(txHash)}
            />
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    },
    {
      title: '区块号',
      dataIndex: 'blockNumber',
      key: 'blockNumber',
      render: (blockNumber: number) => (
        blockNumber ? <Text>{blockNumber}</Text> : <Text type="secondary">-</Text>
      )
    },
    {
      title: '备注',
      dataIndex: 'memo',
      key: 'memo',
      render: (memo: string) => (
        memo || <Text type="secondary">-</Text>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => (
        date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: InternalTransferRecord) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>内部转账记录</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadData}
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

      {/* 统计信息 */}
      {stats && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总转账数"
                value={stats.totalTransfers}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总转账金额"
                value={stats.totalAmount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="今日转账"
                value={stats.todayTransfers}
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

      {/* 转账类型统计 */}
      {stats && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12}>
            <Card>
              <Statistic
                title="热钱包→冷钱包"
                value={stats.hotToColdCount}
                prefix={<SwapOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card>
              <Statistic
                title="冷钱包→热钱包"
                value={stats.coldToHotCount}
                prefix={<SwapOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索表单 */}
      <Card className="mb-6">
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 0 }}
        >
          <Form.Item name="fromWalletId" label="来源钱包">
            <Select 
              style={{ width: 150 }} 
              placeholder="选择来源钱包"
              allowClear
            >
              <Option value="all">全部钱包</Option>
              <Option value="wallet1">钱包1</Option>
              <Option value="wallet2">钱包2</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="toWalletId" label="目标钱包">
            <Select 
              style={{ width: 150 }} 
              placeholder="选择目标钱包"
              allowClear
            >
              <Option value="all">全部钱包</Option>
              <Option value="wallet1">钱包1</Option>
              <Option value="wallet2">钱包2</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="status" label="状态">
            <Select style={{ width: 120 }} placeholder="选择状态" allowClear>
              <Option value="pending">待处理</Option>
              <Option value="processing">处理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="failed">失败</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="currency" label="币种">
            <Select style={{ width: 120 }} placeholder="选择币种" allowClear>
              <Option value="BTC">Bitcoin</Option>
              <Option value="ETH">Ethereum</Option>
              <Option value="USDT">USDT</Option>
              <Option value="USDC">USDC</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="transferType" label="转账类型">
            <Select style={{ width: 150 }} placeholder="选择类型" allowClear>
              <Option value="hot_to_cold">热钱包→冷钱包</Option>
              <Option value="cold_to_hot">冷钱包→热钱包</Option>
              <Option value="hot_to_hot">热钱包→热钱包</Option>
              <Option value="cold_to_cold">冷钱包→冷钱包</Option>
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
              <Button onClick={() => searchForm.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 内部转账记录列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={transfers}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>
    </div>
  )
}

export default InternalTransferPage 