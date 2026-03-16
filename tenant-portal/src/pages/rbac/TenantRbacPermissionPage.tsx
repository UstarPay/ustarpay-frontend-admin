import React, { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { TENANT_PERMISSION } from '@/constants/rbac'
import {
  tenantRbacService,
  type TenantRbacModule,
  type TenantRbacModulePayload,
  type TenantRbacPermission,
  type TenantRbacPermissionPayload,
} from '@/services/tenantRbacService'
import { useAuthStore } from '@/stores/authStore'

const { Title, Text } = Typography

const booleanOptions = [
  { label: '启用', value: true },
  { label: '禁用', value: false },
]

const TenantRbacPermissionPage: React.FC = () => {
  const [moduleForm] = Form.useForm<TenantRbacModulePayload>()
  const [permissionForm] = Form.useForm<TenantRbacPermissionPayload>()
  const [modules, setModules] = useState<TenantRbacModule[]>([])
  const [permissions, setPermissions] = useState<TenantRbacPermission[]>([])
  const [loading, setLoading] = useState(false)
  const [moduleOpen, setModuleOpen] = useState(false)
  const [permissionOpen, setPermissionOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<TenantRbacModule | null>(null)
  const [editingPermission, setEditingPermission] = useState<TenantRbacPermission | null>(null)
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null)
  const canManage = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.TENANT_RBAC_PERMISSIONS_MANAGE))

  const loadData = async () => {
    try {
      setLoading(true)
      const [moduleResponse, permissionResponse] = await Promise.all([
        tenantRbacService.getModules(),
        tenantRbacService.getPermissions(),
      ])
      const nextModules = moduleResponse.data?.items || []
      const nextPermissions = permissionResponse.data?.items || []
      setModules(nextModules)
      setPermissions(nextPermissions)

      if (selectedModuleId && !nextModules.some((item: TenantRbacModule) => item.id === selectedModuleId)) {
        setSelectedModuleId(null)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载权限配置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const modulePermissionMap = useMemo(() => {
    const map = new Map<number, number>()
    permissions.forEach((permission) => {
      map.set(permission.moduleId, (map.get(permission.moduleId) || 0) + 1)
    })
    return map
  }, [permissions])

  const filteredPermissions = useMemo(() => {
    if (!selectedModuleId) {
      return permissions
    }
    return permissions.filter((permission) => permission.moduleId === selectedModuleId)
  }, [permissions, selectedModuleId])

  const enabledPermissionCount = useMemo(() => {
    return permissions.filter((permission) => permission.isActive).length
  }, [permissions])

  const moduleOptions = useMemo(() => {
    return modules.map((module) => ({
      label: `${module.moduleName} (${module.moduleCode})`,
      value: module.id,
    }))
  }, [modules])

  const selectedModule = useMemo(() => {
    return modules.find((module) => module.id === selectedModuleId) || null
  }, [modules, selectedModuleId])

  const permissionColumns = useMemo(
    () => [
      {
        title: '权限名称',
        dataIndex: 'permissionName',
        key: 'permissionName',
        width: 180,
        render: (value: string, record: TenantRbacPermission) => (
          <div>
            <div style={{ fontWeight: 600 }}>{value}</div>
            {record.description ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.description}
              </Text>
            ) : null}
          </div>
        ),
      },
      {
        title: '权限编码',
        dataIndex: 'permissionCode',
        key: 'permissionCode',
        width: 220,
        render: (value: string) => <Tag color="blue">{value}</Tag>,
      },
      {
        title: '模块',
        dataIndex: 'moduleName',
        key: 'moduleName',
        width: 120,
      },
      {
        title: '资源',
        dataIndex: 'resource',
        key: 'resource',
        width: 120,
        render: (value?: string) => value || '-',
      },
      {
        title: '动作',
        dataIndex: 'action',
        key: 'action',
        width: 100,
        render: (value?: string) => value || '-',
      },
      {
        title: '状态',
        dataIndex: 'isActive',
        key: 'isActive',
        width: 90,
        render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? '启用' : '禁用'}</Tag>,
      },
      {
        title: '操作',
        key: 'actions',
        width: 100,
        render: (_: unknown, record: TenantRbacPermission) => (
          <Space size="small">
            {canManage ? (
              <>
                <Button type="text" icon={<EditOutlined />} onClick={() => handleEditPermission(record)} />
                <Popconfirm title="确认删除该权限吗？" onConfirm={() => handleDeletePermission(record.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </>
            ) : (
              <Tag>只读</Tag>
            )}
          </Space>
        ),
      },
    ],
    [canManage]
  )

  const handleCreateModule = () => {
    if (!canManage) {
      message.warning('当前账号只有查看权限')
      return
    }
    setEditingModule(null)
    moduleForm.resetFields()
    moduleForm.setFieldsValue({ sort: 0, isActive: true })
    setModuleOpen(true)
  }

  const handleEditModule = (record: TenantRbacModule) => {
    if (!canManage) {
      message.warning('当前账号只有查看权限')
      return
    }
    setEditingModule(record)
    moduleForm.setFieldsValue(record)
    setModuleOpen(true)
  }

  const handleDeleteModule = async (id: number) => {
    try {
      await tenantRbacService.deleteModule(id)
      message.success('权限模块已删除')
      loadData()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除权限模块失败')
    }
  }

  const handleSubmitModule = async () => {
    try {
      const values = await moduleForm.validateFields()
      if (editingModule) {
        await tenantRbacService.updateModule(editingModule.id, values)
        message.success('权限模块已更新')
      } else {
        await tenantRbacService.createModule(values)
        message.success('权限模块已创建')
      }
      setModuleOpen(false)
      loadData()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    }
  }

  const handleCreatePermission = () => {
    if (!canManage) {
      message.warning('当前账号只有查看权限')
      return
    }
    setEditingPermission(null)
    permissionForm.resetFields()
    permissionForm.setFieldsValue({
      moduleId: selectedModuleId || undefined,
      sort: 0,
      isActive: true,
    })
    setPermissionOpen(true)
  }

  const handleEditPermission = async (record: TenantRbacPermission) => {
    if (!canManage) {
      message.warning('当前账号只有查看权限')
      return
    }
    try {
      const response = await tenantRbacService.getPermission(record.id)
      permissionForm.setFieldsValue(response.data)
      setEditingPermission(record)
      setPermissionOpen(true)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载权限详情失败')
    }
  }

  const handleDeletePermission = async (id: number) => {
    try {
      await tenantRbacService.deletePermission(id)
      message.success('权限已删除')
      loadData()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除权限失败')
    }
  }

  const handleSubmitPermission = async () => {
    try {
      const values = await permissionForm.validateFields()
      if (editingPermission) {
        await tenantRbacService.updatePermission(editingPermission.id, values)
        message.success('权限已更新')
      } else {
        await tenantRbacService.createPermission(values)
        message.success('权限已创建')
      }
      setPermissionOpen(false)
      loadData()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} style={{ marginBottom: 6 }}>
            RBAC 权限管理
          </Title>
          <Text type="secondary">管理租户后台自己的权限模块和权限项，不影响平台后台 RBAC。</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            刷新
          </Button>
          {canManage ? <Button onClick={handleCreateModule}>新增模块</Button> : null}
          {canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePermission}>
              新增权限
            </Button>
          ) : null}
        </Space>
      </div>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="权限模块数" value={modules.length} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="权限总数" value={permissions.length} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="启用中权限" value={enabledPermissionCount} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} align="stretch">
        <Col xs={24} lg={8}>
          <Card
            title="权限模块"
            extra={
              selectedModuleId ? (
                <Button type="link" onClick={() => setSelectedModuleId(null)}>
                  查看全部
                </Button>
              ) : null
            }
            bodyStyle={{ padding: 12 }}
          >
            <div style={{ maxHeight: 760, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {modules.length === 0 ? (
                <Empty description="暂无权限模块" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                modules.map((module) => {
                  const selected = module.id === selectedModuleId
                  const permissionCount = modulePermissionMap.get(module.id) || 0
                  return (
                    <div
                      key={module.id}
                      onClick={() => setSelectedModuleId(module.id)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: 14,
                        padding: 14,
                        border: selected ? '1px solid #1677ff' : '1px solid #f0f0f0',
                        background: selected ? '#f0f7ff' : '#ffffff',
                        boxShadow: selected ? '0 6px 18px rgba(22,119,255,0.08)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{module.moduleName}</div>
                          <div style={{ marginBottom: 8 }}>
                            <Tag color="blue">{module.moduleCode}</Tag>
                            <Tag color={module.isActive ? 'success' : 'default'}>{module.isActive ? '启用' : '禁用'}</Tag>
                          </div>
                          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                            {module.description || '暂无描述'}
                          </Text>
                        </div>
                        {canManage ? (
                          <Space size={4}>
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={(event) => {
                                event.stopPropagation()
                                handleEditModule(module)
                              }}
                            />
                            <Popconfirm
                              title="确认删除该模块吗？"
                              onConfirm={() => handleDeleteModule(module.id)}
                              onPopupClick={(event) => event.stopPropagation()}
                            >
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(event) => event.stopPropagation()}
                              />
                            </Popconfirm>
                          </Space>
                        ) : null}
                      </div>
                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary">排序 {module.sort}</Text>
                        <Badge count={permissionCount} showZero color={selected ? '#1677ff' : '#bfbfbf'} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={selectedModule ? `权限列表 · ${selectedModule.moduleName}` : '权限列表'}
            extra={
              <Space>
                {selectedModule ? <Tag color="blue">{selectedModule.moduleCode}</Tag> : <Tag>全部模块</Tag>}
                <Tag color="success">{filteredPermissions.length} 项</Tag>
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            <Table
              rowKey="id"
              loading={loading}
              columns={permissionColumns}
              dataSource={filteredPermissions}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 980 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingModule ? '编辑权限模块' : '新增权限模块'}
        open={moduleOpen}
        onCancel={() => setModuleOpen(false)}
        onOk={handleSubmitModule}
        destroyOnClose
      >
        <Form form={moduleForm} layout="vertical">
          <Form.Item name="moduleName" label="模块名称" rules={[{ required: true, message: '请输入模块名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="moduleCode" label="模块编码" rules={[{ required: true, message: '请输入模块编码' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label="状态">
            <Select options={booleanOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingPermission ? '编辑权限' : '新增权限'}
        open={permissionOpen}
        onCancel={() => setPermissionOpen(false)}
        onOk={handleSubmitPermission}
        width={760}
        destroyOnClose
      >
        <Form form={permissionForm} layout="vertical">
          <Form.Item name="moduleId" label="所属模块" rules={[{ required: true, message: '请选择所属模块' }]}>
            <Select options={moduleOptions} optionFilterProp="label" showSearch />
          </Form.Item>
          <Form.Item name="permissionName" label="权限名称" rules={[{ required: true, message: '请输入权限名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="permissionCode" label="权限编码" rules={[{ required: true, message: '请输入权限编码' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="resource" label="资源">
            <Input />
          </Form.Item>
          <Form.Item name="action" label="动作">
            <Input />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label="状态">
            <Select options={booleanOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TenantRbacPermissionPage
