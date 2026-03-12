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
  Badge,
  Modal,
  Descriptions,
  Input,
  message
} from 'antd'
import { 
  SearchOutlined, 
  ReloadOutlined,
  EyeOutlined,
  CopyOutlined,
  DownloadOutlined,
  ClearOutlined,
  RedoOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SendOutlined
} from '@ant-design/icons'
import { logService } from '@/services'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

interface WebhookLog {
  id: string
  webhookId: string
  webhookName: string
  eventType: string
  eventId: string
  url: string
  method: string
  headers: Record<string, string>
  payload: string
  responseStatus: number
  responseBody: string
  responseTime: number
  retryCount: number
  maxRetries: number
  status: 'pending' | 'sent' | 'failed' | 'retrying'
  errorMessage?: string
  createdAt: string
  sentAt?: string
  nextRetryAt?: string
  lastRetryAt?: string
}

interface WebhookLogStats {
  totalWebhooks: number
  totalSent: number
  totalFailed: number
  totalPending: number
  averageResponseTime: number
  successRate: number
  todayWebhooks: number
  todaySent: number
  todayFailed: number
  topEventTypes: Array<{
    eventType: string
    count: number
    successRate: number
  }>
  topWebhooks: Array<{
    webhookName: string
    count: number
    successRate: number
  }>
}

