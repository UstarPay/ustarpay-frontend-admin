import React, { useState } from 'react'
import {
  Card,
  Table,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Button,
  Tooltip,
  Badge,
  DatePicker,
  Drawer,
  Descriptions,
  Divider
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { collectionService } from '@/services'
import { 
  TenantCollectionTask, 
  CollectionTaskStatus, 
  CollectionTaskQueryParams
} from '@shared/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const CollectionTaskPage: React.FC = () => {
  const [searchParams, setSearchParams] = useState<CollectionTaskQueryParams>({
    page: 1,
    pageSize: 10,
    status: undefined,
    configId: undefined,
    startDate: undefined,
    endDate: undefined
  })
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<TenantCollectionTask | null>(null)

  // 获取归集任务列表
  const { data: taskData, isLoading, refetch } = useQuery({
    queryKey: ['collection-tasks', searchParams],
    queryFn: () => collectionService.getTasks(searchParams)
  })

  // 获取任务统计
  const { data: taskStats } = useQuery({
    queryKey: ['collection-task-stats', searchParams.startDate, searchParams.endDate],
    queryFn: () => collectionService.getTaskStats({
      startDate: searchParams.startDate,
      endDate: searchParams.endDate
    })
  })

  const queryClient = useQueryClient()

  // 重新执行（基于配置触发新归集）
  const reExecuteMutation = useMutation({
    mutationFn: (configId: string) => collectionService.executeCollection(configId),
    onSuccess: (res) => {
      // TASK_ALREADY_EXISTS / NO_FUNDS_AVAILABLE 时展示 message；data 有任务对象时展示执行成功
      if (res?.code === 'TASK_ALREADY_EXISTS' || res?.code === 'NO_FUNDS_AVAILABLE') {
        message.info(res?.message || '执行完成')
      } else if (res?.data != null) {
        message.success('执行成功')
      } else {
        message.info(res?.message || '执行完成')
      }
      queryClient.invalidateQueries({ queryKey: ['collection-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['collection-task-stats'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '执行失败')
    }
  })

  // 处理分页
  const handleTableChange = (pagination: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  // 处理日期范围变化
  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setSearchParams(prev => ({
        ...prev,
        startDate: dates[0]?.format('YYYY-MM-DD'),
        endDate: dates[1]?.format('YYYY-MM-DD'),
        page: 1
      }))
    } else {
      setSearchParams(prev => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
        page: 1
      }))
    }
  }

  // 查看任务详情
  const handleViewDetail = (record: TenantCollectionTask) => {
    setDetailRecord(record)
    setDetailOpen(true)
  }

  // 获取状态配置（-1:frozen, 0:inactive, 1:active, 2:finished）
  const getStatusConfig = (status: number) => {
    const statusConfig: Record<number, { text: string; color: string; icon: React.ReactNode }> = {
      [CollectionTaskStatus.FROZEN]: { text: '失效', color: 'default', icon: <CloseCircleOutlined /> },
      [CollectionTaskStatus.INACTIVE]: { text: '暂停', color: 'warning', icon: <ClockCircleOutlined /> },
      [CollectionTaskStatus.ACTIVE]: { text: '待执行', color: 'processing', icon: <SyncOutlined spin /> },
      [CollectionTaskStatus.FINISHED]: { text: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
    }
    return statusConfig[status] ?? { text: '未知', color: 'default', icon: <ClockCircleOutlined /> }
  }

  // 表格列定义
  const columns = [
    {
      title: '任务信息',
      key: 'taskInfo',
      render: (_: any, record: TenantCollectionTask) => (
        <Space>
          <div>
            <div className="font-medium">
              任务ID: {record.id.slice(0, 8)}...
            </div>
            <Text type="secondary" className="text-xs">
              配置ID: {record.configId.slice(0, 8)}...
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '归集地址',
      key: 'addresses',
      render: (_: any, record: TenantCollectionTask) => (
        <div>
          <div className="font-medium">
            目标: {record.toAddress.slice(0, 6)}...{record.toAddress.slice(-4)}
          </div>
          <Text type="secondary" className="text-xs">
            {record.fromAddressCount} / {record.expectedFromAddressCount}
          </Text>
        </div>
      )
    },
    {
      title: '支持的链和代币',
      key: 'chainAndSymbols',
      render: (_: any, record: TenantCollectionTask) => (
        <div>
          <div className="mb-1">
            {record.chainCodes.map((code: string) => (
              <Tag key={code} color="blue">
                {code.toUpperCase()}
              </Tag>
            ))}
          </div>
          <div>
            {record.symbols.map((symbol: string) => (
              <Tag key={symbol} color="green">
                {symbol}
              </Tag>
            ))}
          </div>
        </div>
      )
    },
    {
      title: '归集金额',
      key: 'amounts',
      render: (_: any, record: TenantCollectionTask) => (
        <div>
          <div className="font-medium">
            {Object.entries(record.expectedAmount).map(([symbol, amount]) => (
              <span key={symbol} className="mr-2">
                {symbol}: {amount}
              </span>
            ))}
          </div>
        </div>
      )
    },
    {
      title: '执行状态',
      key: 'execution',
      render: (_: any, record: TenantCollectionTask) => {
        const statusConfig = getStatusConfig(record.status)
        return <Badge status={statusConfig.color as any} text={statusConfig.text} />
      }
    },
    {
      title: '时间信息',
      key: 'timing',
      render: (_: any, record: TenantCollectionTask) => (
        <div>
          <div className="font-medium">
            计划: {dayjs(record.scheduledAt).format('MM-DD HH:mm')}
          </div>
          <Text type="secondary" className="text-xs">
            {record.executedAt && `执行: ${dayjs(record.executedAt).format('MM-DD HH:mm')}`}
            {record.completedAt && ` | 完成: ${dayjs(record.completedAt).format('MM-DD HH:mm')}`}
          </Text>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: TenantCollectionTask) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 1 && (
            <Tooltip title="重新执行">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                size="small"
                loading={reExecuteMutation.isPending}
                onClick={() => reExecuteMutation.mutate(record.configId)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <Title level={2} style={{ margin: 0 }}>
          <PlayCircleOutlined className="mr-2" style={{ color: '#1890ff' }} />
          归集任务监控
        </Title>
        <Text type="secondary">监控归集任务的执行状态和进度</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="总任务数"
              value={taskStats?.data?.totalTasks || 0}
              prefix={<PlayCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="已完成"
              value={taskStats?.data?.completedTasks || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="待执行"
              value={(taskStats?.data?.pendingTasks ?? 0) + (taskStats?.data?.executingTasks ?? 0)}
              prefix={<SyncOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="成功率"
              value={
                taskStats?.data?.successRate != null
                  ? taskStats.data.successRate
                  : (() => {
                      const completed = taskStats?.data?.completedTasks ?? 0
                      const failed = taskStats?.data?.failedTasks ?? 0
                      const finished = completed + failed
                      return finished > 0
                        ? Math.round((completed / finished) * 100)
                        : 0
                    })()
              }
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="搜索任务ID或配置ID"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
            onChange={(e) => setSearchParams(prev => ({ ...prev, search: e.target.value }))}
          />
          <Input
            placeholder="配置ID"
            style={{ width: 200 }}
            allowClear
            onChange={(e) => setSearchParams(prev => ({ ...prev, configId: e.target.value }))}
          />
          <Select
            placeholder="选择状态"
            style={{ width: 120 }}
            allowClear
            value={searchParams.status ?? undefined}
            onChange={(value) => setSearchParams(prev => ({ ...prev, status: value as number }))}
          >
            <Option value={CollectionTaskStatus.FROZEN}>失效</Option>
            <Option value={CollectionTaskStatus.INACTIVE}>暂停</Option>
            <Option value={CollectionTaskStatus.ACTIVE}>待执行</Option>
            <Option value={CollectionTaskStatus.FINISHED}>已完成</Option>
          </Select>
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
          />
          <Button onClick={() => {
            setSearchParams({
              page: 1,
              pageSize: 10,
              status: undefined,
              configId: undefined,
              startDate: undefined,
              endDate: undefined
            })
          }}>
            重置
          </Button>
        </div>
      </Card>

      {/* 任务列表 */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Text strong>归集任务列表</Text>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            刷新列表
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={taskData?.data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: taskData?.data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 任务详情抽屉 */}
      <Drawer
        title="归集任务详情"
        placement="right"
        width={560}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {detailRecord && (
          <>
            <Descriptions title="任务信息" column={1} bordered size="small">
              <Descriptions.Item label="任务 ID">
                <Text code copyable style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {detailRecord.id}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="配置 ID">
                <Text code copyable style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {detailRecord.configId}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="执行状态">
                <Badge
                  status={(getStatusConfig(detailRecord.status).color as any) || 'default'}
                  text={getStatusConfig(detailRecord.status).text}
                />
              </Descriptions.Item>
              {detailRecord.failureReason && (
                <Descriptions.Item label="失败原因">
                  <Text type="danger">{detailRecord.failureReason}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <Descriptions title="归集地址" column={1} bordered size="small">
              <Descriptions.Item label="目标地址">
                <Text code copyable style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {detailRecord.toAddress}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="源地址数量">
                {detailRecord.fromAddressCount} / {detailRecord.expectedFromAddressCount}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="链与代币" column={1} bordered size="small">
              <Descriptions.Item label="链">
                <Space wrap size={[4, 4]}>
                  {detailRecord.chainCodes.map((code: string) => (
                    <Tag key={code} color="blue">{code.toUpperCase()}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="代币">
                <Space wrap size={[4, 4]}>
                  {detailRecord.symbols.map((symbol: string) => (
                    <Tag key={symbol} color="green">{symbol}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="归集金额" column={1} bordered size="small">
              <Descriptions.Item label="预期金额">
                {Object.entries(detailRecord.expectedAmount).map(([symbol, amount]) => (
                  <div key={symbol}>
                    <Text strong>{symbol}: {amount}</Text>
                  </div>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="实际金额">
                {Object.entries(detailRecord.amount).length > 0
                  ? Object.entries(detailRecord.amount).map(([symbol, amount]) => (
                      <div key={symbol}>
                        <Text>{symbol}: {amount}</Text>
                      </div>
                    ))
                  : <Text type="secondary">-</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="手续费">
                {detailRecord.blockFee}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="时间信息" column={1} bordered size="small">
              <Descriptions.Item label="计划执行时间">
                {dayjs(detailRecord.scheduledAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="实际执行时间">
                {detailRecord.executedAt
                  ? dayjs(detailRecord.executedAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {detailRecord.completedAt
                  ? dayjs(detailRecord.completedAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detailRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(detailRecord.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default CollectionTaskPage
