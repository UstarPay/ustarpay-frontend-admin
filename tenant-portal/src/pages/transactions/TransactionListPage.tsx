import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Input,
  Select,
  DatePicker,
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
      (typeFilter === 'collection' && transaction.type === 'collection')
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7fb_0%,#eef4f9_42%,#f8fafc_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-[1680px] space-y-6">
        <section className="overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,#111827_0%,#16324f_42%,#0f766e_100%)] text-white shadow-[0_30px_80px_rgba(15,23,42,0.20)]">
          <div className="relative px-6 py-7 md:px-8 md:py-8">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.18),rgba(15,118,110,0))]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.04)_100%)]" />
            <div className="relative flex flex-col gap-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-emerald-100">
                    <TransactionOutlined />
                    General Ledger
                  </div>
                  <Title level={1} className="!mb-2 !mt-4 !text-[40px] !font-semibold !tracking-tight !text-[#fffaf2]">
                    交易记录
                  </Title>
                  <Text className="block max-w-2xl text-[15px] leading-7 !text-slate-300">
                    统一查看充值、提现、转账、归集与内部转账明细，按状态、类型、币种和时间区间快速追踪资金流向。
                  </Text>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
                  <div className="rounded-[24px] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur-sm">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">账务总额</div>
                    <div className="mt-3 text-[34px] font-semibold tracking-tight text-white">{stats.totalAmount}</div>
                    <div className="mt-2 text-xs text-slate-300">累计交易金额（USD）</div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/15 px-5 py-5">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">当期状态</div>
                    <div className="mt-4 space-y-2">
                      {[
                        { label: '已完成', value: stats.completedCount, tone: 'text-emerald-200' },
                        { label: '处理中', value: stats.pendingCount, tone: 'text-amber-200' },
                        { label: '失败', value: stats.failedCount, tone: 'text-rose-200' }
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/6 px-4 py-3">
                          <span className="text-sm text-slate-200">{item.label}</span>
                          <span className={`text-lg font-semibold ${item.tone}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: '总交易数', value: stats.totalTransactions, helper: '累计笔数', tone: 'bg-white/8 text-white' },
                  { label: '今日交易', value: stats.todayTransactions, helper: '当日新增', tone: 'bg-emerald-400/15 text-emerald-100' },
                  { label: '处理中', value: stats.pendingCount, helper: '待确认 / 执行中', tone: 'bg-amber-400/15 text-amber-100' },
                  { label: '已完成', value: stats.completedCount, helper: '已入账 / 已结算', tone: 'bg-sky-400/15 text-sky-100' },
                  { label: '失败笔数', value: stats.failedCount, helper: '异常待排查', tone: 'bg-rose-400/15 text-rose-100' }
                ].map(item => (
                  <div key={item.label} className={`rounded-[22px] px-4 py-4 ${item.tone}`}>
                    <div className="text-[11px] uppercase tracking-[0.22em] opacity-80">{item.label}</div>
                    <div className="mt-3 break-all text-[28px] font-semibold leading-none">{item.value}</div>
                    <div className="mt-2 text-xs opacity-80">{item.helper}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[30px] border border-[#dce7f3] bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_52%,#eef6ff_100%)] shadow-[0_16px_38px_rgba(21,40,67,0.05)]">
          <div className="border-b border-[#dde7f2] px-6 py-5 md:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Journal Filters</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">筛选面板</div>
                <div className="mt-2 text-sm text-slate-500">
                  已筛选结果 {filteredTransactions.length} 条，当前类型 {typeFilter === 'all' ? '全部类型' : getTypeText(typeFilter)}，当前状态 {statusFilter === 'all' ? '全部状态' : getStatusText(statusFilter)}。
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={loadTransactionData}
                  loading={loading}
                  className="!h-11 !rounded-full !border-0 !bg-[#16324f] !px-5 !shadow-none"
                >
                  刷新
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    console.log('导出交易记录')
                  }}
                  className="!h-11 !rounded-full !border-[#d8e4f0] !bg-white !px-5 !text-slate-700"
                >
                  导出
                </Button>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 md:px-8">
            <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_1fr]">
              <Search
                placeholder="搜索交易ID、钱包名称或交易哈希"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
              />
              <Select placeholder="交易类型" value={typeFilter} onChange={setTypeFilter} style={{ width: '100%' }}>
                <Option value="all">全部类型</Option>
                <Option value="deposit">充值</Option>
                <Option value="withdraw">提现</Option>
                <Option value="transfer">转账</Option>
                <Option value="collect">归集</Option>
                <Option value="internal">内部转账</Option>
              </Select>
              <Select placeholder="交易状态" value={statusFilter} onChange={setStatusFilter} style={{ width: '100%' }}>
                <Option value="all">全部状态</Option>
                <Option value="pending">处理中</Option>
                <Option value="completed">已完成</Option>
                <Option value="failed">失败</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
              <Select placeholder="币种" value={symbolFilter} onChange={setSymbolFilter} style={{ width: '100%' }}>
                <Option value="all">全部币种</Option>
                <Option value="BTC">Bitcoin</Option>
                <Option value="ETH">Ethereum</Option>
                <Option value="USDT">USDT</Option>
                <Option value="USDC">USDC</Option>
                <Option value="BNB">BNB</Option>
              </Select>
              <RangePicker
                placeholder={['开始时间', '结束时间']}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </section>

        <Card
          bordered={false}
          className="min-w-0 rounded-[30px] border border-[#d9e2ee] bg-white/94 shadow-[0_16px_38px_rgba(21,40,67,0.05)]"
          bodyStyle={{ padding: 0 }}
          title={
            <div className="px-1 py-1">
              <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Ledger Table</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">交易清单</div>
            </div>
          }
          extra={
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              {filteredTransactions.length} 条结果
            </div>
          }
        >
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="grid gap-3 md:grid-cols-4">
              {[
                { label: '搜索范围', value: 'ID / 钱包 / 哈希' },
                { label: '时间窗口', value: dateRange ? '已选择区间' : '全部时间' },
                { label: '状态分布', value: `完成 ${stats.completedCount} / 失败 ${stats.failedCount}` },
                { label: '币种过滤', value: symbolFilter === 'all' ? '全部币种' : symbolFilter }
              ].map(item => (
                <div key={item.label} className="rounded-[18px] bg-slate-50 px-4 py-3">
                  <div className="text-xs text-slate-400">{item.label}</div>
                  <div className="mt-1 text-sm font-medium text-slate-800">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full max-w-full overflow-x-auto">
            <Table
              style={{ minWidth: 1500 }}
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
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TransactionListPage 
