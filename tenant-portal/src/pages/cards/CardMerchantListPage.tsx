import React, { useState, useEffect } from 'react'
import {
  Button,
  Card,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm
} from 'antd'
import {
  CreditCardOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { cardMerchantService } from '@/services'
import type { CardMerchant, CreateCardMerchantRequest, UpdateCardMerchantRequest } from '@shared/types'
import { SearchTable } from '@shared/components'
import type { SearchField, TableColumn } from '@shared/components'

const CardMerchantListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [formVisible, setFormVisible] = useState(false)
  const [editingMerchant, setEditingMerchant] = useState<CardMerchant | null>(null)
  const [searchParams, setSearchParams] = useState({
    page: 1,
    pageSize: 20,
    search: ''
  })

  const { data: merchantData, isLoading, refetch } = useQuery({
    queryKey: ['card-merchants', searchParams],
    queryFn: () => cardMerchantService.getCardMerchants(searchParams)
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateCardMerchantRequest) => cardMerchantService.createCardMerchant(data),
    onSuccess: () => {
      message.success('创建成功')
      setFormVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['card-merchants'] })
    },
    onError: (err: any) => {
      message.error(err?.message || '创建失败')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCardMerchantRequest }) =>
      cardMerchantService.updateCardMerchant(id, data),
    onSuccess: () => {
      message.success('更新成功')
      setFormVisible(false)
      setEditingMerchant(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['card-merchants'] })
    },
    onError: (err: any) => {
      message.error(err?.message || '更新失败')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cardMerchantService.deleteCardMerchant(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['card-merchants'] })
    },
    onError: (err: any) => {
      message.error(err?.message || '删除失败')
    }
  })

  const handleCreate = () => {
    setEditingMerchant(null)
    form.resetFields()
    setFormVisible(true)
  }

  const handleEdit = (record: CardMerchant) => {
    setEditingMerchant(record)
    setFormVisible(true)
  }

  // 等 Form 挂载后再设置编辑数据，避免 "form is not connected" 警告
  useEffect(() => {
    if (formVisible && editingMerchant) {
      form.setFieldsValue({
        merchant_name: editingMerchant.merchant_name,
        api_key: editingMerchant.api_key,
        api_host: editingMerchant.api_host,
        sub_account_id: editingMerchant.sub_account_id,
        default_card_material: editingMerchant.default_card_material,
        default_currency: editingMerchant.default_currency,
        environment: editingMerchant.environment,
        status: editingMerchant.status,
        notes: editingMerchant.notes
      })
    } else if (formVisible && !editingMerchant) {
      form.resetFields()
    }
  }, [formVisible, editingMerchant])

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingMerchant) {
        await updateMutation.mutateAsync({
          id: editingMerchant.id,
          data: {
            merchant_name: values.merchant_name,
            api_key: values.api_key,
            api_host: values.api_host,
            sub_account_id: values.sub_account_id,
            default_card_material: values.default_card_material,
            default_currency: values.default_currency,
            environment: values.environment,
            status: values.status,
            notes: values.notes || null
          }
        })
      } else {
        await createMutation.mutateAsync({
          merchant_name: values.merchant_name,
          api_key: values.api_key,
          api_secret: values.api_secret,
          signature_key: values.signature_key,
          api_host: values.api_host,
          sub_account_id: values.sub_account_id,
          default_card_material: values.default_card_material,
          default_currency: values.default_currency,
          environment: values.environment || 'sandbox',
          webhook_secret: values.webhook_secret || undefined,
          notes: values.notes || null
        })
      }
    } catch (err) {
      // Form validation or API error
    }
  }

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }

  const handleSearch = (values: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: 1,
      search: values.search || ''
    }))
  }

  const handleReset = () => {
    setSearchParams({
      page: 1,
      pageSize: 20,
      search: ''
    })
  }

  const merchants = (merchantData as any)?.data?.items || []
  const total = (merchantData as any)?.data?.total ?? 0
  const activeCount = merchants.filter((item: CardMerchant) => item.status === 1).length
  const inactiveCount = merchants.filter((item: CardMerchant) => item.status !== 1).length
  const latestCreatedAt = merchants.length > 0
    ? merchants
      .map((item: CardMerchant) => item.created_at)
      .filter(Boolean)
      .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())[0]
    : ''

  const searchFields: SearchField[] = [
    {
      key: 'search',
      label: '搜索',
      type: 'text',
      placeholder: '搜索卡商名称',
      span: 8
    }
  ]

  const columns: TableColumn[] = [
    {
      key: 'merchant_name',
      title: '卡商名称',
      dataIndex: 'merchant_name',
      width: 150,
      render: (_: any, record: CardMerchant) => (
        <span className="font-medium">{record.merchant_name}</span>
      )
    },
    {
      key: 'api_key',
      title: 'API Key',
      dataIndex: 'api_key',
      width: 140,
      render: (_: any, record: CardMerchant) => (
        <Typography.Text copyable={{ text: record.api_key }} className="font-mono text-xs">
          {record.api_key?.slice(0, 12)}...
        </Typography.Text>
      )
    },
    {
      key: 'api_host',
      title: 'API 域名',
      dataIndex: 'api_host',
      width: 180,
      ellipsis: true,
      render: (_: any, record: CardMerchant) => record.api_host || '-'
    },
    {
      key: 'default_product_code',
      title: '产品代码策略',
      dataIndex: 'default_product_code',
      width: 180,
      render: () => '实体卡 4101 / 虚拟卡 4102'
    },
    {
      key: 'default_currency',
      title: '默认币种',
      dataIndex: 'default_currency',
      width: 120,
      render: (_: any, record: CardMerchant) => record.default_currency || '-'
    },
    {
      key: 'environment',
      title: '环境',
      dataIndex: 'environment',
      width: 90,
      render: (_: any, record: CardMerchant) => (
        <Tag color={record.environment === 'prod' ? 'green' : 'orange'}>
          {record.environment === 'prod' ? '生产' : '沙盒'}
        </Tag>
      )
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (_: any, record: CardMerchant) => (
        <Tag color={record.status === 1 ? 'success' : 'default'}>
          {record.status === 1 ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      key: 'created_at',
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: (_: any, record: CardMerchant) =>
        record.created_at ? new Date(record.created_at).toLocaleString('zh-CN') : '-'
    },
    {
      key: 'actions',
      title: '操作',
      width: 140,
      fixed: 'right',
      render: (_: any, record: CardMerchant) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该卡商？"
            description="删除后无法恢复，请谨慎操作"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[32px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_58%,#0ea5e9_100%)] text-white shadow-[0_28px_70px_rgba(29,78,216,0.34)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-4 py-3 lg:px-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.18),transparent_32%)]" />
          <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
            <div className="rounded-[22px] border border-white/10 bg-white/12 p-3 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.36em] text-sky-200/80">Merchant Control Tower</div>
              <div className="mt-1 text-xl font-semibold tracking-tight text-white">卡商列表</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading} className="h-8 rounded-full border-white/15 bg-white/10 px-3 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white">
                  刷新卡商
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} className="h-8 rounded-full bg-sky-500 px-3 shadow-none hover:!bg-sky-400">
                  创建卡商
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 self-stretch">
              {[
                { label: '总卡商数', value: total, helper: '当前查询范围', icon: <CreditCardOutlined className="text-sky-300" /> },
                { label: '启用卡商', value: activeCount, helper: '可参与路由', icon: <SafetyCertificateOutlined className="text-emerald-300" /> },
                { label: '停用卡商', value: inactiveCount, helper: '需人工处理', icon: <DeleteOutlined className="text-rose-300" /> },
                { label: '最近接入', value: latestCreatedAt ? new Date(latestCreatedAt).toLocaleDateString('zh-CN') : '暂无', helper: '最近创建时间', icon: <CreditCardOutlined className="text-violet-300" /> },
              ].map(item => (
                <div key={item.label} className="rounded-[18px] border border-white/10 bg-white/12 px-3 py-2.5 backdrop-blur-sm xl:min-h-[72px]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                      {item.icon}
                    </div>
                  </div>
                  <div className="mt-1.5 break-all text-lg font-semibold text-white">{item.value}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{item.helper}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card bordered={false} className="rounded-[30px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbff_100%)] shadow-sm" bodyStyle={{ padding: 24 }}>
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <div className="text-sm font-medium text-slate-500">配置清单</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">卡商接入与凭证档案</div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: '总卡商数', value: total, tone: 'bg-sky-50 text-sky-700' },
              { label: '启用占比', value: total > 0 ? `${Math.round((activeCount / total) * 100)}%` : '0%', tone: 'bg-cyan-50 text-cyan-700' },
              { label: '停用占比', value: total > 0 ? `${Math.round((inactiveCount / total) * 100)}%` : '0%', tone: 'bg-blue-50 text-blue-700' }
            ].map(item => (
              <div key={item.label} className={`rounded-2xl px-4 py-3 ${item.tone}`}>
                <div className="text-xs">{item.label}</div>
                <div className="mt-1 text-xl font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <SearchTable
          dataSource={merchants}
          columns={columns}
          searchFields={searchFields}
          title="卡商配置列表"
          className="[&_.ant-card]:border-slate-200 [&_.ant-card]:shadow-none [&_.ant-card]:rounded-[24px]"
          loading={isLoading}
          scroll={{ x: 1100 }}
          showPagination
          serverSidePagination
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total,
          }}
          onSearch={handleSearch}
          onRefresh={() => refetch()}
          onReset={handleReset}
          onTableChange={(pagination) => {
            setSearchParams(prev => ({
              ...prev,
              page: pagination.current || 1,
              pageSize: pagination.pageSize || prev.pageSize,
            }))
          }}
        />
      </Card>

      <Modal
        title={editingMerchant ? '编辑卡商' : '创建卡商'}
        open={formVisible}
        onOk={handleFormSubmit}
        onCancel={() => {
          setFormVisible(false)
          setEditingMerchant(null)
          form.resetFields()
        }}
        width={560}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="merchant_name"
            label="卡商名称"
            rules={[{ required: true, message: '请输入卡商名称' }, { max: 100 }]}
          >
            <Input placeholder="唯一标识，用于后台展示" disabled={!!editingMerchant} />
          </Form.Item>
          <Form.Item
            name="api_key"
            label="API Key (client_id)"
            rules={[{ required: true, message: '请输入 API Key' }, { max: 128 }]}
          >
            <Input placeholder="OAuth2.0 客户端标识" />
          </Form.Item>
          {!editingMerchant && (
            <>
              <Form.Item
                name="api_secret"
                label="API Secret (client_secret)"
                rules={[{ required: true, message: '请输入 API Secret' }, { max: 256 }]}
              >
                <Input.Password placeholder="OAuth2.0 客户端密钥" />
              </Form.Item>
              <Form.Item
                name="signature_key"
                label="Signature Key (Sign Key)"
                rules={[{ required: true, message: '请输入签名密钥' }, { max: 256 }]}
              >
                <Input.Password placeholder="HMAC-SHA512 签名密钥" />
              </Form.Item>
            </>
          )}
          <Form.Item
            name="api_host"
            label="接口域名"
            rules={[{ required: true, message: '请输入接口域名' }, { max: 255 }]}
          >
            <Input placeholder="https://api.example.com" />
          </Form.Item>
          <Form.Item
            name="sub_account_id"
            label="D-SUB-ACCOUNT-ID"
            rules={[{ required: true, message: '请输入子账户ID' }, { max: 50 }]}
          >
            <Input placeholder="主账户下注册的子账户标识" />
          </Form.Item>
          <Form.Item label="产品代码策略">
            <Input value="实体卡固定 4101，虚拟卡固定 4102" disabled />
          </Form.Item>
          <Form.Item
            name="default_card_material"
            label="默认上游卡介质"
            initialValue={3}
            rules={[{ required: true, message: '请选择默认上游卡介质' }]}
          >
            <Select
              options={[
                { label: '虚拟卡 (3)', value: 3 },
                { label: '实体卡 (2)', value: 2 }
              ]}
            />
          </Form.Item>
          <Form.Item
            name="default_currency"
            label="默认币种"
            initialValue="USD"
            rules={[{ required: true, message: '请输入默认币种' }, { max: 16 }]}
          >
            <Input placeholder="USD" />
          </Form.Item>
          <Form.Item name="environment" label="环境" initialValue="sandbox">
            <Select
              options={[
                { label: '沙盒 (sandbox)', value: 'sandbox' },
                { label: '生产 (prod)', value: 'prod' }
              ]}
            />
          </Form.Item>
          {editingMerchant && (
            <Form.Item name="status" label="状态">
              <Select
                options={[
                  { label: '启用', value: 1 },
                  { label: '禁用', value: 0 }
                ]}
              />
            </Form.Item>
          )}
          {!editingMerchant && (
            <Form.Item name="webhook_secret" label="Webhook 密钥">
              <Input.Password placeholder="可选，用于验证回调签名" />
            </Form.Item>
          )}
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="可记录审批人、到期提醒等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CardMerchantListPage
