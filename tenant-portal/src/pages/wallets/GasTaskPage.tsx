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
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FireOutlined
} from '@ant-design/icons'
import { walletService } from '@/services'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

interface GasTask {
  id: string
  name: string
  description: string
  walletId: string
  walletName: string
  currency: string
  targetAddress: string
  gasAmount: string
  gasPrice: string
  totalCost: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  txHash?: string
  blockNumber?: number
  confirmations?: number
  requiredConfirmations: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  taskType: 'auto' | 'manual'
  priority: 'low' | 'medium' | 'high'
  estimatedTime?: string
}

interface GasTaskStats {
  totalTasks: number
  totalCost: string
  pendingCount: number
  processingCount: number
  completedCount: number
  failedCount: number
  todayTasks: number
  todayCost: string
  autoTaskCount: number
  manualTaskCount: number
  highPriorityCount: number
}

const GasTaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<GasTask[]>([])
  const [stats, setStats] = useState<GasTaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchForm] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<GasTask | null>(null)
  const [createForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tasksData, statsData] = await Promise.all([
        walletService.getGasTasks(),
        walletService.getGasTaskStats()
      ])
      
      setTasks((tasksData.items || []).map((task: any) => ({
        id: task.id,
        name: task.name,
        description: task.description,
        walletId: task.walletId,
        walletName: task.walletName || '钱包' + task.walletId.slice(0, 8),
        currency: task.currency,
        targetAddress: task.targetAddress,
        gasAmount: task.gasAmount,
        gasPrice: task.gasPrice,
        totalCost: task.totalCost,
        status: task.status as any,
        txHash: task.txHash,
        blockNumber: task.blockNumber,
        confirmations: task.confirmations,
        requiredConfirmations: task.requiredConfirmations,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        errorMessage: task.errorMessage,
        taskType: task.taskType as any,
        priority: task.priority as any,
        estimatedTime: task.estimatedTime
      })))
      setStats({
        totalTasks: statsData.data.totalTasks,
        totalCost: statsData.data.totalCost,
        pendingCount: statsData.data.pendingTasks,
        processingCount: statsData.data.processingTasks,
        completedCount: statsData.data.completedTasks,
        failedCount: statsData.data.failedTasks,
        todayTasks: statsData.data.todayTasks,
        todayCost: statsData.data.todayCost,
        autoTaskCount: statsData.data.autoTaskCount,
        manualTaskCount: statsData.data.manualTaskCount,
        highPriorityCount: statsData.data.highPriorityCount
      })
    } catch (error) {
      console.error('加载Gas任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (values: any) => {
    try {
      setLoading(true)
      const params = {
        walletId: values.walletId || undefined,
        status: values.status || undefined,
        currency: values.currency || undefined,
        taskType: values.taskType || undefined,
        priority: values.priority || undefined,
        dateRange: values.dateRange ? [
          values.dateRange[0].format('YYYY-MM-DD'),
          values.dateRange[1].format('YYYY-MM-DD')
        ] : undefined
      }
      
      const response = await walletService.searchGasTasks(params)
      setTasks((response.items || []).map((task: any) => ({
        id: task.id,
        name: task.name,
        description: task.description,
        walletId: task.walletId,
        walletName: task.walletName || '钱包' + task.walletId.slice(0, 8),
        currency: task.currency,
        targetAddress: task.targetAddress,
        gasAmount: task.gasAmount,
        gasPrice: task.gasPrice,
        totalCost: task.totalCost,
        status: task.status as any,
        txHash: task.txHash,
        blockNumber: task.blockNumber,
        confirmations: task.confirmations,
        requiredConfirmations: task.requiredConfirmations,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        errorMessage: task.errorMessage,
        taskType: task.taskType as any,
        priority: task.priority as any,
        estimatedTime: task.estimatedTime
      })))
    } catch (error) {
      console.error('搜索Gas任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = () => {
    createForm.resetFields()
    setCreateModalVisible(true)
  }

  const handleSubmitCreate = async (values: any) => {
    try {
      await walletService.createGasTask(values)
      message.success('创建成功')
      setCreateModalVisible(false)
      loadData()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleViewDetail = (task: GasTask) => {
    setSelectedTask(task)
    setDetailModalVisible(true)
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await walletService.deleteGasTask(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleCopyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'processing': return 'processing'
      case 'pending': return 'warning'
      case 'failed': return 'error'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'processing': return '处理中'
      case 'pending': return '待处理'
      case 'failed': return '失败'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'auto': return 'blue'
      case 'manual': return 'green'
      default: return 'default'
    }
  }

  const getTaskTypeText = (type: string) => {
    switch (type) {
      case 'auto': return '自动补充'
      case 'manual': return '手动补充'
      default: return type
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'green'
      default: return 'default'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高优先级'
      case 'medium': return '中优先级'
      case 'low': return '低优先级'
      default: return priority
    }
  }

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: GasTask) => (
        <Space direction="vertical" size="small">
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </Space>
      )
    },
    {
      title: '目标钱包',
      dataIndex: 'walletName',
      key: 'walletName',
      render: (name: string, record: GasTask) => (
        <Space>
          <Text>{name}</Text>
          <Tag>{record.currency.toUpperCase()}</Tag>
        </Space>
      )
    },
    {
      title: '目标地址',
      dataIndex: 'targetAddress',
      key: 'targetAddress',
      render: (address: string) => (
        <Tooltip title={address}>
          <Text code style={{ fontSize: '12px' }}>
            {address.slice(0, 8)}...{address.slice(-8)}
          </Text>
        </Tooltip>
      )
    },
    {
      title: 'Gas信息',
      key: 'gasInfo',
      render: (_: any, record: GasTask) => (
        <Space direction="vertical" size="small">
          <Text>数量: {record.gasAmount}</Text>
          <Text>价格: {record.gasPrice}</Text>
        </Space>
      )
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost: string, record: GasTask) => (
        <Text strong>{cost} {record.currency.toUpperCase()}</Text>
      )
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      render: (type: string) => (
        <Tag color={getTaskTypeColor(type)}>
          {getTaskTypeText(type)}
        </Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: GasTask) => (
        <Space>
          <Tag color={getStatusColor(status)}>
            {getStatusText(status)}
          </Tag>
          {(status === 'pending' || status === 'processing') && (
            <Badge 
              count={`${record.confirmations || 0}/${record.requiredConfirmations}`} 
              style={{ backgroundColor: '#1890ff' }}
            />
          )}
        </Space>
      )
    },
    {
      title: '交易哈希',
      dataIndex: 'txHash',
      key: 'txHash',
      render: (txHash: string) => (
        txHash ? (
          <Space>
            <Tooltip title={txHash}>
              <Text code style={{ fontSize: '12px', cursor: 'pointer' }}>
                {txHash.slice(0, 8)}...{txHash.slice(-8)}
              </Text>
            </Tooltip>
            <Button 
              type="text" 
              size="small" 
              icon={<CopyOutlined />}
              onClick={() => handleCopyTxHash(txHash)}
            />
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => (
        date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: GasTask) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="删除任务">
            <Button 
              type="text" 
              size="small" 
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteTask(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>补充Gas任务</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadData}
            loading={loading}
          >
            刷新
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateTask}
          >
            新建任务
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
                title="总任务数"
                value={stats.totalTasks}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总成本"
                value={stats.totalCost}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="今日任务"
                value={stats.todayTasks}
                suffix={`个 / ${stats.todayCost}`}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="高优先级"
                value={stats.highPriorityCount}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 任务类型统计 */}
      {stats && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="自动补充"
                value={stats.autoTaskCount}
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="手动补充"
                value={stats.manualTaskCount}
                prefix={<PauseCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="失败任务"
                value={stats.failedCount}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
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
          <Form.Item name="walletId" label="钱包ID">
            <Select 
              style={{ width: 150 }} 
              placeholder="选择钱包"
              allowClear
            >
              <Option value="wallet1">钱包1</Option>
              <Option value="wallet2">钱包2</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="status" label="状态">
            <Select style={{ width: 120 }} placeholder="选择状态" allowClear>
              <Option value="pending">待处理</Option>
              <Option value="processing">处理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="failed">失败</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="currency" label="币种">
            <Select style={{ width: 120 }} placeholder="选择币种" allowClear>
              <Option value="ETH">Ethereum</Option>
              <Option value="BTC">Bitcoin</Option>
              <Option value="USDT">USDT</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="taskType" label="任务类型">
            <Select style={{ width: 120 }} placeholder="选择类型" allowClear>
              <Option value="auto">自动补充</Option>
              <Option value="manual">手动补充</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="priority" label="优先级">
            <Select style={{ width: 120 }} placeholder="选择优先级" allowClear>
              <Option value="high">高优先级</Option>
              <Option value="medium">中优先级</Option>
              <Option value="low">低优先级</Option>
            </Select>
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

      {/* Gas任务列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* 新建任务模态框 */}
      <Modal
        title="新建Gas补充任务"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleSubmitCreate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="任务名称"
                rules={[{ required: true, message: '请输入任务名称' }]}
              >
                <Input placeholder="请输入任务名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currency"
                label="币种"
                rules={[{ required: true, message: '请选择币种' }]}
              >
                <Select placeholder="选择币种">
                  <Option value="ETH">Ethereum</Option>
                  <Option value="BTC">Bitcoin</Option>
                  <Option value="USDT">USDT</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="任务描述"
          >
            <TextArea rows={2} placeholder="请输入任务描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="walletId"
                label="目标钱包"
                rules={[{ required: true, message: '请选择目标钱包' }]}
              >
                <Select placeholder="选择目标钱包">
                  <Option value="wallet1">钱包1</Option>
                  <Option value="wallet2">钱包2</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="targetAddress"
                label="目标地址"
                rules={[{ required: true, message: '请输入目标地址' }]}
              >
                <Input placeholder="请输入目标地址" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="gasAmount"
                label="Gas数量"
                rules={[{ required: true, message: '请输入Gas数量' }]}
              >
                <Input placeholder="Gas数量" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="gasPrice"
                label="Gas价格"
                rules={[{ required: true, message: '请输入Gas价格' }]}
              >
                <Input placeholder="Gas价格" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="选择优先级">
                  <Option value="low">低优先级</Option>
                  <Option value="medium">中优先级</Option>
                  <Option value="high">高优先级</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建任务
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 任务详情模态框 */}
      <Modal
        title="Gas任务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTask && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="任务ID" span={2}>
              <Text code>{selectedTask.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="任务名称">
              {selectedTask.name}
            </Descriptions.Item>
            <Descriptions.Item label="任务类型">
              <Tag color={getTaskTypeColor(selectedTask.taskType)}>
                {getTaskTypeText(selectedTask.taskType)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="目标钱包">
              {selectedTask.walletName}
            </Descriptions.Item>
            <Descriptions.Item label="目标地址">
              <Text code>{selectedTask.targetAddress}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="币种">
              {selectedTask.currency.toUpperCase()}
            </Descriptions.Item>
            <Descriptions.Item label="Gas数量">
              {selectedTask.gasAmount}
            </Descriptions.Item>
            <Descriptions.Item label="Gas价格">
              {selectedTask.gasPrice}
            </Descriptions.Item>
            <Descriptions.Item label="总成本">
              <Text strong>{selectedTask.totalCost} {selectedTask.currency.toUpperCase()}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag color={getPriorityColor(selectedTask.priority)}>
                {getPriorityText(selectedTask.priority)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(selectedTask.status)}>
                {getStatusText(selectedTask.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="任务描述" span={2}>
              {selectedTask.description}
            </Descriptions.Item>
            {selectedTask.txHash && (
              <>
                <Descriptions.Item label="交易哈希" span={2}>
                  <Space>
                    <Text code>{selectedTask.txHash}</Text>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyTxHash(selectedTask.txHash!)}
                    />
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="区块号">
                  {selectedTask.blockNumber}
                </Descriptions.Item>
                <Descriptions.Item label="确认数">
                  {selectedTask.confirmations}/{selectedTask.requiredConfirmations}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="创建时间">
              {dayjs(selectedTask.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {selectedTask.startedAt ? dayjs(selectedTask.startedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="完成时间">
              {selectedTask.completedAt ? dayjs(selectedTask.completedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            {selectedTask.estimatedTime && (
              <Descriptions.Item label="预计完成时间">
                {dayjs(selectedTask.estimatedTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {selectedTask.errorMessage && (
              <Descriptions.Item label="错误信息" span={2}>
                <Text type="danger">{selectedTask.errorMessage}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default GasTaskPage 