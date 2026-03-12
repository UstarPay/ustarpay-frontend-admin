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
  Descriptions,
  InputNumber,
  message
} from 'antd'
import {
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  CopyOutlined,
  WalletOutlined
} from '@ant-design/icons'
import { withdrawalService, currencyService } from '@/services'
import type { Currency } from '@shared/types/currency'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { TextArea } = Input

// 状态 0-5 与文案、颜色
const STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '待审核', color: 'gold' },
  1: { text: '审核成功', color: 'blue' },
  2: { text: '审核失败', color: 'red' },
  3: { text: '交易成功', color: 'green' },
  4: { text: '交易失败', color: 'red' },
  5: { text: '已取消', color: 'default' }
}

// 链地址校验
const CHAIN_ADDRESS_REGEX: Record<string, RegExp> = {
  ETH: /^0x[0-9a-fA-F]{40}$/,
  BSC: /^0x[0-9a-fA-F]{40}$/,
  TRX: /^T[A-Za-z0-9]{33}$/,
  TRON: /^T[A-Za-z0-9]{33}$/
}

function validateAddress(chainCode: string, address: string): string | null {
  if (!address?.trim()) return '请输入提现地址'
  const code = chainCode?.toUpperCase() || ''
  const re = CHAIN_ADDRESS_REGEX[code] || CHAIN_ADDRESS_REGEX['ETH']
  return re.test(address.trim()) ? null : `当前链(${chainCode})地址格式不正确`
}

interface WithdrawalRecord {
  id: string
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
    requestedAt: raw.requestedAt ?? raw.requested_at ?? raw.createdAt ?? raw.created_at ?? '',
    processedAt: raw.processedAt ?? raw.processed_at,
    completedAt: raw.completedAt ?? raw.completed_at,
    webhookSent: raw.webhookSent ?? raw.webhook_sent,
    webhookSentAt: raw.webhookSentAt ?? raw.webhook_sent_at
  }
}

