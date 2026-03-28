import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { TableProps } from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  NotificationOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { cardService } from '@/services'
import type {
  CardTransactionRiskAlertReceivers,
  CardTransactionRiskBlacklistItem,
  CardTransactionRiskBlacklistUpsertPayload,
  CardTransactionRiskConfig,
  CardTransactionRiskConfigUpsertPayload,
} from '@/services/cardService'

const amountPattern = /^\d+(\.\d{1,2})?$/

const alertSceneOptions = [
  { label: '授权缺失', value: 'AUTH_MISSING' },
  { label: '透支待处理', value: 'OVERDRAFT_PENDING' },
  { label: '回调乱序', value: 'OUT_OF_ORDER' },
  { label: '退款待处理', value: 'REFUND_PENDING' },
  { label: '系统异常', value: 'SYSTEM_ERROR' },
]

const feeModeOptions = [
  { label: '固定金额', value: 'FIXED' },
  { label: '比例费率', value: 'RATE' },
]

const feeRefundScopeOptions = [
  { label: '仅交易失败退回手续费', value: 'FAILED_ONLY' },
  { label: '交易失败和退款都退回手续费', value: 'FAILED_AND_REFUND' },
  { label: '不退回手续费', value: 'NONE' },
]

const blacklistStatusOptions = [
  { label: '生效中', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
]

const blacklistActionLabelMap: Record<string, string> = {
  DECLINE: '直接拒绝',
}

type RiskConfigFormValues = {
  statusEnabled: boolean
  riskEnabled: boolean
  maxTransactionAmount: string
  dailyAmountLimit: string
  monthlyAmountLimit: string
  dailyCountLimit: number
  monthlyCountLimit: number
  feeEnabled: boolean
  feeMode?: 'FIXED' | 'RATE'
  feeFixedAmount: string
  feeRateBps: number
  feeMinAmount: string
  feeMaxAmount: string
  feeRefundEnabled: boolean
  feeRefundScope: 'FAILED_ONLY' | 'FAILED_AND_REFUND' | 'NONE'
  alertEnabled: boolean
  alertScene: string[]
  alertEmails: string
  alertPhones: string
}

type BlacklistFormValues = {
  userId: string
  status: 'ACTIVE' | 'INACTIVE'
  reason?: string
  sourceType?: string
  effectiveAt: Dayjs
  expiredAt?: Dayjs | null
}

type BlacklistQueryParams = {
  page: number
  pageSize: number
  search: string
}

const defaultRiskConfigValues: RiskConfigFormValues = {
  statusEnabled: true,
  riskEnabled: true,
  maxTransactionAmount: '0',
  dailyAmountLimit: '0',
  monthlyAmountLimit: '0',
  dailyCountLimit: 0,
  monthlyCountLimit: 0,
  feeEnabled: false,
  feeMode: undefined,
  feeFixedAmount: '0',
  feeRateBps: 0,
  feeMinAmount: '0',
  feeMaxAmount: '0',
  feeRefundEnabled: true,
  feeRefundScope: 'FAILED_AND_REFUND',
  alertEnabled: false,
  alertScene: [],
  alertEmails: '',
  alertPhones: '',
}

const defaultBlacklistParams: BlacklistQueryParams = {
  page: 1,
  pageSize: 10,
  search: '',
}

const decimalRule = (label: string) => ({
  validator: async (_: unknown, value: string | undefined) => {
    const raw = `${value ?? ''}`.trim()
    if (!raw || amountPattern.test(raw)) {
      return
    }
    throw new Error(`${label}需为非负金额，最多保留 2 位小数`)
  },
})

const formatDateTime = (value?: string) =>
  value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'

const splitReceiverText = (value?: string): string[] =>
  `${value ?? ''}`
    .split(/[\n,，;]/)
    .map((item) => item.trim())
    .filter(Boolean)

const joinReceiverText = (value: unknown): string =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).join('\n') : ''

const normalizeReceivers = (
  receivers?: CardTransactionRiskAlertReceivers
): CardTransactionRiskAlertReceivers => {
  const raw = receivers ?? {}
  return {
    emails: Array.isArray(raw.emails) ? raw.emails.filter((item): item is string => typeof item === 'string') : [],
    phones: Array.isArray(raw.phones) ? raw.phones.filter((item): item is string => typeof item === 'string') : [],
  }
}

const toFormValues = (config?: CardTransactionRiskConfig | null): RiskConfigFormValues => {
  if (!config) {
    return defaultRiskConfigValues
  }
  const receivers = normalizeReceivers(config.alertReceivers)
  return {
    statusEnabled: config.status === 'ENABLED',
    riskEnabled: config.riskEnabled,
    maxTransactionAmount: config.maxTransactionAmount || '0',
    dailyAmountLimit: config.dailyAmountLimit || '0',
    monthlyAmountLimit: config.monthlyAmountLimit || '0',
    dailyCountLimit: config.dailyCountLimit || 0,
    monthlyCountLimit: config.monthlyCountLimit || 0,
    feeEnabled: config.feeEnabled,
    feeMode: config.feeMode || undefined,
    feeFixedAmount: config.feeFixedAmount || '0',
    feeRateBps: config.feeRateBps || 0,
    feeMinAmount: config.feeMinAmount || '0',
    feeMaxAmount: config.feeMaxAmount || '0',
    feeRefundEnabled: config.feeRefundEnabled,
    feeRefundScope: config.feeRefundScope || 'FAILED_AND_REFUND',
    alertEnabled: config.alertEnabled,
    alertScene: config.alertScene || [],
    alertEmails: joinReceiverText(receivers.emails),
    alertPhones: joinReceiverText(receivers.phones),
  }
}

const CardTransactionRiskPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [configForm] = Form.useForm<RiskConfigFormValues>()
  const [blacklistForm] = Form.useForm<BlacklistFormValues>()
  const [blacklistParams, setBlacklistParams] = useState<BlacklistQueryParams>(defaultBlacklistParams)
  const [blacklistModalOpen, setBlacklistModalOpen] = useState(false)
  const [editingBlacklist, setEditingBlacklist] = useState<CardTransactionRiskBlacklistItem | null>(null)

  const feeEnabled = Form.useWatch('feeEnabled', configForm) ?? defaultRiskConfigValues.feeEnabled
  const feeMode = Form.useWatch('feeMode', configForm) ?? defaultRiskConfigValues.feeMode
  const feeRefundEnabled = Form.useWatch('feeRefundEnabled', configForm) ?? defaultRiskConfigValues.feeRefundEnabled
  const alertEnabled = Form.useWatch('alertEnabled', configForm) ?? defaultRiskConfigValues.alertEnabled

  const { data: riskConfig, isLoading: riskConfigLoading, refetch: refetchRiskConfig } = useQuery({
    queryKey: ['card-transaction-risk-config'],
    queryFn: () => cardService.getTransactionRiskConfig(),
  })

  const { data: blacklistResponse, isLoading: blacklistLoading, refetch: refetchBlacklist } = useQuery({
    queryKey: ['card-transaction-risk-blacklist', blacklistParams],
    queryFn: () => cardService.getTransactionRiskBlacklist(blacklistParams),
  })

  useEffect(() => {
    configForm.setFieldsValue(toFormValues(riskConfig))
  }, [configForm, riskConfig])

  const saveRiskConfigMutation = useMutation({
    mutationFn: (payload: CardTransactionRiskConfigUpsertPayload) => cardService.updateTransactionRiskConfig(payload),
    onSuccess: async () => {
      message.success('卡交易风控配置已保存')
      await queryClient.invalidateQueries({ queryKey: ['card-transaction-risk-config'] })
    },
    onError: (error: Error) => {
      message.error(error.message || '保存卡交易风控配置失败')
    },
  })

  const saveBlacklistMutation = useMutation({
    mutationFn: (payload: { id?: string; data: CardTransactionRiskBlacklistUpsertPayload }) => {
      if (payload.id) {
        return cardService.updateTransactionRiskBlacklist(payload.id, payload.data)
      }
      return cardService.createTransactionRiskBlacklist(payload.data)
    },
    onSuccess: async () => {
      message.success(editingBlacklist ? '黑名单记录已更新' : '黑名单记录已创建')
      setBlacklistModalOpen(false)
      setEditingBlacklist(null)
      blacklistForm.resetFields()
      await queryClient.invalidateQueries({ queryKey: ['card-transaction-risk-blacklist'] })
    },
    onError: (error: Error) => {
      message.error(error.message || '保存黑名单记录失败')
    },
  })

  const deleteBlacklistMutation = useMutation({
    mutationFn: (id: string) => cardService.deleteTransactionRiskBlacklist(id),
    onSuccess: async () => {
      message.success('黑名单记录已删除')
      await queryClient.invalidateQueries({ queryKey: ['card-transaction-risk-blacklist'] })
    },
    onError: (error: Error) => {
      message.error(error.message || '删除黑名单记录失败')
    },
  })

  const blacklistItems = blacklistResponse?.data?.items ?? []
  const blacklistTotal = blacklistResponse?.data?.total ?? 0

  const blacklistStats = useMemo(() => {
    const activeCount = blacklistItems.filter((item) => item.status === 'ACTIVE').length
    const inactiveCount = blacklistItems.filter((item) => item.status === 'INACTIVE').length
    return { activeCount, inactiveCount }
  }, [blacklistItems])

  const handleSaveRiskConfig = async () => {
    try {
      const values = await configForm.validateFields()
      const payload: CardTransactionRiskConfigUpsertPayload = {
        status: values.statusEnabled ? 'ENABLED' : 'DISABLED',
        riskEnabled: values.riskEnabled,
        blacklistHitAction: 'DECLINE',
        maxTransactionAmount: values.maxTransactionAmount.trim() || '0',
        dailyAmountLimit: values.dailyAmountLimit.trim() || '0',
        monthlyAmountLimit: values.monthlyAmountLimit.trim() || '0',
        dailyCountLimit: values.dailyCountLimit || 0,
        monthlyCountLimit: values.monthlyCountLimit || 0,
        feeEnabled: values.feeEnabled,
        feeMode: values.feeMode || 'FIXED',
        feeFixedAmount: values.feeFixedAmount.trim() || '0',
        feeRateBps: Number(values.feeRateBps || 0),
        feeMinAmount: values.feeMinAmount.trim() || '0',
        feeMaxAmount: values.feeMaxAmount.trim() || '0',
        feeRoundMode: 'ROUND_HALF_UP',
        feeRefundEnabled: values.feeRefundEnabled,
        feeRefundScope: values.feeRefundScope,
        alertEnabled: values.alertEnabled,
        alertScene: values.alertScene || [],
        alertReceivers: {
          emails: splitReceiverText(values.alertEmails),
          phones: splitReceiverText(values.alertPhones),
        },
      }
      await saveRiskConfigMutation.mutateAsync(payload)
    } catch {
      // ignore validation error
    }
  }

  const openCreateBlacklistModal = () => {
    setEditingBlacklist(null)
    blacklistForm.setFieldsValue({
      userId: '',
      status: 'ACTIVE',
      reason: '',
      sourceType: 'MANUAL',
      effectiveAt: dayjs(),
      expiredAt: null,
    })
    setBlacklistModalOpen(true)
  }

  const openEditBlacklistModal = (record: CardTransactionRiskBlacklistItem) => {
    setEditingBlacklist(record)
    blacklistForm.setFieldsValue({
      userId: record.userId,
      status: record.status,
      reason: record.reason || '',
      sourceType: record.sourceType || 'MANUAL',
      effectiveAt: dayjs(record.effectiveAt),
      expiredAt: record.expiredAt ? dayjs(record.expiredAt) : null,
    })
    setBlacklistModalOpen(true)
  }

  const handleSaveBlacklist = async () => {
    try {
      const values = await blacklistForm.validateFields()
      const payload: CardTransactionRiskBlacklistUpsertPayload = {
        userId: values.userId.trim(),
        status: values.status,
        reason: values.reason?.trim() || '',
        sourceType: values.sourceType?.trim() || 'MANUAL',
        effectiveAt: values.effectiveAt.toISOString(),
        expiredAt: values.expiredAt ? values.expiredAt.toISOString() : '',
      }
      await saveBlacklistMutation.mutateAsync({
        id: editingBlacklist?.id,
        data: payload,
      })
    } catch {
      // ignore validation error
    }
  }

  const handleDeleteBlacklist = (record: CardTransactionRiskBlacklistItem) => {
    Modal.confirm({
      title: '删除黑名单记录',
      content: `确认删除用户 ${record.userId} 的黑名单记录？`,
      okButtonProps: {
        danger: true,
        loading: deleteBlacklistMutation.isPending,
      },
      onOk: async () => {
        await deleteBlacklistMutation.mutateAsync(record.id)
      },
    })
  }

  const blacklistColumns: TableProps<CardTransactionRiskBlacklistItem>['columns'] = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      width: 240,
      render: (value: string) => (
        <Typography.Text copyable={{ text: value }} className="font-mono text-xs">
          {value}
        </Typography.Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value: CardTransactionRiskBlacklistItem['status']) =>
        value === 'ACTIVE' ? <Tag color="red">生效中</Tag> : <Tag color="default">停用</Tag>,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      ellipsis: true,
      render: (value?: string) => value || '-',
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      width: 120,
      render: (value?: string) => value || 'MANUAL',
    },
    {
      title: '生效时间',
      dataIndex: 'effectiveAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '失效时间',
      dataIndex: 'expiredAt',
      width: 180,
      render: (value?: string) => formatDateTime(value),
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      width: 140,
      render: (value?: string) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_: unknown, record: CardTransactionRiskBlacklistItem) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditBlacklistModal(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteBlacklist(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[30px] border-0 bg-[linear-gradient(135deg,#0b1f5e_0%,#163b8c_45%,#1d4ed8_100%)] text-white shadow-[0_24px_56px_rgba(29,78,216,0.24)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.05)_100%)] px-5 py-4 xl:border-b-0 xl:border-r">
            <div className="text-[11px] uppercase tracking-[0.32em] text-blue-100/80">Tenant Card Transaction Risk</div>
            <div className="mt-2 text-[24px] font-semibold tracking-tight text-white">卡交易风控</div>
            <div className="mt-2 text-sm leading-6 text-blue-50/90">
              这里维护租户维度的消费交易风控策略，包括金额/次数限制、内部手续费、预警目标以及黑名单用户拦截。
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Tag color={riskConfig?.status === 'ENABLED' ? 'success' : 'default'} className="rounded-full px-3 py-1">
                配置状态: {riskConfig?.status === 'ENABLED' ? '已发布' : '未发布'}
              </Tag>
              <Tag color={riskConfig?.riskEnabled ? 'processing' : 'default'} className="rounded-full px-3 py-1">
                运行状态: {riskConfig?.riskEnabled ? '风控生效' : '风控停用'}
              </Tag>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px bg-white/10 md:grid-cols-4">
            <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] px-5 py-4">
              <Statistic
                title={<span className="text-blue-100/80">配置版本</span>}
                value={riskConfig?.configVersion ?? 0}
                valueStyle={{ color: '#fff', fontSize: 28 }}
                prefix={<SafetyCertificateOutlined />}
              />
            </div>
            <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] px-5 py-4">
              <Statistic
                title={<span className="text-blue-100/80">预警邮箱</span>}
                value={normalizeReceivers(riskConfig?.alertReceivers).emails?.length ?? 0}
                valueStyle={{ color: '#fff', fontSize: 28 }}
                prefix={<NotificationOutlined />}
              />
            </div>
            <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] px-5 py-4">
              <Statistic
                title={<span className="text-blue-100/80">黑名单数量</span>}
                value={blacklistTotal}
                valueStyle={{ color: '#fff', fontSize: 28 }}
                prefix={<StopOutlined />}
              />
            </div>
            <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] px-5 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-blue-100/80">最近生效时间</div>
              <div className="mt-3 text-lg font-semibold text-white">
                {riskConfig?.effectiveAt ? dayjs(riskConfig.effectiveAt).format('YYYY-MM-DD HH:mm') : '未发布'}
              </div>
              <div className="mt-2 text-xs text-blue-50/80">修改配置后将立即影响新进入的同步授权决策。</div>
            </div>
          </div>
        </div>
      </Card>

      <Card
        bordered={false}
        className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetchRiskConfig()} loading={riskConfigLoading}>
              刷新配置
            </Button>
            <Button type="primary" onClick={() => handleSaveRiskConfig()} loading={saveRiskConfigMutation.isPending}>
              保存配置
            </Button>
          </Space>
        }
      >
        <div className="mb-4">
          <div className="text-lg font-semibold tracking-tight text-slate-900">风控规则配置</div>
          <div className="mt-1 text-sm text-slate-500">金额阈值填 0 表示不限制。</div>
        </div>

        <Alert
          type="info"
          showIcon
          className="mb-5 rounded-2xl"
          message="命中黑名单当前固定直接拒绝交易"
        />

        <Form form={configForm} layout="vertical">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Card bordered={false} className="rounded-[24px] border border-slate-100 bg-slate-50 shadow-none">
              <div className="mb-3 text-base font-semibold text-slate-900">基础开关</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Item name="statusEnabled" label="配置发布状态" valuePropName="checked">
                  <Switch checkedChildren="已发布" unCheckedChildren="停用" />
                </Form.Item>
                <Form.Item name="riskEnabled" label="运行期风控开关" valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
              </div>
              <Descriptions column={1} size="small" className="mt-2">
                <Descriptions.Item label="黑名单动作">
                  {blacklistActionLabelMap[riskConfig?.blacklistHitAction || 'DECLINE'] || '直接拒绝'}
                </Descriptions.Item>
                <Descriptions.Item label="配置说明">
                  发布状态和运行期风控同时开启时，消费风控才会真正参与授权决策。
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card bordered={false} className="rounded-[24px] border border-slate-100 bg-slate-50 shadow-none">
              <div className="mb-3 text-base font-semibold text-slate-900">交易限额与次数</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Item name="maxTransactionAmount" label="单笔交易限额" rules={[decimalRule('单笔交易限额')]}>
                  <Input placeholder="0 表示不限制" />
                </Form.Item>
                <Form.Item name="dailyAmountLimit" label="单日累计交易额" rules={[decimalRule('单日累计交易额')]}>
                  <Input placeholder="0 表示不限制" />
                </Form.Item>
                <Form.Item name="monthlyAmountLimit" label="单月累计交易额" rules={[decimalRule('单月累计交易额')]}>
                  <Input placeholder="0 表示不限制" />
                </Form.Item>
                <Form.Item name="dailyCountLimit" label="单日交易次数">
                  <InputNumber min={0} precision={0} className="w-full" placeholder="0 表示不限制" />
                </Form.Item>
                <Form.Item name="monthlyCountLimit" label="单月交易次数">
                  <InputNumber min={0} precision={0} className="w-full" placeholder="0 表示不限制" />
                </Form.Item>
              </div>
            </Card>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Card bordered={false} className="rounded-[24px] border border-slate-100 bg-slate-50 shadow-none">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-base font-semibold text-slate-900">消费交易手续费策略</div>
                <Form.Item name="feeEnabled" valuePropName="checked" noStyle>
                  <Switch checkedChildren="启用" unCheckedChildren="关闭" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Item
                  name="feeMode"
                  label="手续费模式"
                  rules={[
                    {
                      validator: async (_: unknown, value: RiskConfigFormValues['feeMode']) => {
                        if (!feeEnabled || value) {
                          return
                        }
                        throw new Error('启用手续费后请选择手续费模式')
                      },
                    },
                  ]}
                >
                  <Select options={feeModeOptions} disabled={!feeEnabled} />
                </Form.Item>
                <Form.Item name="feeRefundEnabled" label="手续费退回开关" valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" disabled={!feeEnabled} />
                </Form.Item>
                {feeEnabled && feeMode === 'FIXED' ? (
                  <Form.Item
                    name="feeFixedAmount"
                    label="固定手续费"
                    rules={[decimalRule('固定手续费')]}
                  >
                    <Input placeholder="0.00" />
                  </Form.Item>
                ) : null}
                {feeEnabled && feeMode === 'RATE' ? (
                  <Form.Item name="feeRateBps" label="比例费率(BPS)">
                    <InputNumber min={0} precision={0} className="w-full" />
                  </Form.Item>
                ) : null}
                <Form.Item name="feeMinAmount" label="手续费最小值" rules={[decimalRule('手续费最小值')]}>
                  <Input disabled={!feeEnabled} placeholder="0.00" />
                </Form.Item>
                <Form.Item name="feeMaxAmount" label="手续费最大值" rules={[decimalRule('手续费最大值')]}>
                  <Input disabled={!feeEnabled} placeholder="0.00" />
                </Form.Item>
                <Form.Item name="feeRefundScope" label="手续费退回范围" className="md:col-span-2">
                  <Select options={feeRefundScopeOptions} disabled={!feeEnabled || !feeRefundEnabled} />
                </Form.Item>
              </div>
            </Card>

            <Card bordered={false} className="rounded-[24px] border border-slate-100 bg-slate-50 shadow-none">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-base font-semibold text-slate-900">预警通知</div>
                <Form.Item name="alertEnabled" valuePropName="checked" noStyle>
                  <Switch checkedChildren="启用" unCheckedChildren="关闭" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Form.Item name="alertScene" label="预警场景">
                  <Checkbox.Group options={alertSceneOptions} disabled={!alertEnabled} />
                </Form.Item>
                <Form.Item name="alertEmails" label="预警邮箱">
                  <Input.TextArea
                    rows={4}
                    disabled={!alertEnabled}
                    placeholder="每行一个邮箱，或使用逗号分隔"
                  />
                </Form.Item>
                <Form.Item name="alertPhones" label="预警手机号">
                  <Input.TextArea
                    rows={4}
                    disabled={!alertEnabled}
                    placeholder="每行一个手机号，或使用逗号分隔"
                  />
                </Form.Item>
              </div>
            </Card>
          </div>
        </Form>
      </Card>

      <Card
        bordered={false}
        className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetchBlacklist()} loading={blacklistLoading}>
              刷新黑名单
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateBlacklistModal}>
              新增黑名单
            </Button>
          </Space>
        }
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold tracking-tight text-slate-900">黑名单用户</div>
            <div className="mt-1 text-sm text-slate-500">命中黑名单的用户在同步授权阶段直接拒绝。支持管理员手工新增、停用和删除。</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card bordered={false} className="min-w-[132px] rounded-2xl bg-rose-50 shadow-none">
              <Statistic title="生效中" value={blacklistStats.activeCount} />
            </Card>
            <Card bordered={false} className="min-w-[132px] rounded-2xl bg-slate-50 shadow-none">
              <Statistic title="停用" value={blacklistStats.inactiveCount} />
            </Card>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <Input.Search
            allowClear
            className="max-w-[420px]"
            placeholder="搜索用户ID"
            onSearch={(search) =>
              setBlacklistParams((prev) => ({
                ...prev,
                page: 1,
                search,
              }))
            }
          />
          <Button
            onClick={() => setBlacklistParams(defaultBlacklistParams)}
          >
            重置筛选
          </Button>
        </div>

        <Table<CardTransactionRiskBlacklistItem>
          rowKey="id"
          loading={blacklistLoading}
          columns={blacklistColumns}
          dataSource={blacklistItems}
          scroll={{ x: 1200 }}
          pagination={{
            current: blacklistParams.page,
            pageSize: blacklistParams.pageSize,
            total: blacklistTotal,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(pagination) =>
            setBlacklistParams((prev) => ({
              ...prev,
              page: pagination.current || 1,
              pageSize: pagination.pageSize || prev.pageSize,
            }))
          }
        />
      </Card>

      <Modal
        open={blacklistModalOpen}
        title={editingBlacklist ? '编辑黑名单' : '新增黑名单'}
        onCancel={() => {
          setBlacklistModalOpen(false)
          setEditingBlacklist(null)
        }}
        onOk={handleSaveBlacklist}
        confirmLoading={saveBlacklistMutation.isPending}
        destroyOnClose
        maskClosable={false}
        okText="保存"
      >
        <Form form={blacklistForm} layout="vertical" className="mt-4">
          <Form.Item name="userId" label="用户ID" rules={[{ required: true, message: '请输入用户ID' }]}>
            <Input placeholder="租户用户 UUID" />
          </Form.Item>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
              <Select options={blacklistStatusOptions} />
            </Form.Item>
            <Form.Item name="sourceType" label="来源">
              <Input placeholder="默认 MANUAL" />
            </Form.Item>
          </div>
          <Form.Item name="reason" label="加入原因">
            <Input.TextArea rows={3} placeholder="记录加入黑名单的业务原因" />
          </Form.Item>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item name="effectiveAt" label="生效时间" rules={[{ required: true, message: '请选择生效时间' }]}>
              <DatePicker showTime className="w-full" />
            </Form.Item>
            <Form.Item name="expiredAt" label="失效时间">
              <DatePicker showTime className="w-full" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default CardTransactionRiskPage
