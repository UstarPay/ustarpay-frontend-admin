import React, { useState, useEffect, useRef } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Badge,
  Switch,
  notification,
  Divider,
  Collapse
} from 'antd'
import { 
  SettingOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { walletService, hotWalletService } from '@/services'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

interface BalanceAlert {
  id: string
  walletId: string
  walletName: string
  walletAddress?: string
  walletType?: string
  chainCode?: string
  chainDisplay?: string
  symbol?: string
  currency: string
  type: 'low' | 'high' | 'both'
  threshold: number
  lowThreshold?: number
  highThreshold?: number
  currentBalance: number
  status: 'active' | 'inactive'
  alertEnabled: boolean
  isTriggered: boolean
  lastTriggeredAt?: string
  createdAt: string
  updatedAt: string
  isWithdrawalWallet?: boolean
  isGasWallet?: boolean
}

interface MonitorConfigRecipient {
  recipientId: string
  channel: 'email' | 'tg' | 'discord' | 'web'
}

interface MonitorConfig {
  id: string
  name: string
  description?: string
  isEnabled: boolean
  checkInterval: number
  alertChannels: string[]
  recipients: MonitorConfigRecipient[]
  alertId?: string // 关联的预警规则 ID（每条配置仅一个）
  workflowIdentifier?: string
  workflowMapping?: Record<string, string> // 兼容旧格式
  novuSecretKey?: string // 本条配置的 Novu API 密钥
  createdAt?: string
  updatedAt?: string
  novuConfigured?: boolean
}

interface BalanceStats {
  totalWallets: number
  monitoredWallets: number
  activeAlerts: number
  triggeredAlerts: number
  totalBalance: string
  averageBalance: string
}

const BalanceMonitorPage: React.FC = () => {
  const [alerts, setAlerts] = useState<BalanceAlert[]>([])
  const [configs, setConfigs] = useState<MonitorConfig[]>([])
  const [stats, setStats] = useState<BalanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [alertModalVisible, setAlertModalVisible] = useState(false)
  const [configModalVisible, setConfigModalVisible] = useState(false)
  const [editingAlert, setEditingAlert] = useState<BalanceAlert | null>(null)
  const [editingConfig, setEditingConfig] = useState<MonitorConfig | null>(null)
  const [alertForm] = Form.useForm()
  const [configForm] = Form.useForm()
  const alertType = Form.useWatch('type', alertForm)
  const [hotWallets, setHotWallets] = useState<{ id: string; name: string }[]>([])
  const [novuConfigured, setNovuConfigured] = useState(false)
  const [configModalAlerts, setConfigModalAlerts] = useState<BalanceAlert[]>([]) // 打开配置弹窗时拉取的预警规则
  const [selectedAlertId, setSelectedAlertId] = useState<string | undefined>(undefined) // 当前选择的预警规则ID
  const pendingConfigEditRef = useRef<{ config: MonitorConfig; alerts: BalanceAlert[] } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [alertsData, configsData, statsData] = await Promise.all([
        walletService.getBalanceAlerts(),
        walletService.getMonitorConfigs(),
        walletService.getBalanceMonitorStats()
      ])
      
      setAlerts(alertsData?.data?.items || [])
      setNovuConfigured(configsData?.data?.novuConfigured ?? false)
      const items = configsData?.data?.items || []
      const configsList: MonitorConfig[] = items.map((i: any) => ({
        id: i.id,
        name: i.name || '余额告警接收人',
        description: i.description ?? '',
        isEnabled: true,
        checkInterval: i.checkInterval ?? 2,
        alertChannels: i.alertChannels || [],
        recipients: (i.recipients || []).map((r: any) => ({
          recipientId: r.recipientId,
          channel: r.channel
        })),
        alertId: i.alertId,
        workflowIdentifier: i.workflowIdentifier,
        workflowMapping: i.workflowMapping || (i.alertId && i.workflowIdentifier ? { [i.alertId]: i.workflowIdentifier } : {}),
        novuConfigured: configsData?.data?.novuConfigured ?? false,
      }))
      setConfigs(configsList)
      setStats(statsData?.data ?? null)
    } catch (error) {
      console.error('加载余额监控数据失败:', error)
      notification.error({
        message: '加载失败',
        description: '无法加载余额监控数据'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadHotWallets = async () => {
    try {
      const options = await hotWalletService.getHotWalletOptions()
      setHotWallets(options.map((w) => ({ id: w.id, name: w.name })))
    } catch (e) {
      console.error('加载热钱包列表失败:', e)
    }
  }

  const handleCreateAlert = () => {
    setEditingAlert(null)
    alertForm.resetFields()
    loadHotWallets()
    setAlertModalVisible(true)
  }

  const handleEditAlert = async (alert: BalanceAlert) => {
    setEditingAlert(alert)
    await loadHotWallets()
    setAlertModalVisible(true)
  }

  const handleSaveAlert = async (values: any) => {
    try {
      const payload = values.type === 'both'
        ? { ...values, lowThreshold: values.lowThreshold, highThreshold: values.highThreshold }
        : { ...values, threshold: values.threshold }
      if (editingAlert) {
        await walletService.updateBalanceAlert(editingAlert.id, payload)
        notification.success({ message: '预警规则更新成功' })
      } else {
        await walletService.createBalanceAlert(payload)
        notification.success({ message: '预警规则创建成功' })
      }
      setAlertModalVisible(false)
      loadData()
    } catch (error: any) {
      console.error('保存预警规则失败:', error)
      notification.error({
        message: '保存失败',
        description: error?.response?.data?.error || error?.message || '无法保存预警规则'
      })
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个预警规则吗？',
      onOk: async () => {
        try {
          await walletService.deleteBalanceAlert(alertId)
          notification.success({ message: '预警规则删除成功' })
          loadData()
        } catch (error) {
          console.error('删除预警规则失败:', error)
          notification.error({
            message: '删除失败',
            description: '无法删除预警规则'
          })
        }
      }
    })
  }

  const handleToggleAlert = async (alertId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await walletService.enableBalanceAlert(alertId)
        notification.success({ message: '预警已启用' })
      } else {
        await walletService.disableBalanceAlert(alertId)
        notification.success({ message: '预警已停用' })
      }
      loadData()
    } catch (error) {
      console.error('切换预警状态失败:', error)
      notification.error({
        message: '操作失败',
        description: '无法切换预警状态'
      })
    }
  }

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'low': return 'red'
      case 'high': return 'orange'
      case 'both': return 'blue'
      default: return 'default'
    }
  }

  const getAlertTypeText = (type: string) => {
    switch (type) {
      case 'low': return '余额过低'
      case 'high': return '余额过高'
      case 'both': return '双阈值'
      default: return type
    }
  }

  const getAlertThresholdDisplay = (alert: BalanceAlert) => {
    if (alert.type === 'both' && alert.lowThreshold != null && alert.highThreshold != null) {
      return `${alert.lowThreshold} ~ ${alert.highThreshold}`
    }
    return String(alert.threshold)
  }

  const getAlertStatusColor = (status: string, isTriggered: boolean) => {
    if (isTriggered) return 'error'
    return status === 'active' ? 'success' : 'default'
  }

  const getAlertStatusText = (status: string, isTriggered: boolean) => {
    if (isTriggered) return '已触发'
    return status === 'active' ? '启用' : '禁用'
  }

  const alertColumns = [
    {
      title: '钱包名称',
      dataIndex: 'walletName',
      key: 'walletName',
      render: (name: string) => <Text>{name || '-'}</Text>
    },
    {
      title: '钱包地址',
      dataIndex: 'walletAddress',
      key: 'walletAddress',
      ellipsis: true,
      render: (addr: string) => (
        <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {addr || '-'}
        </Text>
      )
    },
    {
      title: '支持的链',
      dataIndex: 'chainDisplay',
      key: 'chainCode',
      render: (display: string, record: BalanceAlert) => (
        <Tag>{display || record.chainCode || '-'}</Tag>
      )
    },
    {
      title: '支持的代币',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (sym: string, record: BalanceAlert) => (
        <Tag color="blue">{(sym || record.currency || '-').toUpperCase()}</Tag>
      )
    },
    {
      title: '钱包用途',
      key: 'walletUsage',
      render: (_: unknown, record: BalanceAlert) => {
        const isHot = record.walletType?.toLowerCase() === 'hot'
        if (!isHot) return <Text type="secondary">-</Text>
        const usages: string[] = []
        if (record.isWithdrawalWallet) usages.push('提现钱包')
        if (record.isGasWallet) usages.push('Gas支付钱包')
        if (usages.length === 0) return <Text type="secondary">-</Text>
        return (
          <Space size={4} wrap>
            {usages.map((u) => (
              <Tag key={u}>{u}</Tag>
            ))}
          </Space>
        )
      }
    },
    {
      title: '预警类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getAlertTypeColor(type)}>
          {getAlertTypeText(type)}
        </Tag>
      )
    },
    {
      title: '阈值',
      dataIndex: 'threshold',
      key: 'threshold',
      render: (_: number, record: BalanceAlert) => (
        <Text strong>
          {getAlertThresholdDisplay(record)} {record.currency?.toUpperCase() || ''}
        </Text>
      )
    },
    {
      title: '当前余额',
      dataIndex: 'currentBalance',
      key: 'currentBalance',
      render: (balance: number, record: BalanceAlert) => (
        <Text>{balance} {record.currency.toUpperCase()}</Text>
      )
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: BalanceAlert) => (
        <Space>
          <Tag color={getAlertStatusColor(record.status, record.isTriggered)}>
            {getAlertStatusText(record.status, record.isTriggered)}
          </Tag>
          {record.isTriggered && (
            <Badge count={<WarningOutlined style={{ color: '#ff4d4f' }} />} />
          )}
        </Space>
      )
    },
    {
      title: '最后触发',
      dataIndex: 'lastTriggeredAt',
      key: 'lastTriggeredAt',
      render: (date: string) => (
        date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: BalanceAlert) => (
        <Space>
          <Switch
            checked={record.alertEnabled}
            checkedChildren="开启"
            unCheckedChildren="停用"
            onChange={(checked) => handleToggleAlert(record.id, checked)}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditAlert(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteAlert(record.id)}
          />
        </Space>
      )
    }
  ]

  const channelText: Record<string, string> = { email: '邮件', tg: 'Telegram', discord: 'Discord', web: '站内信' }
  const configColumns = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || '-'
    },
    {
      title: '检查间隔',
      dataIndex: 'checkInterval',
      key: 'checkInterval',
      width: 100,
      render: (v: number) => v != null ? `${v} 分钟` : '-'
    },
    {
      title: '通知渠道',
      dataIndex: 'alertChannels',
      key: 'alertChannels',
      render: (channels: string[] = []) => (
        <Space wrap size={4}>
          {channels.map((ch) => (
            <Tag key={ch}>{channelText[ch] || ch}</Tag>
          ))}
          {(!channels || channels.length === 0) && <Text type="secondary">-</Text>}
        </Space>
      )
    },
    {
      title: '接收人',
      dataIndex: 'recipients',
      key: 'recipients',
      render: (recipients: MonitorConfigRecipient[] = []) => (
        <Space wrap>
          {recipients.map((r, i) => (
            <Tag key={i}>
              {r.recipientId.slice(0, 8)}... / {channelText[r.channel] || r.channel}
            </Tag>
          ))}
          {recipients.length === 0 && <Text type="secondary">未配置</Text>}
        </Space>
      )
    },
    {
      title: '预警规则',
      key: 'alertRules',
      render: (_: any, record: MonitorConfig) => {
        const alertId = record.alertId
        if (!alertId) return <Text type="secondary">未关联</Text>
        const a = alerts.find((x) => x.id === alertId)
        if (!a) return <Text type="secondary">关联的预警规则已删除</Text>
        return (
          <Tag color={getAlertTypeColor(a.type)}>
            {a.walletName || '钱包'} · {getAlertTypeText(a.type)} · {getAlertThresholdDisplay(a)} {a.currency?.toUpperCase() || ''}
          </Tag>
        )
      }
    },
    {
      title: 'Novu 状态',
      dataIndex: 'novuConfigured',
      key: 'novuConfigured',
      width: 100,
      render: (configured: boolean) => (
        <Tag color={configured ? 'success' : 'default'}>
          {configured ? '已配置' : '未配置'}
        </Tag>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 165,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '状态',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      width: 80,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: MonitorConfig) => (
        <Space>
          <Button 
            type="text" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditConfig(record)}
          />
          <Button 
            type="text" 
            size="small" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteConfig(record)}
          />
        </Space>
      )
    }
  ]

  const getDefaultWorkflowByType = (type: string) => {
    if (type === 'low') return 'balance-low-alert'
    if (type === 'high') return 'balance-high-alert'
    if (type === 'both') return 'balance-both-alert'
    return 'balance-low-alert'
  }

  const handleOpenConfigModal = async (config?: MonitorConfig) => {
    let fetchedAlerts: BalanceAlert[] = []
    let editConfig: MonitorConfig | null = null
    try {
      const res = await walletService.getMonitorConfigEditData(config?.id)
      const data = res?.data as { config?: any; alerts?: { items?: any[] } }
      fetchedAlerts = data?.alerts?.items || []
      setConfigModalAlerts(fetchedAlerts)
      if (data?.config && (data.config.recipients?.length > 0 || config)) {
        const c = data.config
        editConfig = {
          id: c.configId || config?.id || 'config',
          name: c.name || '余额告警接收人',
          description: c.description ?? '',
          isEnabled: true,
          checkInterval: c.checkInterval ?? 2,
          alertChannels: c.alertChannels ?? [],
          recipients: (c.recipients || []).map((r: any) => ({
            recipientId: r.recipientId,
            channel: r.channel
          })),
          alertId: c.alertId,
          workflowIdentifier: c.workflowIdentifier,
          novuSecretKey: c.novuSecretKey,
          novuConfigured: c.novuConfigured,
        }
      }
    } catch (e: any) {
      console.error('获取监控配置编辑数据失败:', e)
      const is404 = e?.response?.status === 404 || e?.message?.includes('404')
      if (is404 && config) {
        notification.warning({
          message: '配置可能已变更',
          description: '未能加载最新配置，将使用列表数据回显。若保存失败请刷新页面重试。',
        })
      }
      fetchedAlerts = config ? (alerts || []) : []
      setConfigModalAlerts(fetchedAlerts)
    }
    const cfg = editConfig ?? config
    if (cfg) {
      setEditingConfig(cfg)
      setSelectedAlertId(cfg.alertId) // 设置已选择的预警规则ID
      pendingConfigEditRef.current = { config: cfg, alerts: fetchedAlerts }
      configForm.setFieldsValue({
        name: cfg.name,
        description: cfg.description ?? '',
        checkInterval: cfg.checkInterval ?? 2,
        alertChannels: cfg.alertChannels ?? [],
        recipients: cfg.recipients?.length ? cfg.recipients : [{ recipientId: '', channel: 'email' }],
        alertId: cfg.alertId || undefined,
        workflowIdentifier: cfg.workflowIdentifier || getDefaultWorkflowByType(cfg.alertId ? (alerts.find((a) => a.id === cfg.alertId)?.type || 'low') : 'low'),
        novuSecretKey: '', // 编辑时不回显密钥，留空表示不更新
      })
    } else {
      setEditingConfig(null)
      setSelectedAlertId(undefined) // 清空选择的预警规则ID
      pendingConfigEditRef.current = null
      configForm.resetFields()
      configForm.setFieldsValue({
        checkInterval: 2,
        alertChannels: ['email'],
        recipients: [{ recipientId: '', channel: 'email' }],
        alertId: undefined,
        workflowIdentifier: '',
        novuSecretKey: undefined,
      })
    }
    setConfigModalVisible(true)
  }

  const handleEditConfig = (config: MonitorConfig) => {
    handleOpenConfigModal(config)
  }

  const handleDeleteConfig = async (config: MonitorConfig) => {
    Modal.confirm({
      title: '确认删除',
      icon: <WarningOutlined />,
      content: '确定要删除此监控配置吗？删除后需重新添加才能恢复。',
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await walletService.deleteMonitorConfig(config.id)
          notification.success({ message: '监控配置已删除' })
          loadData()
        } catch (error) {
          console.error('删除监控配置失败:', error)
          notification.error({
            message: '删除失败',
            description: '无法删除监控配置'
          })
        }
      }
    })
  }

  const handleSaveConfig = async (values: any) => {
    const recipients = (values.recipients || []).filter(
      (r: any) => r?.recipientId && r?.channel
    )
    if (recipients.length === 0) {
      notification.error({ message: '请至少添加一个接收人' })
      return
    }
    if (!values.alertId) {
      notification.error({ message: '请选择预警规则' })
      return
    }
    const alertChannels = [...new Set(recipients.map((r: any) => r.channel).filter(Boolean))]
    const workflowIdentifier = (values.workflowIdentifier || '').trim() || getDefaultWorkflowByType(
      configModalAlerts.find((a) => a.id === values.alertId)?.type || 'low'
    )
    try {
      const payload: any = {
        ...values,
        recipients,
        alertChannels,
        alertId: values.alertId,
        workflowIdentifier,
      }
      if (!editingConfig && !payload.novuSecretKey?.trim()) {
        notification.error({ message: '请输入 Novu API 密钥（每条监控配置单独设置）' })
        return
      }
      if (!payload.novuSecretKey?.trim()) delete payload.novuSecretKey
      if (editingConfig) {
        delete payload.novuSecretKey
        await walletService.updateMonitorConfig(editingConfig.id, payload)
        notification.success({ message: '监控配置更新成功' })
      } else {
        await walletService.createMonitorConfig(payload)
        notification.success({ message: '监控配置创建成功' })
      }
      setConfigModalVisible(false)
      loadData()
    } catch (error) {
      console.error('保存监控配置失败:', error)
      notification.error({
        message: '保存失败',
        description: '无法保存监控配置'
      })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>余额监控</Title>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={loadData}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      {/* 统计信息 */}
      {stats && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="监控钱包"
                value={stats.monitoredWallets}
                suffix={`/ ${stats.totalWallets}`}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="活跃预警"
                value={stats.activeAlerts}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="已触发预警"
                value={stats.triggeredAlerts}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总余额"
                value={stats.totalBalance}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 预警规则 */}
      <Card 
        title="预警规则" 
        className="mb-6"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateAlert}
          >
            添加预警
          </Button>
        }
      >
        <Table
          columns={alertColumns}
          dataSource={alerts}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* 监控配置 */}
      <Card 
        title="监控配置" 
        className="mb-6"
        extra={
          <Button 
            icon={<PlusOutlined />}
            onClick={() => handleOpenConfigModal()}
          >
            添加监控配置
          </Button>
        }
      >
        <Table
          columns={configColumns}
          dataSource={configs}
          rowKey={(r) => r.id || 'config'}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* 预警规则模态框 */}
      <Modal
        title={editingAlert ? '编辑预警规则' : '添加预警规则'}
        open={alertModalVisible}
        onCancel={() => {
          setAlertModalVisible(false)
          setEditingAlert(null)
          alertForm.resetFields()
        }}
        destroyOnClose
        footer={null}
        afterOpenChange={(open) => {
          if (open && editingAlert) {
            setTimeout(() => {
              alertForm.setFieldsValue({
                walletId: editingAlert.walletId,
                type: editingAlert.type,
                threshold: editingAlert.threshold,
                lowThreshold: editingAlert.lowThreshold,
                highThreshold: editingAlert.highThreshold,
                status: editingAlert.status || 'active'
              })
            }, 0)
          }
        }}
      >
        <Form
          form={alertForm}
          layout="vertical"
          onFinish={handleSaveAlert}
        >
          <Form.Item
            name="walletId"
            label="选择钱包"
            rules={[{ required: true, message: '请选择钱包' }]}
          >
            <Select placeholder="请选择钱包" showSearch optionFilterProp="children">
              {hotWallets.map((w) => (
                <Option key={w.id} value={w.id}>{w.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="type"
            label="预警类型"
            rules={[{ required: true, message: '请选择预警类型' }]}
          >
            <Select
              placeholder="请选择预警类型"
              onChange={() => {
                alertForm.setFieldsValue({ threshold: undefined, lowThreshold: undefined, highThreshold: undefined })
              }}
            >
              <Option value="low">余额过低</Option>
              <Option value="high">余额过高</Option>
              <Option value="both">双阈值</Option>
            </Select>
          </Form.Item>

          {alertType === 'both' ? (
            <>
              <Form.Item
                name="lowThreshold"
                label="最低值"
                rules={[{ required: true, message: '请输入最低值' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入最低值"
                  min={0}
                />
              </Form.Item>
              <Form.Item
                name="highThreshold"
                label="最高值"
                rules={[
                  { required: true, message: '请输入最高值' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const low = getFieldValue('lowThreshold')
                      if (!value || !low || value > low) return Promise.resolve()
                      return Promise.reject(new Error('最高值必须大于最低值'))
                    }
                  })
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入最高值"
                  min={0}
                />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="threshold"
              label="阈值"
              rules={[{ required: true, message: '请输入阈值' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入阈值"
                min={0}
              />
            </Form.Item>
          )}
          
          <Form.Item
            name="status"
            label="状态"
            initialValue="active"
          >
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingAlert ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setAlertModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 监控配置模态框 */}
      <Modal
        title={editingConfig ? '编辑监控配置' : '添加监控配置'}
        open={configModalVisible}
        onCancel={() => {
          setConfigModalVisible(false)
          setSelectedAlertId(undefined) // 重置选择的预警规则ID
        }}
        width={620}
        destroyOnClose
        afterOpenChange={(open) => {
          if (!open) {
            pendingConfigEditRef.current = null
            setSelectedAlertId(undefined) // 重置选择的预警规则ID
            return
          }
          const pending = pendingConfigEditRef.current
          if (pending) {
            const { config: cfg } = pending
            setTimeout(() => {
              configForm.setFieldsValue({
                name: cfg.name,
                description: cfg.description ?? '',
                checkInterval: cfg.checkInterval ?? 2,
                alertChannels: cfg.alertChannels ?? [],
                recipients: cfg.recipients?.length ? cfg.recipients : [{ recipientId: '', channel: 'email' }],
                alertId: cfg.alertId || undefined,
                workflowIdentifier: cfg.workflowIdentifier || 'balance-low-alert',
                novuSecretKey: undefined,
              })
            }, 0)
          }
        }}
        footer={[
          <Button key="cancel" onClick={() => setConfigModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => configForm.submit()}>
            {editingConfig ? '更新' : '创建'}
          </Button>,
        ]}
      >
        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleSaveConfig}
          initialValues={{ checkInterval: 2 }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>基础配置</Text>
              <Divider style={{ margin: '8px 0 16px' }} />
              <Form.Item
                name="name"
                label="配置名称"
                rules={[{ required: true, message: '请输入配置名称' }]}
                tooltip="如：余额告警接收人"
              >
                <Input placeholder="如：余额告警接收人" />
              </Form.Item>
              <Form.Item
                name="description"
                label="描述"
                tooltip="如：余额低于/高于阈值时的通知接收人"
              >
                <Input.TextArea placeholder="如：余额低于/高于阈值时的通知接收人（可选）" rows={2} />
              </Form.Item>
              <Form.Item
                name="checkInterval"
                label="检查间隔（分钟）"
                rules={[{ required: true, message: '请输入检查间隔' }]}
              >
                <InputNumber
                  style={{ width: 160 }}
                  placeholder="如：2"
                  min={1}
                  max={60}
                  addonAfter="分钟"
                />
              </Form.Item>
            </div>

            <div>
              <Space align="center" wrap style={{ marginBottom: 8 }}>
                <Text strong>Novu 通知</Text>
              </Space>
              <Collapse
                ghost
                size="small"
                style={{ marginBottom: 16 }}
                items={[{
                  key: 'novu-guide',
                  label: (
                    <Space size={4}>
                      <QuestionCircleOutlined />
                      <Text type="secondary" style={{ fontSize: 12 }}>Novu 操作配置手册</Text>
                    </Space>
                  ),
                  children: (
                    <div style={{ fontSize: 12, lineHeight: 1.8, padding: '8px 0' }}>
                      <p><Text strong>1. 注册 Novu</Text></p>
                      <p>访问 <a href="https://web.novu.co" target="_blank" rel="noopener noreferrer">web.novu.co</a> 注册并创建应用。</p>
                      <p><Text strong>2. 获取 API 密钥</Text></p>
                      <p>控制台 → 设置 → API Keys → 复制 Secret Key（十六进制字符串），填入下方「API 密钥」。</p>
                      <p><Text strong>3. 创建 Workflow</Text></p>
                      <p>控制台 → Workflows → 新建，按预警规则配置 <Text code>Identifier</Text>（如 balance-low-alert、balance-high-alert）。下方可为每个预警规则单独选择并配置 Workflow，留空则按类型使用默认。</p>
                      <p><Text strong>4. 创建 Subscriber</Text></p>
                      <p>控制台 → Subscribers → 新建，记录其 <Text code>subscriberId</Text>（通常为 UUID），作为下方「接收人 ID」。</p>
                      <p><Text strong>5. 配置联系方式</Text></p>
                      <p>在 Subscriber 详情中添加邮箱、Telegram Chat ID、Discord 等，与本表单中选择的渠道对应。</p>
                      <p><Text strong>6. 邮件模板变量（Payload）</Text></p>
                      <p>本系统触发 Novu 时传入的变量如下，在模板中需使用 <Text code>payload.</Text> 前缀引用：</p>
                      <ul style={{ margin: '4px 0 8px', paddingLeft: 20 }}>
                        <li><Text code>payload.triggerReason</Text> 触发原因</li>
                        <li><Text code>payload.previousBalance</Text> 事件前余额</li>
                        <li><Text code>payload.currentBalance</Text> 当前余额</li>
                        <li><Text code>payload.threshold</Text> 触发阈值</li>
                        <li><Text code>payload.direction</Text> below / above</li>
                        <li><Text code>payload.monitorDirection</Text> low / high / both</li>
                      </ul>
                      <p><Text strong>7. 邮件模板示例（可复制到 Novu Email 编辑器中）</Text></p>
                      <pre style={{
                        margin: '8px 0',
                        padding: 12,
                        background: 'var(--ant-color-fill-tertiary)',
                        borderRadius: 6,
                        fontSize: 11,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
{`亲爱的用户，

【紧急告警】钱包余额预警

{{payload.triggerReason}}

当前余额：{{payload.currentBalance}}
触发阈值：{{payload.threshold}}
变更前余额：{{payload.previousBalance}}
预警类型：{{payload.direction}} ({{payload.monitorDirection}})

请及时处理。`}
                      </pre>
                      <p><Text type="secondary">官方文档：<a href="https://docs.novu.co" target="_blank" rel="noopener noreferrer">docs.novu.co</a></Text></p>
                    </div>
                  )
                }]}
              />
              <Divider style={{ margin: '8px 0 16px' }} />
              {!editingConfig && (
                <Form.Item
                  name="novuSecretKey"
                  label="API 密钥"
                  required
                  rules={[{ required: true, message: '请输入 Novu API 密钥（每条监控配置单独设置）' }]}
                  tooltip="用于发送 Novu 通知，每条监控配置单独设置"
                >
                  <Input.Password
                    placeholder="从 Novu 控制台复制 Secret Key"
                    autoComplete="new-password"
                  />
                </Form.Item>
              )}
              {(() => {
                if (configModalAlerts.length === 0) {
                  return (
                    <div
                      style={{
                        padding: 24,
                        background: 'var(--ant-color-fill-quaternary)',
                        borderRadius: 8,
                        textAlign: 'center',
                      }}
                    >
                      <Text type="secondary">请先添加预警规则，再选择并配置</Text>
                    </div>
                  )
                }
                return (
                  <div
                    style={{
                      padding: 16,
                      background: 'var(--ant-color-fill-quaternary)',
                      borderRadius: 8,
                      border: '1px solid var(--ant-color-border-secondary)',
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 12, display: 'block' }}>
                      每条监控配置仅关联一种预警规则（过高/过低/双阈值）
                    </Text>
                    <Form.Item
                      name="alertId"
                      label="预警规则"
                      rules={[{ required: true, message: '请选择预警规则' }]}
                      tooltip="选择要关联的预警规则"
                    >
                      <Select
                        placeholder="请选择预警规则"
                        style={{ width: '100%' }}
                        optionLabelProp="label"
                        showSearch
                        optionFilterProp="label"
                        onChange={(value) => {
                          const alert = configModalAlerts.find((a) => a.id === value)
                          if (alert) {
                            setSelectedAlertId(value) // 更新选择的预警规则ID
                            configForm.setFieldValue(
                              'workflowIdentifier',
                              getDefaultWorkflowByType(alert.type)
                            )
                          }
                        }}
                      >
                        {configModalAlerts.map((alert) => (
                          <Option
                            key={alert.id}
                            value={alert.id}
                            label={`${alert.walletName || '钱包'} · ${getAlertTypeText(alert.type)} · ${getAlertThresholdDisplay(alert)} ${alert.currency?.toUpperCase()}`}
                          >
                            <Space size={4}>
                              <span>{alert.walletName || '钱包'}</span>
                              <Tag color={getAlertTypeColor(alert.type)} style={{ margin: 0 }}>
                                {getAlertTypeText(alert.type)}
                              </Tag>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {getAlertThresholdDisplay(alert)} {alert.currency?.toUpperCase()}
                              </Text>
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="workflowIdentifier"
                      label="Workflow Identifier"
                      tooltip="留空则按预警类型使用默认"
                    >
                      <Input
                        placeholder="如 balance-low-alert"
                        size="middle"
                        disabled={!selectedAlertId}
                      />
                    </Form.Item>
                  </div>
                )
              })()}
            </div>

            <div>
              <Space align="center" wrap>
                <Text strong>通知接收人</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  接收人 ID 需与 Novu subscriberId 一致，邮箱等联系方式请在 Novu 控制台维护
                </Text>
              </Space>
              <Divider style={{ margin: '8px 0 16px' }} />
              <Form.List name="recipients">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ marginBottom: 12 }}>
                        <Space align="start" style={{ width: '100%' }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'recipientId']}
                            rules={[{ required: true, message: '请输入接收人 ID' }]}
                            style={{ flex: 1, marginBottom: 0, minWidth: 200 }}
                          >
                            <Input placeholder="接收人 ID（UUID）" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'channel']}
                            rules={[{ required: true, message: '请选择渠道' }]}
                            style={{ width: 120, marginBottom: 0 }}
                          >
                            <Select placeholder="渠道">
                              <Option value="email">邮件</Option>
                              <Option value="tg" disabled>Telegram</Option>
                              <Option value="discord" disabled>Discord</Option>
                              <Option value="web" disabled>站内信</Option>
                            </Select>
                          </Form.Item>
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                            disabled={fields.length <= 1}
                          />
                        </Space>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add({ recipientId: '', channel: 'email' })} icon={<PlusCircleOutlined />} block>
                      添加接收人
                    </Button>
                  </>
                )}
              </Form.List>
            </div>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

export default BalanceMonitorPage 