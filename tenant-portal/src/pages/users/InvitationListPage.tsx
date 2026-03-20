import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tree,
  Typography,
  message,
} from 'antd'
import type { DataNode } from 'antd/es/tree'
import { EyeOutlined, ReloadOutlined, ShareAltOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { TENANT_PERMISSION } from '@/constants/rbac'
import {
  tenantUserService,
  type TenantInvitationDetail,
  type TenantInvitationListParams,
  type TenantInvitationRelation,
  type TenantInvitationUserSummary,
} from '@/services/tenantUserService'
import { useAuthStore } from '@/stores/authStore'

const { Title, Text, Paragraph } = Typography

const bindSourceOptions = [
  { label: '全部来源', value: '' },
  { label: '手动输入', value: 'manual_input' },
  { label: '扫码绑定', value: 'qr_scan' },
  { label: '邀请链接', value: 'invite_link' },
]

const bindSourceText: Record<string, string> = {
  manual_input: '手动输入',
  qr_scan: '扫码绑定',
  invite_link: '邀请链接',
}

const searchPlaceholder = '搜索邀请人 / 被邀请用户 / 邮箱 / 邀请码'

interface InvitationGroup {
  inviterId: string
  inviterUserName: string
  inviterEmail: string
  invitees: TenantInvitationRelation[]
}

function formatDateTime(value?: string) {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function renderBindSourceTag(value?: string) {
  return <Tag color="blue">{bindSourceText[value || ''] || value || '-'}</Tag>
}

function renderKycTag(value?: number) {
  return <Tag color={value === 1 ? 'success' : 'default'}>{value === 1 ? '已 KYC' : '未 KYC'}</Tag>
}

function toggleExpandedKey(keys: string[], key: string) {
  if (keys.includes(key)) {
    return keys.filter((item) => item !== key)
  }

  return [...keys, key]
}

function buildInvitationGroups(items: TenantInvitationRelation[]): InvitationGroup[] {
  const groupMap = new Map<string, InvitationGroup>()

  items.forEach((item) => {
    const current = groupMap.get(item.inviterId)
    if (current) {
      current.invitees.push(item)
      return
    }

    groupMap.set(item.inviterId, {
      inviterId: item.inviterId,
      inviterUserName: item.inviterUserName,
      inviterEmail: item.inviterEmail,
      invitees: [item],
    })
  })

  return Array.from(groupMap.values()).sort((left, right) => {
    if (right.invitees.length !== left.invitees.length) {
      return right.invitees.length - left.invitees.length
    }

    return left.inviterUserName.localeCompare(right.inviterUserName)
  })
}

function normalizeInvitationDetail(detail: TenantInvitationDetail | null): TenantInvitationDetail | null {
  if (!detail) {
    return null
  }

  return {
    ...detail,
    invitees: Array.isArray(detail.invitees) ? detail.invitees : [],
  }
}

const InvitationListPage: React.FC = () => {
  const canView = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.TENANT_USERS_VIEW))
  const [items, setItems] = useState<TenantInvitationRelation[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [bindSource, setBindSource] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<TenantInvitationDetail | null>(null)
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<string[]>([])
  const [expandedDetailKeys, setExpandedDetailKeys] = useState<string[]>([])

  const loadInvitations = useCallback(
    async (
      nextPage = page,
      nextPageSize = pageSize,
      overrides?: {
        search?: string
        bindSource?: string
      }
    ) => {
      if (!canView) {
        return
      }

      try {
        setLoading(true)
        const nextSearch = overrides?.search ?? search
        const nextBindSource = overrides?.bindSource ?? bindSource
        const params: TenantInvitationListParams = {
          page: nextPage,
          pageSize: nextPageSize,
          search: nextSearch || undefined,
          bindSource: nextBindSource || undefined,
        }

        const response = await tenantUserService.getInvitations(params)
        setItems(response.data?.items || [])
        setTotal(response.data?.pagination?.total || 0)
        setPage(response.data?.pagination?.page || nextPage)
        setPageSize(response.data?.pagination?.pageSize || nextPageSize)
      } catch (error) {
        message.error(error instanceof Error ? error.message : '加载邀请关系失败')
      } finally {
        setLoading(false)
      }
    },
    [bindSource, canView, page, pageSize, search]
  )

  useEffect(() => {
    loadInvitations(1, pageSize)
  }, [canView])

  const handleOpenDetail = useCallback(async (userId: string) => {
    if (!userId) {
      return
    }

    try {
      setDetailLoading(true)
      setDetailOpen(true)
      const response = await tenantUserService.getUserInvitations(userId)
      setDetail(normalizeInvitationDetail(response.data || null))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载邀请详情失败')
      setDetailOpen(false)
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const groupedInvitations = useMemo(() => buildInvitationGroups(items), [items])

  useEffect(() => {
    setExpandedGroupKeys(groupedInvitations.map((group) => `group-${group.inviterId}`))
  }, [groupedInvitations])

  useEffect(() => {
    if (!detail) {
      setExpandedDetailKeys([])
      return
    }

    const keys: string[] = [`current-${detail.user.id}`]
    if (detail.inviter) {
      keys.unshift(`inviter-${detail.inviter.id}`)
    }
    setExpandedDetailKeys(keys)
  }, [detail])

  const totalKycPassed = useMemo(
    () => items.reduce((count, item) => count + (item.inviteeKycStatus === 1 ? 1 : 0), 0),
    [items]
  )

  const treeData = useMemo<DataNode[]>(
    () =>
      groupedInvitations.map((group) => {
        const nodeKey = `group-${group.inviterId}`

        return {
          key: nodeKey,
          selectable: false,
          title: (
            <div onClick={() => setExpandedGroupKeys((current) => toggleExpandedKey(current, nodeKey))}>
              <Space size={12} style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space direction="vertical" size={2}>
                  <Space size={8}>
                    <Text strong>{group.inviterUserName}</Text>
                    <Badge count={group.invitees.length} color="#1677ff" />
                  </Space>
                  <Text type="secondary">{group.inviterEmail}</Text>
                </Space>
                <Space size={8}>
                  <Tag color="processing">邀请人</Tag>
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleOpenDetail(group.inviterId)
                    }}
                  >
                    详情
                  </Button>
                </Space>
              </Space>
            </div>
          ),
          children: group.invitees.map((relation) => ({
            key: `relation-${relation.id}`,
            selectable: false,
            isLeaf: true,
            title: (
              <Space size={12} style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space direction="vertical" size={2}>
                  <Text>{relation.inviteeUserName}</Text>
                  <Text type="secondary">{relation.inviteeEmail}</Text>
                </Space>
                <Space size={8}>
                  {renderBindSourceTag(relation.bindSource)}
                  {renderKycTag(relation.inviteeKycStatus)}
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleOpenDetail(relation.inviteeId)
                    }}
                  >
                    详情
                  </Button>
                </Space>
              </Space>
            ),
          })),
        }
      }),
    [groupedInvitations, handleOpenDetail]
  )

  const detailTreeData = useMemo<DataNode[]>(() => {
    if (!detail) {
      return []
    }

    const inviteeChildren: DataNode[] = detail.invitees.map((invitee) => ({
      key: `invitee-${invitee.id}`,
      selectable: false,
      isLeaf: true,
      title: (
        <Space size={12} style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space direction="vertical" size={2}>
            <Text strong>{invitee.userName}</Text>
            <Text type="secondary">{invitee.email}</Text>
          </Space>
          <Space size={8}>
            {renderKycTag(invitee.isKycInternal)}
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={(event) => {
                event.stopPropagation()
                handleOpenDetail(invitee.id)
              }}
            >
              详情
            </Button>
          </Space>
        </Space>
      ),
    }))

    const currentUserKey = `current-${detail.user.id}`
    const currentUserNode: DataNode = {
      key: currentUserKey,
      selectable: false,
      title: (
        <div onClick={() => setExpandedDetailKeys((current) => toggleExpandedKey(current, currentUserKey))}>
          <Space size={12} style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space direction="vertical" size={2}>
              <Text strong>{detail.user.userName}</Text>
              <Text type="secondary">{detail.user.email}</Text>
            </Space>
            <Space size={8}>
              {renderKycTag(detail.user.isKycInternal)}
              <Tag color="gold">当前用户</Tag>
            </Space>
          </Space>
        </div>
      ),
      children: inviteeChildren,
    }

    if (!detail.inviter) {
      return [currentUserNode]
    }

    const inviterKey = `inviter-${detail.inviter.id}`

    return [
      {
        key: inviterKey,
        selectable: false,
        title: (
          <div onClick={() => setExpandedDetailKeys((current) => toggleExpandedKey(current, inviterKey))}>
            <Space size={12} style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space direction="vertical" size={2}>
                <Text strong>{detail.inviter.userName}</Text>
                <Text type="secondary">{detail.inviter.email}</Text>
              </Space>
              <Space size={8}>
                <Tag color="purple">上游邀请人</Tag>
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleOpenDetail(detail.inviter!.id)
                  }}
                >
                  详情
                </Button>
              </Space>
            </Space>
          </div>
        ),
        children: [currentUserNode],
      },
    ]
  }, [detail, handleOpenDetail])

  const tableColumns = useMemo(
    () => [
      {
        title: '邀请人',
        key: 'inviter',
        render: (_: unknown, record: TenantInvitationRelation) => (
          <Space direction="vertical" size={2}>
            <Text strong>{record.inviterUserName}</Text>
            <Text type="secondary">{record.inviterEmail}</Text>
          </Space>
        ),
      },
      {
        title: '被邀请用户',
        key: 'invitee',
        render: (_: unknown, record: TenantInvitationRelation) => (
          <Space direction="vertical" size={2}>
            <Text strong>{record.inviteeUserName}</Text>
            <Text type="secondary">{record.inviteeEmail}</Text>
          </Space>
        ),
      },
      {
        title: '邀请码',
        dataIndex: 'inviteCode',
        key: 'inviteCode',
        render: (value: string) => value || '-',
      },
      {
        title: '绑定来源',
        dataIndex: 'bindSource',
        key: 'bindSource',
        render: (value: string) => renderBindSourceTag(value),
      },
      {
        title: '绑定时间',
        dataIndex: 'boundAt',
        key: 'boundAt',
        render: (value: string) => formatDateTime(value),
      },
      {
        title: 'KYC',
        dataIndex: 'inviteeKycStatus',
        key: 'inviteeKycStatus',
        render: (value: number) => renderKycTag(value),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        render: (_: unknown, record: TenantInvitationRelation) => (
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleOpenDetail(record.inviteeId)}>
            详情
          </Button>
        ),
      },
    ],
    [handleOpenDetail]
  )

  const inviteeColumns = useMemo(
    () => [
      { title: '用户名', dataIndex: 'userName', key: 'userName' },
      { title: '邮箱', dataIndex: 'email', key: 'email' },
      {
        title: '邀请码',
        dataIndex: 'invitationCode',
        key: 'invitationCode',
        render: (value?: string) => value || '-',
      },
      {
        title: '注册时间',
        dataIndex: 'registerTime',
        key: 'registerTime',
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '绑定来源',
        dataIndex: 'bindSource',
        key: 'bindSource',
        render: (value?: string) => renderBindSourceTag(value),
      },
      {
        title: '绑定时间',
        dataIndex: 'boundAt',
        key: 'boundAt',
        render: (value?: string) => formatDateTime(value),
      },
      {
        title: 'KYC',
        dataIndex: 'isKycInternal',
        key: 'isKycInternal',
        render: (value: number) => renderKycTag(value),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        render: (_: unknown, record: TenantInvitationUserSummary) => (
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleOpenDetail(record.id)}>
            详情
          </Button>
        ),
      },
    ],
    [handleOpenDetail]
  )

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>
            邀请关系
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            采用“树状关系 + 明细列表”的组合展示。主流邀请系统通常同时提供树视图和列表视图，便于同时看结构和查明细。
          </Paragraph>
        </div>

        <Space wrap>
          <Input.Search
            placeholder={searchPlaceholder}
            title={searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onSearch={() => loadInvitations(1, pageSize)}
            allowClear
            style={{ width: 320 }}
          />
          <Select
            value={bindSource}
            options={bindSourceOptions}
            style={{ width: 160 }}
            onChange={(value) => setBindSource(value)}
          />
          <Button type="primary" onClick={() => loadInvitations(1, pageSize)}>
            搜索
          </Button>
          <Button
            onClick={() => {
              setSearch('')
              setBindSource('')
              loadInvitations(1, pageSize, { search: '', bindSource: '' })
            }}
          >
            重置
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => loadInvitations(page, pageSize)} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="当前绑定关系" value={total} prefix={<ShareAltOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="有效邀请人" value={groupedInvitations.length} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="已完成 KYC 的被邀请用户" value={totalKycPassed} prefix={<TeamOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card
            title="邀请关系树"
            extra={<Text type="secondary">点击树节点本身也可以展开或收起，不必只点箭头</Text>}
            bodyStyle={{ minHeight: 520 }}
          >
            {treeData.length === 0 ? (
              <Empty description="暂无邀请关系数据" />
            ) : (
              <Tree
                blockNode
                showLine
                selectable={false}
                expandedKeys={expandedGroupKeys}
                onExpand={(keys) => setExpandedGroupKeys(keys as string[])}
                treeData={treeData}
                style={{ background: '#fff' }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card
            title="邀请关系明细"
            extra={<Text type="secondary">适合搜索、核对和导出前检查</Text>}
            bodyStyle={{ minHeight: 520 }}
          >
            <Table
              rowKey="id"
              loading={loading}
              columns={tableColumns}
              dataSource={items}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                onChange: (nextPage, nextPageSize) => loadInvitations(nextPage, nextPageSize),
              }}
              scroll={{ x: 920 }}
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        title="邀请关系详情"
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setDetail(null)
        }}
        width={920}
      >
        {detailLoading ? (
          <Text type="secondary">加载中...</Text>
        ) : !detail ? (
          <Empty description="暂无详情数据" />
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card title="关系图" size="small">
              <Tree
                blockNode
                showLine
                selectable={false}
                expandedKeys={expandedDetailKeys}
                onExpand={(keys) => setExpandedDetailKeys(keys as string[])}
                treeData={detailTreeData}
              />
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="当前用户" size="small">
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="用户名">{detail.user.userName}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{detail.user.email}</Descriptions.Item>
                    <Descriptions.Item label="邀请码">{detail.user.invitationCode || '-'}</Descriptions.Item>
                    <Descriptions.Item label="注册时间">{formatDateTime(detail.user.registerTime)}</Descriptions.Item>
                    <Descriptions.Item label="KYC">{renderKycTag(detail.user.isKycInternal)}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="上游邀请人" size="small">
                  {detail.inviter ? (
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="用户名">{detail.inviter.userName}</Descriptions.Item>
                      <Descriptions.Item label="邮箱">{detail.inviter.email}</Descriptions.Item>
                      <Descriptions.Item label="邀请码">{detail.inviter.invitationCode || '-'}</Descriptions.Item>
                      <Descriptions.Item label="绑定来源">{renderBindSourceTag(detail.inviter.bindSource)}</Descriptions.Item>
                      <Descriptions.Item label="绑定时间">{formatDateTime(detail.inviter.boundAt)}</Descriptions.Item>
                    </Descriptions>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前用户没有上游邀请人" />
                  )}
                </Card>
              </Col>
            </Row>

            <Card
              title={`下游被邀请用户 (${detail.inviteeCount})`}
              size="small"
              extra={<Text type="secondary">一个用户只能有一个上游邀请人，但可以邀请多个下游用户</Text>}
            >
              {detail.invitees.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前用户还没有邀请记录" />
              ) : (
                <Table
                  rowKey="id"
                  pagination={false}
                  dataSource={detail.invitees}
                  columns={inviteeColumns}
                  scroll={{ x: 760 }}
                />
              )}
            </Card>

            <Divider style={{ margin: 0 }} />
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              这一版按主流邀请系统的做法做成“树视图 + 列表视图 + 详情抽屉”三层结构：上层看整体关系，中层查明细，下层看单个用户的上下游链路。
            </Paragraph>
          </Space>
        )}
      </Drawer>
    </div>
  )
}

export default InvitationListPage
