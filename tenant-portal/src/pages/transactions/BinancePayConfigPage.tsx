import React, { useMemo, useState } from 'react'
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { TENANT_PERMISSION } from '@/constants/rbac'
import { paymentAdminService } from '@/services'
import { useAuthStore } from '@/stores/authStore'
import type {
  BinancePayOverview,
  BinancePayProvider,
  CreateBinancePayProviderRequest,
  UpdateBinancePayProviderRequest,
} from '@shared/types'

const { Title, Paragraph, Text } = Typography
const CURRENT_PROVIDER_LABEL = 'Binance Pay'

type ProviderFilters = {
  page: number
  pageSize: number
  search: string
  environment: string
  status: string
}

type ProviderFormValues = {
  provider_name: string
  merchant_id: string
  certificate_sn: string
  api_secret?: string
  api_host: string
  environment: 'prod' | 'sandbox'
  webhook_endpoint?: string
  return_url?: string
  cancel_url?: string
  allowed_currencies: string[]
  status: number
  remarks?: string
}

const defaultOverview: BinancePayOverview = {
  provider_count: 0,
  active_provider_count: 0,
  pending_order_count: 0,
  credited_order_count: 0,
  closed_order_count: 0,
  success_webhook_count: 0,
  failed_webhook_count: 0,
  total_credited_amount: '0',
}

const shellStyle: React.CSSProperties = {
  minHeight: '100%',
  padding: 24,
  background:
    'radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.18), transparent 24%), radial-gradient(circle at 100% 0%, rgba(14, 165, 233, 0.12), transparent 20%), linear-gradient(180deg, #06152f 0%, #0a1d42 34%, #edf4ff 34%, #f6f9ff 100%)',
}

const panelStyle: React.CSSProperties = {
  borderRadius: 28,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'linear-gradient(135deg, rgba(6,21,47,0.97) 0%, rgba(10,29,66,0.92) 55%, rgba(15,54,115,0.88) 100%)',
  boxShadow: '0 24px 60px rgba(2, 6, 23, 0.28)',
  overflow: 'hidden',
}

const statCardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid rgba(191, 219, 254, 0.14)',
  background: 'linear-gradient(180deg, rgba(8,24,53,0.94), rgba(15,49,104,0.92))',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
}

const sectionCardStyle: React.CSSProperties = {
  borderRadius: 26,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(255,255,255,0.96)',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
}

function formatTime(value?: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'
}

function normalizeOptionalString(value?: string) {
  const next = value?.trim()
  return next ? next : ''
}

const BinancePayConfigPage: React.FC = () => {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const canManage = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.TRANSACTIONS_MANAGE))
  const [form] = Form.useForm<ProviderFormValues>()
  const [editing, setEditing] = useState<BinancePayProvider | null>(null)
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<ProviderFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    environment: '',
    status: '',
  })

  const params = useMemo(
    () => ({
      page: filters.page,
      pageSize: filters.pageSize,
      search: filters.search || undefined,
      environment: filters.environment || undefined,
      status: filters.status ? Number(filters.status) : undefined,
    }),
    [filters],
  )

  const overviewQuery = useQuery({
    queryKey: ['binance-pay-overview'],
    queryFn: () => paymentAdminService.getOverview(),
  })

  const providerQuery = useQuery({
    queryKey: ['binance-pay-providers', params],
    queryFn: () => paymentAdminService.getProviders(params),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateBinancePayProviderRequest) => paymentAdminService.createProvider(payload),
    onSuccess: () => {
      message.success('配置创建成功')
      handleClose()
      void queryClient.invalidateQueries({ queryKey: ['binance-pay-overview'] })
      void queryClient.invalidateQueries({ queryKey: ['binance-pay-providers'] })
    },
    onError: (error: Error) => message.error(error.message || '配置创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBinancePayProviderRequest }) =>
      paymentAdminService.updateProvider(id, payload),
    onSuccess: () => {
      message.success('配置更新成功')
      handleClose()
      void queryClient.invalidateQueries({ queryKey: ['binance-pay-overview'] })
      void queryClient.invalidateQueries({ queryKey: ['binance-pay-providers'] })
    },
    onError: (error: Error) => message.error(error.message || '配置更新失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentAdminService.deleteProvider(id),
    onSuccess: () => {
      message.success('配置删除成功')
      void queryClient.invalidateQueries({ queryKey: ['binance-pay-overview'] })
      void queryClient.invalidateQueries({ queryKey: ['binance-pay-providers'] })
    },
    onError: (error: Error) => message.error(error.message || '配置删除失败'),
  })

  const overview = overviewQuery.data || defaultOverview
  const rows = providerQuery.data?.data?.items || []
  const total = providerQuery.data?.data?.total || 0

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const openEditor = (row?: BinancePayProvider) => {
    setEditing(row || null)
    form.resetFields()
    form.setFieldsValue({
      provider_name: row?.provider_name || CURRENT_PROVIDER_LABEL,
      merchant_id: row?.merchant_id || '',
      certificate_sn: row?.certificate_sn || '',
      api_secret: '',
      api_host: row?.api_host || 'https://bpay.binanceapi.com',
      environment: row?.environment || 'prod',
      webhook_endpoint: row?.webhook_endpoint || '',
      return_url: row?.return_url || '',
      cancel_url: row?.cancel_url || '',
      allowed_currencies: row?.allowed_currencies || ['USDT'],
      status: row?.status ?? 1,
      remarks: row?.remarks || '',
    })
    setOpen(true)
  }

  const submit = async () => {
    const values = await form.validateFields()
    const payload: UpdateBinancePayProviderRequest = {
      provider_name: values.provider_name.trim(),
      merchant_id: values.merchant_id.trim(),
      certificate_sn: values.certificate_sn.trim(),
      api_host: values.api_host.trim(),
      environment: values.environment,
      webhook_endpoint: normalizeOptionalString(values.webhook_endpoint),
      return_url: normalizeOptionalString(values.return_url),
      cancel_url: normalizeOptionalString(values.cancel_url),
      allowed_currencies: (values.allowed_currencies || []).map((item) => item.trim()).filter(Boolean),
      status: values.status,
      remarks: normalizeOptionalString(values.remarks),
    }

    const apiSecret = normalizeOptionalString(values.api_secret)
    if (apiSecret) {
      payload.api_secret = apiSecret
    }

    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload })
      return
    }

    await createMutation.mutateAsync({
      ...(payload as CreateBinancePayProviderRequest),
      api_secret: apiSecret,
    })
  }

  const columns: ColumnsType<BinancePayProvider> = [
    {
      title: '机构配置',
      key: 'provider',
      width: 260,
      render: (_, row) => (
        <Space direction="vertical" size={4}>
          <Text strong>{row.provider_name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            商户号 {row.merchant_id}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            证书 SN {row.certificate_sn}
          </Text>
        </Space>
      ),
    },
    {
      title: '环境与状态',
      key: 'status',
      width: 140,
      render: (_, row) => (
        <Space direction="vertical" size={6}>
          <Tag color={row.environment === 'prod' ? 'geekblue' : 'gold'}>
            {row.environment === 'prod' ? '生产' : '沙盒'}
          </Tag>
          <Tag color={row.status === 1 ? 'success' : 'default'}>{row.status === 1 ? '启用' : '禁用'}</Tag>
        </Space>
      ),
    },
    {
      title: '接口地址',
      dataIndex: 'api_host',
      key: 'api_host',
      width: 220,
      render: (value: string) => <Text copyable={{ text: value }}>{value}</Text>,
    },
    {
      title: '支持币种',
      dataIndex: 'allowed_currencies',
      key: 'allowed_currencies',
      width: 200,
      render: (currencies: string[]) => (
        <Space wrap>
          {(currencies || []).map((item) => (
            <Tag key={item} color="cyan">
              {item}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '回调地址',
      dataIndex: 'webhook_endpoint',
      key: 'webhook_endpoint',
      width: 260,
      render: (value?: string | null) => (value ? <Text copyable={{ text: value }}>{value}</Text> : '-'),
    },
    {
      title: '密钥掩码',
      dataIndex: 'api_secret_masked',
      key: 'api_secret_masked',
      width: 140,
      render: (value?: string | null) => value || '未展示',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (value: string) => formatTime(value),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, row) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} disabled={!canManage} onClick={() => openEditor(row)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该配置？"
            description="删除后当前支付渠道将无法继续用于创建支付订单。"
            onConfirm={() => deleteMutation.mutate(row.id)}
            disabled={!canManage}
          >
            <Button type="link" danger icon={<DeleteOutlined />} disabled={!canManage}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const summaryCards = [
    { title: '配置总数', value: overview.provider_count, color: '#f8fafc' },
    { title: '启用配置', value: overview.active_provider_count, color: '#7dd3fc' },
    { title: '待入账订单', value: overview.pending_order_count, color: '#fde68a' },
    { title: '累计入账', value: overview.total_credited_amount, color: '#86efac' },
    { title: '成功回调', value: overview.success_webhook_count, color: '#c4b5fd' },
    { title: '失败回调', value: overview.failed_webhook_count, color: '#fda4af' },
  ]

  return (
    <div style={shellStyle}>
      <Card bordered={false} style={{ ...panelStyle, marginBottom: 24 }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={10}>
            <Space direction="vertical" size={14}>
              <Tag color="processing" style={{ width: 'fit-content', padding: '6px 14px', borderRadius: 999 }}>
                Payment Config Matrix
              </Tag>
              <Title level={2} style={{ color: '#f8fbff', margin: 0 }}>
                租户支付配置中心
              </Title>
              <Paragraph style={{ color: 'rgba(226,232,240,0.86)', marginBottom: 0 }}>
                统一维护支付渠道商户号、证书序列号、API Host 与回调地址。
              </Paragraph>
              <Space wrap>
                <Button type="primary" icon={<PlusOutlined />} disabled={!canManage} onClick={() => openEditor()}>
                  新增配置
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    void overviewQuery.refetch()
                    void providerQuery.refetch()
                  }}
                >
                  刷新数据
                </Button>
              </Space>
            </Space>
          </Col>
          <Col xs={24} xl={14}>
            <Row gutter={[16, 16]}>
              {summaryCards.map((item) => (
                <Col xs={12} md={8} key={item.title}>
                  <Card bordered={false} style={statCardStyle}>
                    <Statistic
                      title={<span style={{ color: 'rgba(191,219,254,0.82)' }}>{item.title}</span>}
                      value={item.value}
                      valueStyle={{ color: item.color, fontSize: 26 }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xxl={7}>
          <Card bordered={false} style={panelStyle}>
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              <div>
                <Text style={{ color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1.4 }}>Filter Dock</Text>
                <Title level={4} style={{ color: '#fff', margin: '8px 0 0' }}>
                  快速筛选配置
                </Title>
              </div>
              <Input
                allowClear
                size="large"
                placeholder="搜索机构 / 商户号 / 证书 SN"
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    page: 1,
                    search: event.target.value,
                  }))
                }
              />
              <Select
                size="large"
                value={filters.environment}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    page: 1,
                    environment: value,
                  }))
                }
                options={[
                  { value: '', label: '全部环境' },
                  { value: 'prod', label: '生产环境' },
                  { value: 'sandbox', label: '沙盒环境' },
                ]}
              />
              <Select
                size="large"
                value={filters.status}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    page: 1,
                    status: value,
                  }))
                }
                options={[
                  { value: '', label: '全部状态' },
                  { value: '1', label: '启用' },
                  { value: '0', label: '禁用' },
                ]}
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} xxl={17}>
          <Card
            bordered={false}
            style={sectionCardStyle}
            title="支付渠道配置列表"
            extra={<Text type="secondary">共 {total} 条</Text>}
          >
            <Table
              rowKey="id"
              loading={providerQuery.isLoading}
              columns={columns}
              dataSource={rows}
              locale={{
                emptyText: <Empty description="暂无支付机构配置" />,
              }}
              scroll={{ x: 1500 }}
              pagination={{
                current: filters.page,
                pageSize: filters.pageSize,
                total,
                showSizeChanger: true,
                onChange: (page, pageSize) => setFilters((prev) => ({ ...prev, page, pageSize })),
              }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={editing ? '编辑支付渠道配置' : '新增支付渠道配置'}
        open={open}
        onCancel={handleClose}
        onOk={() => void submit()}
        width={860}
        destroyOnClose
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="渠道显示名称" name="provider_name" rules={[{ required: true, message: '请输入渠道显示名称' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="商户号" name="merchant_id" rules={[{ required: true, message: '请输入商户号' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Certificate SN" name="certificate_sn" rules={[{ required: true, message: '请输入证书序列号' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={editing ? 'API Secret（留空则不更新）' : 'API Secret'}
                name="api_secret"
                rules={editing ? undefined : [{ required: true, message: '请输入 API Secret' }]}
              >
                <Input.Password />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="API Host" name="api_host" rules={[{ required: true, message: '请输入 API Host' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="环境" name="environment" rules={[{ required: true, message: '请选择环境' }]}>
                <Select options={[{ value: 'prod', label: '生产' }, { value: 'sandbox', label: '沙盒' }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
                <Select options={[{ value: 1, label: '启用' }, { value: 0, label: '禁用' }]} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="支持币种"
                name="allowed_currencies"
                rules={[{ required: true, message: '请至少填写一个币种' }]}
              >
                <Select
                  mode="tags"
                  tokenSeparators={[',', ' ']}
                  options={[
                    { value: 'USDT', label: 'USDT' },
                    { value: 'USDC', label: 'USDC' },
                    { value: 'BTC', label: 'BTC' },
                    { value: 'ETH', label: 'ETH' },
                    { value: 'BNB', label: 'BNB' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Webhook 回调地址" name="webhook_endpoint">
                <Input placeholder="https://tenant-api.example.com/api/v1/payments/binance-pay/webhook" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="成功跳转地址" name="return_url">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="取消跳转地址" name="cancel_url">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="备注" name="remarks">
                <Input.TextArea rows={3} showCount maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default BinancePayConfigPage
