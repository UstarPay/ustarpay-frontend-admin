import React, { useState, useEffect } from 'react'
import {
  Button,
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
import { CreditCardOutlined, PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { cardMerchantService } from '@/services'
import type { CardMerchant, CreateCardMerchantRequest, UpdateCardMerchantRequest } from '@shared/types'
import { PageHeaderCard, SearchTable } from '@shared/components'
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
      key: 'sub_account_id',
      title: '子账户ID',
      dataIndex: 'sub_account_id',
      width: 120,
      render: (_: any, record: CardMerchant) => record.sub_account_id || '-'
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
      <PageHeaderCard
        title="卡商列表"
        subtitle="管理 DTC 卡商凭证，配置 API 密钥、签名密钥、接口域名等信息"
        logoText="🏦"
        gradientColors={['#52c41a', '#73d13d', '#95de64', '#b7eb8f']}
        actions={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建卡商
            </Button>
          </Space>
        }
      />

      <SearchTable
        dataSource={merchants}
        columns={columns}
        searchFields={searchFields}
        title="卡商列表"
        loading={isLoading}
        scroll={{ x: 1100 }}
        showPagination={false}
        onSearch={handleSearch}
        onRefresh={() => refetch()}
        onReset={handleReset}
      />

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
