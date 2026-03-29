import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  KeyOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import { Helmet } from 'react-helmet-async'
import dayjs from 'dayjs'

import { useAuthStore } from '@/stores/authStore'
import {
  twoFactorAdminApi,
  type TwoFactorAdminActionPayload,
  type TwoFactorAdminAuditEvent,
  type TwoFactorAdminAuditFilters,
  type TwoFactorAdminUserDetail,
  type TwoFactorAdminUserFilters,
  type TwoFactorAdminUserSummary,
} from '@/services/apis/twoFactorAdminApi'

const { Paragraph, Text, Title } = Typography

const userTypeOptions = [
  { label: '全部用户', value: 'all' },
  { label: 'App 用户', value: 'app' },
  { label: '租户后台用户', value: 'tenant' },
]

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '已开启', value: 'active' },
  { label: '开启中', value: 'pending' },
  { label: '已禁用', value: 'disabled' },
  { label: '挑战锁定', value: 'locked' },
  { label: '未开启', value: 'not_enabled' },
]

const eventTypeOptions = [
  { label: '全部事件', value: '' },
  { label: '开启中', value: 'mfa_setup_started' },
  { label: '开启成功', value: 'mfa_setup_confirmed' },
  { label: '开启失败', value: 'mfa_setup_failed' },
  { label: '登录验证成功', value: 'mfa_login_verified' },
  { label: '登录验证失败', value: 'mfa_login_failed' },
  { label: '登录挑战锁定', value: 'mfa_login_locked' },
  { label: '恢复码重生', value: 'mfa_recovery_codes_regenerated' },
  { label: '管理员重置', value: 'mfa_disabled_admin_reset' },
  { label: '管理员解锁', value: 'mfa_challenge_unlocked_admin' },
]

const resultOptions = [
  { label: '全部结果', value: '' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
]

const eventTypeLabelMap = new Map(
  eventTypeOptions.map((item) => [item.value, item.label])
)

type ActionModalState = {
  open: boolean
  type: 'reset' | 'unlock'
}

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-'
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
}

const renderMethodStatus = (status: string, locked?: boolean) => {
  if (locked) {
    return <Tag color="warning">挑战锁定</Tag>
  }

  const normalized = (status || '').trim()
  const map: Record<string, { color: string; label: string }> = {
    active: { color: 'success', label: '已开启' },
    pending: { color: 'processing', label: '开启中' },
    disabled: { color: 'default', label: '已禁用' },
    not_enabled: { color: 'default', label: '未开启' },
  }
  const current = map[normalized] || {
    color: 'default',
    label: normalized || '未知',
  }
  return <Tag color={current.color}>{current.label}</Tag>
}

const renderAccountKind = (value?: string) => {
  const map: Record<string, string> = {
    app_user: 'App 用户',
    tenant_admin: '租户子管理员',
    tenant_owner: '租户主账号',
  }
  return map[value || ''] || '-'
}

const renderEventType = (value: string) => {
  return eventTypeLabelMap.get(value) || value
}

const TwoFactorManagementPage: React.FC = () => {
  const canView = useAuthStore((state) =>
    state.hasPermission('system:settings')
  )

  const [userFilters, setUserFilters] = useState<TwoFactorAdminUserFilters>({
    userType: 'all',
    status: 'all',
    keyword: '',
    page: 1,
    pageSize: 20,
  })
  const [auditFilters, setAuditFilters] = useState<TwoFactorAdminAuditFilters>({
    userType: 'all',
    eventType: '',
    result: '',
    keyword: '',
    page: 1,
    pageSize: 20,
  })
  const [users, setUsers] = useState<TwoFactorAdminUserSummary[]>([])
  const [userTotal, setUserTotal] = useState(0)
  const [auditEvents, setAuditEvents] = useState<TwoFactorAdminAuditEvent[]>([])
  const [auditTotal, setAuditTotal] = useState(0)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedUser, setSelectedUser] =
    useState<TwoFactorAdminUserSummary | null>(null)
  const [detail, setDetail] = useState<TwoFactorAdminUserDetail | null>(null)
  const [actionModal, setActionModal] = useState<ActionModalState>({
    open: false,
    type: 'reset',
  })
  const [actionSubmitting, setActionSubmitting] = useState(false)
  const [actionForm] = Form.useForm<TwoFactorAdminActionPayload>()

  const loadUsers = useCallback(async (filters: TwoFactorAdminUserFilters) => {
    try {
      setLoadingUsers(true)
      const response = await twoFactorAdminApi.listUsers(filters)
      setUsers(response.items || [])
      setUserTotal(response.total || 0)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '加载 2FA 用户列表失败'
      )
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  const loadAuditEvents = useCallback(
    async (filters: TwoFactorAdminAuditFilters) => {
      try {
        setLoadingAudit(true)
        const response = await twoFactorAdminApi.listAuditEvents(filters)
        setAuditEvents(response.items || [])
        setAuditTotal(response.total || 0)
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : '加载 2FA 安全事件失败'
        )
      } finally {
        setLoadingAudit(false)
      }
    },
    []
  )

  const loadDetail = useCallback(async (user: TwoFactorAdminUserSummary) => {
    try {
      setDetailLoading(true)
      const response = await twoFactorAdminApi.getUserDetail(
        user.userType,
        user.userId
      )
      setDetail(response)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '加载 2FA 详情失败'
      )
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!canView) {
      return
    }
    void loadUsers(userFilters)
  }, [canView, loadUsers, userFilters])

  useEffect(() => {
    if (!canView) {
      return
    }
    void loadAuditEvents(auditFilters)
  }, [auditFilters, canView, loadAuditEvents])

  const handleOpenDetail = useCallback(
    (record: TwoFactorAdminUserSummary) => {
      setSelectedUser(record)
      setDrawerOpen(true)
      void loadDetail(record)
    },
    [loadDetail]
  )

  const refreshDetail = useCallback(async () => {
    if (!selectedUser) {
      return
    }
    await loadDetail(selectedUser)
  }, [loadDetail, selectedUser])

  const openActionModal = useCallback(
    (type: 'reset' | 'unlock') => {
      actionForm.resetFields()
      setActionModal({ open: true, type })
    },
    [actionForm]
  )

  const handleSubmitAction = useCallback(async () => {
    if (!selectedUser) {
      return
    }

    try {
      const values = await actionForm.validateFields()
      setActionSubmitting(true)
      const request = {
        reason: values.reason.trim(),
        ticketNo: values.ticketNo.trim(),
      }

      const nextDetail =
        actionModal.type === 'reset'
          ? await twoFactorAdminApi.resetUser(
              selectedUser.userType,
              selectedUser.userId,
              request
            )
          : await twoFactorAdminApi.unlockUser(
              selectedUser.userType,
              selectedUser.userId,
              request
            )

      setDetail(nextDetail)
      setActionModal((prev) => ({ ...prev, open: false }))
      message.success(
        actionModal.type === 'reset' ? '已完成 2FA 重置' : '已解除挑战锁定'
      )
      await Promise.all([loadUsers(userFilters), loadAuditEvents(auditFilters)])
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        return
      }
      message.error(error instanceof Error ? error.message : '2FA 管理操作失败')
    } finally {
      setActionSubmitting(false)
    }
  }, [
    actionForm,
    actionModal.type,
    auditFilters,
    loadAuditEvents,
    loadUsers,
    selectedUser,
    userFilters,
  ])

  const userColumns = useMemo(
    () => [
      {
        title: '用户',
        key: 'user',
        render: (_: unknown, record: TwoFactorAdminUserSummary) => (
          <Space direction="vertical" size={2}>
            <Text strong>{record.displayName || record.usernameMasked}</Text>
            <Text type="secondary">{record.usernameMasked}</Text>
            <Text type="secondary">{record.emailMasked || '-'}</Text>
          </Space>
        ),
      },
      {
        title: '用户类型',
        key: 'userType',
        width: 120,
        render: (_: unknown, record: TwoFactorAdminUserSummary) => (
          <Space direction="vertical" size={2}>
            <Tag color={record.userType === 'app' ? 'blue' : 'purple'}>
              {record.userType === 'app' ? 'App' : '租户后台'}
            </Tag>
            <Text type="secondary">
              {renderAccountKind(record.accountKind)}
            </Text>
          </Space>
        ),
      },
      {
        title: '2FA 状态',
        key: 'status',
        width: 150,
        render: (_: unknown, record: TwoFactorAdminUserSummary) => (
          <Space direction="vertical" size={4}>
            {renderMethodStatus(record.methodStatus, record.hasLockedChallenge)}
            <Text type="secondary">恢复码剩余 {record.remainingRecovery}</Text>
          </Space>
        ),
      },
      {
        title: '最近验证',
        dataIndex: 'lastVerifiedAt',
        key: 'lastVerifiedAt',
        width: 180,
        render: (value: string | undefined) => formatDateTime(value),
      },
      {
        title: '最近挑战',
        key: 'lastChallenge',
        width: 180,
        render: (_: unknown, record: TwoFactorAdminUserSummary) => (
          <Space direction="vertical" size={4}>
            <Text>{formatDateTime(record.lastChallengeAt)}</Text>
            <Text type="secondary">
              失败次数 {record.lastChallengeAttemptCount}
            </Text>
          </Space>
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        fixed: 'right' as const,
        render: (_: unknown, record: TwoFactorAdminUserSummary) => (
          <Button type="link" onClick={() => handleOpenDetail(record)}>
            查看详情
          </Button>
        ),
      },
    ],
    [handleOpenDetail]
  )

  const eventColumns = useMemo(
    () => [
      {
        title: '事件时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '用户',
        key: 'user',
        render: (_: unknown, record: TwoFactorAdminAuditEvent) => (
          <Space direction="vertical" size={2}>
            <Text strong>
              {record.displayName || record.usernameMasked || '-'}
            </Text>
            <Text type="secondary">{record.emailMasked || record.userId}</Text>
          </Space>
        ),
      },
      {
        title: '事件',
        dataIndex: 'eventType',
        key: 'eventType',
        width: 180,
        render: (value: string) => <Tag>{renderEventType(value)}</Tag>,
      },
      {
        title: '结果',
        dataIndex: 'eventResult',
        key: 'eventResult',
        width: 100,
        render: (value: string) => (
          <Tag color={value === 'success' ? 'success' : 'error'}>
            {value === 'success' ? '成功' : '失败'}
          </Tag>
        ),
      },
      {
        title: '操作人/工单',
        key: 'operator',
        width: 220,
        render: (_: unknown, record: TwoFactorAdminAuditEvent) => (
          <Space direction="vertical" size={2}>
            <Text>{record.operatorAdminUsername || '-'}</Text>
            <Text type="secondary">{record.ticketNo || '-'}</Text>
          </Space>
        ),
      },
      {
        title: '原因',
        dataIndex: 'reason',
        key: 'reason',
        ellipsis: true,
      },
    ],
    []
  )

  if (!canView) {
    return (
      <>
        <Helmet>
          <title>2FA 管理 - U卡服务管理系统</title>
        </Helmet>
        <Alert
          message="权限不足"
          description="当前账号没有查看 2FA 管理后台的权限。"
          type="warning"
          showIcon
        />
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>2FA 管理 - U卡服务管理系统</title>
      </Helmet>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>
            <SafetyCertificateOutlined style={{ marginRight: 8 }} />
            2FA 管理
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            这里是平台支持侧的 2FA 支持台，用于查询 App 侧 2FA
            状态、处理人工重置和挑战解锁，不展示明文密钥和恢复码。
          </Paragraph>
        </div>

        <Alert
          type="info"
          showIcon
          message="当前版本保持不改动旧租户后台 2FA"
          description="本页针对统一 2FA 新链路做支持管理，旧的租户共享 2FA 页面和接口不会被这里接管。"
        />

        <Tabs
          items={[
            {
              key: 'users',
              label: '用户查询',
              children: (
                <Card>
                  <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col span={5}>
                      <Input
                        allowClear
                        placeholder="邮箱 / 用户名 / 用户ID"
                        prefix={<SearchOutlined />}
                        value={userFilters.keyword}
                        onChange={(event) =>
                          setUserFilters((prev) => ({
                            ...prev,
                            keyword: event.target.value,
                            page: 1,
                          }))
                        }
                      />
                    </Col>
                    <Col span={4}>
                      <Select
                        style={{ width: '100%' }}
                        value={userFilters.userType}
                        options={userTypeOptions}
                        onChange={(value) =>
                          setUserFilters((prev) => ({
                            ...prev,
                            userType: value,
                            page: 1,
                          }))
                        }
                      />
                    </Col>
                    <Col span={4}>
                      <Select
                        style={{ width: '100%' }}
                        value={userFilters.status}
                        options={statusOptions}
                        onChange={(value) =>
                          setUserFilters((prev) => ({
                            ...prev,
                            status: value,
                            page: 1,
                          }))
                        }
                      />
                    </Col>
                    <Col span={11}>
                      <Space>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => void loadUsers(userFilters)}
                        >
                          刷新
                        </Button>
                        <Button
                          onClick={() =>
                            setUserFilters({
                              userType: 'all',
                              status: 'all',
                              keyword: '',
                              page: 1,
                              pageSize: userFilters.pageSize,
                            })
                          }
                        >
                          重置筛选
                        </Button>
                      </Space>
                    </Col>
                  </Row>

                  <Table
                    rowKey={(record) => `${record.userType}:${record.userId}`}
                    loading={loadingUsers}
                    columns={userColumns}
                    dataSource={users}
                    scroll={{ x: 980 }}
                    pagination={{
                      current: userFilters.page,
                      pageSize: userFilters.pageSize,
                      total: userTotal,
                      showSizeChanger: true,
                      onChange: (page, pageSize) =>
                        setUserFilters((prev) => ({
                          ...prev,
                          page,
                          pageSize,
                        })),
                    }}
                  />
                </Card>
              ),
            },
            {
              key: 'events',
              label: '安全事件',
              children: (
                <Card>
                  <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col span={5}>
                      <Input
                        allowClear
                        placeholder="用户 / 邮箱 / 工单号"
                        prefix={<SearchOutlined />}
                        value={auditFilters.keyword}
                        onChange={(event) =>
                          setAuditFilters((prev) => ({
                            ...prev,
                            keyword: event.target.value,
                            page: 1,
                          }))
                        }
                      />
                    </Col>
                    <Col span={4}>
                      <Select
                        style={{ width: '100%' }}
                        value={auditFilters.userType}
                        options={userTypeOptions}
                        onChange={(value) =>
                          setAuditFilters((prev) => ({
                            ...prev,
                            userType: value,
                            page: 1,
                          }))
                        }
                      />
                    </Col>
                    <Col span={5}>
                      <Select
                        style={{ width: '100%' }}
                        value={auditFilters.eventType}
                        options={eventTypeOptions}
                        onChange={(value) =>
                          setAuditFilters((prev) => ({
                            ...prev,
                            eventType: value,
                            page: 1,
                          }))
                        }
                      />
                    </Col>
                    <Col span={4}>
                      <Select
                        style={{ width: '100%' }}
                        value={auditFilters.result}
                        options={resultOptions}
                        onChange={(value) =>
                          setAuditFilters((prev) => ({
                            ...prev,
                            result: value,
                            page: 1,
                          }))
                        }
                      />
                    </Col>
                    <Col span={6}>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => void loadAuditEvents(auditFilters)}
                      >
                        刷新
                      </Button>
                    </Col>
                  </Row>

                  <Table
                    rowKey="id"
                    loading={loadingAudit}
                    columns={eventColumns}
                    dataSource={auditEvents}
                    scroll={{ x: 980 }}
                    pagination={{
                      current: auditFilters.page,
                      pageSize: auditFilters.pageSize,
                      total: auditTotal,
                      showSizeChanger: true,
                      onChange: (page, pageSize) =>
                        setAuditFilters((prev) => ({
                          ...prev,
                          page,
                          pageSize,
                        })),
                    }}
                  />
                </Card>
              ),
            },
          ]}
        />
      </Space>

      <Drawer
        width={760}
        title={
          selectedUser
            ? `${selectedUser.displayName || selectedUser.usernameMasked} 的 2FA 详情`
            : '2FA 详情'
        }
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setDetail(null)
          setSelectedUser(null)
        }}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void refreshDetail()}
          >
            刷新详情
          </Button>
        }
      >
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              title="基础信息"
              extra={
                <Space>
                  <Button
                    icon={<KeyOutlined />}
                    danger
                    disabled={!detail.summary.hasTwoFactor}
                    onClick={() => openActionModal('reset')}
                  >
                    强制重置 2FA
                  </Button>
                  <Button
                    icon={<UnlockOutlined />}
                    disabled={!detail.summary.hasLockedChallenge}
                    onClick={() => openActionModal('unlock')}
                  >
                    解除挑战锁定
                  </Button>
                </Space>
              }
            >
              <Descriptions column={2} size="small">
                <Descriptions.Item label="用户类型">
                  <Space>
                    <Tag
                      color={
                        detail.summary.userType === 'app' ? 'blue' : 'purple'
                      }
                    >
                      {detail.summary.userType === 'app' ? 'App' : '租户后台'}
                    </Tag>
                    <Text type="secondary">
                      {renderAccountKind(detail.summary.accountKind)}
                    </Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="2FA 状态">
                  {renderMethodStatus(
                    detail.summary.methodStatus,
                    detail.summary.hasLockedChallenge
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="用户ID">
                  {detail.summary.userId}
                </Descriptions.Item>
                <Descriptions.Item label="租户ID">
                  {detail.summary.tenantId || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="用户名">
                  {detail.summary.usernameMasked}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">
                  {detail.summary.emailMasked || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="手机号">
                  {detail.summary.phoneMasked || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="最近验证">
                  {formatDateTime(detail.summary.lastVerifiedAt)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="2FA 方法">
              {detail.method ? (
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="方法类型">
                    {detail.method.methodType}
                  </Descriptions.Item>
                  <Descriptions.Item label="恢复码剩余">
                    {detail.method.remainingRecovery}
                  </Descriptions.Item>
                  <Descriptions.Item label="绑定开始时间">
                    {formatDateTime(detail.method.setupStartedAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="启用时间">
                    {formatDateTime(detail.method.enabledAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="最近验证时间">
                    {formatDateTime(detail.method.lastVerifiedAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="禁用原因">
                    {detail.method.disabledReason || '-'}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Text type="secondary">
                  当前用户尚未创建新的 2FA 方法记录。
                </Text>
              )}
            </Card>

            <Card title="风险状态">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="挑战锁定">
                  {detail.risk.hasLockedChallenge ? (
                    <Tag color="warning">是</Tag>
                  ) : (
                    <Tag>否</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="最近挑战时间">
                  {formatDateTime(detail.risk.lastChallengeAt)}
                </Descriptions.Item>
                <Descriptions.Item label="最近失败次数">
                  {detail.risk.lastChallengeAttemptCount}
                </Descriptions.Item>
                <Descriptions.Item label="最近 IP">
                  {detail.risk.recentIp || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="最近 User-Agent" span={2}>
                  <Paragraph
                    ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                    style={{ marginBottom: 0 }}
                  >
                    {detail.risk.recentUserAgent || '-'}
                  </Paragraph>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="最近人工处理记录">
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={detail.recentAdminActions}
                locale={{ emptyText: '暂无人工处理记录' }}
                columns={[
                  {
                    title: '时间',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    width: 170,
                    render: (value: string) => formatDateTime(value),
                  },
                  {
                    title: '事件',
                    dataIndex: 'eventType',
                    key: 'eventType',
                    render: (value: string) => renderEventType(value),
                  },
                  {
                    title: '操作人',
                    dataIndex: 'operatorAdminUsername',
                    key: 'operatorAdminUsername',
                    render: (value: string) => value || '-',
                  },
                  {
                    title: '工单号',
                    dataIndex: 'ticketNo',
                    key: 'ticketNo',
                    render: (value: string) => value || '-',
                  },
                  {
                    title: '原因',
                    dataIndex: 'reason',
                    key: 'reason',
                    ellipsis: true,
                  },
                ]}
              />
            </Card>

            <Card title="最近安全事件">
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={detail.recentEvents}
                columns={[
                  {
                    title: '时间',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    width: 170,
                    render: (value: string) => formatDateTime(value),
                  },
                  {
                    title: '事件',
                    dataIndex: 'eventType',
                    key: 'eventType',
                    render: (value: string) => renderEventType(value),
                  },
                  {
                    title: '结果',
                    dataIndex: 'eventResult',
                    key: 'eventResult',
                    width: 100,
                    render: (value: string) => (
                      <Tag color={value === 'success' ? 'success' : 'error'}>
                        {value}
                      </Tag>
                    ),
                  },
                  {
                    title: 'IP',
                    dataIndex: 'ip',
                    key: 'ip',
                    width: 150,
                    render: (value: string) => value || '-',
                  },
                ]}
              />
            </Card>
          </Space>
        ) : (
          <Card loading={detailLoading} />
        )}
      </Drawer>

      <Modal
        open={actionModal.open}
        title={actionModal.type === 'reset' ? '强制重置 2FA' : '解除挑战锁定'}
        onCancel={() => setActionModal((prev) => ({ ...prev, open: false }))}
        onOk={() => void handleSubmitAction()}
        confirmLoading={actionSubmitting}
      >
        <Alert
          type="warning"
          showIcon
          message={
            actionModal.type === 'reset'
              ? '重置后用户需要重新绑定 2FA。'
              : '仅清理当前锁定 challenge，用户下次登录会重新获取挑战。'
          }
          style={{ marginBottom: 16 }}
        />
        <Form form={actionForm} layout="vertical">
          <Form.Item
            name="ticketNo"
            label="工单号"
            rules={[{ required: true, message: '请输入工单号' }]}
          >
            <Input placeholder="请输入工单号" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="处理原因"
            rules={[{ required: true, message: '请输入处理原因' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请填写身份核验结果和处理原因"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default TwoFactorManagementPage
