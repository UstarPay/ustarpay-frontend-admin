import { useEffect, useState } from 'react'
import {
  Descriptions,
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import type {
  CardMerchant,
  CardWebhookMockCardInfo,
  CardWebhookMockSubmitResponse,
  CreateCardMerchantRequest,
  ListParams,
  PaginatedResponse,
  UpdateCardMerchantRequest,
} from '@shared/types'
import { cardMerchantApi } from '@/services/apis/cardMerchantApi'

const { Title, Text } = Typography
const { Search } = Input

const EVENT_OPTIONS = [
  { label: '卡状态变更', value: 'CARD_STATUS_CHANGE' },
  { label: '卡片配送通知', value: 'CARD_DELIVERY' },
  { label: '卡设置变更', value: 'CARD_SETTING' },
  { label: '卡交易通知', value: 'CARD_TRANSACTION' },
] as const

const TX_TYPE_OPTIONS = [
  { label: '交易授权', value: 'AUTHORIZATION' },
  { label: '交易结算', value: 'PRESENTMENT' },
  { label: '交易撤销', value: 'REVERSAL' },
  { label: '交易退款', value: 'REFUND' },
]

const TX_STATE_OPTIONS_BY_TYPE: Record<string, Array<{ label: string; value: string }>> = {
  AUTHORIZATION: [
    { label: '授权通过', value: 'APPROVED' },
    { label: '授权拒绝', value: 'DECLINED' },
    { label: '处理中', value: 'PENDING' },
  ],
  PRESENTMENT: [
    { label: '已结算', value: 'SETTLED' },
    { label: '处理中', value: 'PENDING' },
  ],
  REVERSAL: [
    { label: '已撤销', value: 'REVERSED' },
    { label: '处理中', value: 'PENDING' },
  ],
  REFUND: [
    { label: '已退款', value: 'REFUNDED' },
    { label: '处理中', value: 'PENDING' },
  ],
}

const TX_INDICATOR_META_BY_TYPE: Record<string, { label: string; value: string; color: string }> = {
  AUTHORIZATION: { label: '借记', value: 'debit', color: 'blue' },
  PRESENTMENT: { label: '借记', value: 'debit', color: 'blue' },
  REVERSAL: { label: '借记', value: 'debit', color: 'blue' },
  REFUND: { label: '贷记', value: 'credit', color: 'green' },
}

const yesNoOptions = [
  { label: '开启', value: 1 },
  { label: '关闭', value: 0 },
]

const cardStatusLabelMap: Record<number, { label: string; color: string }> = {
  0: { label: '未激活', color: 'default' },
  1: { label: '已激活', color: 'success' },
  2: { label: '已冻结', color: 'blue' },
  3: { label: '已终止', color: 'volcano' },
  4: { label: '已注销', color: 'default' },
  99: { label: '待审核', color: 'gold' },
}

const getCardStatusMeta = (status: number) => cardStatusLabelMap[status] || { label: `状态 ${status}`, color: 'default' }

const formatNow = () => {
  const now = new Date()
  const pad = (value: number) => `${value}`.padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const createMockTxID = () => `mock_tx_${Date.now()}`

const CardMerchantListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [mockForm] = Form.useForm()
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 10 })
  const [formVisible, setFormVisible] = useState(false)
  const [editingMerchant, setEditingMerchant] = useState<CardMerchant | null>(null)
  const [mockVisible, setMockVisible] = useState(false)
  const [cardInfo, setCardInfo] = useState<CardWebhookMockCardInfo | null>(null)
  const [mockResult, setMockResult] = useState<CardWebhookMockSubmitResponse | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-card-merchants', params],
    queryFn: async (): Promise<PaginatedResponse<CardMerchant>> => cardMerchantApi.getCardMerchants(params),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateCardMerchantRequest) => cardMerchantApi.createCardMerchant(payload),
    onSuccess: () => {
      message.success('卡商创建成功')
      setFormVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['admin-card-merchants'] })
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || error?.message || '卡商创建失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCardMerchantRequest }) =>
      cardMerchantApi.updateCardMerchant(id, payload),
    onSuccess: () => {
      message.success('卡商更新成功')
      setFormVisible(false)
      setEditingMerchant(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['admin-card-merchants'] })
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || error?.message || '卡商更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cardMerchantApi.deleteCardMerchant(id),
    onSuccess: () => {
      message.success('卡商删除成功')
      queryClient.invalidateQueries({ queryKey: ['admin-card-merchants'] })
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || error?.message || '卡商删除失败')
    },
  })

  const queryCardMutation = useMutation({
    mutationFn: (cardId: string) => cardMerchantApi.getWebhookMockCard(cardId),
    onSuccess: (result) => {
      setCardInfo(result)
      setMockResult(null)
      mockForm.setFieldsValue({
        cardId: result.external_card_id,
        referenceNo: result.reference_no,
        currency: result.currency,
      })
      message.success('卡信息查询成功')
    },
    onError: (error: any) => {
      setCardInfo(null)
      setMockResult(null)
      message.error(error?.response?.data?.error || error?.message || '查询卡信息失败')
    },
  })

  const submitMockMutation = useMutation({
    mutationFn: cardMerchantApi.submitWebhookMock,
    onSuccess: (result) => {
      setMockResult(result)
      message.success('Webhook Mock 提交成功')
      if (cardInfo) {
        queryCardMutation.mutate(cardInfo.external_card_id)
      }
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || error?.message || 'Webhook Mock 提交失败')
    },
  })

  useEffect(() => {
    if (!formVisible) {
      return
    }
    if (!editingMerchant) {
      form.resetFields()
      form.setFieldsValue({
        environment: 'sandbox',
        status: 1,
        default_card_material: 3,
        default_currency: 'USD',
      })
      return
    }

    form.setFieldsValue({
      merchant_name: editingMerchant.merchant_name,
      api_key: editingMerchant.api_key,
      api_host: editingMerchant.api_host,
      sub_account_id: editingMerchant.sub_account_id,
      default_product_code: editingMerchant.default_product_code,
      default_card_material: editingMerchant.default_card_material,
      default_currency: editingMerchant.default_currency,
      environment: editingMerchant.environment,
      status: editingMerchant.status,
      notes: editingMerchant.notes,
    })
  }, [editingMerchant, form, formVisible])

  useEffect(() => {
    if (!mockVisible) {
      return
    }
    mockForm.setFieldsValue({
      event: 'CARD_TRANSACTION',
      transactionType: 'AUTHORIZATION',
      transactionState: 'APPROVED',
      indicator: 'debit',
      externalTransactionId: createMockTxID(),
      createdDate: formatNow(),
      confirmedTime: formatNow(),
    })
  }, [mockForm, mockVisible])

  const selectedEvent = Form.useWatch('event', mockForm)
  const selectedTransactionType = Form.useWatch('transactionType', mockForm)

  useEffect(() => {
    if (!mockVisible || selectedEvent !== 'CARD_TRANSACTION') {
      return
    }
    const options = TX_STATE_OPTIONS_BY_TYPE[selectedTransactionType || 'AUTHORIZATION'] || []
    const currentState = mockForm.getFieldValue('transactionState')
    if (!options.some(option => option.value === currentState)) {
      mockForm.setFieldValue('transactionState', options[0]?.value)
    }
    const indicatorMeta = TX_INDICATOR_META_BY_TYPE[selectedTransactionType || 'AUTHORIZATION']
    if (indicatorMeta) {
      mockForm.setFieldValue('indicator', indicatorMeta.value)
    }
    if (cardInfo?.currency) {
      mockForm.setFieldValue('currency', cardInfo.currency)
    }
    if (selectedTransactionType === 'AUTHORIZATION') {
      mockForm.setFieldValue('originalExternalTransactionId', undefined)
    }
  }, [cardInfo?.currency, mockForm, mockVisible, selectedEvent, selectedTransactionType])

  const merchants = data?.items || []

  const columns: ColumnsType<CardMerchant> = [
    {
      title: '卡商名称',
      dataIndex: 'merchant_name',
      key: 'merchant_name',
      width: 180,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      title: 'API Key',
      dataIndex: 'api_key',
      key: 'api_key',
      width: 180,
      render: (value: string) => (
        <Text copyable={{ text: value }} className="font-mono text-xs">
          {value}
        </Text>
      ),
    },
    {
      title: 'API 域名',
      dataIndex: 'api_host',
      key: 'api_host',
      width: 220,
      ellipsis: true,
    },
    {
      title: '子账户',
      dataIndex: 'sub_account_id',
      key: 'sub_account_id',
      width: 160,
      render: (value?: string) => value || '-',
    },
    {
      title: '默认产品',
      dataIndex: 'default_product_code',
      key: 'default_product_code',
      width: 120,
      render: (value?: string) => value || '-',
    },
    {
      title: '默认币种',
      dataIndex: 'default_currency',
      key: 'default_currency',
      width: 100,
      render: (value?: string) => value || '-',
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      width: 100,
      render: (value: string) => <Tag color={value === 'prod' ? 'green' : 'orange'}>{value === 'prod' ? '生产' : '沙盒'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: number) => <Tag color={value === 1 ? 'success' : 'default'}>{value === 1 ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => {
        const items = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: '编辑',
            onClick: () => {
              setEditingMerchant(record)
              setFormVisible(true)
            },
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            danger: true,
            label: '删除',
            onClick: () => {
              Modal.confirm({
                title: '确认删除',
                content: `确定删除卡商“${record.merchant_name}”吗？`,
                okText: '确定',
                okType: 'danger',
                cancelText: '取消',
                onOk: () => deleteMutation.mutate(record.id),
              })
            },
          },
        ]

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (editingMerchant) {
      await updateMutation.mutateAsync({
        id: editingMerchant.id,
        payload: {
          merchant_name: values.merchant_name,
          api_key: values.api_key,
          api_secret: values.api_secret || undefined,
          signature_key: values.signature_key || undefined,
          api_host: values.api_host,
          sub_account_id: values.sub_account_id,
          default_product_code: values.default_product_code,
          default_card_material: values.default_card_material,
          default_currency: values.default_currency,
          environment: values.environment,
          status: values.status,
          webhook_secret: values.webhook_secret,
          notes: values.notes || null,
        },
      })
      return
    }

    await createMutation.mutateAsync({
      merchant_name: values.merchant_name,
      api_key: values.api_key,
      api_secret: values.api_secret,
      signature_key: values.signature_key,
      api_host: values.api_host,
      sub_account_id: values.sub_account_id,
      default_product_code: values.default_product_code,
      default_card_material: values.default_card_material,
      default_currency: values.default_currency,
      environment: values.environment,
      webhook_secret: values.webhook_secret,
      notes: values.notes || null,
    })
  }

  const handleQueryCard = async () => {
    const cardId = mockForm.getFieldValue('cardId')
    if (!cardId) {
      message.warning('请先输入卡ID')
      return
    }
    await queryCardMutation.mutateAsync(cardId)
  }

  const resetMockModal = () => {
    setMockVisible(false)
    setCardInfo(null)
    setMockResult(null)
    mockForm.resetFields()
  }

  const buildMockPayload = (values: Record<string, any>) => {
    switch (values.event) {
      case 'CARD_STATUS_CHANGE':
        return {
          previousCardStatus: values.previousCardStatus,
          newCardStatus: values.newCardStatus,
          trackingNo: values.trackingNo,
          truncatedCardNumber: values.truncatedCardNumber,
          referenceNo: values.referenceNo,
        }
      case 'CARD_DELIVERY':
        return {
          trackingNo: values.trackingNo,
          truncatedCardNumber: values.truncatedCardNumber,
          referenceNo: values.referenceNo,
        }
      case 'CARD_SETTING':
        return {
          autoDebitEnabled: values.autoDebitEnabled,
          cardLimitEnabled: values.cardLimitEnabled,
          transactionLimit: values.transactionLimit,
          monthlyLimit: values.monthlyLimit,
          truncatedCardNumber: values.truncatedCardNumber,
          referenceNo: values.referenceNo,
        }
      case 'CARD_TRANSACTION':
      default:
        return {
          transactionType: values.transactionType,
          transactionState: values.transactionState,
          amount: values.amount,
          currency: values.currency,
          referenceNo: values.referenceNo,
          externalTransactionId: values.externalTransactionId,
          originalExternalTransactionId: values.originalExternalTransactionId,
          indicator: values.indicator,
          merchantName: values.merchantName,
          transactionDesc: values.transactionDesc,
          acquirerReferenceNo: values.acquirerReferenceNo,
          confirmedTime: values.confirmedTime,
          createdDate: values.createdDate,
        }
    }
  }

  const handleSubmitMock = async () => {
    const values = await mockForm.validateFields()
    if (!cardInfo) {
      message.warning('请先查询卡信息')
      return
    }
    if (cardInfo.merchant_environment !== 'sandbox') {
      message.error('当前卡关联的卡商非沙盒环境，无权限执行 Mock')
      return
    }

    await submitMockMutation.mutateAsync({
      card_id: values.cardId,
      event: values.event,
      payload: buildMockPayload(values),
    })
  }

  const renderEventFields = () => {
    switch (selectedEvent) {
      case 'CARD_STATUS_CHANGE':
        return (
          <>
            <Form.Item name="previousCardStatus" label="原卡状态">
              <Input placeholder="默认取当前卡状态" />
            </Form.Item>
            <Form.Item name="newCardStatus" label="新卡状态" rules={[{ required: true, message: '请输入新卡状态' }]}>
              <Input placeholder="例如 1" />
            </Form.Item>
            <Form.Item name="trackingNo" label="物流单号">
              <Input />
            </Form.Item>
            <Form.Item name="truncatedCardNumber" label="脱敏卡号">
              <Input placeholder="例如 ****1234" />
            </Form.Item>
          </>
        )
      case 'CARD_DELIVERY':
        return (
          <>
            <Form.Item name="trackingNo" label="物流单号">
              <Input />
            </Form.Item>
            <Form.Item name="truncatedCardNumber" label="脱敏卡号">
              <Input placeholder="例如 ****1234" />
            </Form.Item>
          </>
        )
      case 'CARD_SETTING':
        return (
          <>
            <Form.Item name="autoDebitEnabled" label="自动扣款开关" rules={[{ required: true, message: '请选择自动扣款开关' }]}>
              <Select options={yesNoOptions} />
            </Form.Item>
            <Form.Item name="cardLimitEnabled" label="卡限额开关" rules={[{ required: true, message: '请选择卡限额开关' }]}>
              <Select options={yesNoOptions} />
            </Form.Item>
            <Form.Item name="transactionLimit" label="单笔限额">
              <Input />
            </Form.Item>
            <Form.Item name="monthlyLimit" label="月限额">
              <Input />
            </Form.Item>
            <Form.Item name="truncatedCardNumber" label="脱敏卡号">
              <Input placeholder="例如 ****1234" />
            </Form.Item>
          </>
        )
      case 'CARD_TRANSACTION':
      default:
        const stateOptions = TX_STATE_OPTIONS_BY_TYPE[selectedTransactionType || 'AUTHORIZATION'] || []
        const indicatorMeta = TX_INDICATOR_META_BY_TYPE[selectedTransactionType || 'AUTHORIZATION']
        const showOriginalExternalTransactionId = selectedTransactionType === 'PRESENTMENT' || selectedTransactionType === 'REVERSAL' || selectedTransactionType === 'REFUND'
        const showAmountAndCurrency = selectedTransactionType === 'AUTHORIZATION' || selectedTransactionType === 'PRESENTMENT' || selectedTransactionType === 'REFUND'
        const showMerchantInfo = selectedTransactionType === 'AUTHORIZATION' || selectedTransactionType === 'PRESENTMENT' || selectedTransactionType === 'REFUND'
        return (
          <>
            <Space className="w-full" size="large" align="start">
              <Form.Item name="transactionType" label="交易类型" rules={[{ required: true, message: '请选择交易类型' }]} className="min-w-[220px]">
                <Select options={TX_TYPE_OPTIONS} />
              </Form.Item>
              <Form.Item name="transactionState" label="交易状态" rules={[{ required: true, message: '请选择交易状态' }]} className="min-w-[220px]">
                <Select options={stateOptions} />
              </Form.Item>
              <Form.Item label="借贷方向" className="min-w-[180px]">
                <Tag color={indicatorMeta?.color || 'default'}>{indicatorMeta?.label || '-'}</Tag>
              </Form.Item>
            </Space>
            <Form.Item name="indicator" hidden>
              <Input />
            </Form.Item>
            {showAmountAndCurrency ? (
              <Space className="w-full" size="large" align="start">
                <Form.Item name="amount" label="交易金额" rules={[{ required: true, message: '请输入交易金额' }]} className="min-w-[220px]">
                  <Input />
                </Form.Item>
                <Form.Item name="currency" label="币种" rules={[{ required: true, message: '请输入币种' }]} className="min-w-[180px]">
                  <Input />
                </Form.Item>
              </Space>
            ) : null}
            <Form.Item name="externalTransactionId" label="交易流水号" rules={[{ required: true, message: '请输入交易流水号' }]}>
              <Input
                addonAfter={
                  <Button
                    type="link"
                    onClick={() => mockForm.setFieldValue('externalTransactionId', createMockTxID())}
                  >
                    重新生成
                  </Button>
                }
              />
            </Form.Item>
            {showOriginalExternalTransactionId ? (
              <Form.Item
                name="originalExternalTransactionId"
                label="原始交易流水号"
                rules={[{ required: true, message: '请输入原始交易流水号' }]}
              >
                <Input placeholder="关联原授权交易号" />
              </Form.Item>
            ) : null}
            {showMerchantInfo ? (
              <>
                <Form.Item name="merchantName" label="商户名称">
                  <Input />
                </Form.Item>
                <Form.Item name="transactionDesc" label="交易描述">
                  <Input />
                </Form.Item>
              </>
            ) : null}
            <Form.Item name="acquirerReferenceNo" label="收单参考号">
              <Input />
            </Form.Item>
            <Space className="w-full" size="large" align="start">
              <Form.Item name="createdDate" label="创建时间" className="min-w-[240px]">
                <Input />
              </Form.Item>
              <Form.Item name="confirmedTime" label="确认时间" className="min-w-[240px]">
                <Input />
              </Form.Item>
            </Space>
          </>
        )
    }
  }

  const cardStatusMeta = cardInfo ? getCardStatusMeta(cardInfo.status) : null

  return (
    <>
      <Helmet>
        <title>卡商管理 - U卡服务管理系统</title>
      </Helmet>

      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Title level={3} className="!mb-1">
                卡商管理
              </Title>
              <Text type="secondary">统一维护全局卡商配置，供各租户卡业务复用。</Text>
            </div>
            <Space>
              <Button
                onClick={() => {
                  setMockVisible(true)
                }}
              >
                Webhook Mock
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingMerchant(null)
                  setFormVisible(true)
                }}
              >
                新增卡商
              </Button>
            </Space>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <Search
              allowClear
              placeholder="搜索卡商名称"
              style={{ maxWidth: 320 }}
              onSearch={(search) => setParams(prev => ({ ...prev, page: 1, search }))}
            />
            <Text type="secondary">共 {data?.total || 0} 条</Text>
          </div>

          <Table<CardMerchant>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={merchants}
            scroll={{ x: 1200 }}
            pagination={{
              current: params.page,
              pageSize: params.pageSize,
              total: data?.total || 0,
              showSizeChanger: true,
              onChange: (page, pageSize) => setParams(prev => ({ ...prev, page, pageSize })),
            }}
          />
        </Card>

        <Modal
          destroyOnHidden
          open={formVisible}
          title={editingMerchant ? '编辑卡商' : '新增卡商'}
          okText={editingMerchant ? '保存' : '创建'}
          cancelText="取消"
          onCancel={() => {
            setFormVisible(false)
            setEditingMerchant(null)
          }}
          onOk={() => void handleSubmit()}
          confirmLoading={createMutation.isPending || updateMutation.isPending}
          width={720}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="merchant_name" label="卡商名称" rules={[{ required: true, message: '请输入卡商名称' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="api_key" label="API Key" rules={[{ required: true, message: '请输入 API Key' }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="api_secret"
              label="API Secret"
              rules={[{ required: !editingMerchant, message: '请输入 API Secret' }]}
            >
              <Input.Password placeholder={editingMerchant ? '留空表示不更新' : ''} />
            </Form.Item>
            <Form.Item
              name="signature_key"
              label="签名密钥"
              rules={[{ required: !editingMerchant, message: '请输入签名密钥' }]}
            >
              <Input.Password placeholder={editingMerchant ? '留空表示不更新' : ''} />
            </Form.Item>
            <Form.Item name="webhook_secret" label="Webhook Secret">
              <Input.Password placeholder={editingMerchant ? '留空表示不更新' : ''} />
            </Form.Item>
            <Form.Item name="api_host" label="API 域名" rules={[{ required: true, message: '请输入 API 域名' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="sub_account_id" label="子账户 ID">
              <Input />
            </Form.Item>
            <Space className="w-full" size="large" align="start">
              <Form.Item name="default_product_code" label="默认产品代码" className="min-w-[180px]">
                <Input />
              </Form.Item>
              <Form.Item name="default_card_material" label="默认卡介质" initialValue={3} className="min-w-[180px]">
                <Select
                  options={[
                    { label: '实体卡(2)', value: 2 },
                    { label: '虚拟卡(3)', value: 3 },
                  ]}
                />
              </Form.Item>
              <Form.Item name="default_currency" label="默认币种" initialValue="USD" className="min-w-[140px]">
                <Input />
              </Form.Item>
            </Space>
            <Space className="w-full" size="large" align="start">
              <Form.Item name="environment" label="环境" initialValue="sandbox" className="min-w-[180px]">
                <Select
                  options={[
                    { label: '沙盒', value: 'sandbox' },
                    { label: '生产', value: 'prod' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="status" label="状态" initialValue={1} className="min-w-[140px]">
                <Select
                  options={[
                    { label: '启用', value: 1 },
                    { label: '禁用', value: 0 },
                  ]}
                />
              </Form.Item>
            </Space>
            <Form.Item name="notes" label="备注">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          destroyOnHidden
          open={mockVisible}
          title="Webhook Mock"
          okText="提交 Mock"
          cancelText="取消"
          onCancel={resetMockModal}
          onOk={() => void handleSubmitMock()}
          confirmLoading={submitMockMutation.isPending}
          width={900}
        >
          <Form form={mockForm} layout="vertical">
            <Card size="small" title="卡片查询" className="mb-4">
              <Space.Compact className="w-full">
                <Form.Item name="cardId" noStyle rules={[{ required: true, message: '请输入卡ID' }]}>
                  <Input placeholder="请输入卡ID" />
                </Form.Item>
                <Button loading={queryCardMutation.isPending} onClick={() => void handleQueryCard()}>
                  查询卡信息
                </Button>
              </Space.Compact>
            </Card>

            <Card size="small" title="卡片基础信息" className="mb-4">
              {cardInfo ? (
                <Descriptions size="small" column={2}>
                  <Descriptions.Item label="卡ID">{cardInfo.external_card_id}</Descriptions.Item>
                  <Descriptions.Item label="参考号">{cardInfo.reference_no}</Descriptions.Item>
                  <Descriptions.Item label="卡后四位">{cardInfo.card_number_last4 || '-'}</Descriptions.Item>
                  <Descriptions.Item label="用户ID">{cardInfo.user_id}</Descriptions.Item>
                  <Descriptions.Item label="币种">{cardInfo.currency}</Descriptions.Item>
                  <Descriptions.Item label="当前状态">
                    {cardStatusMeta ? <Tag color={cardStatusMeta.color}>{cardStatusMeta.label}</Tag> : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="当前卡商名称">{cardInfo.merchant_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="当前卡商环境">
                    <Tag color={cardInfo.merchant_environment === 'sandbox' ? 'orange' : 'green'}>
                      {cardInfo.merchant_environment || '-'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="卡账户可用余额">{cardInfo.account_amount}</Descriptions.Item>
                  <Descriptions.Item label="卡账户冻结余额">{cardInfo.account_held_amount}</Descriptions.Item>
                  <Descriptions.Item label="是否存在卡账户">
                    <Tag color={cardInfo.has_card_account ? 'success' : 'default'}>
                      {cardInfo.has_card_account ? '是' : '否'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Text type="secondary">请先输入卡ID并查询卡信息。</Text>
              )}
            </Card>

            <Card size="small" title="Mock 参数">
              <Form.Item name="event" label="事件类型" rules={[{ required: true, message: '请选择事件类型' }]}>
                <Select options={EVENT_OPTIONS as any} />
              </Form.Item>
              <Form.Item name="referenceNo" hidden>
                <Input />
              </Form.Item>
              {renderEventFields()}
            </Card>
          </Form>

          {mockResult ? (
            <Card size="small" title="提交结果" className="mt-4">
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="事件类型">{mockResult.event}</Descriptions.Item>
                <Descriptions.Item label="卡ID">{mockResult.card_id}</Descriptions.Item>
                <Descriptions.Item label="参考号">{mockResult.reference_no}</Descriptions.Item>
                <Descriptions.Item label="卡商环境">{mockResult.merchant_environment || '-'}</Descriptions.Item>
                <Descriptions.Item label="结果">{mockResult.message}</Descriptions.Item>
                <Descriptions.Item label="提交时间">{mockResult.submitted_at}</Descriptions.Item>
              </Descriptions>
              <div className="mt-3">
                <Text strong>请求 Payload</Text>
                <pre className="mt-2 max-h-80 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
                  {JSON.stringify(mockResult.request_payload, null, 2)}
                </pre>
              </div>
            </Card>
          ) : null}
        </Modal>
      </div>
    </>
  )
}

export default CardMerchantListPage
