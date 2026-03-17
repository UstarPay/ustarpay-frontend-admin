import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
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
  Form,
  Tooltip,
  Modal,
  InputNumber,
  message
} from 'antd'
import {
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  CopyOutlined,
  WalletOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { withdrawalService, currencyService } from '@/services'
import type { Currency } from '@shared/types/currency'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { TextArea } = Input

const STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '待审核', color: 'gold' },
  1: { text: '审核成功', color: 'blue' },
  2: { text: '审核失败', color: 'red' },
  3: { text: '交易成功', color: 'green' },
  4: { text: '交易失败', color: 'red' },
  5: { text: '已取消', color: 'default' },
  6: { text: '广播处理中', color: 'processing' }
}

const CHAIN_ADDRESS_REGEX: Record<string, RegExp> = {
  ETH: /^0x[0-9a-fA-F]{40}$/,
  BSC: /^0x[0-9a-fA-F]{40}$/,
  TRX: /^T[A-Za-z0-9]{33}$/,
  TRON: /^T[A-Za-z0-9]{33}$/
}

function validateAddress(chainCode: string, address: string): string | null {
  if (!address?.trim()) return '请输入提现地址'
  const code = chainCode?.toUpperCase() || ''
  const re = CHAIN_ADDRESS_REGEX[code] || CHAIN_ADDRESS_REGEX.ETH
  return re.test(address.trim()) ? null : `当前链(${chainCode})地址格式不正确`
}

interface WithdrawalRecord {
  id: string
  userId?: string
  chainCode: string
  symbol: string
  address: string
  amount: string
  withdrawFee: string
  netAmount: string
  status: number
  transactionStatus?: number | null
  txHash?: string
  failureReason?: string
  fromAddress?: string
  blockFee?: string
  note?: string
  businessId?: string
  applicantUserName?: string
  applicantEmail?: string
  applicantPhone?: string
  isFrozenPending?: boolean
  isBroadcastProcessing?: boolean
  requestedAt: string
  processedAt?: string
  completedAt?: string
  webhookSent?: boolean
  webhookSentAt?: string
}

function normalizeRecord(raw: any): WithdrawalRecord {
  const txStatus = raw.transactionStatus ?? raw.transaction_status
  return {
    id: raw.id,
    userId: raw.userId ?? raw.user_id,
    chainCode: raw.chainCode ?? raw.chain_code ?? '',
    symbol: raw.symbol ?? '',
    address: raw.address ?? '',
    amount: raw.amount ?? '0',
    withdrawFee: raw.withdrawFee ?? raw.withdraw_fee ?? '0',
    netAmount: raw.netAmount ?? raw.net_amount ?? '0',
    status: typeof raw.status === 'number' ? raw.status : parseInt(raw.status, 10) || 0,
    transactionStatus: txStatus != null ? (typeof txStatus === 'number' ? txStatus : parseInt(txStatus, 10)) : null,
    txHash: raw.txHash ?? raw.tx_hash,
    failureReason: raw.failureReason ?? raw.failure_reason,
    fromAddress: raw.fromAddress ?? raw.from_address,
    blockFee: raw.blockFee ?? raw.block_fee,
    note: raw.note ?? raw.memo,
    businessId: raw.businessId ?? raw.business_id,
    applicantUserName: raw.applicantUserName ?? raw.applicant_user_name,
    applicantEmail: raw.applicantEmail ?? raw.applicant_email,
    applicantPhone: raw.applicantPhone ?? raw.applicant_phone,
    isFrozenPending: raw.isFrozenPending ?? raw.is_frozen_pending,
    isBroadcastProcessing: raw.isBroadcastProcessing ?? raw.is_broadcast_processing,
    requestedAt: raw.requestedAt ?? raw.requested_at ?? raw.createdAt ?? raw.created_at ?? '',
    processedAt: raw.processedAt ?? raw.processed_at,
    completedAt: raw.completedAt ?? raw.completed_at,
    webhookSent: raw.webhookSent ?? raw.webhook_sent,
    webhookSentAt: raw.webhookSentAt ?? raw.webhook_sent_at
  }
}

