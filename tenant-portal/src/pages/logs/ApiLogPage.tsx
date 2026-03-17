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
  DeleteOutlined,
  ClearOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { logService } from '@/services'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

interface ApiLog {
  id: string
  requestId: string
  method: string
  path: string
  statusCode: number
  responseTime: number
  requestSize: number
  responseSize: number
  userAgent: string
  ipAddress: string
  userId?: string
  userName?: string
  apiKey?: string
  errorMessage?: string
  requestBody?: string
  responseBody?: string
  createdAt: string
  userAgentInfo: {
    browser: string
    os: string
    device: string
  }
}

interface ApiLogStats {
  totalRequests: number
  totalErrors: number
  averageResponseTime: number
  totalTraffic: number
  todayRequests: number
  todayErrors: number
  todayTraffic: number
  successRate: number
  topEndpoints: Array<{
    path: string
    count: number
    avgResponseTime: number
  }>
  topErrors: Array<{
    error: string
    count: number
  }>
}

const ApiLogPage: React.FC = () => {
  const [logs, setLogs] = useState<ApiLog[]>([])
  const [stats, setStats] = useState<ApiLogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchForm] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [logsData, statsData] = await Promise.all([
        logService.getApiLogs(),
        logService.getApiLogStats()
      ])
      
      setLogs((logsData.items || []).map((log: any) => ({
        id: log.id,
        requestId: log.requestId,
        method: log.method,
        path: log.path,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        requestSize: log.requestSize,
        responseSize: log.responseSize,
        userAgent: log.userAgent,
        ipAddress: log.ipAddress,
        userId: log.userId,
        userName: log.userName,
        apiKey: log.apiKey,
        errorMessage: log.errorMessage,
        requestBody: log.requestBody,
        responseBody: log.responseBody,
        createdAt: log.createdAt,
        userAgentInfo: log.userAgentInfo || {
          browser: 'Unknown',
          os: 'Unknown',
          device: 'Unknown'
        }
      })))
      setStats({
        totalRequests: statsData.data.totalRequests,
        totalErrors: statsData.data.totalErrors,
        averageResponseTime: statsData.data.averageResponseTime,
        totalTraffic: statsData.data.totalTraffic,
        todayRequests: statsData.data.todayRequests,
        todayErrors: statsData.data.todayErrors,
        todayTraffic: statsData.data.todayTraffic,
        successRate: statsData.data.successRate,
        topEndpoints: statsData.data.topEndpoints || [],
        topErrors: statsData.data.topErrors || []
      })
    } catch (error) {
      console.error('加载API日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (values: any) => {
    try {
      setLoading(true)
      const params = {
        method: values.method || undefined,
        statusCode: values.statusCode || undefined,
        path: values.path || undefined,
        userId: values.userId || undefined,
        ipAddress: values.ipAddress || undefined,
        dateRange: values.dateRange ? [
          values.dateRange[0].format('YYYY-MM-DD'),
          values.dateRange[1].format('YYYY-MM-DD')
        ] : undefined
      }
      
      const response = await logService.searchApiLogs(params)
      setLogs((response.items || []).map((log: any) => ({
        id: log.id,
        requestId: log.requestId,
        method: log.method,
        path: log.path,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        requestSize: log.requestSize,
        responseSize: log.responseSize,
        userAgent: log.userAgent,
        ipAddress: log.ipAddress,
        userId: log.userId,
        userName: log.userName,
        apiKey: log.apiKey,
        errorMessage: log.errorMessage,
        requestBody: log.requestBody,
        responseBody: log.responseBody,
        createdAt: log.createdAt,
        userAgentInfo: log.userAgentInfo || {
          browser: 'Unknown',
          os: 'Unknown',
          device: 'Unknown'
        }
      })))
    } catch (error) {
      console.error('搜索API日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (log: ApiLog) => {
    setSelectedLog(log)
    setDetailModalVisible(true)
  }

  const handleClearLogs = async () => {
    try {
      await logService.clearApiLogs()
      message.success('清理成功')
      loadData()
    } catch (error) {
      message.error('清理失败')
    }
  }

  const handleCopyRequestId = (requestId: string) => {
    navigator.clipboard.writeText(requestId)
  }

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'green'
      case 'POST': return 'blue'
      case 'PUT': return 'orange'
      case 'DELETE': return 'red'
      case 'PATCH': return 'purple'
      default: return 'default'
    }
  }

  const getStatusCodeColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'success'
    if (statusCode >= 300 && statusCode < 400) return 'warning'
    if (statusCode >= 400 && statusCode < 500) return 'error'
    if (statusCode >= 500) return 'error'
    return 'default'
  }

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 100) return 'success'
    if (responseTime < 500) return 'warning'
    return 'error'
  }

  const columns = [
    {
      title: '请求ID',
      dataIndex: 'requestId',
      key: 'requestId',
      render: (requestId: string) => (
        <Space>
          <Tooltip title={requestId}>
            <Text code style={{ fontSize: '12px', cursor: 'pointer' }}>
              {requestId.slice(0, 8)}...
            </Text>
          </Tooltip>
          <Button 
            type="text" 
            size="small" 
            icon={<CopyOutlined />}
            onClick={() => handleCopyRequestId(requestId)}
          />
        </Space>
      )
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <Tag color={getMethodColor(method)}>
          {method.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      render: (path: string) => (
        <Tooltip title={path}>
          <Text style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {path}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '状态码',
      dataIndex: 'statusCode',
      key: 'statusCode',
      render: (statusCode: number) => (
        <Tag color={getStatusCodeColor(statusCode)}>
          {statusCode}
        </Tag>
      )
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (responseTime: number) => (
        <Tag color={getResponseTimeColor(responseTime)}>
          {responseTime}ms
        </Tag>
      )
    },
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: ApiLog) => (
        <Space direction="vertical" size="small">
          <Text>{record.userName || record.userId || '匿名用户'}</Text>
          {record.apiKey && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              API Key: {record.apiKey.slice(0, 8)}...
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip: string) => <Text code>{ip}</Text>
    },
    {
      title: '浏览器信息',
      key: 'userAgent',
      render: (_: any, record: ApiLog) => (
        <Space direction="vertical" size="small">
          <Text>{record.userAgentInfo.browser}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.userAgentInfo.os} / {record.userAgentInfo.device}
          </Text>
        </Space>
      )
    },
    {
      title: '流量',
      key: 'traffic',
      render: (_: any, record: ApiLog) => (
        <Space direction="vertical" size="small">
          <Text>请求: {record.requestSize} B</Text>
          <Text>响应: {record.responseSize} B</Text>
        </Space>
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
      render: (_: any, record: ApiLog) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>API日志</Title>
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
                title="总请求数"
                value={stats.totalRequests}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ApiOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="错误数"
                value={stats.totalErrors}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
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
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="成功率"
                value={stats.successRate}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
                prefix={<CheckCircleOutlined />}
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
                title="今日请求"
                value={stats.todayRequests}
                suffix={`个 / ${stats.todayTraffic} MB`}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="今日错误"
                value={stats.todayErrors}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="总流量"
                value={stats.totalTraffic}
                suffix="MB"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 热门端点 */}
      {stats && stats.topEndpoints.length > 0 && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <Card title="热门端点" size="small">
              <Row gutter={[16, 16]}>
                {stats.topEndpoints.slice(0, 6).map((endpoint, index) => (
                  <Col xs={24} sm={8} key={index}>
                    <Card size="small">
                      <Statistic
                        title={endpoint.path}
                        value={endpoint.count}
                        suffix={`次 / ${endpoint.avgResponseTime}ms`}
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
          <Form.Item name="method" label="请求方法">
            <Select style={{ width: 100 }} placeholder="选择方法" allowClear>
              <Option value="GET">GET</Option>
              <Option value="POST">POST</Option>
              <Option value="PUT">PUT</Option>
              <Option value="DELETE">DELETE</Option>
              <Option value="PATCH">PATCH</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="statusCode" label="状态码">
            <Select style={{ width: 120 }} placeholder="选择状态码" allowClear>
              <Option value="200">200 (成功)</Option>
              <Option value="400">400 (客户端错误)</Option>
              <Option value="401">401 (未授权)</Option>
              <Option value="403">403 (禁止)</Option>
              <Option value="404">404 (未找到)</Option>
              <Option value="500">500 (服务器错误)</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="path" label="路径">
            <Input placeholder="输入路径关键词" style={{ width: 200 }} />
          </Form.Item>
          
          <Form.Item name="userId" label="用户ID">
            <Input placeholder="输入用户ID" style={{ width: 150 }} />
          </Form.Item>
          
          <Form.Item name="ipAddress" label="IP地址">
            <Input placeholder="输入IP地址" style={{ width: 150 }} />
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

      {/* API日志列表 */}
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
        title="API日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedLog && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="请求ID" span={2}>
              <Text code>{selectedLog.requestId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="请求方法">
              <Tag color={getMethodColor(selectedLog.method)}>
                {selectedLog.method.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态码">
              <Tag color={getStatusCodeColor(selectedLog.statusCode)}>
                {selectedLog.statusCode}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="请求路径" span={2}>
              <Text code>{selectedLog.path}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="响应时间">
              <Tag color={getResponseTimeColor(selectedLog.responseTime)}>
                {selectedLog.responseTime}ms
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">
              <Text code>{selectedLog.ipAddress}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="用户">
              {selectedLog.userName || selectedLog.userId || '匿名用户'}
            </Descriptions.Item>
            <Descriptions.Item label="API Key">
              {selectedLog.apiKey ? `${selectedLog.apiKey.slice(0, 8)}...` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="浏览器">
              {selectedLog.userAgentInfo.browser}
            </Descriptions.Item>
            <Descriptions.Item label="操作系统">
              {selectedLog.userAgentInfo.os}
            </Descriptions.Item>
            <Descriptions.Item label="设备">
              {selectedLog.userAgentInfo.device}
            </Descriptions.Item>
            <Descriptions.Item label="流量">
              请求: {selectedLog.requestSize} B / 响应: {selectedLog.responseSize} B
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {selectedLog.errorMessage && (
              <Descriptions.Item label="错误信息" span={2}>
                <Text type="danger">{selectedLog.errorMessage}</Text>
              </Descriptions.Item>
            )}
            {selectedLog.requestBody && (
              <Descriptions.Item label="请求体" span={2}>
                <TextArea 
                  value={selectedLog.requestBody} 
                  rows={4} 
                  readOnly 
                  style={{ fontFamily: 'monospace' }}
                />
              </Descriptions.Item>
            )}
            {selectedLog.responseBody && (
              <Descriptions.Item label="响应体" span={2}>
                <TextArea 
                  value={selectedLog.responseBody} 
                  rows={4} 
                  readOnly 
                  style={{ fontFamily: 'monospace' }}
                />
              </Descriptions.Item>
            )}
            <Descriptions.Item label="User Agent" span={2}>
              <Text style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                {selectedLog.userAgent}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default ApiLogPage 