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
  Switch,
  Empty,
  Popconfirm,
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
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  DeleteOutlined,
  DollarOutlined
} from '@ant-design/icons'
import { currencyService, withdrawalFeeConfigService, withdrawalRiskConfigService, withdrawalService } from '@/services'
import { TENANT_PERMISSION } from '@/constants/rbac'
import { useAuthStore } from '@/stores'
import type { Currency } from '@shared/types/currency'
import type { WithdrawalRiskConfig } from '@/services/withdrawalRiskConfigService'
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
  const [riskForm] = Form.useForm()
  const [feeForm] = Form.useForm()
  const [chains, setChains] = useState<{ chainCode: string; label: string }[]>([])
  const [allCurrencies, setAllCurrencies] = useState<Currency[]>([])
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
  const [riskModalVisible, setRiskModalVisible] = useState(false)
  const [feeModalVisible, setFeeModalVisible] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [riskConfigs, setRiskConfigs] = useState<WithdrawalRiskConfig[]>([])
  const [riskConfigLoading, setRiskConfigLoading] = useState(false)
  const [riskConfigSaving, setRiskConfigSaving] = useState(false)
  const [riskConfigDeleting, setRiskConfigDeleting] = useState(false)
  const [riskPairLoading, setRiskPairLoading] = useState(false)
  const [feePairLoading, setFeePairLoading] = useState(false)
  const [detailRecord, setDetailRecord] = useState<WithdrawalRecord | null>(null)
  const [reviewRecord, setReviewRecord] = useState<WithdrawalRecord | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })
  const permissions = useAuthStore(state => state.permissions)

  const selectedChain = Form.useWatch('chain_code', form)
  const selectedSymbol = Form.useWatch('symbol', form)
  const amount = Form.useWatch('amount', form)
  const selectedRiskChain = Form.useWatch('chainCode', riskForm)
  const selectedRiskSymbol = Form.useWatch('symbol', riskForm)
  const selectedRiskRequireApproval = Form.useWatch('requireApproval', riskForm)
  const selectedRiskMinWithdraw = Form.useWatch('minWithdraw', riskForm)
  const selectedRiskSingleLimit = Form.useWatch('singleLimit', riskForm)
  const selectedRiskDailyLimit = Form.useWatch('dailyLimit', riskForm)
  const selectedRiskDailyTxCountLimit = Form.useWatch('dailyTxCountLimit', riskForm)
  const selectedRiskKYCCooldownHours = Form.useWatch('kycCooldownHours', riskForm)
  const selectedRiskUserFrequencyLimitMins = Form.useWatch('userFrequencyLimitMins', riskForm)
  const selectedFeeChain = Form.useWatch('chainCode', feeForm)
  const selectedFeeSymbol = Form.useWatch('symbol', feeForm)
  const selectedFeeMode = Form.useWatch('feeMode', feeForm)
  const selectedFeeFixedFee = Form.useWatch('fixedFee', feeForm)
  const selectedFeeRate = Form.useWatch('feeRate', feeForm)
  const selectedFeeMinFee = Form.useWatch('minFee', feeForm)
  const selectedFeeMaxFee = Form.useWatch('maxFee', feeForm)
  const selectedFeeDeductMode = Form.useWatch('feeDeductMode', feeForm)
  const canViewRiskConfig = permissions.includes(TENANT_PERMISSION.WITHDRAWAL_RISK_VIEW) || permissions.includes(TENANT_PERMISSION.WITHDRAWAL_RISK_MANAGE)
  const canManageRiskConfig = permissions.includes(TENANT_PERMISSION.WITHDRAWAL_RISK_MANAGE)
  const canViewFeeConfig = canViewRiskConfig
  const canManageFeeConfig = canManageRiskConfig

  const riskSymbolOptions = Array.from(
    new Map(
      allCurrencies
        .filter(item => !selectedRiskChain || item.chainCode === selectedRiskChain)
        .map(item => [item.symbol, { value: item.symbol, label: item.symbol }])
    ).values()
  )
  const configuredRiskPairs = new Set(riskConfigs.map(item => `${item.chainCode}::${item.symbol}`))
  const unconfiguredRiskCurrencies = allCurrencies.filter(item => !configuredRiskPairs.has(`${item.chainCode}::${item.symbol}`))
  const configuredFeePairs = new Set(
    riskConfigs
      .filter(item => Number(item.feeMode ?? 0) > 0 || Number(item.fixedFee ?? 0) > 0 || Number(item.feeRate ?? 0) > 0 || Number(item.minFee ?? 0) > 0 || Number(item.maxFee ?? 0) > 0)
      .map(item => `${item.chainCode}::${item.symbol}`)
  )
  const unconfiguredFeeCurrencies = allCurrencies.filter(item => !configuredFeePairs.has(`${item.chainCode}::${item.symbol}`))

  const currentRiskConfig = selectedRiskChain && selectedRiskSymbol
    ? riskConfigs.find(item => item.chainCode === selectedRiskChain && item.symbol === selectedRiskSymbol) ?? null
    : null
  const currentFeeConfig = selectedFeeChain && selectedFeeSymbol
    ? riskConfigs.find(item => item.chainCode === selectedFeeChain && item.symbol === selectedFeeSymbol) ?? null
    : null
  const currentRiskCurrency = selectedRiskChain && selectedRiskSymbol
    ? allCurrencies.find(item => item.chainCode === selectedRiskChain && item.symbol === selectedRiskSymbol) ?? null
    : null
  const currentFeeCurrency = selectedFeeChain && selectedFeeSymbol
    ? allCurrencies.find(item => item.chainCode === selectedFeeChain && item.symbol === selectedFeeSymbol) ?? null
    : null
  const previewRequireApproval = selectedRiskRequireApproval ?? currentRiskConfig?.requireApproval ?? false
  const previewMinWithdraw = selectedRiskMinWithdraw ?? currentRiskConfig?.minWithdraw ?? currentRiskCurrency?.minWithdraw ?? null
  const previewSingleLimit = selectedRiskSingleLimit ?? (currentRiskConfig ? Number(currentRiskConfig.singleLimit) || null : null)
  const previewDailyLimit = selectedRiskDailyLimit ?? (currentRiskConfig ? Number(currentRiskConfig.dailyLimit) || null : null)
  const previewDailyTxCountLimit = selectedRiskDailyTxCountLimit ?? currentRiskConfig?.dailyTxCountLimit ?? 0
  const previewKYCCooldownHours = selectedRiskKYCCooldownHours ?? currentRiskConfig?.kycCooldownHours ?? 0
  const previewUserFrequencyLimitMins = selectedRiskUserFrequencyLimitMins ?? currentRiskConfig?.userFrequencyLimitMins ?? 0
  const previewFeeMode = selectedFeeMode ?? currentFeeConfig?.feeMode ?? 0
  const previewFixedFee = selectedFeeFixedFee ?? (currentFeeConfig ? Number(currentFeeConfig.fixedFee ?? 0) : 0)
  const previewFeeRate = selectedFeeRate ?? (currentFeeConfig ? Number(currentFeeConfig.feeRate ?? 0) : 0)
  const previewMinFee = selectedFeeMinFee ?? (currentFeeConfig ? Number(currentFeeConfig.minFee ?? 0) : 0)
  const previewMaxFee = selectedFeeMaxFee ?? (currentFeeConfig ? Number(currentFeeConfig.maxFee ?? 0) : 0)
  const previewFeeDeductMode = selectedFeeDeductMode ?? currentFeeConfig?.feeDeductMode ?? 1
  const hasExplicitFeeConfig = !!currentFeeConfig && Number(currentFeeConfig.feeMode ?? 0) > 0
  const shouldShowFixedFeeFields = previewFeeMode === 1 || previewFeeMode === 3
  const shouldShowRateFeeFields = previewFeeMode === 2 || previewFeeMode === 3
  const shouldShowFeeBoundFields = previewFeeMode === 1 || previewFeeMode === 2 || previewFeeMode === 3
  const feeSymbolOptions = Array.from(
    new Map(
      allCurrencies
        .filter(item => !selectedFeeChain || item.chainCode === selectedFeeChain)
        .map(item => [item.symbol, { value: item.symbol, label: item.symbol }])
    ).values()
  )

  const loadChains = useCallback(async () => {
    try {
      const res = await currencyService.getActiveCurrencies()
      const list = (res?.data ?? res ?? []) as Currency[]
      setAllCurrencies(list)
      const map = new Map<string, string>()
      list.forEach((c: Currency) => {
        const code = c.chainCode ?? (c as any).chain_code ?? ''
        if (code && !map.has(code)) map.set(code, code)
      })
      setChains(Array.from(map.entries()).map(([k]) => ({ chainCode: k, label: k })))
    } catch {
      setAllCurrencies([])
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

  const loadRiskConfigs = useCallback(async () => {
    if (!canViewRiskConfig) return
    try {
      setRiskConfigLoading(true)
      const configs = await withdrawalRiskConfigService.listRiskConfigs()
      setRiskConfigs(configs)
    } catch (e) {
      console.error('加载提现风控配置失败:', e)
      setRiskConfigs([])
    } finally {
      setRiskConfigLoading(false)
    }
  }, [canViewRiskConfig])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    if (riskModalVisible) {
      loadRiskConfigs()
    }
  }, [riskModalVisible, loadRiskConfigs])

  useEffect(() => {
    if (feeModalVisible) {
      loadRiskConfigs()
    }
  }, [feeModalVisible, loadRiskConfigs])

  useEffect(() => {
    if (!riskModalVisible || !selectedRiskChain || !selectedRiskSymbol) return
    let cancelled = false
    setRiskPairLoading(true)
    withdrawalRiskConfigService.getRiskConfig(selectedRiskChain, selectedRiskSymbol).then((config) => {
      if (cancelled) return
      const nextValues = {
        chainCode: selectedRiskChain,
        symbol: selectedRiskSymbol,
        minWithdraw: config?.minWithdraw ?? currentRiskCurrency?.minWithdraw ?? null,
        singleLimit: config ? (Number(config.singleLimit) || null) : null,
        dailyLimit: config ? (Number(config.dailyLimit) || null) : null,
        dailyTxCountLimit: config?.dailyTxCountLimit ?? 0,
        kycCooldownHours: config?.kycCooldownHours ?? 0,
        userFrequencyLimitMins: config?.userFrequencyLimitMins ?? 0,
        requireApproval: config?.requireApproval ?? false
      }
      riskForm.setFieldsValue(nextValues)
      setRiskConfigs(prev => {
        const next = prev.filter(item => !(item.chainCode === selectedRiskChain && item.symbol === selectedRiskSymbol))
        return config ? [...next, config] : next
      })
    }).catch(() => {
      if (cancelled) return
      riskForm.setFieldsValue({
        chainCode: selectedRiskChain,
        symbol: selectedRiskSymbol,
        minWithdraw: currentRiskCurrency?.minWithdraw ?? null,
        singleLimit: null,
        dailyLimit: null,
        dailyTxCountLimit: 0,
        kycCooldownHours: 0,
        userFrequencyLimitMins: 0,
        requireApproval: false
      })
    }).finally(() => {
      if (!cancelled) setRiskPairLoading(false)
    })
    return () => { cancelled = true }
  }, [riskModalVisible, selectedRiskChain, selectedRiskSymbol, riskForm, currentRiskCurrency])

  useEffect(() => {
    if (!feeModalVisible || !selectedFeeChain || !selectedFeeSymbol) return
    let cancelled = false
    setFeePairLoading(true)
    withdrawalFeeConfigService.getFeeConfig(selectedFeeChain, selectedFeeSymbol).then((config) => {
      if (cancelled) return
      feeForm.setFieldsValue({
        chainCode: selectedFeeChain,
        symbol: selectedFeeSymbol,
        feeMode: config && Number(config.feeMode ?? 0) > 0 ? config.feeMode : undefined,
        fixedFee: config ? (Number(config.fixedFee ?? 0) || 0) : 0,
        feeRate: config ? (Number(config.feeRate ?? 0) || 0) : 0,
        minFee: config ? (Number(config.minFee ?? 0) || 0) : 0,
        maxFee: config ? (Number(config.maxFee ?? 0) || 0) : 0,
        feeDeductMode: config?.feeDeductMode ?? 1,
      })
      setRiskConfigs(prev => {
        const next = prev.filter(item => !(item.chainCode === selectedFeeChain && item.symbol === selectedFeeSymbol))
        return config ? [...next, config] : next
      })
    }).catch(() => {
      if (cancelled) return
      feeForm.setFieldsValue({
        chainCode: selectedFeeChain,
        symbol: selectedFeeSymbol,
        feeMode: undefined,
        fixedFee: 0,
        feeRate: 0,
        minFee: 0,
        maxFee: 0,
        feeDeductMode: 1,
      })
    }).finally(() => {
      if (!cancelled) setFeePairLoading(false)
    })
    return () => { cancelled = true }
  }, [feeModalVisible, selectedFeeChain, selectedFeeSymbol, feeForm])

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

  const openRiskModal = () => {
    const firstChain = chains[0]?.chainCode
    const firstCurrency = allCurrencies.find(item => item.chainCode === firstChain)
    riskForm.setFieldsValue({
      chainCode: firstChain,
      symbol: firstCurrency?.symbol,
      minWithdraw: firstCurrency?.minWithdraw ?? null,
      singleLimit: null,
      dailyLimit: null,
      dailyTxCountLimit: 0,
      kycCooldownHours: 0,
      userFrequencyLimitMins: 0,
      requireApproval: false
    })
    setRiskModalVisible(true)
  }

  const openFeeModal = () => {
    const firstChain = chains[0]?.chainCode
    const firstSymbol = allCurrencies.find(item => item.chainCode === firstChain)?.symbol
    feeForm.setFieldsValue({
      chainCode: firstChain,
      symbol: firstSymbol,
      feeMode: undefined,
      fixedFee: 0,
      feeRate: 0,
      minFee: 0,
      maxFee: 0,
      feeDeductMode: 1,
    })
    setFeeModalVisible(true)
  }

  const closeRiskModal = () => {
    setRiskModalVisible(false)
    riskForm.resetFields()
  }

  const closeFeeModal = () => {
    setFeeModalVisible(false)
    feeForm.resetFields()
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

  const handleRiskSave = async () => {
    try {
      const values = await riskForm.validateFields()
      setRiskConfigSaving(true)
      await withdrawalRiskConfigService.upsertRiskConfig({
        chainCode: values.chainCode,
        symbol: values.symbol,
        minWithdraw: values.minWithdraw ?? 0,
        singleLimit: values.singleLimit ?? 0,
        dailyLimit: values.dailyLimit ?? 0,
        dailyTxCountLimit: values.dailyTxCountLimit ?? 0,
        kycCooldownHours: values.kycCooldownHours ?? 0,
        userFrequencyLimitMins: values.userFrequencyLimitMins ?? 0,
        requireApproval: values.requireApproval ?? false
      })
      message.success('提现风控配置已保存')
      await loadRiskConfigs()
      closeRiskModal()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error(e?.message || '保存风控配置失败')
    } finally {
      setRiskConfigSaving(false)
    }
  }

  const handleRiskDelete = async () => {
    if (!selectedRiskChain || !selectedRiskSymbol) return
    try {
      setRiskConfigDeleting(true)
      await withdrawalRiskConfigService.deleteRiskConfig(selectedRiskChain, selectedRiskSymbol)
      message.success('提现风控配置已删除')
      await loadRiskConfigs()
      riskForm.setFieldsValue({
        chainCode: selectedRiskChain,
        symbol: selectedRiskSymbol,
        minWithdraw: currentRiskCurrency?.minWithdraw ?? null,
        singleLimit: null,
        dailyLimit: null,
        dailyTxCountLimit: 0,
        kycCooldownHours: 0,
        userFrequencyLimitMins: 0,
        requireApproval: false
      })
    } catch (e: any) {
      message.error(e?.message || '删除风控配置失败')
    } finally {
      setRiskConfigDeleting(false)
    }
  }

  const handleFeeSave = async () => {
    try {
      const values = await feeForm.validateFields()
      const existing = currentFeeConfig
      setRiskConfigSaving(true)
      await withdrawalFeeConfigService.upsertFeeConfig({
        chainCode: values.chainCode,
        symbol: values.symbol,
        singleLimit: existing?.singleLimit ?? 0,
        dailyLimit: existing?.dailyLimit ?? 0,
        dailyTxCountLimit: existing?.dailyTxCountLimit ?? 0,
        kycCooldownHours: existing?.kycCooldownHours ?? 0,
        userFrequencyLimitMins: existing?.userFrequencyLimitMins ?? 0,
        requireApproval: existing?.requireApproval ?? false,
        feeMode: values.feeMode ?? 0,
        fixedFee: values.fixedFee ?? 0,
        feeRate: values.feeRate ?? 0,
        minFee: values.minFee ?? 0,
        maxFee: values.maxFee ?? 0,
        feeSymbol: values.symbol,
        feeDeductMode: values.feeDeductMode ?? 1,
        networkFeeMode: 1,
      })
      message.success('提现手续费配置已保存')
      await loadRiskConfigs()
      closeFeeModal()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error(e?.message || '保存提现手续费配置失败')
    } finally {
      setRiskConfigSaving(false)
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
          {canViewFeeConfig && (
            <Button
              size="large"
              icon={<DollarOutlined />}
              onClick={openFeeModal}
              className="!h-11 !rounded-xl !border-0 !bg-[linear-gradient(135deg,#0f766e_0%,#14b8a6_100%)] !px-5 !font-semibold !text-white shadow-lg shadow-teal-500/30 hover:!bg-[linear-gradient(135deg,#0d9488_0%,#2dd4bf_100%)] hover:shadow-xl hover:shadow-teal-500/35"
            >
              提现手续费配置
            </Button>
          )}
          {canViewRiskConfig && (
            <Button
              type="primary"
              size="large"
              icon={<SafetyCertificateOutlined />}
              onClick={openRiskModal}
              className="!h-11 !rounded-xl !border-0 !bg-[linear-gradient(135deg,#f97316_0%,#ef4444_100%)] !px-5 !font-semibold !text-white shadow-lg shadow-orange-500/30 hover:!bg-[linear-gradient(135deg,#fb923c_0%,#f87171_100%)]"
            >
              提现风控配置
            </Button>
          )}
        </Space>
      </div>

      <div className="mb-6 grid gap-6">
        <Card className="h-full border-0 shadow-sm shadow-slate-200/60" bodyStyle={{ padding: 18 }}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">筛选与搜索</div>
              <div className="mt-0.5 text-xs text-slate-500">组合条件快速收敛待处理申请、链上确认单和历史记录</div>
            </div>
            <Tag color="blue" className="rounded-full px-2.5 py-0.5 text-[11px]">实时查询</Tag>
          </div>
          <Row gutter={[12, 10]}>
            <Col xs={24} md={12} xl={9}>
              <Search
                placeholder="申请人 / 地址 / 交易哈希"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onSearch={() => setPagination(p => ({ ...p, page: 1 }))}
                allowClear
                size="middle"
              />
            </Col>
            <Col xs={24} md={12} xl={5}>
              <Select size="middle" value={statusFilter} onChange={v => { setStatusFilter(v); setPagination(p => ({ ...p, page: 1 })) }} style={{ width: '100%' }}>
                <Option value="all">全部状态</Option>
                <Option value="0">{STATUS_MAP[0]?.text}</Option>
                <Option value="1">{STATUS_MAP[1]?.text}</Option>
                <Option value="6">{STATUS_MAP[6]?.text}</Option>
                <Option value="3">区块确认中</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} xl={5}>
              <Select size="middle" value={chainFilter} onChange={v => { setChainFilter(v); setPagination(p => ({ ...p, page: 1 })) }} style={{ width: '100%' }}>
                <Option value="all">全部链</Option>
                {chains.map(c => <Option key={c.chainCode} value={c.chainCode}>{c.label}</Option>)}
              </Select>
            </Col>
            <Col xs={24} sm={12} xl={5}>
              <Select size="middle" value={symbolFilter} onChange={v => { setSymbolFilter(v); setPagination(p => ({ ...p, page: 1 })) }} style={{ width: '100%' }}>
                <Option value="all">全部币种</Option>
                <Option value="USDT">USDT</Option>
                <Option value="ETH">ETH</Option>
                <Option value="BTC">BTC</Option>
                <Option value="TRX">TRX</Option>
              </Select>
            </Col>
            <Col xs={24} xl={9}>
              <RangePicker
                value={dateRange}
                onChange={d => { setDateRange(d as [dayjs.Dayjs, dayjs.Dayjs]); setPagination(p => ({ ...p, page: 1 })) }}
                style={{ width: '100%' }}
                size="middle"
              />
            </Col>
            <Col xs={24} xl={4}>
              <Button
                block
                size="middle"
                onClick={() => {
                  setSearchText('')
                  setStatusFilter('all')
                  setChainFilter('all')
                  setSymbolFilter('all')
                  setDateRange(null)
                  setPagination(p => ({ ...p, page: 1 }))
                }}
              >
                重置筛选
              </Button>
            </Col>
          </Row>
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
        title="提现风控配置"
        open={riskModalVisible}
        onCancel={closeRiskModal}
        onOk={canManageRiskConfig ? handleRiskSave : closeRiskModal}
        okText={canManageRiskConfig ? '保存配置' : '关闭'}
        cancelText="取消"
        confirmLoading={riskConfigSaving}
        width={980}
        destroyOnClose
      >
        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Card size="small" className="border-slate-200">
              <div className="text-sm font-semibold text-slate-900">已配置币种</div>
              <div className="mt-3">
                {riskConfigLoading ? (
                  <div className="py-6 text-center text-sm text-slate-500">加载中...</div>
                ) : riskConfigs.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无风控配置" />
                ) : (
                  <div className="space-y-2">
                    {riskConfigs
                      .slice()
                      .sort((a, b) => `${a.chainCode}-${a.symbol}`.localeCompare(`${b.chainCode}-${b.symbol}`))
                      .map(item => (
                        <button
                          key={`${item.chainCode}-${item.symbol}`}
                          type="button"
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                            item.chainCode === selectedRiskChain && item.symbol === selectedRiskSymbol
                              ? 'border-sky-300 bg-sky-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          onClick={() => riskForm.setFieldsValue({ chainCode: item.chainCode, symbol: item.symbol })}
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-900">{item.chainCode} / {item.symbol}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              单笔 {Number(item.singleLimit) > 0 ? item.singleLimit : '不限制'} · 日累计 {Number(item.dailyLimit) > 0 ? item.dailyLimit : '不限制'}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              日次数 {item.dailyTxCountLimit > 0 ? `${item.dailyTxCountLimit} 次` : '不限制'} · KYC冷静期 {item.kycCooldownHours > 0 ? `${item.kycCooldownHours} 小时` : '关闭'}
                            </div>
                          </div>
                          <Tag color={item.requireApproval ? 'gold' : 'green'}>
                            {item.requireApproval ? '待审核' : '直通'}
                          </Tag>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </Card>

            <Card size="small" className="border-slate-200">
              <div className="text-sm font-semibold text-slate-900">未配置币种</div>
              <div className="mt-3">
                {riskConfigLoading ? (
                  <div className="py-6 text-center text-sm text-slate-500">加载中...</div>
                ) : unconfiguredRiskCurrencies.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无未配置币种" />
                ) : (
                  <div className="space-y-2">
                    {unconfiguredRiskCurrencies
                      .slice()
                      .sort((a, b) => `${a.chainCode}-${a.symbol}`.localeCompare(`${b.chainCode}-${b.symbol}`))
                      .map(item => (
                        <button
                          key={`unconfigured-${item.chainCode}-${item.symbol}`}
                          type="button"
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                            item.chainCode === selectedRiskChain && item.symbol === selectedRiskSymbol
                              ? 'border-orange-300 bg-orange-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          onClick={() => riskForm.setFieldsValue({
                            chainCode: item.chainCode,
                            symbol: item.symbol,
                            minWithdraw: item.minWithdraw ?? null,
                            singleLimit: null,
                            dailyLimit: null,
                            dailyTxCountLimit: 0,
                            kycCooldownHours: 0,
                            userFrequencyLimitMins: 0,
                            requireApproval: false
                          })}
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-900">{item.chainCode} / {item.symbol}</div>
                            <div className="mt-1 text-xs text-slate-500">{item.name || '平台已开放币种'} · 点击后可直接配置风控</div>
                          </div>
                          <Tag color="default">未配置</Tag>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card size="small" className="border-slate-200">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">配置详情</div>
                {currentRiskConfig && canManageRiskConfig ? (
                  <Popconfirm
                    title="确认删除当前风控配置吗？"
                    description="删除后该链和币种将恢复为未配置状态。"
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true, loading: riskConfigDeleting }}
                    onConfirm={handleRiskDelete}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={riskConfigDeleting}
                      disabled={riskPairLoading}
                    >
                      删除当前配置
                    </Button>
                  </Popconfirm>
                ) : null}
              </div>
              <Form
                form={riskForm}
                layout="vertical"
                initialValues={{ requireApproval: false, minWithdraw: null, singleLimit: null, dailyLimit: null, dailyTxCountLimit: 0, kycCooldownHours: 0, userFrequencyLimitMins: 0 }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="chainCode"
                      label="链"
                      rules={[{ required: true, message: '请选择链' }]}
                    >
                      <Select
                        placeholder="请选择链"
                        options={chains.map(item => ({ value: item.chainCode, label: item.label }))}
                        onChange={() => riskForm.setFieldsValue({ symbol: undefined, minWithdraw: null })}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                        name="symbol"
                        label="币种"
                        rules={[{ required: true, message: '请选择币种' }]}
                    >
                      <Select
                        placeholder="请选择币种"
                        options={riskSymbolOptions}
                        disabled={!selectedRiskChain}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="minWithdraw"
                      label="单笔最低提现额度"
                      tooltip="当前提现最小金额门槛，建议与实际风控口径保持一致"
                    >
                      <InputNumber
                        min={0}
                        precision={8}
                        style={{ width: '100%' }}
                        stringMode
                        placeholder="请输入最低提现额度"
                        disabled={!canManageRiskConfig || riskPairLoading}
                        addonAfter={selectedRiskSymbol || currentRiskCurrency?.symbol || ''}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="singleLimit"
                      label="单笔提现限额"
                      tooltip="0 或留空表示不限制"
                    >
                      <InputNumber
                        min={0}
                        precision={8}
                        stringMode
                        style={{ width: '100%' }}
                        placeholder="0 = 不限制"
                        disabled={!canManageRiskConfig || riskPairLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="dailyLimit"
                      label="日累计提现限额"
                      tooltip="0 或留空表示不限制"
                    >
                      <InputNumber
                        min={0}
                        precision={8}
                        stringMode
                        style={{ width: '100%' }}
                        placeholder="0 = 不限制"
                        disabled={!canManageRiskConfig || riskPairLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="dailyTxCountLimit"
                      label="日提现次数限制"
                      tooltip="0 表示不限制"
                    >
                      <InputNumber
                        min={0}
                        precision={0}
                        style={{ width: '100%' }}
                        placeholder="0 = 不限制"
                        disabled={!canManageRiskConfig || riskPairLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="kycCooldownHours"
                      label="KYC通过后冷静期"
                      tooltip="用户 KYC 审核通过后，在此小时数内不可提现"
                    >
                      <InputNumber
                        min={0}
                        precision={0}
                        style={{ width: '100%' }}
                        placeholder="0 = 不限制"
                        addonAfter="小时"
                        disabled={!canManageRiskConfig || riskPairLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="userFrequencyLimitMins"
                      label="用户提交频率限制"
                      tooltip="用户提交提现申请后，在此分钟数内不可再次提交"
                    >
                      <InputNumber
                        min={0}
                        precision={0}
                        style={{ width: '100%' }}
                        placeholder="0 = 不限制"
                        addonAfter="分钟"
                        disabled={!canManageRiskConfig || riskPairLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="requireApproval"
                      label="是否开启风控"
                      valuePropName="checked"
                      tooltip="开启后，提现申请通过基础限额校验后仍会进入待审核"
                    >
                      <Switch
                        checkedChildren="开启风控"
                        unCheckedChildren="关闭风控"
                        disabled={!canManageRiskConfig || riskPairLoading}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card size="small" className="border-0 bg-slate-50 shadow-none">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">单笔最低提现额度</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {previewMinWithdraw ?? '未设置'}
                </div>
                <div className="mt-1 text-xs text-slate-500">提现预览和正式提交都会优先按这里的配置校验</div>
              </Card>
              <Card size="small" className="border-0 bg-slate-50 shadow-none">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">单笔限额校验</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {previewSingleLimit != null && Number(previewSingleLimit) > 0 ? previewSingleLimit : '不限制'}
                </div>
                <div className="mt-1 text-xs text-slate-500">超限直接拦截申请</div>
              </Card>
              <Card size="small" className="border-0 bg-slate-50 shadow-none">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">日累计限额校验</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {previewDailyLimit != null && Number(previewDailyLimit) > 0 ? previewDailyLimit : '不限制'}
                </div>
                <div className="mt-1 text-xs text-slate-500">累计超限直接拦截申请</div>
              </Card>
              <Card size="small" className="border-0 bg-slate-50 shadow-none">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">入单初始状态</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {previewRequireApproval ? '待审核' : '审核通过'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {previewRequireApproval ? '提交后进入人工审核流程' : '提交后无需人工审核可直接提现'}
                </div>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card size="small" className="border-0 bg-slate-50 shadow-none">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">日提现次数</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {previewDailyTxCountLimit > 0 ? `${previewDailyTxCountLimit} 次` : '不限制'}
                </div>
                <div className="mt-1 text-xs text-slate-500">按链和币种统计当日申请次数</div>
              </Card>
              <Card size="small" className="border-0 bg-slate-50 shadow-none">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">KYC冷静期</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {previewKYCCooldownHours > 0 ? `${previewKYCCooldownHours} 小时` : '关闭'}
                </div>
                <div className="mt-1 text-xs text-slate-500">KYC刚通过的用户暂缓提现</div>
              </Card>
              <Card size="small" className="border-0 bg-slate-50 shadow-none">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">提交频率限制</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {previewUserFrequencyLimitMins > 0 ? `${previewUserFrequencyLimitMins} 分钟` : '不限制'}
                </div>
                <div className="mt-1 text-xs text-slate-500">限制同一用户短时间重复提交</div>
              </Card>
            </div>

            {!canManageRiskConfig && (
              <Alert
                type="warning"
                showIcon
                message="当前账号只有查看权限"
                description="如需修改提现风控配置，请为当前账号补充 withdrawal_risk:manage 权限。"
              />
            )}
          </div>
        </div>
      </Modal>

      <Modal
        title="提现手续费配置"
        open={feeModalVisible}
        onCancel={closeFeeModal}
        onOk={canManageFeeConfig ? handleFeeSave : closeFeeModal}
        okText={canManageFeeConfig ? '保存配置' : '关闭'}
        cancelText="取消"
        confirmLoading={riskConfigSaving}
        width={980}
        destroyOnClose
      >
        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Card size="small" className="border-slate-200">
              <div className="text-sm font-semibold text-slate-900">已配置币种</div>
              <div className="mt-3">
                {riskConfigLoading ? (
                  <div className="py-6 text-center text-sm text-slate-500">加载中...</div>
                ) : configuredFeePairs.size === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无手续费配置" />
                ) : (
                  <div className="space-y-2">
                    {riskConfigs
                      .filter(item => configuredFeePairs.has(`${item.chainCode}::${item.symbol}`))
                      .slice()
                      .sort((a, b) => `${a.chainCode}-${a.symbol}`.localeCompare(`${b.chainCode}-${b.symbol}`))
                      .map(item => (
                        <button
                          key={`fee-${item.chainCode}-${item.symbol}`}
                          type="button"
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                            item.chainCode === selectedFeeChain && item.symbol === selectedFeeSymbol
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          onClick={() => feeForm.setFieldsValue({ chainCode: item.chainCode, symbol: item.symbol })}
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-900">{item.chainCode} / {item.symbol}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {Number(item.feeMode ?? 0) === 1 ? '固定手续费' : Number(item.feeMode ?? 0) === 2 ? '按比例收费' : '固定 + 比例收费'}
                            </div>
                          </div>
                          <Tag color="green">已配置</Tag>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </Card>

            <Card size="small" className="border-slate-200">
              <div className="text-sm font-semibold text-slate-900">未配置币种</div>
              <div className="mt-3">
                {riskConfigLoading ? (
                  <div className="py-6 text-center text-sm text-slate-500">加载中...</div>
                ) : unconfiguredFeeCurrencies.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无未配置币种" />
                ) : (
                  <div className="space-y-2">
                    {unconfiguredFeeCurrencies
                      .slice()
                      .sort((a, b) => `${a.chainCode}-${a.symbol}`.localeCompare(`${b.chainCode}-${b.symbol}`))
                      .map(item => (
                        <button
                          key={`fee-unconfigured-${item.chainCode}-${item.symbol}`}
                          type="button"
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                            item.chainCode === selectedFeeChain && item.symbol === selectedFeeSymbol
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          onClick={() => feeForm.setFieldsValue({
                            chainCode: item.chainCode,
                            symbol: item.symbol,
                            feeMode: undefined,
                            fixedFee: 0,
                            feeRate: 0,
                            minFee: 0,
                            maxFee: 0,
                            feeDeductMode: 1,
                          })}
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-900">{item.chainCode} / {item.symbol}</div>
                            <div className="mt-1 text-xs text-slate-500">{item.name || '平台已开放币种'} · 点击后可直接配置手续费</div>
                          </div>
                          <Tag color="default">未配置</Tag>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-0 shadow-sm shadow-slate-200/60">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">默认配置</div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                    {currentFeeCurrency ? `${currentFeeCurrency.chainCode} / ${currentFeeCurrency.symbol}` : '未选择币种'}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">当前币种无指定配置，将按以下默认配置执行。</div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-500">
                  <DollarOutlined className="text-xl" />
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">默认提现手续费</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">
                    {currentFeeCurrency?.withdrawFee ?? '-'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">平台币种基础手续费</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">单笔最低提现额度</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">
                    {currentFeeCurrency?.minWithdraw ?? '-'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">低于该金额不可发起提现</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">默认手续费币种</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">
                    {currentFeeCurrency?.symbol ?? '-'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">当前默认与提现币种一致</div>
                </div>
              </div>
            </Card>

            <Card size="small" className="border-slate-200">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">配置详情</div>
                <Tag color="blue">按链+币种生效</Tag>
              </div>
              <Form
                form={feeForm}
                layout="vertical"
                initialValues={{ feeMode: undefined, fixedFee: 0, feeRate: 0, minFee: 0, maxFee: 0, feeDeductMode: 1 }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="chainCode" label="链" rules={[{ required: true, message: '请选择链' }]}>
                      <Select
                        placeholder="请选择链"
                        options={chains.map(item => ({ value: item.chainCode, label: item.label }))}
                        onChange={() => feeForm.setFieldValue('symbol', undefined)}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="symbol" label="币种" rules={[{ required: true, message: '请选择币种' }]}>
                      <Select placeholder="请选择币种" options={feeSymbolOptions} disabled={!selectedFeeChain} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="feeMode" label="手续费模式" rules={[{ required: true, message: '请选择手续费模式' }]}>
                      <Select
                        options={[
                          { value: 1, label: '固定手续费' },
                          { value: 2, label: '按比例收费' },
                          { value: 3, label: '固定 + 比例收费' },
                        ]}
                        placeholder="请选择手续费模式"
                        disabled={!canManageFeeConfig || feePairLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="feeDeductMode" label="手续费扣费方式">
                      <Select
                        options={[
                          { value: 1, label: '内扣' },
                          { value: 2, label: '外扣' },
                        ]}
                        disabled={!canManageFeeConfig || feePairLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Alert
                      type="info"
                      showIcon
                      message={previewFeeDeductMode === 2 ? '外扣：用户账户额外扣除手续费，到账金额保持为申请提现金额。' : '内扣：手续费从申请提现金额中扣除，用户实际到账金额 = 申请金额 - 手续费。'}
                    />
                  </Col>
                  {shouldShowFixedFeeFields && (
                    <Col xs={24} md={12}>
                      <Form.Item name="fixedFee" label="固定手续费">
                        <InputNumber min={0} precision={8} stringMode style={{ width: '100%' }} disabled={!canManageFeeConfig || feePairLoading} />
                      </Form.Item>
                    </Col>
                  )}
                  {shouldShowRateFeeFields && (
                    <Col xs={24} md={12}>
                      <Form.Item name="feeRate" label="比例手续费" tooltip="例如 0.01 表示 1%">
                        <InputNumber min={0} precision={8} stringMode style={{ width: '100%' }} disabled={!canManageFeeConfig || feePairLoading} />
                      </Form.Item>
                    </Col>
                  )}
                  {shouldShowFeeBoundFields && (
                    <Col xs={24} md={12}>
                      <Form.Item name="minFee" label="手续费下限">
                        <InputNumber min={0} precision={8} stringMode style={{ width: '100%' }} disabled={!canManageFeeConfig || feePairLoading} />
                      </Form.Item>
                    </Col>
                  )}
                  {shouldShowFeeBoundFields && (
                    <Col xs={24} md={12}>
                      <Form.Item name="maxFee" label="手续费上限">
                        <InputNumber min={0} precision={8} stringMode style={{ width: '100%' }} disabled={!canManageFeeConfig || feePairLoading} />
                      </Form.Item>
                    </Col>
                  )}
                </Row>
              </Form>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card size="small" className="border-0 bg-slate-50 shadow-none">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">手续费模式</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {hasExplicitFeeConfig || selectedFeeMode ? (['', '固定', '比例', '固定+比例'][previewFeeMode] || '未指定') : '默认配置'}
                </div>
                <div className="mt-1 text-xs text-slate-500">{hasExplicitFeeConfig || selectedFeeMode ? '按租户指定模式计算手续费' : '当前未保存租户专属手续费规则'}</div>
              </Card>
              {shouldShowFixedFeeFields && (
                <Card size="small" className="border-0 bg-slate-50 shadow-none">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">固定手续费</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{previewFixedFee || 0}</div>
                  <div className="mt-1 text-xs text-slate-500">适用于固定或固定+比例模式</div>
                </Card>
              )}
              {shouldShowRateFeeFields && (
                <Card size="small" className="border-0 bg-slate-50 shadow-none">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">比例手续费</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{previewFeeRate || 0}</div>
                  <div className="mt-1 text-xs text-slate-500">例如 0.01 = 1%</div>
                </Card>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {shouldShowFeeBoundFields && (
                <Card size="small" className="border-0 bg-slate-50 shadow-none">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">手续费下限</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{previewMinFee || 0}</div>
                  <div className="mt-1 text-xs text-slate-500">0 表示不限制</div>
                </Card>
              )}
              {shouldShowFeeBoundFields && (
                <Card size="small" className="border-0 bg-slate-50 shadow-none">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">手续费上限</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{previewMaxFee || 0}</div>
                  <div className="mt-1 text-xs text-slate-500">0 表示不限制</div>
                </Card>
              )}
              <Card size="small" className="border-0 bg-slate-50 shadow-none">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">扣费方式</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{previewFeeDeductMode === 2 ? '外扣' : '内扣'}</div>
                <div className="mt-1 text-xs text-slate-500">控制到账金额与冻结金额口径</div>
              </Card>
            </div>

            {!canManageFeeConfig && (
              <Alert
                type="warning"
                showIcon
                message="当前账号只有查看权限"
                description="如需修改提现手续费配置，请为当前账号补充 withdrawal_risk:manage 权限。"
              />
            )}
          </div>
        </div>
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
