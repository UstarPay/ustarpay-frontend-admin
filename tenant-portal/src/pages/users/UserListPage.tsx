import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { TENANT_PERMISSION } from '@/constants/rbac'
import { tenantUserService, type TenantAppUser, type TenantUserSavePayload } from '@/services/tenantUserService'
import { useAuthStore } from '@/stores/authStore'

const { Title } = Typography

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

const loginPasswordRuleLabels = [
  { key: 'length', label: '长度 8-20 位' },
  { key: 'letter', label: '至少包含 1 个字母' },
  { key: 'number', label: '至少包含 1 个数字' },
  { key: 'special', label: '至少包含 1 个特殊字符' },
] as const

const passwordLetterRegex = /[A-Za-z]/
const passwordNumberRegex = /\d/
const passwordSpecialRegex = /[^A-Za-z0-9]/

function getLoginPasswordRequirementState(password: string) {
  return {
    length: password.length >= 8 && password.length <= 20,
    letter: passwordLetterRegex.test(password),
    number: passwordNumberRegex.test(password),
    special: passwordSpecialRegex.test(password),
  }
}

function isValidLoginPassword(password: string) {
  const state = getLoginPasswordRequirementState(password)
  return state.length && state.letter && state.number && state.special
}

const UserListPage: React.FC = () => {
  const [form] = Form.useForm<TenantUserSavePayload>()
  const [items, setItems] = useState<TenantAppUser[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TenantAppUser | null>(null)
  const [search, setSearch] = useState('')
  const canManageUsers = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.TENANT_USERS_MANAGE))
  const loginPassword = Form.useWatch('loginPassword', form) || ''
  const loginPasswordRequirementState = useMemo(
    () => getLoginPasswordRequirementState(loginPassword),
    [loginPassword]
  )

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

  const activeCount = useMemo(() => items.filter((item) => item.status === 1).length, [items])
  const internalKycCount = useMemo(() => items.filter((item) => item.isKycInternal === 1).length, [items])
  const phoneBoundCount = useMemo(() => items.filter((item) => !!item.phone).length, [items])

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
      title: '三方KYC认证',
      dataIndex: 'isKycInternal',
      key: 'isKycInternal',
      render: (value: number) => <Tag color={value === 1 ? 'gold' : 'default'}>{value === 1 ? '已认证' : '未认证'}</Tag>,
    },
    {
      title: '邀请人',
      dataIndex: 'invitedUid',
      key: 'invitedUid',
      render: (value?: string) => value || '-',
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
    form.setFieldsValue({ gender: 1, profession: '4' })
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
        await tenantUserService.createUser({ ...values, status: 1 })
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

  const validateLoginPassword = async (_: unknown, value?: string) => {
    if (!value) {
      if (editing) {
        return
      }
      throw new Error('请输入登录密码')
    }

    if (!isValidLoginPassword(value)) {
      throw new Error('密码需为 8-20 位并包含字母、数字和特殊字符')
    }
  }

  const loginPasswordRuleHint = (
    <div className="space-y-1 pt-1">
      {loginPasswordRuleLabels.map((item) => {
        const active = loginPasswordRequirementState[item.key]

        return (
          <div
            key={item.key}
            className={`flex items-center gap-2 text-xs ${active ? 'text-emerald-600' : 'text-slate-500'}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full border ${
                active ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-transparent'
              }`}
            />
            <span>{item.label}</span>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-6 p-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[32px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#172554_55%,#1d4ed8_100%)] text-white shadow-[0_28px_70px_rgba(29,78,216,0.32)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-5 lg:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.10),transparent_28%)]" />
          <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.34em] text-slate-300">User Directory</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-white">用户列表</div>
              <div className="mt-2 text-sm leading-6 text-slate-200">集中查看租户用户基础档案、认证状态和联系方式，便于快速检索与维护。</div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Input.Search
                  placeholder="搜索用户名/邮箱/手机号"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onSearch={loadUsers}
                  className="w-full max-w-[320px]"
                />
                <Button icon={<ReloadOutlined />} onClick={loadUsers} loading={loading} className="h-9 rounded-full border-white/15 bg-white/10 px-4 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white">
                  刷新
                </Button>
                {canManageUsers ? (
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} className="h-9 rounded-full bg-sky-500 px-4 shadow-none hover:!bg-sky-400">
                    新增用户
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '用户总数', value: items.length, helper: '当前列表载入' },
                { label: '正常用户', value: activeCount, helper: '状态正常' },
                { label: '内部KYC', value: internalKycCount, helper: '已完成内部认证' },
                { label: '已绑手机', value: phoneBoundCount, helper: '具备手机号信息' },
              ].map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</div>
                  <div className="mt-3 text-2xl font-semibold text-white">{item.value}</div>
                  <div className="mt-1 text-xs text-slate-200">{item.helper}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: '正常占比', value: items.length > 0 ? `${Math.round((activeCount / items.length) * 100)}%` : '0%', tone: 'bg-sky-50 text-sky-700' },
          { label: '内部KYC占比', value: items.length > 0 ? `${Math.round((internalKycCount / items.length) * 100)}%` : '0%', tone: 'bg-cyan-50 text-cyan-700' },
          { label: '手机号覆盖率', value: items.length > 0 ? `${Math.round((phoneBoundCount / items.length) * 100)}%` : '0%', tone: 'bg-blue-50 text-blue-700' },
        ].map((item) => (
          <div key={item.label} className={`rounded-[24px] px-4 py-4 shadow-sm ${item.tone}`}>
            <div className="text-xs">{item.label}</div>
            <div className="mt-2 text-2xl font-semibold">{item.value}</div>
          </div>
        ))}
      </div>

      <Card
        bordered={false}
        className="rounded-[30px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbff_100%)] shadow-sm"
        bodyStyle={{ padding: 24 }}
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">用户档案</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">用户记录列表</div>
            <div className="mt-2 text-sm text-slate-600">支持查看基础信息、账号状态和内部 KYC 状态，并直接执行编辑和删除操作。</div>
          </div>
          <div className="rounded-full bg-sky-50 px-4 py-2 text-xs font-medium text-sky-700">
            用户资料与认证状态联动展示
          </div>
        </div>

        <Table rowKey="id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={(
          <div>
            <div className="text-sm font-medium text-slate-500">{editing ? '用户编辑' : '用户创建'}</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{editing ? '编辑用户' : '新增用户'}</div>
          </div>
        )}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        okText={editing ? '保存' : '创建'}
        cancelText="取消"
        okButtonProps={{ disabled: !canManageUsers }}
        width={760}
        destroyOnClose
      >
        <Form form={form} layout="vertical" autoComplete="off" className="mt-4 grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <Form.Item name="userName" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input autoComplete="new-password" />
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
          <Form.Item name="gender" label="性别">
            <Select options={genderOptions} />
          </Form.Item>
          <Form.Item name="profession" label="职业">
            <Select options={professionOptions} />
          </Form.Item>
          <Form.Item name="birthDay" label="生日">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="remark" label="备注" className="md:col-span-2">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="loginPassword"
            label={editing ? '登录密码(留空不改)' : '登录密码'}
            rules={[{ validator: validateLoginPassword }]}
            extra={loginPasswordRuleHint}
          >
            <Input.Password autoComplete="new-password" />
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