const WithdrawalListPage: React.FC = () => {
  const [form] = Form.useForm()
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
  const [detailRecord, setDetailRecord] = useState<WithdrawalRecord | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })

  const selectedChain = Form.useWatch('chain_code', form)
  const selectedSymbol = Form.useWatch('symbol', form)
  const amount = Form.useWatch('amount', form)

  // 加载链选项（从活跃币种去重）
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
      setChains([{ chainCode: 'ETH', label: 'Ethereum' }, { chainCode: 'BSC', label: 'BSC' }, { chainCode: 'TRX', label: 'TRON' }])
    }
  }, [])

  useEffect(() => {
    loadChains()
  }, [loadChains])

  // 链变化时加载该链下的币种
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

  // 选择链+币种后拉取可用余额
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

  // 金额/链/币种变化时估算手续费
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
        statuses: '0,1,3',
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
      const businessId = `wd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      await withdrawalService.createWithdrawal({
        address,
        chainCode,
        symbol: values.symbol,
        amount: String(amt),
        businessId,
        memo: values.note ? String(values.note).slice(0, 255) : undefined
      })
      message.success('提交成功')
      form.resetFields()
      setWithdrawFee('0')
      setAvailableBalance(null)
      loadList()
    } catch (e: any) {
      const msg = e?.message || '提交失败'
      message.error(msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleCancelWithdrawal = (record: WithdrawalRecord) => {
    if (record.status !== 0) return
    Modal.confirm({
      title: '确认取消',
      content: '确定要取消该提现申请吗？',
      onOk: async () => {
        try {
          await withdrawalService.cancelWithdrawal(record.id)
          message.success('已取消')
          loadList()
        } catch (e: any) {
          message.error(e?.message || '取消失败')
        }
      }
    })
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
      title: '来源地址',
      dataIndex: 'fromAddress',
      key: 'fromAddress',
      ellipsis: true,
      render: (v: string) => (
        <Space>
          <Tooltip title={v}>
            <Text code style={{ fontSize: 12 }}>{v ? `${v.slice(0, 6)}...${v.slice(-4)}` : '-'}</Text>
          </Tooltip>
          {v && (
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(v)} />
          )}
        </Space>
      )
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
          {v && (
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(v)} />
          )}
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
            <Text code style={{ fontSize: 12, cursor: 'pointer' }} onClick={() => window.open(`https://etherscan.io/tx/${v}`, '_blank')}>
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
            <Button type="link" size="small" danger onClick={() => handleCancelWithdrawal(record)}>
              取消
            </Button>
          )}
        </Space>
      )
    }
  ]

  const balanceNum = availableBalance != null ? Number(availableBalance) : null
  const amountNum = amount != null && amount > 0 ? Number(amount) : 0
  const isOverBalance = balanceNum != null && amountNum > balanceNum

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>提现</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadList} loading={loading}>刷新</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport} loading={loading}>导出</Button>
        </Space>
      </div>

      {/* 业务规则提示 */}
      <Alert
        type="info"
        showIcon
        message="冷钱包地址不允许发起提现"
        description="出资方地址（fromAddress）不可为冷钱包地址。使用开放 API 提现时，请使用租户钱包或热钱包作为出资方。"
        className="mb-6"
      />

      {/* 余额概览 */}
      <Card className="mb-6">
        <Space>
          <WalletOutlined style={{ fontSize: 24 }} />
          <div>
            <Text type="secondary">可用余额</Text>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {balanceLoading ? (
                <Text type="secondary">加载中...</Text>
              ) : selectedChain && selectedSymbol ? (
                <Text style={{ color: isOverBalance ? '#ff4d4f' : undefined }}>
                  {availableBalance ?? '0'} {selectedSymbol}
                </Text>
              ) : (
                <Text type="secondary">请选择链和币种</Text>
              )}
            </div>
          </div>
        </Space>
      </Card>

      {/* 提现申请表单 */}
      <Card title="提现申请" className="mb-6">
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
                <Input placeholder="0x..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
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
                <InputNumber min={0} step={0.01} placeholder="0.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="手续费">
                <Input readOnly value={feeLoading ? '计算中...' : `${withdrawFee} ${selectedSymbol || ''}`} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="实际到账">
                <Input readOnly value={`${netAmount} ${selectedSymbol || ''}`} />
              </Form.Item>
            </Col>
            <Col xs={24} md={24}>
              <Form.Item name="note" label="备注">
                <TextArea rows={2} placeholder="可选" maxLength={255} showCount />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitLoading}>提交申请</Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 筛选 */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <Search
              placeholder="地址 / 交易哈希"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onSearch={() => setPagination(p => ({ ...p, page: 1 }))}
              allowClear
            />
          </Col>
          <Col xs={24} sm={4}>
            <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPagination(p => ({ ...p, page: 1 })) }} style={{ width: '100%' }}>
              <Option value="all">全部状态</Option>
              <Option value="0">{STATUS_MAP[0]?.text}</Option>
              <Option value="1">{STATUS_MAP[1]?.text}</Option>
              <Option value="3">区块确认中</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select value={chainFilter} onChange={v => { setChainFilter(v); setPagination(p => ({ ...p, page: 1 })) }} style={{ width: '100%' }}>
              <Option value="all">全部链</Option>
              {chains.map(c => <Option key={c.chainCode} value={c.chainCode}>{c.label}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select value={symbolFilter} onChange={v => { setSymbolFilter(v); setPagination(p => ({ ...p, page: 1 })) }} style={{ width: '100%' }}>
              <Option value="all">全部币种</Option>
              <Option value="USDT">USDT</Option>
              <Option value="ETH">ETH</Option>
              <Option value="BTC">BTC</Option>
              <Option value="TRX">TRX</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <RangePicker
              value={dateRange}
              onChange={d => { setDateRange(d as [dayjs.Dayjs, dayjs.Dayjs]); setPagination(p => ({ ...p, page: 1 })) }}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 提现记录列表 */}
      <Card title={`提现记录（${pagination.total}）`}>
        <Table
          columns={columns}
          dataSource={withdrawals}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
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

      {/* 详情弹窗 */}
      <Modal
        title="提现详情"
        open={detailModalVisible}
        onCancel={() => { setDetailModalVisible(false); setDetailRecord(null) }}
        footer={[
          detailRecord?.status === 0 ? (
            <Button key="cancel" danger onClick={() => { handleCancelWithdrawal(detailRecord); setDetailModalVisible(false) }}>
              取消申请
            </Button>
          ) : null,
          <Button key="close" type="primary" onClick={() => { setDetailModalVisible(false); setDetailRecord(null) }}>
            关闭
          </Button>
        ]}
        width={640}
      >
        {detailRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="申请时间">{dayjs(detailRecord.requestedAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="链/币种">{detailRecord.chainCode} / {detailRecord.symbol}</Descriptions.Item>
            <Descriptions.Item label="来源地址">{detailRecord.fromAddress || '-'}</Descriptions.Item>
            <Descriptions.Item label="接收地址">{detailRecord.address}</Descriptions.Item>
            <Descriptions.Item label="金额">{detailRecord.amount} {detailRecord.symbol}</Descriptions.Item>
            <Descriptions.Item label="手续费">{detailRecord.withdrawFee} {detailRecord.symbol}</Descriptions.Item>
            <Descriptions.Item label="净得金额">{detailRecord.netAmount} {detailRecord.symbol}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {detailRecord.status === 3 && detailRecord.transactionStatus === 0
                ? '区块确认中'
                : (STATUS_MAP[detailRecord.status]?.text ?? detailRecord.status)}
            </Descriptions.Item>
            {detailRecord.txHash && <Descriptions.Item label="交易哈希">{detailRecord.txHash}</Descriptions.Item>}
            {detailRecord.failureReason && <Descriptions.Item label="失败原因">{detailRecord.failureReason}</Descriptions.Item>}
            {detailRecord.blockFee != null && <Descriptions.Item label="区块手续费">{detailRecord.blockFee}</Descriptions.Item>}
            {detailRecord.processedAt && <Descriptions.Item label="审核时间">{dayjs(detailRecord.processedAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>}
            {detailRecord.completedAt && <Descriptions.Item label="完成时间">{dayjs(detailRecord.completedAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>}
            {detailRecord.note && <Descriptions.Item label="备注">{detailRecord.note}</Descriptions.Item>}
            {detailRecord.webhookSent != null && <Descriptions.Item label="Webhook 已发送">{detailRecord.webhookSent ? '是' : '否'}</Descriptions.Item>}
            {detailRecord.webhookSentAt && <Descriptions.Item label="Webhook 发送时间">{dayjs(detailRecord.webhookSentAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default WithdrawalListPage
