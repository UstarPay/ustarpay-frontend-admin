import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Input,
  Select,
  DatePicker,
  Statistic,
  Tooltip
} from 'antd'
import { 
  TransactionOutlined, 
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { transactionService } from '@/services'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

interface TransactionItem {
  id: string
  type: 'deposit' | 'withdrawal' | 'transfer' | 'collection' | 'internal'
  amount: string
  symbol: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  fromAddress?: string
  toAddress?: string
  txHash?: string
  blockNumber?: number
  fee?: string
  createdAt: string
  updatedAt: string
  walletId: string
  walletName: string
}

interface TransactionStats {
  totalTransactions: number
  todayTransactions: number
  totalAmount: string
  pendingCount: number
  completedCount: number
  failedCount: number
}

const TransactionListPage: React.FC = () => {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    todayTransactions: 0,
    totalAmount: '0',
    pendingCount: 0,
    completedCount: 0,
    failedCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [symbolFilter, setSymbolFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  useEffect(() => {
    loadTransactionData()
  }, [])

  const mapNumericStatus = (status: number): TransactionItem['status'] => {
    switch (status) {
      case 0: return 'pending'
      case 1: case 3: return 'completed'
      case 2: case 4: return 'failed'
      case 5: return 'cancelled'
      default: return 'pending'
    }
  }

  const loadTransactionData = async () => {
    try {
      setLoading(true)
      const transactionsRes = await transactionService.getTransactions()

      const resData = transactionsRes.data as any
      const txList: any[] = resData?.transactions || []
      const pagination = resData?.pagination || {}

      const mapped = txList.map((tx: any) => ({
        id: tx.id,
        type: (tx.tx_type || tx.type) as any,
        amount: tx.amount,
        symbol: tx.symbol || tx.currency || '',
        status: typeof tx.status === 'number' ? mapNumericStatus(tx.status) : tx.status,
        fromAddress: tx.from_address || tx.fromAddress,
        toAddress: tx.to_address || tx.toAddress,
        txHash: tx.tx_hash || tx.hash,
        blockNumber: tx.block_height || tx.blockHeight,
        fee: tx.block_fee || tx.fee,
        createdAt: tx.created_at || tx.createdAt,
        updatedAt: tx.updated_at || tx.updatedAt,
        walletId: tx.wallet_id || tx.walletId || '',
        walletName: tx.wallet_name || tx.walletName || ''
      }))
      setTransactions(mapped)

      const today = dayjs().format('YYYY-MM-DD')
      const todayTx = mapped.filter(tx => dayjs(tx.createdAt).format('YYYY-MM-DD') === today)
      const totalAmount = mapped.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0)
      const pendingCount = mapped.filter(tx => tx.status === 'pending').length

      setStats({
        totalTransactions: pagination.total || mapped.length,
        todayTransactions: todayTx.length,
        totalAmount: totalAmount.toFixed(2),
        pendingCount,
        completedCount: mapped.filter(tx => tx.status === 'completed').length,
        failedCount: mapped.filter(tx => tx.status === 'failed').length
      })
    } catch (error) {
      console.error('加载交易数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'green'
      case 'withdrawal':
      case 'withdraw': return 'red'
      case 'transfer': return 'blue'
      case 'collection':
      case 'collect': return 'orange'
      case 'internal': return 'purple'
      default: return 'default'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'deposit': return '充值'
      case 'withdrawal':
      case 'withdraw': return '提现'
      case 'transfer': return '转账'
      case 'collection':
      case 'collect': return '归集'
      case 'internal': return '内部转账'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'processing'
      case 'failed': return 'error'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'pending': return '处理中'
      case 'failed': return '失败'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  const getSymbolColor = (symbol: string) => {
    const symbolColors: Record<string, string> = {
      'BTC': 'orange',
      'ETH': 'blue',
      'USDT': 'green',
      'USDC': 'cyan',
      'BNB': 'yellow'
    }
    return symbolColors[symbol] || 'default'
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchText.toLowerCase()) ||
                         transaction.walletName.toLowerCase().includes(searchText.toLowerCase()) ||
                         (transaction.txHash && transaction.txHash.toLowerCase().includes(searchText.toLowerCase()))
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter ||
      (typeFilter === 'collect' && (transaction.type === 'collect' || transaction.type === 'collection'))
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
    const matchesSymbol = symbolFilter === 'all' || transaction.symbol === symbolFilter
    const matchesDate = !dateRange || (
      dayjs(transaction.createdAt).isAfter(dateRange[0]) && 
      dayjs(transaction.createdAt).isBefore(dateRange[1])
    )
    
    return matchesSearch && matchesType && matchesStatus && matchesSymbol && matchesDate
  })

  const columns = [
    {
      title: '交易ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text code>{id.slice(0, 8)}...</Text>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>
          {getTypeText(type)}
        </Tag>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string, record: TransactionItem) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {parseFloat(amount).toFixed(6)} {record.symbol.toUpperCase()}
          </Text>
          {record.fee && parseFloat(record.fee) > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              手续费: {parseFloat(record.fee).toFixed(6)}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '发送地址',
      dataIndex: 'fromAddress',
      key: 'fromAddress',
      ellipsis: true,
      render: (addr: string) => addr ? (
        <Tooltip title={addr}>
          <Text code style={{ fontSize: 12 }}>{addr.slice(0, 6)}...{addr.slice(-4)}</Text>
        </Tooltip>
      ) : <Text type="secondary">-</Text>
    },
    {
      title: '接收地址',
      dataIndex: 'toAddress',
      key: 'toAddress',
      ellipsis: true,
      render: (addr: string) => addr ? (
        <Tooltip title={addr}>
          <Text code style={{ fontSize: 12 }}>{addr.slice(0, 6)}...{addr.slice(-4)}</Text>
        </Tooltip>
      ) : <Text type="secondary">-</Text>
    },
    {
      title: '币种',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string) => (
        <Tag color={getSymbolColor(symbol)}>
          {symbol.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '交易哈希',
      dataIndex: 'txHash',
      key: 'txHash',
      ellipsis: true,
      render: (hash: string) => (
        hash ? (
          <Tooltip title={hash}>
            <Text code style={{ cursor: 'pointer', fontSize: 12 }}>
              {hash.slice(0, 6)}...{hash.slice(-4)}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: TransactionItem) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/transactions/${record.id}`)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>交易记录</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadTransactionData}
            loading={loading}
          >
            刷新
          </Button>
          <Button 
            icon={<DownloadOutlined />}
            onClick={() => {
              // 导出功能
              console.log('导出交易记录')
            }}
          >
            导出
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总交易数"
              value={stats.totalTransactions}
              prefix={<TransactionOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日交易"
              value={stats.todayTransactions}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总金额"
              value={stats.totalAmount}
              valueStyle={{ color: '#722ed1' }}
              suffix="USD"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="处理中"
              value={stats.pendingCount}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选器 */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <Search
              placeholder="搜索交易ID、钱包名称或交易哈希"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="交易类型"
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部类型</Option>
              <Option value="deposit">充值</Option>
              <Option value="withdraw">提现</Option>
              <Option value="transfer">转账</Option>
              <Option value="collect">归集</Option>
              <Option value="internal">内部转账</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="交易状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">处理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="failed">失败</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="币种"
              value={symbolFilter}
              onChange={setSymbolFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部币种</Option>
              <Option value="BTC">Bitcoin</Option>
              <Option value="ETH">Ethereum</Option>
              <Option value="USDT">USDT</Option>
              <Option value="USDC">USDC</Option>
              <Option value="BNB">BNB</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <RangePicker
              placeholder={['开始时间', '结束时间']}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 交易列表 */}
      <Card title={`交易记录 (${filteredTransactions.length})`}>
        <Table
          columns={columns}
          dataSource={filteredTransactions}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 1500 }}
        />
      </Card>
    </div>
  )
}

export default TransactionListPage 