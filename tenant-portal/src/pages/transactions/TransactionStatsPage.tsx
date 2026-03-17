import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Space,
  Typography,
  Button,
  Select,
  DatePicker,
  Table,
  Tag,
  Spin
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { dashboardService } from '@/services'
import type { DashboardData } from '@/services'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const TransactionStatsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('month')

  useEffect(() => {
    loadStats()
  }, [timeFilter])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await dashboardService.getStats()
      setStats(response.data)
    } catch (error) {
      console.error('加载交易统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    )
  }

  const successRate = stats.transactions.totalTransactions > 0
    ? ((stats.transactions.successTransactions / stats.transactions.totalTransactions) * 100).toFixed(1)
    : '0'

  const pendingRate = stats.transactions.totalTransactions > 0
    ? ((stats.transactions.pendingTransactions / stats.transactions.totalTransactions) * 100).toFixed(1)
    : '0'

  const failedRate = stats.transactions.totalTransactions > 0
    ? ((stats.transactions.failedTransactions / stats.transactions.totalTransactions) * 100).toFixed(1)
    : '0'

  const statsData = [
    {
      title: '成功交易',
      value: stats.transactions.successTransactions,
      total: stats.transactions.totalTransactions,
      percent: parseFloat(successRate),
      color: '#52c41a',
      icon: <CheckCircleOutlined />
    },
    {
      title: '待处理交易',
      value: stats.transactions.pendingTransactions,
      total: stats.transactions.totalTransactions,
      percent: parseFloat(pendingRate),
      color: '#faad14',
      icon: <ClockCircleOutlined />
    },
    {
      title: '失败交易',
      value: stats.transactions.failedTransactions,
      total: stats.transactions.totalTransactions,
      percent: parseFloat(failedRate),
      color: '#ff4d4f',
      icon: <CloseCircleOutlined />
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2}>
            <RiseOutlined style={{ marginRight: 8 }} />
            交易统计详情
          </Title>
          <Text type="secondary">查看详细的交易统计数据和分析</Text>
        </div>
        <Space>
          <Select
            value={timeFilter}
            onChange={setTimeFilter}
            style={{ width: 120 }}
          >
            <Select.Option value="today">今天</Select.Option>
            <Select.Option value="week">最近7天</Select.Option>
            <Select.Option value="month">最近30天</Select.Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadStats}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        {statsData.map((item, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Card
              style={{
                borderLeft: `4px solid ${item.color}`,
                height: '100%'
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div className="flex justify-between items-center">
                  <Space>
                    <div style={{ color: item.color, fontSize: 20 }}>
                      {item.icon}
                    </div>
                    <Text strong>{item.title}</Text>
                  </Space>
                  <div
                    style={{
                      background: item.color,
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: 4,
                      fontWeight: 600
                    }}
                  >
                    {item.value}
                  </div>
                </div>
                <Progress
                  percent={item.percent}
                  strokeColor={item.color}
                  showInfo={false}
                />
                <div className="flex justify-between">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    占比 {item.percent.toFixed(1)}%
                  </Text>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: item.color
                    }}
                  />
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 总览卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card
            title="交易总览"
            style={{ height: '100%' }}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Text type="secondary" style={{ fontSize: 14 }}>
                总交易数
              </Text>
              <div style={{ fontSize: 48, fontWeight: 600, color: '#1890ff', margin: '16px 0' }}>
                {stats.transactions.totalTransactions}
              </div>
              <Text type="secondary" style={{ fontSize: 14 }}>
                成功率 {successRate}%
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="交易量统计"
            style={{ height: '100%' }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Statistic
                title="总交易量"
                value={stats.transactions.volumeStats.totalVolume}
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
              <Statistic
                title="充值量"
                value={stats.transactions.volumeStats.depositVolume}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
              <Statistic
                title="提现量"
                value={stats.transactions.volumeStats.withdrawVolume}
                precision={2}
                valueStyle={{ color: '#faad14' }}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default TransactionStatsPage
