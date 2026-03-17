import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { TENANT_PERMISSION } from '@/constants/rbac'
import { tenantUserService, type TenantAppUser, type TenantAppUserKyc, type TenantUserKycSavePayload } from '@/services/tenantUserService'
import { useAuthStore } from '@/stores/authStore'

const { Title } = Typography

const kycStatusOptions = [
  { label: '待审核', value: 0 },
  { label: '已通过', value: 1 },
  { label: '已驳回', value: 2 },
]

const KycListPage: React.FC = () => {
  const [form] = Form.useForm<TenantUserKycSavePayload>()
  const [items, setItems] = useState<TenantAppUserKyc[]>([])
  const [users, setUsers] = useState<TenantAppUser[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const canManageKyc = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.TENANT_USER_KYC_MANAGE))

  const loadData = async () => {
    try {
      setLoading(true)
      const [kycResponse, userResponse] = await Promise.all([
        tenantUserService.getKycs({ page: 1, pageSize: 100, search }),
        tenantUserService.getUsers({ page: 1, pageSize: 100 }),
      ])
      setItems(kycResponse.data?.items || [])
      setUsers(userResponse.data?.items || [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载KYC列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const columns = useMemo(() => [
    { title: '用户名', dataIndex: 'userName', key: 'userName' },
    { title: '业务ID', dataIndex: 'businessId', key: 'businessId' },
    { title: '邮箱', dataIndex: 'email', key: 'email', render: (value?: string) => value || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: number) => {
        const option = kycStatusOptions.find((item) => item.value === value)
        const color = value === 1 ? 'success' : value === 2 ? 'error' : 'processing'
        return <Tag color={color}>{option?.label || value}</Tag>
      },
    },
    { title: '提交时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: TenantAppUserKyc) => (
        <Space>
          {canManageKyc ? (
            <>
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record.id)} />
              <Popconfirm title="确认删除该KYC记录吗？" onConfirm={() => handleDelete(record.id)}>
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          ) : (
            <Tag>只读</Tag>
          )}
        </Space>
      ),
    },
  ], [canManageKyc])

  const handleCreate = () => {
    if (!canManageKyc) {
      message.warning('当前账号只有查看权限')
      return
    }
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ status: 0 })
    setOpen(true)
  }

  const handleEdit = async (id: string) => {
    if (!canManageKyc) {
      message.warning('当前账号只有查看权限')
      return
    }
    try {
      const response = await tenantUserService.getKyc(id)
      const data = response.data || {}
      form.setFieldsValue({
        ...data,
        userId: data.userId,
        dob: data.dob ? String(data.dob).slice(0, 10) : undefined,
        metadata: data.metadata ? JSON.stringify(data.metadata, null, 2) : undefined,
      } as unknown as TenantUserKycSavePayload)
      setEditingId(id)
      setOpen(true)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载KYC详情失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!canManageKyc) {
      message.warning('当前账号只有查看权限')
      return
    }
    try {
      await tenantUserService.deleteKyc(id)
      message.success('KYC记录已删除')
      loadData()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除KYC失败')
    }
  }

  const handleSubmit = async () => {
    if (!canManageKyc) {
      message.warning('当前账号只有查看权限')
      return
    }
    try {
      const values = await form.validateFields()
      const payload: TenantUserKycSavePayload = {
        ...values,
        metadata: values.metadata ? JSON.parse(values.metadata as unknown as string) : undefined,
      }
      if (editingId) {
        await tenantUserService.updateKyc(editingId, payload)
        message.success('KYC记录已更新')
      } else {
        await tenantUserService.createKyc(payload)
        message.success('KYC记录已创建')
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
        <Title level={2}>KYC 管理</Title>
        <Space>
          <Input.Search placeholder="搜索用户名/业务ID/邮箱" value={search} onChange={(e) => setSearch(e.target.value)} onSearch={loadData} style={{ width: 260 }} />
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>刷新</Button>
          {canManageKyc ? <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增KYC</Button> : null}
        </Space>
      </div>

      <Card>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editingId ? '编辑KYC' : '新增KYC'} open={open} onCancel={() => setOpen(false)} onOk={handleSubmit} okButtonProps={{ disabled: !canManageKyc }} width={760} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="userId" label="用户" rules={[{ required: true, message: '请选择用户' }]}>
            <Select showSearch optionFilterProp="label" options={users.map((user) => ({ label: `${user.userName} (${user.email})`, value: user.id }))} />
          </Form.Item>
          <Form.Item name="businessId" label="业务ID"><Input /></Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}><Select options={kycStatusOptions} /></Form.Item>
          <Form.Item name="rejectReason" label="驳回原因"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="firstName" label="名"><Input /></Form.Item>
          <Form.Item name="lastName" label="姓"><Input /></Form.Item>
          <Form.Item name="fullName" label="全名"><Input /></Form.Item>
          <Form.Item name="gender" label="性别(M/F)"><Input /></Form.Item>
          <Form.Item name="dob" label="生日"><Input placeholder="YYYY-MM-DD" /></Form.Item>
          <Form.Item name="countryOfBirth" label="出生国家(alpha-3)"><Input /></Form.Item>
          <Form.Item name="nationality" label="国籍(alpha-3)"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
          <Form.Item name="addressCountry" label="居住国家(alpha-3)"><Input /></Form.Item>
          <Form.Item name="addressStreet" label="街道"><Input /></Form.Item>
          <Form.Item name="addressTown" label="城市"><Input /></Form.Item>
          <Form.Item name="addressState" label="州/省"><Input /></Form.Item>
          <Form.Item name="addressPostCode" label="邮编"><Input /></Form.Item>
          <Form.Item name="addressBuildingNumber" label="楼栋号"><Input /></Form.Item>
          <Form.Item name="addressFlatNumber" label="房间号"><Input /></Form.Item>
          <Form.Item name="addressFormattedAddress" label="完整地址"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="tin" label="TIN"><Input /></Form.Item>
          <Form.Item name="idCardFrontUrl" label="证件正面URL"><Input /></Form.Item>
          <Form.Item name="idCardBackUrl" label="证件反面URL"><Input /></Form.Item>
          <Form.Item name="metadata" label="Metadata(JSON)"><Input.TextArea rows={4} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default KycListPage
