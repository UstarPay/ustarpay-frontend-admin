import React, { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { kmsApi } from '@/services/apis/kmsApi'
import { useAuthStore, useAppStore } from '@/stores'
import type {
  KMSAuthMode,
  SystemKMSConfig,
  SystemKMSConfigListParams,
  UpsertSystemKMSConfigRequest,
} from '@shared/types/kms'

const { Paragraph, Text } = Typography

const defaultActions = ['kms:GenerateDataKey', 'kms:Decrypt', 'kms:DescribeKey']
const defaultTargets = ['go_service', 'tx_processor']

const authModeOptions = [
  { label: '默认凭证链', value: 'DEFAULT' },
  { label: '静态凭证', value: 'STATIC' },
  { label: 'Assume Role', value: 'ASSUME_ROLE' },
]

const targetOptions = [
  { label: 'Go 服务', value: 'go_service' },
  { label: 'tx-processor', value: 'tx_processor' },
]

const permissionOptions = defaultActions.map((item) => ({ label: item, value: item }))

const AWSKMSConfigPage: React.FC = () => {
  const { hasPermission } = useAuthStore()
  const { addNotification } = useAppStore()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()

  const [searchParams, setSearchParams] = useState<SystemKMSConfigListParams>({
    page: 1,
    limit: 20,
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<SystemKMSConfig | null>(null)
  const [detailItem, setDetailItem] = useState<SystemKMSConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const authMode = Form.useWatch('authMode', form) as KMSAuthMode | undefined

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['kms-configs', searchParams],
    queryFn: () => kmsApi.getKMSConfigs(searchParams),
    enabled: hasPermission('chain:list'),
  })

  const handleError = (error: any, title: string) => {
    const message = error?.response?.data?.message || error?.message || '操作失败'
    addNotification({ type: 'error', title, message })
  }

  const openCreateModal = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      provider: 'AWS_KMS',
      configCode: 'wallet_private_key',
      authMode: 'DEFAULT',
      serviceTargets: defaultTargets,
      requiredActions: defaultActions,
      isActive: true,
    })
    setModalVisible(true)
  }

  const openEditModal = (item: SystemKMSConfig) => {
    setEditingItem(item)
    form.setFieldsValue({
      configCode: item.configCode,
      provider: item.provider,
      region: item.region,
      kmsKeyId: item.kmsKeyId,
      kmsKeyArn: item.kmsKeyArn,
      aliasName: item.aliasName,
      authMode: item.authMode,
      accessKeyId: item.accessKeyId,
      roleArn: item.roleArn,
      externalId: item.externalId,
      roleSessionName: item.roleSessionName,
      serviceTargets: item.serviceTargets?.length ? item.serviceTargets : defaultTargets,
      requiredActions: item.requiredActions?.length ? item.requiredActions : defaultActions,
      isActive: item.isActive,
      description: item.description,
      secretAccessKey: '',
      sessionToken: '',
    })
    setModalVisible(true)
  }

  const openDetail = (item: SystemKMSConfig) => {
    setDetailItem(item)
    setDetailVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload: UpsertSystemKMSConfigRequest = {
        ...values,
        serviceTargets: values.serviceTargets || defaultTargets,
        requiredActions: values.requiredActions || defaultActions,
      }

      // 更新时空字符串代表“不覆盖”
      if (!payload.secretAccessKey) {
        delete payload.secretAccessKey
      }
      if (!payload.sessionToken) {
        delete payload.sessionToken
      }

      setSaving(true)
      if (editingItem) {
        await kmsApi.updateKMSConfig(editingItem.id, payload)
        addNotification({ type: 'success', title: '更新成功', message: 'AWS KMS 配置已更新' })
      } else {
        await kmsApi.createKMSConfig(payload)
        addNotification({ type: 'success', title: '创建成功', message: 'AWS KMS 配置已创建' })
      }
      queryClient.invalidateQueries({ queryKey: ['kms-configs'] })
      setModalVisible(false)
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      handleError(error, editingItem ? '更新失败' : '创建失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await kmsApi.deleteKMSConfig(id)
      addNotification({ type: 'success', title: '删除成功', message: 'KMS 配置已删除' })
      queryClient.invalidateQueries({ queryKey: ['kms-configs'] })
    } catch (error: any) {
      handleError(error, '删除失败')
    }
  }

  const columns: ColumnsType<SystemKMSConfig> = useMemo(() => [
    {
      title: '配置编码',
      dataIndex: 'configCode',
      width: 150,
      render: (value: string) => <Text code>{value}</Text>,
    },
    {
      title: 'KMS Key',
      key: 'kmsKey',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.aliasName || '未配置别名'}</Text>
          <Text type="secondary">{record.kmsKeyId}</Text>
        </Space>
      ),
    },
    {
      title: 'Region',
      dataIndex: 'region',
      width: 140,
    },
    {
      title: '认证方式',
      dataIndex: 'authMode',
      width: 140,
      render: (value: KMSAuthMode) => {
        const color = value === 'STATIC' ? 'orange' : value === 'ASSUME_ROLE' ? 'blue' : 'green'
        const label = value === 'STATIC' ? '静态凭证' : value === 'ASSUME_ROLE' ? 'Assume Role' : '默认凭证链'
        return <Tag color={color}>{label}</Tag>
      },
    },
    {
      title: '适用服务',
      dataIndex: 'serviceTargets',
      width: 200,
      render: (targets: string[]) => (
        <Space wrap>
          {(targets || []).map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? '激活' : '停用'}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openDetail(record)}>查看</Button>
          {hasPermission('chain:update') && (
            <Button size="small" type="primary" ghost onClick={() => openEditModal(record)}>编辑</Button>
          )}
          {hasPermission('chain:update') && (
            <Popconfirm
              title="确认删除该 KMS 配置吗？"
              description="删除后将无法在后台继续维护该配置。"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [hasPermission])

  if (!hasPermission('chain:list')) {
    return (
      <Card>
        <Alert message="权限不足" description="您没有权限访问 AWS KMS 配置管理页面" type="error" showIcon />
      </Card>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1 style={{ marginBottom: 8, fontSize: 24, fontWeight: 600 }}>AWS KMS配置</h1>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>刷新</Button>
          {hasPermission('chain:update') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              新增配置
            </Button>
          )}
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form
          layout="inline"
          initialValues={searchParams}
          onFinish={(values) => setSearchParams({ ...searchParams, ...values, page: 1 })}
        >
          <Form.Item name="search" label="关键字">
            <Input allowClear placeholder="配置编码 / KMS Key / Role ARN" style={{ width: 260 }} />
          </Form.Item>
          <Form.Item name="authMode" label="认证方式">
            <Select allowClear style={{ width: 160 }} options={authModeOptions} />
          </Form.Item>
          <Form.Item name="isActive" label="状态">
            <Select
              allowClear
              style={{ width: 120 }}
              options={[
                { label: '激活', value: true },
                { label: '停用', value: false },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={() => setSearchParams({ page: 1, limit: 20 })}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        {error && (
          <Alert
            style={{ marginBottom: 16 }}
            message="加载失败"
            description={(error as Error).message || '获取 KMS 配置列表失败'}
            type="error"
            showIcon
          />
        )}

        <Table<SystemKMSConfig>
          rowKey="id"
          columns={columns}
          loading={isLoading}
          dataSource={data?.items || []}
          pagination={{
            current: searchParams.page || 1,
            pageSize: searchParams.limit || 20,
            total: data?.total || 0,
            showSizeChanger: true,
            onChange: (page, pageSize) => setSearchParams({ ...searchParams, page, limit: pageSize }),
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑 AWS KMS 配置' : '新增 AWS KMS 配置'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={860}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} size={16} align="start">
            <Form.Item label="配置编码" name="configCode" rules={[{ required: true }]}>
              <Input placeholder="wallet_private_key" style={{ width: 240 }} />
            </Form.Item>
            <Form.Item label="提供方" name="provider" rules={[{ required: true }]}>
              <Input placeholder="AWS_KMS" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item label="Region" name="region" rules={[{ required: true }]}>
              <Input placeholder="ap-southeast-1" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item label="是否激活" name="isActive" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size={16} align="start">
            <Form.Item label="KMS Key ID" name="kmsKeyId" rules={[{ required: true }]}>
              <Input placeholder="填写 KMS Key ID" style={{ width: 280 }} />
            </Form.Item>
            <Form.Item label="Alias" name="aliasName">
              <Input placeholder="alias/ustarpay-wallet" style={{ width: 220 }} />
            </Form.Item>
            <Form.Item label="认证方式" name="authMode" rules={[{ required: true }]}>
              <Select style={{ width: 180 }} options={authModeOptions} />
            </Form.Item>
          </Space>

          <Form.Item label="KMS Key ARN" name="kmsKeyArn">
            <Input placeholder="填写完整 KMS Key ARN" />
          </Form.Item>

          {(authMode === 'STATIC' || authMode === 'ASSUME_ROLE') && (
            <Space style={{ width: '100%' }} size={16} align="start">
              <Form.Item
                label="Access Key ID"
                name="accessKeyId"
                rules={authMode === 'STATIC' ? [{ required: true, message: '静态凭证模式必须填写 Access Key ID' }] : []}
              >
                <Input placeholder="填写 Access Key ID" style={{ width: 240 }} />
              </Form.Item>
              <Form.Item
                label={editingItem ? 'Secret Access Key（留空则不修改）' : 'Secret Access Key'}
                name="secretAccessKey"
                rules={editingItem || authMode !== 'STATIC' ? [] : [{ required: true, message: '静态凭证模式必须填写 Secret Access Key' }]}
              >
                <Input.Password placeholder="填写 Secret Access Key" style={{ width: 300 }} />
              </Form.Item>
              <Form.Item label={editingItem ? 'Session Token（留空则不修改）' : 'Session Token'} name="sessionToken">
                <Input.Password placeholder="临时凭证可填写 Session Token" style={{ width: 240 }} />
              </Form.Item>
            </Space>
          )}

          {authMode === 'ASSUME_ROLE' && (
            <Space style={{ width: '100%' }} size={16} align="start">
              <Form.Item label="Role ARN" name="roleArn" rules={[{ required: true, message: 'Assume Role 模式必须填写 Role ARN' }]}>
                <Input placeholder="arn:aws:iam::xxxx:role/xxx" style={{ width: 320 }} />
              </Form.Item>
              <Form.Item label="External ID" name="externalId">
                <Input placeholder="选填" style={{ width: 180 }} />
              </Form.Item>
              <Form.Item label="Role Session Name" name="roleSessionName">
                <Input placeholder="ustarpay-kms-session" style={{ width: 220 }} />
              </Form.Item>
            </Space>
          )}

          <Form.Item label="适用服务" name="serviceTargets">
            <Select mode="multiple" options={targetOptions} />
          </Form.Item>

          <Form.Item label="要求权限动作" name="requiredActions">
            <Select mode="tags" options={permissionOptions} />
          </Form.Item>

          <Form.Item label="说明" name="description">
            <Input.TextArea rows={3} placeholder="描述该 KMS 配置的用途、适用环境或注意事项" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="AWS KMS 配置详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={840}
      >
        {detailItem && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="配置编码">{detailItem.configCode}</Descriptions.Item>
            <Descriptions.Item label="提供方">{detailItem.provider}</Descriptions.Item>
            <Descriptions.Item label="Region">{detailItem.region}</Descriptions.Item>
            <Descriptions.Item label="状态">{detailItem.isActive ? '激活' : '停用'}</Descriptions.Item>
            <Descriptions.Item label="KMS Key ID" span={2}>{detailItem.kmsKeyId}</Descriptions.Item>
            <Descriptions.Item label="KMS Key ARN" span={2}>{detailItem.kmsKeyArn || '-'}</Descriptions.Item>
            <Descriptions.Item label="Alias">{detailItem.aliasName || '-'}</Descriptions.Item>
            <Descriptions.Item label="认证方式">{detailItem.authMode}</Descriptions.Item>
            <Descriptions.Item label="Access Key ID">{detailItem.accessKeyId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Secret Access Key">
              {detailItem.hasSecretAccessKey ? detailItem.secretAccessKeyMasked : '未配置'}
            </Descriptions.Item>
            <Descriptions.Item label="Session Token">
              {detailItem.hasSessionToken ? detailItem.sessionTokenMasked : '未配置'}
            </Descriptions.Item>
            <Descriptions.Item label="Role ARN" span={2}>{detailItem.roleArn || '-'}</Descriptions.Item>
            <Descriptions.Item label="External ID">{detailItem.externalId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Role Session Name">{detailItem.roleSessionName || '-'}</Descriptions.Item>
            <Descriptions.Item label="适用服务" span={2}>
              <Space wrap>{detailItem.serviceTargets.map((item) => <Tag key={item}>{item}</Tag>)}</Space>
            </Descriptions.Item>
            <Descriptions.Item label="要求权限动作" span={2}>
              <Space wrap>{detailItem.requiredActions.map((item) => <Tag key={item} color="blue">{item}</Tag>)}</Space>
            </Descriptions.Item>
            <Descriptions.Item label="说明" span={2}>{detailItem.description || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default AWSKMSConfigPage
