import React, { useState } from 'react'
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Progress,
  Tag,
  Timeline,
  List,
  Avatar
} from 'antd'
import {
  WalletOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { collectionService } from '@/services'
import { 
  CollectionConfigStats,
  CollectionTaskStats,
  CollectionSchedulerStats,
  CollectionHistoryRecord
} from '@shared/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const CollectionStatsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ])

  // 获取配置统计
  const { data: configStats, refetch: refetchConfigStats } = useQuery({
    queryKey: ['collection-config-stats'],
    queryFn: () => collectionService.getConfigStats()
  })

  // 获取任务统计
  const { data: taskStats, refetch: refetchTaskStats } = useQuery({
    queryKey: ['collection-task-stats', dateRange[0], dateRange[1]],
    queryFn: () => collectionService.getTaskStats({
      startDate: dateRange[0],
      endDate: dateRange[1]
    })
  })

  // 获取调度器统计
  const { data: schedulerStats, refetch: refetchSchedulerStats } = useQuery({
    queryKey: ['collection-scheduler-stats'],
    queryFn: () => collectionService.getSchedulerStats(),
    refetchInterval: 10000 // 每10秒刷新一次
  })

  // 获取归集历史
  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ['collection-history', dateRange[0], dateRange[1]],
    queryFn: () => collectionService.getHistory({
      startDate: dateRange[0],
      endDate: dateRange[1],
      page: 1,
      pageSize: 10
    })
  })

  // 刷新所有数据
  const handleRefreshAll = () => {
    refetchConfigStats()
    refetchTaskStats()
    refetchSchedulerStats()
    refetchHistory()
  }

  // 格式化运行时长
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) {
      return `${days}天 ${hours}小时 ${minutes}分钟`
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  }

  // 格式化执行间隔
  const formatExecutionInterval = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  }

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <BarChartOutlined className="mr-2" style={{ color: '#1890ff' }} />
            归集统计
          </Title>
          <Text type="secondary">查看归集系统的整体运行情况和统计数据</Text>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleRefreshAll}
        >
          刷新数据
        </Button>
      </div>

      {/* 配置统计 */}
      <Card title="配置统计" className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="总配置数"
                value={configStats?.data?.totalConfigs || 0}
                prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="活跃配置"
                value={configStats?.data?.activeConfigs || 0}
                prefix={<WalletOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="非活跃配置"
                value={configStats?.data?.inactiveConfigs || 0}
                prefix={<WalletOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="冻结配置"
                value={configStats?.data?.frozenConfigs || 0}
                prefix={<WalletOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 链和代币分布 */}
        <Row gutter={[16, 16]} className="mt-4">
          <Col xs={24} md={12}>
            <Card title="按链分布" size="small">
              {configStats?.data?.configsByChain && Object.entries(configStats.data.configsByChain).length > 0 ? (
                <div>
                  {Object.entries(configStats.data.configsByChain).map(([chain, count]) => (
                    <div key={chain} className="flex justify-between items-center mb-2">
                      <Text>{chain}</Text>
                      <Tag color="blue">{count}</Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">暂无数据</Text>
              )}
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="按代币分布" size="small">
              {configStats?.data?.configsBySymbol && Object.entries(configStats.data.configsBySymbol).length > 0 ? (
                <div>
                  {Object.entries(configStats.data.configsBySymbol).map(([symbol, count]) => (
                    <div key={symbol} className="flex justify-between items-center mb-2">
                      <Text>{symbol}</Text>
                      <Tag color="green">{count}</Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">暂无数据</Text>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 任务统计 */}
      <Card title="任务统计" className="mb-6">
        <Row gutter={[16, 16]}>
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
                title="运行中"
                value={taskStats?.data?.runningTasks || 0}
                prefix={<SyncOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="成功率"
                value={taskStats?.data?.successRate || 0}
                suffix="%"
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 详细统计 */}
        <Row gutter={[16, 16]} className="mt-4">
          <Col xs={24} md={8}>
            <Card title="归集金额统计" size="small">
              {taskStats?.data?.totalAmount && Object.entries(taskStats.data.totalAmount).length > 0 ? (
                <div>
                  {Object.entries(taskStats.data.totalAmount).map(([symbol, amount]) => (
                    <div key={symbol} className="flex justify-between items-center mb-2">
                      <Text>{symbol}</Text>
                      <Text strong>{amount}</Text>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">暂无数据</Text>
              )}
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="执行时间" size="small">
              <div className="text-center">
                <Statistic
                  title="平均执行时间"
                  value={taskStats?.data?.averageExecutionTime || 0}
                  suffix="秒"
                  prefix={<ClockCircleOutlined />}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="手续费统计" size="small">
              <div className="text-center">
                <Statistic
                  title="总手续费"
                  value={taskStats?.data?.totalFees || '0'}
                  suffix="代币"
                  prefix={<WalletOutlined />}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 调度器统计 */}
      <Card title="调度器统计" className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="调度器状态"
                value={schedulerStats?.data?.isRunning ? '运行中' : '已停止'}
                prefix={schedulerStats?.data?.isRunning ? 
                  <SyncOutlined style={{ color: '#52c41a' }} /> : 
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                }
                valueStyle={{ 
                  color: schedulerStats?.data?.isRunning ? '#52c41a' : '#ff4d4f' 
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="已调度配置"
                value={schedulerStats?.data?.scheduledConfigs || 0}
                prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="运行中任务"
                value={schedulerStats?.data?.runningTasks || 0}
                prefix={<PlayCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center">
              <Statistic
                title="总执行次数"
                value={schedulerStats?.data?.totalExecutions || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* 调度器详细信息 */}
        <Row gutter={[16, 16]} className="mt-4">
          <Col xs={24} md={8}>
            <Card title="执行统计" size="small">
              <div className="mb-2">
                <Text>失败执行次数: </Text>
                <Tag color="red">{schedulerStats?.data?.failedExecutions || 0}</Tag>
              </div>
              <div className="mb-2">
                <Text>平均执行间隔: </Text>
                <Text strong>
                  {schedulerStats?.data?.averageExecutionInterval ? 
                    formatExecutionInterval(schedulerStats.data.averageExecutionInterval) : 
                    '未知'
                  }
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="运行时间" size="small">
              <div className="text-center">
                <Statistic
                  title="运行时长"
                  value={schedulerStats?.data?.uptime ? 
                    formatUptime(schedulerStats.data.uptime) : 
                    '未知'
                  }
                  prefix={<ClockCircleOutlined />}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="下次执行" size="small">
              <div className="text-center">
                <Text>下次计划执行</Text>
                <br />
                <Text strong>
                  {schedulerStats?.data?.nextScheduledExecution ? 
                    dayjs(schedulerStats.data.nextScheduledExecution).format('MM-DD HH:mm:ss') : 
                    '未知'
                  }
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 归集历史 */}
      <Card title="归集历史" className="mb-6">
        <List
          dataSource={historyData?.data?.items || []}
          renderItem={(item: CollectionHistoryRecord) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={<BarChartOutlined />} 
                    style={{ backgroundColor: '#1890ff' }} 
                  />
                }
                title={
                  <div className="flex justify-between items-center">
                    <Text strong>{item.date}</Text>
                    <Space>
                      <Tag color="blue">总任务: {item.totalTasks}</Tag>
                      <Tag color="green">已完成: {item.completedTasks}</Tag>
                      <Tag color="red">失败: {item.failedTasks}</Tag>
                      <Tag color="orange">总金额: {item.totalAmount}</Tag>
                    </Space>
                  </div>
                }
                description={
                  <div className="mt-2">
                    <Progress
                      percent={item.totalTasks > 0 ? (item.completedTasks / item.totalTasks) * 100 : 0}
                      size="small"
                      status={item.failedTasks > 0 ? 'exception' : 'success'}
                    />
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{
            emptyText: '暂无历史数据'
          }}
        />
      </Card>
    </div>
  )
}

export default CollectionStatsPage