const WithdrawalListPage: React.FC = () => {
  const [form] = Form.useForm()
  const [reviewForm] = Form.useForm()
  const [chains, setChains] = useState<{ chainCode: string; label: string }[]>([])
  const [symbols, setSymbols] = useState<Currency[]>([])
  const [availableBalance, setAvailableBalance] = useState<string | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [withdrawFee, setWithdrawFee] = useState<string>('0')
  const [feeLoading, setFeeLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [chainFilter, setChainFilter] = useState<string>('all')
  const [symbolFilter, setSymbolFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [searchText, setSearchText] = useState('')
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [applyModalVisible, setApplyModalVisible] = useState(false)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [detailRecord, setDetailRecord] = useState<WithdrawalRecord | null>(null)
  const [reviewRecord, setReviewRecord] = useState<WithdrawalRecord | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })

  const selectedChain = Form.useWatch('chain_code', form)
  const selectedSymbol = Form.useWatch('symbol', form)
  const amount = Form.useWatch('amount', form)

  const loadChains = useCallback(async () => {
    try {
      const res = await currencyService.getActiveCurrencies()
      const list = (res?.data ?? res ?? []) as Currency[]
      const map = new Map<string, string>()
      list.forEach((c: Currency) => {
        const code = c.chainCode ?? (c as any).chain_code ?? ''
        if (code && !map.has(code)) map.set(code, code)
      })
      setChains(Array.from(map.entries()).map(([k]) => ({ chainCode: k, label: k })))
    } catch {
      setChains([
        { chainCode: 'ETH', label: 'Ethereum' },
        { chainCode: 'BSC', label: 'BSC' },
        { chainCode: 'TRX', label: 'TRON' }
      ])
    }
  }, [])

  useEffect(() => {
    loadChains()
  }, [loadChains])

  useEffect(() => {
    if (!selectedChain) {
      setSymbols([])
      form.setFieldValue('symbol', undefined)
      setAvailableBalance(null)
      setWithdrawFee('0')
      return
    }
    let cancelled = false
    currencyService.getCurrenciesByChain(selectedChain).then((res) => {
      if (cancelled) return
      const list = (res?.data ?? res ?? []) as Currency[]
      setSymbols(list)
      form.setFieldValue('symbol', undefined)
      setAvailableBalance(null)
      setWithdrawFee('0')
    }).catch(() => setSymbols([]))
    return () => { cancelled = true }
  }, [selectedChain, form])

  useEffect(() => {
    if (!selectedChain || !selectedSymbol) {
      setAvailableBalance(null)
      return
    }
    let cancelled = false
    setBalanceLoading(true)
    withdrawalService.getAvailableBalance({
      chain_code: selectedChain,
      symbol: selectedSymbol
    }).then((res) => {
      if (cancelled) return
      const data = res?.data ?? res
      setAvailableBalance(data?.balance ?? null)
    }).catch(() => setAvailableBalance(null)).finally(() => {
      if (!cancelled) setBalanceLoading(false)
    })
    return () => { cancelled = true }
  }, [selectedChain, selectedSymbol])

  useEffect(() => {
    const amt = amount != null && amount > 0 ? String(amount) : ''
    if (!selectedChain || !selectedSymbol || !amt) {
      setWithdrawFee('0')
      return
    }
    let cancelled = false
    setFeeLoading(true)
    withdrawalService.estimateWithdrawalFee({
      chain_code: selectedChain,
      symbol: selectedSymbol,
      amount: amt
    }).then((res) => {
      if (cancelled) return
      const data = res?.data ?? res
      const fee = (data?.fee ?? data?.totalFee ?? (data as any)?.total_fee ?? '0') as string
      setWithdrawFee(String(fee))
    }).catch(() => setWithdrawFee('0')).finally(() => {
      if (!cancelled) setFeeLoading(false)
    })
    return () => { cancelled = true }
  }, [selectedChain, selectedSymbol, amount])

  const loadList = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        include_transaction_status: 'true'
      }
      if (statusFilter !== 'all') params.status = statusFilter
      if (chainFilter !== 'all') params.chain_code = chainFilter
      if (symbolFilter !== 'all') params.symbol = symbolFilter
      if (searchText) params.search = searchText
      if (dateRange?.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD')
      }
      const res = await withdrawalService.getWithdrawals(params)
      const data = res?.data ?? res
      const items = (data?.items ?? []).map(normalizeRecord)
      const total = data?.total ?? items.length
      setWithdrawals(items)
      setPagination(prev => ({ ...prev, total }))
    } catch (e) {
      console.error('加载提现记录失败:', e)
      setWithdrawals([])
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, statusFilter, chainFilter, symbolFilter, searchText, dateRange])

  useEffect(() => {
    loadList()
  }, [loadList])

  const netAmount = (amount != null && amount > 0 && withdrawFee !== null)
    ? Math.max(0, Number(amount) - Number(withdrawFee)).toFixed(8).replace(/\.?0+$/, '')
    : '0'

  const pendingCount = withdrawals.filter(item => item.status === 0).length
  const processingCount = withdrawals.filter(item => item.status === 1 || item.status === 6 || (item.status === 3 && item.transactionStatus === 0)).length
  const frozenPendingCount = withdrawals.filter(item => item.isFrozenPending || item.status === 0).length
  const successAmount = withdrawals
    .filter(item => item.status === 3 && item.transactionStatus !== 0)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    .toFixed(2)

  const resetWithdrawForm = () => {
    form.resetFields()
    setWithdrawFee('0')
    setAvailableBalance(null)
  }

  const openApplyModal = () => {
    resetWithdrawForm()
    setApplyModalVisible(true)
  }

  const closeApplyModal = () => {
    setApplyModalVisible(false)
    resetWithdrawForm()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const chainCode = values.chain_code
      const address = (values.address ?? '').trim()
      const err = validateAddress(chainCode, address)
      if (err) {
        form.setFields([{ name: 'address', errors: [err] }])
        return
      }
      const amt = Number(values.amount)
      const balance = availableBalance != null ? Number(availableBalance) : null
      if (balance != null && amt > balance) {
        message.error('提现金额不能超过可用余额')
        return
      }
      if (amt <= 0) {
        message.error('提现金额必须大于 0')
        return
      }
      setSubmitLoading(true)
      await withdrawalService.createWithdrawal({
        address,
        chainCode,
        symbol: values.symbol,
        amount: String(amt),
        memo: values.note ? String(values.note).slice(0, 255) : undefined
      })
      message.success('提交成功')
      closeApplyModal()
      loadList()
    } catch (e: any) {
      const msg = e?.message || '提交失败'
      message.error(msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  const openReviewModal = (record: WithdrawalRecord) => {
    setReviewRecord(record)
    reviewForm.resetFields()
    setReviewModalVisible(true)
  }

  const closeReviewModal = () => {
    setReviewModalVisible(false)
    setReviewRecord(null)
    reviewForm.resetFields()
  }

  const submitReview = async (status: 1 | 2) => {
    if (!reviewRecord) return
    try {
      if (status === 2) {
        await reviewForm.validateFields()
      }
      const reason = reviewForm.getFieldValue('failure_reason')
      setReviewLoading(true)
      await withdrawalService.updateWithdrawalStatus(reviewRecord.id, {
        status,
        failure_reason: status === 2 ? reason : undefined
      })
      message.success(status === 1 ? '审核已通过' : '已驳回该提现申请')
      closeReviewModal()
      if (detailRecord?.id === reviewRecord.id) {
        setDetailModalVisible(false)
        setDetailRecord(null)
      }
      loadList()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error(e?.message || '审核失败')
    } finally {
      setReviewLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => message.success('已复制'))
  }

  const handleExport = async () => {
    try {
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (chainFilter !== 'all') params.chain_code = chainFilter
      if (symbolFilter !== 'all') params.symbol = symbolFilter
      if (dateRange?.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD')
      }
      if (searchText) params.search = searchText
      await withdrawalService.exportWithdrawals(params)
      message.success('导出已触发')
    } catch (e: any) {
      message.error(e?.message || '导出失败')
    }
  }

  const renderAccountSummary = (record: WithdrawalRecord) => {
    const primary = record.applicantUserName || record.applicantEmail || record.applicantPhone || record.userId || '-'
    const secondary = [record.applicantEmail, record.applicantPhone].filter(Boolean).join(' / ')

    return (
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">{primary}</div>
        <div className="truncate text-xs text-slate-500">{secondary || '未绑定邮箱或手机号'}</div>
      </div>
    )
  }

  const columns = [
    {
      title: '申请时间',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      width: 160,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '链/币种',
      key: 'chainSymbol',
      width: 120,
      render: (_: any, r: WithdrawalRecord) => `${r.chainCode}/${r.symbol}`
    },
    {
      title: '申请人账户',
      key: 'applicantAccount',
      width: 220,
      render: (_: any, record: WithdrawalRecord) => renderAccountSummary(record)
    },
    {
      title: '接收地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (v: string) => (
        <Space>
          <Tooltip title={v}>
            <Text code style={{ fontSize: 12 }}>{v ? `${v.slice(0, 6)}...${v.slice(-4)}` : '-'}</Text>
          </Tooltip>
          {v && <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(v)} />}
        </Space>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: string, r: WithdrawalRecord) => `${v} ${r.symbol}`
    },
    {
      title: '手续费',
      dataIndex: 'withdrawFee',
      key: 'withdrawFee',
      width: 100,
      render: (v: string, r: WithdrawalRecord) => `${v} ${r.symbol}`
    },
    {
      title: '净得金额',
      dataIndex: 'netAmount',
      key: 'netAmount',
      width: 120,
      render: (v: string, r: WithdrawalRecord) => `${v} ${r.symbol}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: number, record: WithdrawalRecord) => {
        if (record.isFrozenPending) {
          return <Tag color="gold">待审核</Tag>
        }
        if (record.isBroadcastProcessing || status === 6) {
          return <Tag color="processing">广播处理中</Tag>
        }
        if (status === 3 && record.transactionStatus === 0) {
          return <Tag color="processing">区块确认中</Tag>
        }
        const { text, color } = STATUS_MAP[status] ?? { text: String(status), color: 'default' }
        return <Tag color={color}>{text}</Tag>
      }
    },
    {
      title: '交易哈希',
      dataIndex: 'txHash',
      key: 'txHash',
      width: 140,
      render: (v: string) => {
        if (!v) return <Text type="secondary">--</Text>
        return (
          <Tooltip title={v}>
            <Text
              code
              style={{ fontSize: 12, cursor: 'pointer' }}
              onClick={() => window.open(`https://etherscan.io/tx/${v}`, '_blank')}
            >
              {v.slice(0, 8)}...{v.slice(-6)}
            </Text>
          </Tooltip>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: WithdrawalRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setDetailRecord(record); setDetailModalVisible(true) }}>
            详情
          </Button>
          {record.status === 0 && (
            <Button type="link" size="small" onClick={() => openReviewModal(record)}>
              审核
            </Button>
          )}
        </Space>
      )
    }
  ]

  const balanceNum = availableBalance != null ? Number(availableBalance) : null
  const amountNum = amount != null && amount > 0 ? Number(amount) : 0
  const isOverBalance = balanceNum != null && amountNum > balanceNum
  const balanceHint = selectedChain && selectedSymbol
    ? `${availableBalance ?? '0'} ${selectedSymbol}`
    : '请选择链和币种查看余额'

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fafc_34%,#f8fafc_100%)] p-6">
      <Card className="mb-6 overflow-hidden border-0 shadow-sm" bodyStyle={{ padding: 0 }}>
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_48%,#0ea5e9_100%)] px-6 py-7 text-white">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),transparent_68%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Text className="!mb-2 !block !text-xs !font-medium uppercase tracking-[0.24em] !text-sky-100">
                Withdraw Center
              </Text>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>发起提现与跟踪处理进度</Title>
              <Text className="!mt-3 !block !text-sm !leading-6 !text-sky-100">
                统一查看提现申请、记录列表、状态进度和链上信息，支持筛选、导出与详情查询。
              </Text>
            </div>
            <div className="flex flex-col gap-3 lg:min-w-[320px]">
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={openApplyModal}
                className="!h-12 !rounded-xl !border-0 !bg-white !px-5 !font-semibold !text-slate-900 shadow-lg shadow-slate-950/10 hover:!bg-slate-100"
              >
                提现申请
              </Button>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <div className="text-xs uppercase tracking-[0.2em] text-sky-100">当前可用余额</div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {balanceLoading ? '加载中...' : balanceHint}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-slate-950/20 p-4 backdrop-blur">
                  <div className="text-xs uppercase tracking-[0.2em] text-sky-100">列表记录数</div>
                  <div className="mt-2 text-xl font-semibold text-white">{pagination.total}</div>
                  <div className="mt-1 text-xs text-sky-100">当前筛选结果</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="border-0 shadow-sm shadow-slate-200/60">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">待审核</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{pendingCount}</div>
              <div className="mt-2 text-sm text-slate-500">等待人工处理的申请</div>
              <div className="mt-2 text-xs text-amber-600">其中冻结中 {frozenPendingCount} 笔</div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-500">
              <ClockCircleOutlined className="text-xl" />
            </div>
          </div>
        </Card>
        <Card className="border-0 shadow-sm shadow-slate-200/60">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">处理中</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{processingCount}</div>
              <div className="mt-2 text-sm text-slate-500">已审核、广播中或等待区块确认</div>
            </div>
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-500">
              <ThunderboltOutlined className="text-xl" />
            </div>
          </div>
        </Card>
        <Card className="border-0 shadow-sm shadow-slate-200/60">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">已成功金额</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{successAmount}</div>
              <div className="mt-2 text-sm text-slate-500">当前列表中成功出账总额</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-500">
              <CheckCircleOutlined className="text-xl" />
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={3} style={{ margin: 0 }}>提现工作台</Title>
          <Text type="secondary">提交申请、筛选记录与查看链上处理状态</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadList} loading={loading}>刷新</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport} loading={loading}>导出</Button>
        </Space>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-0 shadow-sm shadow-slate-200/60">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">筛选与搜索</div>
              <div className="mt-1 text-xs text-slate-500">组合条件快速收敛待处理申请、链上确认单和历史记录</div>
            </div>
            <Tag color="blue" className="rounded-full px-3 py-1">实时查询</Tag>
          </div>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} xl={8}>
              <Search
                placeholder="申请人 / 地址 / 交易哈希"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onSearch={() => setPagination(p => ({ ...p, page: 1 }))}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} xl={5}>
              <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPagination(p => ({ ...p, page: 1 })) }} style={{ width: '100%' }}>
                <Option value="all">全部状态</Option>
                <Option value="0">{STATUS_MAP[0]?.text}</Option>
                <Option value="1">{STATUS_MAP[1]?.text}</Option>
                <Option value="6">{STATUS_MAP[6]?.text}</Option>
                <Option value="3">区块确认中</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} xl={4}>
              <Select value={chainFilter} onChange={v => { setChainFilter(v); setPagination(p => ({ ...p, page: 1 })) }} style={{ width: '100%' }}>
                <Option value="all">全部链</Option>
                {chains.map(c => <Option key={c.chainCode} value={c.chainCode}>{c.label}</Option>)}
              </Select>
            </Col>
            <Col xs={24} sm={12} xl={4}>
              <Select value={symbolFilter} onChange={v => { setSymbolFilter(v); setPagination(p => ({ ...p, page: 1 })) }} style={{ width: '100%' }}>
                <Option value="all">全部币种</Option>
                <Option value="USDT">USDT</Option>
                <Option value="ETH">ETH</Option>
                <Option value="BTC">BTC</Option>
                <Option value="TRX">TRX</Option>
              </Select>
            </Col>
            <Col xs={24} xl={7}>
              <RangePicker
                value={dateRange}
                onChange={d => { setDateRange(d as [dayjs.Dayjs, dayjs.Dayjs]); setPagination(p => ({ ...p, page: 1 })) }}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </Card>

        <Card className="border-0 shadow-sm shadow-slate-200/60">
          <div className="text-sm font-semibold text-slate-900">提现规则</div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">地址限制</div>
              <div className="mt-2 text-sm font-medium text-slate-900">冷钱包地址不可作为出资方</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">系统会自动选择可用热提钱包，不需要手工填写出资方地址。</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">费用预估</div>
              <div className="mt-2 text-sm font-medium text-slate-900">链和币种选定后自动估算手续费</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">输入金额后会同步更新预计到账金额，便于复核最终出账。</div>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title={(
          <div>
            <div className="text-base font-semibold text-slate-900">提现记录</div>
            <div className="text-xs text-slate-500">共 {pagination.total} 条记录，支持查看申请人、手续费、哈希和处理结果</div>
          </div>
        )}
        className="border-0 shadow-sm shadow-slate-200/60"
      >
        <Table
          columns={columns}
          dataSource={withdrawals}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1280 }}
          rowClassName={() => 'hover:!bg-slate-50'}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t, range) => `第 ${range[0]}-${range[1]} 条，共 ${t} 条`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, page, pageSize: pageSize || 10 }))
          }}
        />
      </Card>

      <Modal
        title="提现申请"
        open={applyModalVisible}
        onCancel={closeApplyModal}
        onOk={() => form.submit()}
        okText="提交申请"
        confirmLoading={submitLoading}
        width={860}
        destroyOnClose
      >
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">可用余额</div>
            <div className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-900">
              <WalletOutlined className="text-sky-500" />
              <span className={isOverBalance ? 'text-rose-600' : ''}>
                {balanceLoading ? '加载中...' : balanceHint}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">预估手续费</div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {feeLoading ? '计算中...' : `${withdrawFee} ${selectedSymbol || ''}`}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">预计到账</div>
            <div className="mt-2 text-base font-semibold text-slate-900">{`${netAmount} ${selectedSymbol || ''}`}</div>
          </div>
        </div>

        <Alert
          type="info"
          showIcon
          className="mb-5 rounded-xl border border-sky-100"
          message="系统会自动选择热提钱包"
          description="出资方地址不需要手工填写。提交时会根据链、币种和系统配置自动匹配可用热钱包。"
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="chain_code" label="链" rules={[{ required: true, message: '请选择链' }]}>
                <Select placeholder="请选择链" showSearch optionFilterProp="label" optionLabelProp="label">
                  {chains.map(c => (
                    <Option key={c.chainCode} value={c.chainCode} label={c.label}>{c.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="symbol" label="币种" rules={[{ required: true, message: '请选择币种' }]}>
                <Select placeholder="请选择币种" showSearch optionFilterProp="label" disabled={!selectedChain}>
                  {symbols.map(s => (
                    <Option key={`${s.chainCode}-${s.symbol}`} value={s.symbol} label={`${s.symbol} (${s.name})`}>
                      {s.symbol} ({s.name})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Form.Item
                name="amount"
                label="提现金额"
                rules={[
                  { required: true, message: '请输入提现金额' },
                  () => ({
                    validator(_, value) {
                      if (value == null || value <= 0) return Promise.reject(new Error('金额须大于 0'))
                      if (balanceNum != null && value > balanceNum) return Promise.reject(new Error('不能超过可用余额'))
                      return Promise.resolve()
                    }
                  })
                ]}
              >
                <InputNumber min={0} step={0.01} placeholder="请输入提现金额" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="address"
                label="提现地址"
                rules={[
                  { required: true, message: '请输入提现地址' },
                  () => ({
                    validator(_, value) {
                      if (!value || !selectedChain) return Promise.resolve()
                      const err = validateAddress(selectedChain, value)
                      return err ? Promise.reject(new Error(err)) : Promise.resolve()
                    }
                  })
                ]}
              >
                <Input placeholder="请输入链上提现地址" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="note" label="备注">
                <TextArea rows={3} placeholder="可选，最多 255 字" maxLength={255} showCount />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="提现详情"
        open={detailModalVisible}
        onCancel={() => { setDetailModalVisible(false); setDetailRecord(null) }}
        footer={[
          <Button key="close" type="primary" onClick={() => { setDetailModalVisible(false); setDetailRecord(null) }}>
            关闭
          </Button>
        ]}
        width={760}
      >
        {detailRecord && (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_58%,#38bdf8_100%)] p-5 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-sky-100">Withdrawal Detail</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight">
                    {detailRecord.amount} {detailRecord.symbol}
                  </div>
                  <div className="mt-2 text-sm text-sky-100">
                    申请时间 {dayjs(detailRecord.requestedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  {detailRecord.isFrozenPending
                    ? <Tag color="gold" className="!m-0 rounded-full px-3 py-1">待审核</Tag>
                    : detailRecord.isBroadcastProcessing || detailRecord.status === 6
                    ? <Tag color="processing" className="!m-0 rounded-full px-3 py-1">广播处理中</Tag>
                    : detailRecord.status === 3 && detailRecord.transactionStatus === 0
                    ? <Tag color="processing" className="!m-0 rounded-full px-3 py-1">区块确认中</Tag>
                    : <Tag color={STATUS_MAP[detailRecord.status]?.color || 'default'} className="!m-0 rounded-full px-3 py-1">{STATUS_MAP[detailRecord.status]?.text ?? detailRecord.status}</Tag>}
                  <div className="mt-3 text-xs uppercase tracking-[0.18em] text-sky-100">链 / 币种</div>
                  <div className="mt-1 text-sm font-medium text-white">{detailRecord.chainCode} / {detailRecord.symbol}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">提现金额</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">{detailRecord.amount} {detailRecord.symbol}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">手续费</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">{detailRecord.withdrawFee} {detailRecord.symbol}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">净得金额</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">{detailRecord.netAmount} {detailRecord.symbol}</div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
                <div className="text-sm font-semibold text-slate-900">申请人信息</div>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">申请人</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{detailRecord.applicantUserName || detailRecord.userId || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">邮箱</div>
                    <div className="mt-1 break-all text-sm text-slate-600">{detailRecord.applicantEmail || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">手机号</div>
                    <div className="mt-1 text-sm text-slate-600">{detailRecord.applicantPhone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">业务单号</div>
                    <div className="mt-1 break-all text-sm text-slate-600">{detailRecord.businessId || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
                <div className="text-sm font-semibold text-slate-900">地址与链上信息</div>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">接收地址</div>
                    <div className="mt-1 break-all rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{detailRecord.address}</div>
                  </div>
                  {detailRecord.txHash && (
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">交易哈希</div>
                      <div className="mt-1 break-all rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{detailRecord.txHash}</div>
                    </div>
                  )}
                  {detailRecord.fromAddress && (
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">出资地址</div>
                      <div className="mt-1 break-all rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{detailRecord.fromAddress}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
              <div className="text-sm font-semibold text-slate-900">处理进度</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">审核时间</div>
                  <div className="mt-1 text-sm text-slate-700">
                    {detailRecord.processedAt ? dayjs(detailRecord.processedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">完成时间</div>
                  <div className="mt-1 text-sm text-slate-700">
                    {detailRecord.completedAt ? dayjs(detailRecord.completedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">区块手续费</div>
                  <div className="mt-1 text-sm text-slate-700">{detailRecord.blockFee ?? '-'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Webhook 发送</div>
                  <div className="mt-1 text-sm text-slate-700">
                    {detailRecord.webhookSent == null ? '-' : detailRecord.webhookSent ? '是' : '否'}
                    {detailRecord.webhookSentAt ? ` · ${dayjs(detailRecord.webhookSentAt).format('YYYY-MM-DD HH:mm:ss')}` : ''}
                  </div>
                </div>
              </div>
              {(detailRecord.failureReason || detailRecord.note) && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {detailRecord.failureReason && (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-rose-400">失败原因</div>
                      <div className="mt-2 text-sm leading-6 text-rose-700">{detailRecord.failureReason}</div>
                    </div>
                  )}
                  {detailRecord.note && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">备注</div>
                      <div className="mt-2 text-sm leading-6 text-slate-700">{detailRecord.note}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="审核提现申请"
        open={reviewModalVisible}
        onCancel={closeReviewModal}
        footer={[
          <Button key="close" onClick={closeReviewModal}>关闭</Button>,
          <Button key="reject" danger loading={reviewLoading} onClick={() => submitReview(2)}>驳回</Button>,
          <Button key="approve" type="primary" loading={reviewLoading} onClick={() => submitReview(1)}>审核通过</Button>
        ]}
        width={560}
        destroyOnClose
      >
        {reviewRecord && (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#111827_0%,#1d4ed8_62%,#38bdf8_100%)] p-5 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-sky-100">Review Request</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight">
                    {reviewRecord.amount} {reviewRecord.symbol}
                  </div>
                  <div className="mt-2 text-sm text-sky-100">
                    {reviewRecord.chainCode} / {reviewRecord.symbol} · {dayjs(reviewRecord.requestedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <Tag color="gold" className="!m-0 rounded-full px-3 py-1">待审核</Tag>
                  <div className="mt-3 text-xs uppercase tracking-[0.16em] text-sky-100">申请人</div>
                  <div className="mt-1 text-sm font-medium text-white">{reviewRecord.applicantUserName || reviewRecord.userId || '-'}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">提现金额</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">{reviewRecord.amount} {reviewRecord.symbol}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">手续费</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">{reviewRecord.withdrawFee} {reviewRecord.symbol}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">预计净额</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">{reviewRecord.netAmount} {reviewRecord.symbol}</div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
                <div className="text-sm font-semibold text-slate-900">提现地址</div>
                <div className="mt-3 break-all rounded-2xl bg-slate-50 px-4 py-3 font-mono text-xs leading-6 text-slate-700">
                  {reviewRecord.address}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">业务单号</div>
                    <div className="mt-1 break-all text-sm text-slate-700">{reviewRecord.businessId || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">申请备注</div>
                    <div className="mt-1 text-sm text-slate-700">{reviewRecord.note || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-semibold text-slate-900">审核动作</div>
                <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                    通过后，该申请会进入后续提现处理流程。
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2">
                    驳回时需填写原因，便于后续追踪和回查。
                  </div>
                </div>
              </div>
            </div>

            <Form form={reviewForm} layout="vertical">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
                <div className="mb-4 text-sm font-semibold text-slate-900">驳回说明</div>
                <Form.Item
                  name="failure_reason"
                  label="驳回原因"
                  rules={[{ required: true, message: '请输入驳回原因' }]}
                  className="!mb-0"
                >
                  <TextArea rows={4} placeholder="请输入审核驳回原因" maxLength={255} showCount />
                </Form.Item>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WithdrawalListPage
