import React, { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { paymentAdminService } from '@/services'
import type {
  BinancePayOrderRecord,
  BinancePayOverview,
  BinancePayWebhookEvent,
} from '@shared/types'

const { Title, Paragraph, Text } = Typography

type OrderFilters = {
  page: number
  pageSize: number
  search: string
  status: string
}

type WebhookFilters = {
  page: number
  pageSize: number
  search: string
  verify_status: string
  process_status: string
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
    'radial-gradient(circle at 15% 10%, rgba(37,99,235,0.16), transparent 22%), radial-gradient(circle at 85% 16%, rgba(56,189,248,0.16), transparent 24%), linear-gradient(180deg, #081935 0%, #0b244d 38%, #eef4ff 38%, #f8fbff 100%)',
}

const mastheadStyle: React.CSSProperties = {
  borderRadius: 30,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'linear-gradient(140deg, rgba(5,15,36,0.98) 0%, rgba(8,26,59,0.96) 44%, rgba(9,50,121,0.90) 100%)',
  boxShadow: '0 26px 64px rgba(2, 6, 23, 0.28)',
  overflow: 'hidden',
}

const blueSurfaceStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid rgba(191, 219, 254, 0.14)',
  background: 'linear-gradient(180deg, rgba(8,24,53,0.94), rgba(12,42,95,0.92))',
}

const whitePanelStyle: React.CSSProperties = {
  borderRadius: 26,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(255,255,255,0.97)',
  boxShadow: '0 20px 44px rgba(15, 23, 42, 0.08)',
}

function formatTime(value?: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'
}

function renderOrderStatus(status: string) {
  const colorMap: Record<string, string> = {
    INIT: 'default',
    PENDING: 'processing',
    PAID: 'blue',
    PAID_NOT_CREDITED: 'gold',
    CREDITED: 'success',
    CLOSED: 'default',
    FAILED: 'error',
  }

  const labelMap: Record<string, string> = {
    INIT: '初始化',
    PENDING: '待支付',
    PAID: '已支付',
    PAID_NOT_CREDITED: '已支付待入账',
    CREDITED: '已入账',
    CLOSED: '已关闭',
    FAILED: '失败',
  }

  return <Tag color={colorMap[status] || 'default'}>{labelMap[status] || status}</Tag>
}

function renderWebhookStatus(status: string) {
  const colorMap: Record<string, string> = {
    PENDING: 'processing',
    SUCCESS: 'success',
    FAILED: 'error',
  }

  return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
}

const orderStatusOptions = [
  { value: '', label: '全部订单状态' },
  { value: 'INIT', label: '初始化' },
  { value: 'PENDING', label: '待支付' },
  { value: 'PAID', label: '已支付' },
  { value: 'PAID_NOT_CREDITED', label: '已支付待入账' },
  { value: 'CREDITED', label: '已入账' },
  { value: 'CLOSED', label: '已关闭' },
  { value: 'FAILED', label: '失败' },
]

const webhookStatusOptions = [
  { value: '', label: '全部状态' },
  { value: 'PENDING', label: '处理中' },
  { value: 'SUCCESS', label: '成功' },
  { value: 'FAILED', label: '失败' },
]

const BinancePayQueryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'webhooks'>('orders')
  const [payloadOpen, setPayloadOpen] = useState(false)
  const [payloadContent, setPayloadContent] = useState('')
  const [payloadTitle, setPayloadTitle] = useState('')
  const [orderFilters, setOrderFilters] = useState<OrderFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    status: '',
  })
  const [webhookFilters, setWebhookFilters] = useState<WebhookFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    verify_status: '',
    process_status: '',
  })

  const orderParams = useMemo(
    () => ({
      page: orderFilters.page,
      pageSize: orderFilters.pageSize,
      search: orderFilters.search || undefined,
      status: orderFilters.status || undefined,
    }),
    [orderFilters],
  )

  const webhookParams = useMemo(
    () => ({
      page: webhookFilters.page,
      pageSize: webhookFilters.pageSize,
      search: webhookFilters.search || undefined,
      verify_status: webhookFilters.verify_status || undefined,
      process_status: webhookFilters.process_status || undefined,
    }),
    [webhookFilters],
  )

  const overviewQuery = useQuery({
    queryKey: ['binance-pay-overview'],
    queryFn: () => paymentAdminService.getOverview(),
  })

  const ordersQuery = useQuery({
    queryKey: ['binance-pay-orders', orderParams],
    queryFn: () => paymentAdminService.getOrders(orderParams),
  })

  const webhooksQuery = useQuery({
    queryKey: ['binance-pay-webhooks', webhookParams],
    queryFn: () => paymentAdminService.getWebhookEvents(webhookParams),
  })

  const overview = overviewQuery.data || defaultOverview
  const orderItems = ordersQuery.data?.data?.items || []
  const orderTotal = ordersQuery.data?.data?.total || 0
  const webhookItems = webhooksQuery.data?.data?.items || []
  const webhookTotal = webhooksQuery.data?.data?.total || 0

  const orderColumns: ColumnsType<BinancePayOrderRecord> = [
    {
      title: '订单标识',
      key: 'order_identity',
      width: 260,
      render: (_, row) => (
        <Space direction="vertical" size={3}>
          <Text strong>{row.product_name}</Text>
          <Text code>{row.merchant_trade_no}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            business_id: {row.business_id}
          </Text>
        </Space>
      ),
    },
    {
      title: '金额',
      key: 'amount',
      width: 180,
      render: (_, row) => (
        <Space direction="vertical" size={3}>
          <Text strong>
            {row.order_amount} {row.order_currency || '-'}
          </Text>
          <Text type="secondary">
            实付 {row.pay_amount || '-'} {row.pay_currency || '-'}
          </Text>
        </Space>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 170,
      render: (_, row) => (
        <Space direction="vertical" size={4}>
          {renderOrderStatus(row.order_status)}
          {row.binance_status ? <Tag color="cyan">Binance: {row.binance_status}</Tag> : null}
        </Space>
      ),
    },
    {
      title: '用户 / 交易',
      key: 'user_tx',
      width: 220,
      render: (_, row) => (
        <Space direction="vertical" size={3}>
          <Text copyable={{ text: row.user_id }} style={{ fontSize: 12 }}>
            用户 {row.user_id.slice(0, 8)}...
          </Text>
          <Text copyable={{ text: row.transaction_id || '' }} style={{ fontSize: 12 }}>
            交易号 {row.transaction_id || '-'}
          </Text>
        </Space>
      ),
    },
    {
      title: '时间轨迹',
      key: 'timeline',
      width: 220,
      render: (_, row) => (
        <Space direction="vertical" size={3}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            创建 {formatTime(row.created_at)}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            过期 {formatTime(row.expire_time)}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            入账 {formatTime(row.credited_at)}
          </Text>
        </Space>
      ),
    },
    {
      title: '异常信息',
      dataIndex: 'last_error',
      key: 'last_error',
      width: 260,
      render: (value?: string | null) =>
        value ? (
          <Text type="danger" ellipsis={{ tooltip: value }}>
            {value}
          </Text>
        ) : (
          '-'
        ),
    },
  ]

  const webhookColumns: ColumnsType<BinancePayWebhookEvent> = [
    {
      title: '回调业务',
      key: 'biz',
      width: 220,
      render: (_, row) => (
        <Space direction="vertical" size={3}>
          <Text strong>{row.biz_type || '未知业务'}</Text>
          <Text code>{row.provider_code}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            biz_id: {row.biz_id_str || '-'}
          </Text>
        </Space>
      ),
    },
    {
      title: '验签 / 处理',
      key: 'status',
      width: 180,
      render: (_, row) => (
        <Space direction="vertical" size={6}>
          {renderWebhookStatus(row.verify_status)}
          {renderWebhookStatus(row.process_status)}
        </Space>
      ),
    },
    {
      title: '关联订单',
      key: 'linked',
      width: 220,
      render: (_, row) => (
        <Space direction="vertical" size={3}>
          <Text copyable={{ text: row.merchant_trade_no || '' }} style={{ fontSize: 12 }}>
            商户单号 {row.merchant_trade_no || '-'}
          </Text>
          <Text copyable={{ text: row.prepay_id || '' }} style={{ fontSize: 12 }}>
            prepay_id {row.prepay_id || '-'}
          </Text>
          <Text copyable={{ text: row.transaction_id || '' }} style={{ fontSize: 12 }}>
            tx_id {row.transaction_id || '-'}
          </Text>
        </Space>
      ),
    },
    {
      title: '业务状态',
      key: 'biz_status',
      width: 160,
      render: (_, row) => (
        <Space direction="vertical" size={4}>
          <Tag color="blue">{row.biz_status || 'UNKNOWN'}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            cert_sn: {row.cert_sn || '-'}
          </Text>
        </Space>
      ),
    },
    {
      title: '时间',
      key: 'time',
      width: 220,
      render: (_, row) => (
        <Space direction="vertical" size={3}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            接收 {formatTime(row.received_at)}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            处理 {formatTime(row.processed_at)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Payload',
      key: 'payload',
      width: 120,
      fixed: 'right',
      render: (_, row) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => {
            setPayloadTitle(row.merchant_trade_no || row.id)
            setPayloadContent(row.raw_body || '')
            setPayloadOpen(true)
          }}
        >
          查看
        </Button>
      ),
    },
  ]

  const stats = [
    { title: '待支付订单', value: overview.pending_order_count, color: '#f8fafc' },
    { title: '已入账订单', value: overview.credited_order_count, color: '#86efac' },
    { title: '已关闭订单', value: overview.closed_order_count, color: '#fde68a' },
    { title: '成功回调数', value: overview.success_webhook_count, color: '#7dd3fc' },
    { title: '失败回调数', value: overview.failed_webhook_count, color: '#fda4af' },
  ]

  return (
    <div style={shellStyle}>
      <Card bordered={false} style={{ ...mastheadStyle, marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} xl={8}>
            <Space direction="vertical" size={14}>
              <Tag color="processing" style={{ width: 'fit-content', padding: '6px 14px', borderRadius: 999 }}>
                Payment Ops Search Deck
              </Tag>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                支付管理查询台
              </Title>
              <Paragraph style={{ color: 'rgba(226,232,240,0.85)', marginBottom: 0 }}>
                汇总支付订单进度、回调验签和处理状态。
              </Paragraph>
              <Space wrap>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    void overviewQuery.refetch()
                    if (activeTab === 'orders') {
                      void ordersQuery.refetch()
                    } else {
                      void webhooksQuery.refetch()
                    }
                  }}
                >
                  刷新当前视图
                </Button>
              </Space>
            </Space>
          </Col>
          <Col xs={24} xl={16}>
            <Row gutter={[16, 16]}>
              {stats.map((item) => (
                <Col xs={12} md={8} xl={Math.floor(24 / 5)} key={item.title}>
                  <Card bordered={false} style={blueSurfaceStyle}>
                    <Statistic
                      title={<span style={{ color: 'rgba(191,219,254,0.82)' }}>{item.title}</span>}
                      value={item.value}
                      valueStyle={{ color: item.color, fontSize: 24 }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={whitePanelStyle}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'orders' | 'webhooks')}
          items={[
            {
              key: 'orders',
              label: '支付订单',
              children: (
                <Space direction="vertical" size={20} style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={10}>
                      <Input
                        allowClear
                        size="large"
                        prefix={<SearchOutlined />}
                        placeholder="搜索订单号、流水号或关联记录"
                        value={orderFilters.search}
                        onChange={(event) =>
                          setOrderFilters((prev) => ({
                            ...prev,
                            page: 1,
                            search: event.target.value,
                          }))
                        }
                      />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Select
                        size="large"
                        value={orderFilters.status}
                        options={orderStatusOptions}
                        onChange={(value) =>
                          setOrderFilters((prev) => ({
                            ...prev,
                            page: 1,
                            status: value,
                          }))
                        }
                      />
                    </Col>
                  </Row>
                  <Table
                    rowKey="id"
                    loading={ordersQuery.isLoading}
                    columns={orderColumns}
                    dataSource={orderItems}
                    locale={{ emptyText: <Empty description="暂无支付订单" /> }}
                    scroll={{ x: 1380 }}
                    pagination={{
                      current: orderFilters.page,
                      pageSize: orderFilters.pageSize,
                      total: orderTotal,
                      showSizeChanger: true,
                      onChange: (page, pageSize) =>
                        setOrderFilters((prev) => ({
                          ...prev,
                          page,
                          pageSize,
                        })),
                    }}
                  />
                </Space>
              ),
            },
            {
              key: 'webhooks',
              label: '回调事件',
              children: (
                <Space direction="vertical" size={20} style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={8}>
                      <Input
                        allowClear
                        size="large"
                        prefix={<SearchOutlined />}
                        placeholder="搜索回调关联单号或事件记录"
                        value={webhookFilters.search}
                        onChange={(event) =>
                          setWebhookFilters((prev) => ({
                            ...prev,
                            page: 1,
                            search: event.target.value,
                          }))
                        }
                      />
                    </Col>
                    <Col xs={24} sm={12} lg={5}>
                      <Select
                        size="large"
                        value={webhookFilters.verify_status}
                        options={webhookStatusOptions.map((item) => ({
                          ...item,
                          label: item.value ? `验签${item.label}` : item.label,
                        }))}
                        onChange={(value) =>
                          setWebhookFilters((prev) => ({
                            ...prev,
                            page: 1,
                            verify_status: value,
                          }))
                        }
                      />
                    </Col>
                    <Col xs={24} sm={12} lg={5}>
                      <Select
                        size="large"
                        value={webhookFilters.process_status}
                        options={webhookStatusOptions.map((item) => ({
                          ...item,
                          label: item.value ? `处理${item.label}` : item.label,
                        }))}
                        onChange={(value) =>
                          setWebhookFilters((prev) => ({
                            ...prev,
                            page: 1,
                            process_status: value,
                          }))
                        }
                      />
                    </Col>
                    <Col xs={24} lg={6}>
                      <Card bordered={false} style={{ borderRadius: 18, background: '#eff6ff' }}>
                        <Space direction="vertical" size={2}>
                          <Text strong>回调排查建议</Text>
                          <Text type="secondary">当前渠道验签失败时，优先检查证书序列号、签名头和回调密钥。</Text>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                  <Table
                    rowKey="id"
                    loading={webhooksQuery.isLoading}
                    columns={webhookColumns}
                    dataSource={webhookItems}
                    locale={{ emptyText: <Empty description="暂无支付回调事件" /> }}
                    scroll={{ x: 1320 }}
                    pagination={{
                      current: webhookFilters.page,
                      pageSize: webhookFilters.pageSize,
                      total: webhookTotal,
                      showSizeChanger: true,
                      onChange: (page, pageSize) =>
                        setWebhookFilters((prev) => ({
                          ...prev,
                          page,
                          pageSize,
                        })),
                    }}
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={`Payload 查看: ${payloadTitle}`}
        open={payloadOpen}
        width={720}
        onClose={() => setPayloadOpen(false)}
      >
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#020617',
            color: '#e2e8f0',
            borderRadius: 16,
            padding: 16,
            margin: 0,
            minHeight: 240,
          }}
        >
          {payloadContent || '暂无原始回调内容'}
        </pre>
      </Drawer>
    </div>
  )
}

export default BinancePayQueryPage
