import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { TENANT_PERMISSION } from '@/constants/rbac'
import { tenantRbacService, type TenantRbacRole, type TenantRbacUser, type TenantRbacUserPayload } from '@/services/tenantRbacService'
import { useAuthStore } from '@/stores/authStore'

const { Title } = Typography

const statusOptions = [
  { label: '禁用', value: 0 },
  { label: '正常', value: 1 },
]

const TenantRbacUserPage: React.FC = () => {
  const [form] = Form.useForm<TenantRbacUserPayload>()
  const [items, setItems] = useState<TenantRbacUser[]>([])
  const [roles, setRoles] = useState<TenantRbacRole[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TenantRbacUser | null>(null)
  const [search, setSearch] = useState('')
  const canManage = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.TENANT_RBAC_USERS_MANAGE))

  const loadData = async () => {
    try {
      setLoading(true)
      const [userResponse, roleResponse] = await Promise.all([
        tenantRbacService.getUsers({ search, page: 1, pageSize: 100 }),
        tenantRbacService.getRoles(),
      ])
      setItems(userResponse.data?.items || [])
      setRoles(roleResponse.data?.items || [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载 RBAC 用户失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const columns = useMemo(() => [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '显示名', dataIndex: 'displayName', key: 'displayName' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: number) => <Tag color={value === 1 ? 'success' : 'default'}>{value === 1 ? '正常' : '禁用'}</Tag>,
    },
    {
      title: '类型',
      key: 'userType',
      render: (_: unknown, record: TenantRbacUser) => (
        <Space>
          {record.isOwner ? <Tag color="gold">所有者</Tag> : null}
          {record.isSuperAdmin ? <Tag color="purple">超级管理员</Tag> : null}
        </Space>
      ),
    },
    { title: '角色', dataIndex: 'roleNames', key: 'roleNames', render: (value?: string) => value || '-' },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: TenantRbacUser) => (
        <Space>
          {canManage ? (
            <>
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
              {!record.isOwner ? (
                <Popconfirm title="确认删除该 RBAC 用户吗？" onConfirm={() => handleDelete(record.id)}>
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

  const roleOptions = roles.map((role) => ({
    label: `${role.roleName} (${role.roleCode})`,
    value: role.id,
    disabled: !role.isActive,
  }))

  const handleCreate = () => {
    if (!canManage) {
      message.warning('当前账号只有查看权限')
      return
    }
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 1, roleIds: [] })
    setOpen(true)
  }

  const handleEdit = async (record: TenantRbacUser) => {
    if (!canManage) {
      message.warning('当前账号只有查看权限')
      return
    }
    try {
      const response = await tenantRbacService.getUser(record.id)
      form.setFieldsValue({
        username: response.data?.username,
        displayName: response.data?.displayName,
        email: response.data?.email,
        status: response.data?.status,
        remark: response.data?.remark,
        roleIds: response.data?.roleIds || [],
        password: '',
      })
      setEditing(record)
      setOpen(true)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载 RBAC 用户详情失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await tenantRbacService.deleteUser(id)
      message.success('RBAC 用户已删除')
      loadData()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除 RBAC 用户失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editing) {
        const payload = { ...values }
        if (!payload.password) {
          delete payload.password
        }
        await tenantRbacService.updateUser(editing.id, payload)
        message.success('RBAC 用户已更新')
      } else {
        await tenantRbacService.createUser(values)
        message.success('RBAC 用户已创建')
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
        <Title level={2}>RBAC 用户管理</Title>
        <Space>
          <Input.Search
            placeholder="搜索用户名 / 显示名 / 邮箱"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={loadData}
            style={{ width: 260 }}
          />
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>刷新</Button>
          {canManage ? <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增用户</Button> : null}
        </Space>
      </div>

      <Card>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={editing ? '编辑 RBAC 用户' : '新增 RBAC 用户'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input disabled={Boolean(editing?.isOwner)} />
          </Form.Item>
          <Form.Item name="displayName" label="显示名" rules={[{ required: true, message: '请输入显示名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input disabled={Boolean(editing?.isOwner)} />
          </Form.Item>
          <Form.Item
            name="password"
            label={editing ? '登录密码（留空不修改）' : '登录密码'}
            rules={editing ? [] : [{ required: true, message: '请输入登录密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={statusOptions} disabled={Boolean(editing?.isOwner)} />
          </Form.Item>
          <Form.Item name="roleIds" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select mode="multiple" options={roleOptions} disabled={Boolean(editing?.isOwner)} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TenantRbacUserPage