const WebhookLogPage: React.FC = () => {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [stats, setStats] = useState<WebhookLogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchForm] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [logsData, statsData] = await Promise.all([
        logService.getWebhookLogs(),
        logService.getWebhookLogStats()
      ])
      
      setLogs((logsData.items || []).map((log: any) => ({
        id: log.id,
        webhookId: log.webhookId,
        webhookName: log.webhookName || 'Webhook ' + log.webhookId.slice(0, 8),
        eventType: log.eventType,
        eventId: log.eventId,
        url: log.url,
        method: log.method,
        headers: log.headers || {},
        payload: log.payload,
        responseStatus: log.responseStatus,
        responseBody: log.responseBody,
        responseTime: log.responseTime,
        retryCount: log.retryCount,
        maxRetries: log.maxRetries,
        status: log.status as any,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
        sentAt: log.sentAt,
        nextRetryAt: log.nextRetryAt,
        lastRetryAt: log.lastRetryAt
      })))
      setStats({
        totalWebhooks: statsData.data.totalWebhooks,
        totalSent: statsData.data.totalSent,
        totalFailed: statsData.data.totalFailed,
        totalPending: statsData.data.totalPending,
        averageResponseTime: statsData.data.averageResponseTime,
        successRate: statsData.data.successRate,
        todayWebhooks: statsData.data.todayWebhooks,
        todaySent: statsData.data.todaySent,
        todayFailed: statsData.data.todayFailed,
        topEventTypes: statsData.data.topEventTypes || [],
        topWebhooks: statsData.data.topWebhooks || []
      })
    } catch (error) {
      console.error('加载Webhook日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (values: any) => {
    try {
      setLoading(true)
      const params = {
        eventType: values.eventType || undefined,
        status: values.status || undefined,
        webhookId: values.webhookId || undefined,
        dateRange: values.dateRange ? [
          values.dateRange[0].format('YYYY-MM-DD'),
          values.dateRange[1].format('YYYY-MM-DD')
        ] : undefined
      }
      
      const response = await logService.searchWebhookLogs(params)
      setLogs((response.items || []).map((log: any) => ({
        id: log.id,
        webhookId: log.webhookId,
        webhookName: log.webhookName || 'Webhook ' + log.webhookId.slice(0, 8),
        eventType: log.eventType,
        eventId: log.eventId,
        url: log.url,
        method: log.method,
        headers: log.headers || {},
        payload: log.payload,
        responseStatus: log.responseStatus,
        responseBody: log.responseBody,
        responseTime: log.responseTime,
        retryCount: log.retryCount,
        maxRetries: log.maxRetries,
        status: log.status as any,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
        sentAt: log.sentAt,
        nextRetryAt: log.nextRetryAt,
        lastRetryAt: log.lastRetryAt
      })))
    } catch (error) {
      console.error('搜索Webhook日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (log: WebhookLog) => {
    setSelectedLog(log)
    setDetailModalVisible(true)
  }

  const handleRetryWebhook = async (logId: string) => {
    try {
      await logService.retryWebhook(logId)
      message.success('重试请求已发送')
      loadData()
    } catch (error) {
      message.error('重试失败')
    }
  }

  const handleClearLogs = async () => {
    try {
      await logService.clearWebhookLogs()
      message.success('清理成功')
      loadData()
    } catch (error) {
      message.error('清理失败')
    }
  }

  const handleCopyEventId = (eventId: string) => {
    navigator.clipboard.writeText(eventId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'success'
      case 'pending': return 'warning'
      case 'retrying': return 'processing'
      case 'failed': return 'error'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return '已发送'
      case 'pending': return '待发送'
      case 'retrying': return '重试中'
      case 'failed': return '发送失败'
      default: return status
    }
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'transaction.created': return 'blue'
      case 'transaction.confirmed': return 'green'
      case 'wallet.created': return 'purple'
      case 'withdrawal.requested': return 'orange'
      case 'deposit.received': return 'cyan'
      default: return 'default'
    }
  }

  const getEventTypeText = (eventType: string) => {
    switch (eventType) {
      case 'transaction.created': return '交易创建'
      case 'transaction.confirmed': return '交易确认'
      case 'wallet.created': return '钱包创建'
      case 'withdrawal.requested': return '提现请求'
      case 'deposit.received': return '充值到账'
      default: return eventType
    }
  }

  const getResponseStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'success'
    if (statusCode >= 300 && statusCode < 400) return 'warning'
    if (statusCode >= 400 && statusCode < 500) return 'error'
    if (statusCode >= 500) return 'error'
    return 'default'
  }

  const columns = [
    {
      title: 'Webhook名称',
      dataIndex: 'webhookName',
      key: 'webhookName',
      render: (name: string, record: WebhookLog) => (
        <Space direction="vertical" size="small">
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.webhookId.slice(0, 8)}...
          </Text>
        </Space>
      )
    },
    {
      title: '事件类型',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (eventType: string) => (
        <Tag color={getEventTypeColor(eventType)}>
          {getEventTypeText(eventType)}
        </Tag>
      )
    },
    {
      title: '事件ID',
      dataIndex: 'eventId',
      key: 'eventId',
      render: (eventId: string) => (
        <Space>
          <Tooltip title={eventId}>
            <Text code style={{ fontSize: '12px', cursor: 'pointer' }}>
              {eventId.slice(0, 8)}...
            </Text>
          </Tooltip>
          <Button 
            type="text" 
            size="small" 
            icon={<CopyOutlined />}
            onClick={() => handleCopyEventId(eventId)}
          />
        </Space>
      )
    },
    {
      title: '目标URL',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        <Tooltip title={url}>
          <Text style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {url}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: WebhookLog) => (
        <Space>
          <Tag color={getStatusColor(status)}>
            {getStatusText(status)}
          </Tag>
          {record.retryCount > 0 && (
            <Badge 
              count={`${record.retryCount}/${record.maxRetries}`} 
              style={{ backgroundColor: '#1890ff' }}
            />
          )}
        </Space>
      )
    },
    {
      title: '响应状态',
      dataIndex: 'responseStatus',
      key: 'responseStatus',
      render: (statusCode: number) => (
        statusCode ? (
          <Tag color={getResponseStatusColor(statusCode)}>
            {statusCode}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (responseTime: number) => (
        responseTime ? (
          <Tag color={responseTime < 1000 ? 'success' : responseTime < 3000 ? 'warning' : 'error'}>
            {responseTime}ms
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    },
    {
      title: '重试次数',
      key: 'retry',
      render: (_: any, record: WebhookLog) => (
        <Space direction="vertical" size="small">
          <Text>{record.retryCount}/{record.maxRetries}</Text>
          {record.nextRetryAt && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              下次重试: {dayjs(record.nextRetryAt).format('HH:mm:ss')}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '发送时间',
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: (date: string) => (
        date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: WebhookLog) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 'failed' && (
            <Tooltip title="重试发送">
                             <Button 
                 type="text" 
                 size="small" 
                 icon={<RedoOutlined />}
                 onClick={() => handleRetryWebhook(record.id)}
               />
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Webhook日志</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadData}
            loading={loading}
          >
            刷新
          </Button>
          <Button 
            icon={<ClearOutlined />}
            danger
            onClick={handleClearLogs}
          >
            清理日志
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
                title="总Webhook数"
                value={stats.totalWebhooks}
                valueStyle={{ color: '#1890ff' }}
                                 prefix={<ApiOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="发送成功"
                value={stats.totalSent}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="发送失败"
                value={stats.totalFailed}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="成功率"
                value={stats.successRate}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
                prefix={<SendOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 今日统计 */}
      {stats && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="今日Webhook"
                value={stats.todayWebhooks}
                suffix={`个 (成功: ${stats.todaySent}, 失败: ${stats.todayFailed})`}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="平均响应时间"
                value={stats.averageResponseTime}
                suffix="ms"
                valueStyle={{ color: '#52c41a' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="待发送"
                value={stats.totalPending}
                valueStyle={{ color: '#faad14' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 热门事件类型 */}
      {stats && stats.topEventTypes.length > 0 && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <Card title="热门事件类型" size="small">
              <Row gutter={[16, 16]}>
                {stats.topEventTypes.slice(0, 6).map((eventType, index) => (
                  <Col xs={24} sm={8} key={index}>
                    <Card size="small">
                      <Statistic
                        title={getEventTypeText(eventType.eventType)}
                        value={eventType.count}
                        suffix={`次 / ${eventType.successRate}%`}
                        valueStyle={{ fontSize: '14px' }}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* 热门Webhook */}
      {stats && stats.topWebhooks.length > 0 && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <Card title="热门Webhook" size="small">
              <Row gutter={[16, 16]}>
                {stats.topWebhooks.slice(0, 6).map((webhook, index) => (
                  <Col xs={24} sm={8} key={index}>
                    <Card size="small">
                      <Statistic
                        title={webhook.webhookName}
                        value={webhook.count}
                        suffix={`次 / ${webhook.successRate}%`}
                        valueStyle={{ fontSize: '14px' }}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
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
          <Form.Item name="eventType" label="事件类型">
            <Select style={{ width: 150 }} placeholder="选择事件类型" allowClear>
              <Option value="transaction.created">交易创建</Option>
              <Option value="transaction.confirmed">交易确认</Option>
              <Option value="wallet.created">钱包创建</Option>
              <Option value="withdrawal.requested">提现请求</Option>
              <Option value="deposit.received">充值到账</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="status" label="状态">
            <Select style={{ width: 120 }} placeholder="选择状态" allowClear>
              <Option value="pending">待发送</Option>
              <Option value="sent">已发送</Option>
              <Option value="retrying">重试中</Option>
              <Option value="failed">发送失败</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="webhookId" label="Webhook ID">
            <Input placeholder="输入Webhook ID" style={{ width: 150 }} />
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

      {/* Webhook日志列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* 日志详情模态框 */}
      <Modal
        title="Webhook日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedLog && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Webhook ID" span={2}>
              <Text code>{selectedLog.webhookId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Webhook名称">
              {selectedLog.webhookName}
            </Descriptions.Item>
            <Descriptions.Item label="事件类型">
              <Tag color={getEventTypeColor(selectedLog.eventType)}>
                {getEventTypeText(selectedLog.eventType)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="事件ID" span={2}>
              <Text code>{selectedLog.eventId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="目标URL" span={2}>
              <Text code>{selectedLog.url}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="请求方法">
              <Tag>{selectedLog.method}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(selectedLog.status)}>
                {getStatusText(selectedLog.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="响应状态码">
              {selectedLog.responseStatus ? (
                <Tag color={getResponseStatusColor(selectedLog.responseStatus)}>
                  {selectedLog.responseStatus}
                </Tag>
              ) : (
                <Text type="secondary">-</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="响应时间">
              {selectedLog.responseTime ? (
                <Tag color={selectedLog.responseTime < 1000 ? 'success' : selectedLog.responseTime < 3000 ? 'warning' : 'error'}>
                  {selectedLog.responseTime}ms
                </Tag>
              ) : (
                <Text type="secondary">-</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="重试次数">
              {selectedLog.retryCount}/{selectedLog.maxRetries}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="发送时间">
              {selectedLog.sentAt ? dayjs(selectedLog.sentAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            {selectedLog.lastRetryAt && (
              <Descriptions.Item label="最后重试时间">
                {dayjs(selectedLog.lastRetryAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {selectedLog.nextRetryAt && (
              <Descriptions.Item label="下次重试时间">
                {dayjs(selectedLog.nextRetryAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {selectedLog.errorMessage && (
              <Descriptions.Item label="错误信息" span={2}>
                <Text type="danger">{selectedLog.errorMessage}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="请求头" span={2}>
              <TextArea 
                value={JSON.stringify(selectedLog.headers, null, 2)} 
                rows={4} 
                readOnly 
                style={{ fontFamily: 'monospace' }}
              />
            </Descriptions.Item>
            <Descriptions.Item label="请求体" span={2}>
              <TextArea 
                value={selectedLog.payload} 
                rows={6} 
                readOnly 
                style={{ fontFamily: 'monospace' }}
              />
            </Descriptions.Item>
            {selectedLog.responseBody && (
              <Descriptions.Item label="响应体" span={2}>
                <TextArea 
                  value={selectedLog.responseBody} 
                  rows={6} 
                  readOnly 
                  style={{ fontFamily: 'monospace' }}
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default WebhookLogPage 