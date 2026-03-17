import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { TENANT_PERMISSION } from '@/constants/rbac'
import { tenantUserService, type TenantAppUser, type TenantUserSavePayload } from '@/services/tenantUserService'
import { useAuthStore } from '@/stores/authStore'

const { Title } = Typography

const statusOptions = [
  { label: '禁用', value: 0 },
  { label: '正常', value: 1 },
]

const genderOptions = [
  { label: '男', value: 1 },
  { label: '女', value: 2 },
]

const professionOptions = [
  { label: '学生', value: '1' },
  { label: '上班族', value: '2' },
  { label: '自由职业', value: '3' },
  { label: '其他', value: '4' },
]

const UserListPage: React.FC = () => {
  const [form] = Form.useForm<TenantUserSavePayload>()
  const [items, setItems] = useState<TenantAppUser[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TenantAppUser | null>(null)
  const [search, setSearch] = useState('')
  const canManageUsers = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.TENANT_USERS_MANAGE))

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await tenantUserService.getUsers({ search, page: 1, pageSize: 100 })
      setItems(response.data?.items || [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载用户失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const columns = useMemo(() => [
    { title: '用户名', dataIndex: 'userName', key: 'userName' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '手机号', dataIndex: 'phone', key: 'phone', render: (value?: string) => value || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: number) => <Tag color={value === 1 ? 'success' : 'default'}>{value === 1 ? '正常' : '禁用'}</Tag>,
    },
    {
      title: '内部KYC',
      dataIndex: 'isKycInternal',
      key: 'isKycInternal',
      render: (value: number) => <Tag color={value === 1 ? 'gold' : 'default'}>{value === 1 ? '已认证' : '未认证'}</Tag>,
    },
    { title: '注册时间', dataIndex: 'registerTime', key: 'registerTime' },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: TenantAppUser) => (
        <Space>
          {canManageUsers ? (
            <>
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
              <Popconfirm title="确认删除该用户吗？" onConfirm={() => handleDelete(record.id)}>
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          ) : (
            <Tag>只读</Tag>
          )}
        </Space>
      ),
    },
  ], [canManageUsers])

  const handleCreate = () => {
    if (!canManageUsers) {
      message.warning('当前账号只有查看权限')
      return
    }
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ accountLevel: 1, gender: 1, profession: '4', status: 1 })
    setOpen(true)
  }

  const handleEdit = async (record: TenantAppUser) => {
    if (!canManageUsers) {
      message.warning('当前账号只有查看权限')
      return
    }
    try {
      const response = await tenantUserService.getUser(record.id)
      setEditing(record)
      form.setFieldsValue({
        ...response.data,
        loginPassword: '',
        transactionPin: '',
      })
      setOpen(true)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载用户详情失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!canManageUsers) {
      message.warning('当前账号只有查看权限')
      return
    }
    try {
      await tenantUserService.deleteUser(id)
      message.success('用户已删除')
      loadUsers()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除用户失败')
    }
  }

  const handleSubmit = async () => {
    if (!canManageUsers) {
      message.warning('当前账号只有查看权限')
      return
    }
    try {
      const values = await form.validateFields()
      if (editing) {
        const payload = { ...values }
        if (!payload.loginPassword) delete payload.loginPassword
        if (!payload.transactionPin) delete payload.transactionPin
        await tenantUserService.updateUser(editing.id, payload)
        message.success('用户已更新')
      } else {
        await tenantUserService.createUser(values)
        message.success('用户已创建')
      }
      setOpen(false)
      loadUsers()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>用户管理</Title>
        <Space>
          <Input.Search placeholder="搜索用户名/邮箱/手机号" value={search} onChange={(e) => setSearch(e.target.value)} onSearch={loadUsers} style={{ width: 260 }} />
          <Button icon={<ReloadOutlined />} onClick={loadUsers} loading={loading}>刷新</Button>
          {canManageUsers ? <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增用户</Button> : null}
        </Space>
      </div>

      <Card>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editing ? '编辑用户' : '新增用户'} open={open} onCancel={() => setOpen(false)} onOk={handleSubmit} okButtonProps={{ disabled: !canManageUsers }} width={720} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="userName" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="countryCode" label="国家代码(alpha-2)">
            <Input placeholder="CN" />
          </Form.Item>
          <Form.Item name="accountLevel" label="账户等级">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select options={genderOptions} />
          </Form.Item>
          <Form.Item name="profession" label="职业">
            <Select options={professionOptions} />
          </Form.Item>
          <Form.Item name="birthDay" label="生日">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="loginPassword" label={editing ? '登录密码(留空不改)' : '登录密码'} rules={editing ? [] : [{ required: true, message: '请输入登录密码' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="transactionPin" label={editing ? '交易密码(留空不改)' : '交易密码'} rules={editing ? [] : [{ required: true, message: '请输入交易密码' }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserListPage
