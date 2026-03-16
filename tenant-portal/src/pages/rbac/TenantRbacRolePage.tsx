import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { TENANT_PERMISSION } from '@/constants/rbac'
import { tenantRbacService, type TenantRbacPermission, type TenantRbacRole, type TenantRbacRolePayload } from '@/services/tenantRbacService'
import { useAuthStore } from '@/stores/authStore'

const { Title } = Typography

const TenantRbacRolePage: React.FC = () => {
  const [form] = Form.useForm<TenantRbacRolePayload>()
  const [items, setItems] = useState<TenantRbacRole[]>([])
  const [permissions, setPermissions] = useState<TenantRbacPermission[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TenantRbacRole | null>(null)
  const canManage = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.TENANT_RBAC_ROLES_MANAGE))

  const loadData = async () => {
    try {
      setLoading(true)
      const [roleResponse, permissionResponse] = await Promise.all([
        tenantRbacService.getRoles(),
        tenantRbacService.getPermissions(),
      ])
      setItems(roleResponse.data?.items || [])
      setPermissions(permissionResponse.data?.items || [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载角色失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const permissionOptions = useMemo(() => permissions.map((permission) => ({
    label: `${permission.moduleName} / ${permission.permissionName} (${permission.permissionCode})`,
    value: permission.id,
    disabled: !permission.isActive,
  })), [permissions])

  const columns = useMemo(() => [
    { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
    { title: '角色编码', dataIndex: 'roleCode', key: 'roleCode', render: (value: string) => <Tag color="blue">{value}</Tag> },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '类型',
      dataIndex: 'isSystem',
      key: 'isSystem',
      render: (value: boolean) => <Tag color={value ? 'gold' : 'green'}>{value ? '系统角色' : '自定义角色'}</Tag>,
    },
    { title: '权限数', dataIndex: 'permissionCount', key: 'permissionCount' },
    { title: '用户数', dataIndex: 'userCount', key: 'userCount' },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: TenantRbacRole) => (
        <Space>
          {canManage ? (
            <>
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
              {!record.isSystem ? (
                <Popconfirm title="确认删除该角色吗？" onConfirm={() => handleDelete(record.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ) : null}
            </>
          ) : (
            <Tag>只读</Tag>
          )}
        </Space>
      ),
    },
  ], [canManage])

  const handleCreate = () => {
    if (!canManage) {
      message.warning('当前账号只有查看权限')
      return
    }
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ isActive: true, permissionIds: [] })
    setOpen(true)
  }

  const handleEdit = async (record: TenantRbacRole) => {
    if (!canManage) {
      message.warning('当前账号只有查看权限')
      return
    }
    try {
      const response = await tenantRbacService.getRole(record.id)
      form.setFieldsValue({
        roleCode: response.data?.roleCode,
        roleName: response.data?.roleName,
        description: response.data?.description,
        isActive: response.data?.isActive,
        permissionIds: response.data?.permissionIds || [],
      })
      setEditing(record)
      setOpen(true)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载角色详情失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await tenantRbacService.deleteRole(id)
      message.success('角色已删除')
      loadData()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除角色失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editing) {
        await tenantRbacService.updateRole(editing.id, values)
        message.success('角色已更新')
      } else {
        await tenantRbacService.createRole(values)
        message.success('角色已创建')
      }
      setOpen(false)
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
        <Title level={2}>RBAC 角色管理</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>刷新</Button>
          {canManage ? <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增角色</Button> : null}
        </Space>
      </div>

      <Card>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={editing ? '编辑角色' : '新增角色'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        width={820}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="roleName" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="roleCode" label="角色编码" rules={[{ required: true, message: '请输入角色编码' }]}>
            <Input disabled={Boolean(editing?.isSystem)} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={[{ label: '启用', value: true }, { label: '禁用', value: false }]} />
          </Form.Item>
          <Form.Item name="permissionIds" label="权限">
            <Select mode="multiple" options={permissionOptions} optionFilterProp="label" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TenantRbacRolePage
