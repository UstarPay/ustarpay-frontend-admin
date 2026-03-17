import React, { useState } from 'react'
import { 
  Card, 
  Typography, 
  Alert, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Select,
  DatePicker,
  Tooltip
} from 'antd'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { 
  HistoryOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LockOutlined
} from '@ant-design/icons'
import rbacApi from '@/services/apis/rbacApi'
import { useAuthStore } from '@/stores/authStore'
import { AdminLoginLog, LoginLogQueryParams } from '@shared/types/loginLog'
import dayjs from 'dayjs'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

/**
 * 登录日志页面
 */
const LoginLogPage: React.FC = () => {
  const { hasPermission } = useAuthStore()
  
  const [searchParams, setSearchParams] = useState<LoginLogQueryParams>({
    page: 1,
    page_size: 20
  })

  // 获取登录日志
  const {
    data: loginLogsData,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs
  } = useQuery({
    queryKey: ['login-logs', searchParams],
    queryFn: () => rbacApi.loginLog.getLoginLogs(searchParams),
    enabled: hasPermission('rbac:login-logs:list')
  })

  const logs = loginLogsData?.items || []
  const total = loginLogsData?.total || 0

  // 权限检查
  if (!hasPermission('rbac:login-logs:list')) {
    return (
      <>
        <Helmet>
          <title>登录日志 - NH资产钱包托管系统</title>
        </Helmet>
        <Alert
          message="权限不足"
          description="您没有权限查看登录日志"
          type="warning"
          showIcon
        />
      </>
    )
  }

  // 错误处理
  if (logsError) {
    return (
      <>
        <Helmet>
          <title>登录日志 - NH资产钱包托管系统</title>
        </Helmet>
        <Alert
          message="加载失败"
          description="无法加载登录日志，请检查网络连接或联系管理员。"
          type="error"
          showIcon
        />
      </>
    )
  }

  // 获取登录状态图标和颜色
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'locked':
        return <LockOutlined style={{ color: '#faad14' }} />
      default:
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />
    }
  }

  // 获取登录状态标签
  const getStatusTag = (status: string) => {
    const statusMap = {
      success: { color: 'success', text: '成功' },
      failed: { color: 'error', text: '失败' },
      locked: { color: 'warning', text: '锁定' }
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status }
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
  }

  // 获取登录方式标签
  const getMethodTag = (method: string) => {
    const methodMap = {
      password: { color: 'blue', text: '密码登录' },
      '2fa': { color: 'green', text: '双因子认证' },
      sso: { color: 'purple', text: 'SSO登录' }
    }
    const methodInfo = methodMap[method as keyof typeof methodMap] || { color: 'default', text: method }
    return <Tag color={methodInfo.color}>{methodInfo.text}</Tag>
  }

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left' as const
    },
    {
      title: '用户',
      key: 'user',
      width: 150,
      render: (_: any, record: AdminLoginLog) => (
        <Space direction="vertical" size="small">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserOutlined style={{ marginRight: 4, color: '#1890ff' }} />
            <span style={{ fontWeight: 'bold' }}>{record.username}</span>
          </div>
          {record.user && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.user.full_name}
            </div>
          )}
        </Space>
      )
    },
    {
      title: '登录状态',
      dataIndex: 'login_status',
      key: 'login_status',
      width: 100,
      render: (status: string) => (
        <Space>
          {getStatusIcon(status)}
          {getStatusTag(status)}
        </Space>
      ),
      filters: [
        { text: '成功', value: 'success' },
        { text: '失败', value: 'failed' },
        { text: '锁定', value: 'locked' }
      ],
             onFilter: (value: any, record: AdminLoginLog) => record.login_status === value
    },
    {
      title: '登录方式',
      dataIndex: 'login_method',
      key: 'login_method',
      width: 120,
      render: (method: string) => getMethodTag(method),
      filters: [
        { text: '密码登录', value: 'password' },
        { text: '双因子认证', value: '2fa' },
        { text: 'SSO登录', value: 'sso' }
      ],
             onFilter: (value: any, record: AdminLoginLog) => record.login_method === value
    },
    {
      title: 'IP地址',
      dataIndex: 'login_ip',
      key: 'login_ip',
      width: 140,
      render: (ip: string) => (
        <Space>
          <GlobalOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontFamily: 'monospace' }}>{ip}</span>
        </Space>
      )
    },
    {
      title: '失败原因',
      dataIndex: 'failure_reason',
      key: 'failure_reason',
      width: 150,
      render: (reason: string, record: AdminLoginLog) => {
        if (record.login_status === 'success') {
          return <Tag color="success">-</Tag>
        }
        return reason ? (
          <Tooltip title={reason}>
            <Tag color="error">{reason.length > 20 ? `${reason.slice(0, 20)}...` : reason}</Tag>
          </Tooltip>
        ) : '-'
      }
    },
    {
      title: '用户代理',
      dataIndex: 'user_agent',
      key: 'user_agent',
      ellipsis: {
        showTitle: false
      },
      render: (userAgent: string) => (
        <Tooltip title={userAgent} placement="topLeft">
          <div style={{ 
            maxWidth: 200, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {userAgent}
          </div>
        </Tooltip>
      )
    },
    {
      title: '登录时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => (
        <Space direction="vertical" size="small">
          <div>{dayjs(date).format('YYYY-MM-DD')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(date).format('HH:mm:ss')}
          </div>
        </Space>
      ),
      sorter: true
    }
  ]

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({
      ...prev,
      username: value || undefined,
      page: 1
    }))
  }

  // 处理状态筛选
  const handleStatusFilter = (status: string) => {
    setSearchParams(prev => ({
      ...prev,
      login_status: status || undefined,
      page: 1
    }))
  }

  // 处理方式筛选
  const handleMethodFilter = (method: string) => {
    setSearchParams(prev => ({
      ...prev,
      login_method: method || undefined,
      page: 1
    }))
  }

  // 处理日期范围筛选
  const handleDateRangeFilter = (dates: any) => {
    if (dates && dates.length === 2) {
      setSearchParams(prev => ({
        ...prev,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD'),
        page: 1
      }))
    } else {
      setSearchParams(prev => ({
        ...prev,
        start_date: undefined,
        end_date: undefined,
        page: 1
      }))
    }
  }

  // 处理分页
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: pagination.current,
      page_size: pagination.pageSize
    }))
  }

  const handleRefresh = () => {
    refetchLogs()
  }

  return (
    <>
      <Helmet>
        <title>登录日志 - NH资产钱包托管系统</title>
      </Helmet>

      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <Title level={2}>
            <HistoryOutlined style={{ marginRight: 8 }} />
            登录日志
          </Title>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={logsLoading}
          >
            刷新
          </Button>
        </div>

        {/* 筛选工具栏 */}
        <Card size="small">
          <Space wrap>
            <Search
              placeholder="搜索用户名"
              allowClear
              style={{ width: 200 }}
              onSearch={handleSearch}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="登录状态"
              allowClear
              style={{ width: 120 }}
              onChange={handleStatusFilter}
            >
              <Option value="success">成功</Option>
              <Option value="failed">失败</Option>
              <Option value="locked">锁定</Option>
            </Select>
            <Select
              placeholder="登录方式"
              allowClear
              style={{ width: 120 }}
              onChange={handleMethodFilter}
            >
              <Option value="password">密码登录</Option>
              <Option value="2fa">双因子认证</Option>
              <Option value="sso">SSO登录</Option>
            </Select>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              style={{ width: 240 }}
              onChange={handleDateRangeFilter}
              presets={[
                { label: '今天', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                { label: '昨天', value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] },
                { label: '最近7天', value: [dayjs().subtract(7, 'day'), dayjs()] },
                { label: '最近30天', value: [dayjs().subtract(30, 'day'), dayjs()] },
                { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] }
              ]}
            />
          </Space>
        </Card>

        {/* 统计信息 */}
        <div style={{ display: 'flex', gap: 16 }}>
          <Card size="small" style={{ flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {logs.filter(log => log.login_status === 'success').length}
              </div>
              <div style={{ color: '#666' }}>成功登录</div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {logs.filter(log => log.login_status === 'failed').length}
              </div>
              <div style={{ color: '#666' }}>失败登录</div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {new Set(logs.map(log => log.login_ip)).size}
              </div>
              <div style={{ color: '#666' }}>唯一IP</div>
            </div>
          </Card>
          <Card size="small" style={{ flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                {total}
              </div>
              <div style={{ color: '#666' }}>总记录数</div>
            </div>
          </Card>
        </div>

        {/* 登录日志表格 */}
        <Card title="登录记录" loading={logsLoading}>
          <Table
            dataSource={logs}
            columns={columns}
            rowKey="id"
            loading={logsLoading}
            scroll={{ x: 1200, y: 600 }}
            pagination={{
              current: searchParams.page,
              pageSize: searchParams.page_size,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            onChange={handleTableChange}
          />
        </Card>
      </div>
    </>
  )
}

export default LoginLogPage
