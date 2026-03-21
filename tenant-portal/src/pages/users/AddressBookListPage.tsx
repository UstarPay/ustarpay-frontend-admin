import React, { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'

import { TENANT_PERMISSION } from '@/constants/rbac'
import { currencyService } from '@/services/currencyService'
import {
  tenantAddressBookService,
  type TenantUserAddressBook,
  type TenantUserAddressBookSavePayload,
} from '@/services/tenantAddressBookService'
import { tenantUserService, type TenantAppUser } from '@/services/tenantUserService'
import { useAuthStore } from '@/stores/authStore'
import type { Currency } from '@shared/types/currency'

const { Title, Text } = Typography

const statusOptions = [
  { label: '禁用', value: 0 },
  { label: '正常', value: 1 },
]

const AddressBookListPage: React.FC = () => {
  const [form] = Form.useForm<TenantUserAddressBookSavePayload>()
  const [items, setItems] = useState<TenantUserAddressBook[]>([])
  const [users, setUsers] = useState<TenantAppUser[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TenantUserAddressBook | null>(null)
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [chainFilter, setChainFilter] = useState<string>('all')
  const canManageUsers = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.TENANT_USERS_MANAGE))

  const selectedChain = Form.useWatch('chainCode', form)

  const chainOptions = useMemo(() => {
    const chainMap = new Map<string, string>()
    currencies.forEach((item) => {
      if (!chainMap.has(item.chainCode)) {
        chainMap.set(item.chainCode, item.chainNetwork || item.chainCode)
      }
    })
    return Array.from(chainMap.entries()).map(([value, label]) => ({ value, label }))
  }, [currencies])

  const symbolOptions = useMemo(() => {
    if (!selectedChain) {
      return []
    }
    return currencies
      .filter((item) => item.chainCode === selectedChain)
      .map((item) => ({
        label: `${item.symbol}${item.chainNetwork ? ` (${item.chainNetwork})` : ''}`,
        value: item.symbol,
      }))
      .filter((item, index, array) => array.findIndex((candidate) => candidate.value === item.value) === index)
  }, [currencies, selectedChain])

  const loadOptions = async () => {
    const [userResp, currencyResp] = await Promise.all([
      tenantUserService.getUsers({ page: 1, pageSize: 200 }),
      currencyService.getActiveCurrencies(),
    ])

    setUsers(userResp.data?.items || [])
    setCurrencies(((currencyResp as any)?.data ?? currencyResp ?? []) as Currency[])
  }

  const loadItems = async () => {
    try {
      setLoading(true)
      const response = await tenantAddressBookService.getAddressBooks({
        page: 1,
        pageSize: 200,
        search: search.trim() || undefined,
        userId: userFilter === 'all' ? undefined : userFilter,
        chainCode: chainFilter === 'all' ? undefined : chainFilter,
      })
      setItems(response.data?.items || [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载地址簿失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.all([loadOptions(), loadItems()])
  }, [])

  const handleRefresh = async () => {
    await Promise.all([loadOptions(), loadItems()])
  }

  const handleCreate = () => {
    if (!canManageUsers) {
      message.warning('当前账号只有查看权限')
      return
    }
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 1 })
    setOpen(true)
  }

  const handleEdit = async (record: TenantUserAddressBook) => {
    if (!canManageUsers) {
      message.warning('当前账号只有查看权限')
      return
    }
    try {
      const response = await tenantAddressBookService.getAddressBook(record.id)
      const detail = response.data as TenantUserAddressBook | undefined
      if (!detail) {
        throw new Error('地址簿详情不存在')
      }
      setEditing(detail)
      form.setFieldsValue({
        userId: detail.userId,
        chainCode: detail.chainCode,
        chainNetwork: detail.chainNetwork,
        symbol: detail.symbol,
        label: detail.label,
        address: detail.address,
        remark: detail.remark,
        status: detail.status,
      })
      setOpen(true)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载地址簿详情失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!canManageUsers) {
      message.warning('当前账号只有查看权限')
      return
    }
    try {
      await tenantAddressBookService.deleteAddressBook(id)
      message.success('地址簿已删除')
      await loadItems()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除地址簿失败')
    }
  }

  const handleSubmit = async () => {
    if (!canManageUsers) {
      message.warning('当前账号只有查看权限')
      return
    }
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      if (editing) {
        await tenantAddressBookService.updateAddressBook(editing.id, values)
        message.success('地址簿已更新')
      } else {
        await tenantAddressBookService.createAddressBook(values)
        message.success('地址簿已创建')
      }
      setOpen(false)
      await loadItems()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const columns = useMemo<ColumnsType<TenantUserAddressBook>>(
    () => [
      { title: '用户', dataIndex: 'userName', key: 'userName', width: 140 },
      { title: '邮箱', dataIndex: 'email', key: 'email', width: 220, render: (value) => value || '-' },
      {
        title: '网络',
        key: 'chain',
        width: 180,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Text strong>{record.chainNetwork || record.chainCode}</Text>
            <Text type="secondary">{record.chainCode}</Text>
          </Space>
        ),
      },
      {
        title: '币种',
        dataIndex: 'symbol',
        key: 'symbol',
        width: 110,
        render: (value: string) => <Tag color="blue">{value}</Tag>,
      },
      { title: '标签', dataIndex: 'label', key: 'label', width: 160 },
      {
        title: '地址',
        dataIndex: 'address',
        key: 'address',
        width: 260,
        ellipsis: true,
        render: (value: string) => <Text copyable={{ text: value }}>{value}</Text>,
      },
      { title: '备注', dataIndex: 'remark', key: 'remark', width: 180, render: (value) => value || '-' },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 96,
        render: (value: number) => <Tag color={value === 1 ? 'success' : 'default'}>{value === 1 ? '正常' : '禁用'}</Tag>,
      },
      { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (_, record) => (
          <Space>
            {canManageUsers ? (
              <>
                <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                <Popconfirm title="确认删除该地址簿吗？" onConfirm={() => handleDelete(record.id)}>
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
    [canManageUsers],
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>地址簿管理</Title>
          <Text type="secondary">统一管理 App 用户常用提币地址，网络和币种数据源与后台支持链配置保持一致。</Text>
        </div>
        <Space wrap>
          <Input.Search
            placeholder="搜索用户、邮箱、标签、地址"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onSearch={() => void loadItems()}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            style={{ width: 220 }}
            value={userFilter}
            onChange={setUserFilter}
            options={[
              { value: 'all', label: '全部用户' },
              ...users.map((item) => ({
                value: item.id,
                label: `${item.userName}${item.email ? ` / ${item.email}` : ''}`,
              })),
            ]}
            showSearch
            optionFilterProp="label"
          />
          <Select
            style={{ width: 180 }}
            value={chainFilter}
            onChange={setChainFilter}
            options={[
              { value: 'all', label: '全部网络' },
              ...chainOptions,
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void handleRefresh()} loading={loading}>刷新</Button>
          {canManageUsers ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增地址簿</Button>
          ) : null}
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1500 }}
        />
      </Card>

      <Modal
        title={editing ? '编辑地址簿' : '新增地址簿'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okButtonProps={{ disabled: !canManageUsers }}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="userId" label="用户" rules={[{ required: true, message: '请选择用户' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={users.map((item) => ({
                value: item.id,
                label: `${item.userName}${item.email ? ` / ${item.email}` : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="chainCode" label="网络" rules={[{ required: true, message: '请选择网络' }]}>
            <Select
              options={chainOptions}
              onChange={(value) => {
                const currentSymbol = form.getFieldValue('symbol')
                const nextSymbolOptions = currencies.filter((item) => item.chainCode === value)
                if (!nextSymbolOptions.some((item) => item.symbol === currentSymbol)) {
                  form.setFieldValue('symbol', undefined)
                }
                const firstNetwork = nextSymbolOptions.find((item) => item.chainNetwork)?.chainNetwork
                form.setFieldValue('chainNetwork', firstNetwork || undefined)
              }}
            />
          </Form.Item>
          <Form.Item name="symbol" label="币种" rules={[{ required: true, message: '请选择币种' }]}>
            <Select options={symbolOptions} disabled={!selectedChain} />
          </Form.Item>
          <Form.Item name="label" label="标签" rules={[{ required: true, message: '请输入标签' }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true, message: '请输入地址' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} maxLength={255} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="chainNetwork" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AddressBookListPage
