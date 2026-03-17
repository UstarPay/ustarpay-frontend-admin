import React, { useState, useEffect, useRef } from 'react'
import { 
  Card, 
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

  const monitorCoverage = stats && stats.totalWallets > 0
    ? Math.round((stats.monitoredWallets / stats.totalWallets) * 100)
    : 0

  const headerMetrics = [
    {
      label: '覆盖率',
      value: `${monitorCoverage}%`,
      helper: stats ? `${stats.monitoredWallets}/${stats.totalWallets} 钱包纳入监控` : '等待统计数据',
      tone: 'bg-[#14342b] text-[#d7f7e9]'
    },
    {
      label: '触发事件',
      value: `${stats?.triggeredAlerts ?? 0}`,
      helper: '最近累计触发预警',
      tone: 'bg-[#3f2a15] text-[#ffe7c2]'
    },
    {
      label: '通知能力',
      value: novuConfigured ? '已接通' : '待配置',
      helper: novuConfigured ? 'Novu 可用' : '建议先补全通知配置',
      tone: 'bg-[#1a3152] text-[#d8e9ff]'
    }
  ]

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f3ec_0%,#f5f7fb_26%,#eef3f8_100%)] p-4 md:p-6">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <section className="overflow-hidden rounded-[34px] border border-[#e7ddcf] bg-[linear-gradient(135deg,#fffaf2_0%,#f3ebe0_44%,#e7f0ef_100%)] shadow-[0_24px_60px_rgba(76,61,42,0.10)]">
          <div className="grid gap-0 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-[#eadfce] px-6 py-7 xl:border-b-0 xl:border-r xl:px-8 xl:py-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#17352e] px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-[#d7f7e9]">
                <SettingOutlined />
                Balance Sentinel
              </div>
              <Title level={1} className="!mb-2 !mt-4 !text-[34px] !font-semibold !tracking-tight !text-[#1d2a26]">
                余额监控
              </Title>
              <Text className="block max-w-xl text-[15px] leading-7 !text-[#5f6d69]">
                用于持续观察关键钱包余额，并配置阈值预警与通知接收链路。
              </Text>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={loadData}
                  loading={loading}
                  className="!h-11 !rounded-full !border-0 !bg-[#17352e] !px-5 !shadow-none"
                >
                  刷新监控数据
                </Button>
                <Button
                  icon={<PlusOutlined />}
                  onClick={handleCreateAlert}
                  className="!h-11 !rounded-full !border-[#cbbba6] !bg-white/80 !px-5 !text-[#4d4133]"
                >
                  添加预警规则
                </Button>
                <Button
                  icon={<PlusCircleOutlined />}
                  onClick={() => handleOpenConfigModal()}
                  className="!h-11 !rounded-full !border-[#c9d6d5] !bg-[#eff8f6] !px-5 !text-[#204f46]"
                >
                  添加监控配置
                </Button>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {headerMetrics.map((item) => (
                  <div key={item.label} className={`rounded-[22px] px-4 py-4 ${item.tone}`}>
                    <div className="text-[11px] uppercase tracking-[0.2em] opacity-80">{item.label}</div>
                    <div className="mt-3 text-[28px] font-semibold leading-none">{item.value}</div>
                    <div className="mt-2 text-xs opacity-80">{item.helper}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-7 xl:px-8 xl:py-8">
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <Card bordered={false} className="rounded-[24px] border border-[#e3d7c7] bg-white/80 shadow-none">
                  <Statistic
                    title="监控钱包"
                    value={stats?.monitoredWallets ?? 0}
                    suffix={stats ? `/ ${stats.totalWallets}` : ''}
                    valueStyle={{ color: '#1d4ed8', fontWeight: 700 }}
                  />
                </Card>
                <Card bordered={false} className="rounded-[24px] border border-[#d6eadf] bg-white/80 shadow-none">
                  <Statistic
                    title="活跃预警"
                    value={stats?.activeAlerts ?? 0}
                    valueStyle={{ color: '#15803d', fontWeight: 700 }}
                  />
                </Card>
                <Card bordered={false} className="rounded-[24px] border border-[#f0dfba] bg-white/80 shadow-none">
                  <Statistic
                    title="已触发预警"
                    value={stats?.triggeredAlerts ?? 0}
                    valueStyle={{ color: '#d97706', fontWeight: 700 }}
                  />
                </Card>
                <Card bordered={false} className="rounded-[24px] border border-[#dcd6ec] bg-white/80 shadow-none">
                  <Statistic
                    title="总余额"
                    value={stats?.totalBalance ?? '0'}
                    valueStyle={{ color: '#6d28d9', fontWeight: 700 }}
                  />
                </Card>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[26px] border border-[#eadfce] bg-white/78 px-5 py-5">
                  <div className="text-[11px] uppercase tracking-[0.26em] text-[#a28d76]">Coverage Notes</div>
                  <div className="mt-3 text-sm leading-7 text-[#66594a]">查看监控覆盖情况与规则配置状态。</div>
                </div>
                <div className="rounded-[26px] border border-[#d4e2df] bg-[#17352e] px-5 py-5 text-[#d7f7e9]">
                  <div className="text-[11px] uppercase tracking-[0.26em] text-[#9ed7c7]">Ops Checklist</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div>1. 新钱包接入后立即补预警阈值</div>
                    <div>2. 每条通知配置只绑定一条规则</div>
                    <div>3. 先校验接收人，再启用自动通知</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

          <div className="grid gap-6 xl:grid-cols-[0.6fr_1.4fr]">
            <aside className="min-w-0 space-y-6">
            <Card
              bordered={false}
              className="rounded-[30px] border border-[#e6ddcf] bg-white/88 shadow-[0_16px_38px_rgba(76,61,42,0.06)]"
              bodyStyle={{ padding: 24 }}
            >
              <div className="text-[11px] uppercase tracking-[0.28em] text-[#a28d76]">Monitor Snapshot</div>
              <div className="mt-4 space-y-4">
                <div className="rounded-[22px] bg-[#f7efe4] px-4 py-4">
                  <div className="text-xs text-[#8f7b64]">平均余额</div>
                  <div className="mt-2 text-2xl font-semibold text-[#3f3428]">{stats?.averageBalance ?? '0'}</div>
                </div>
                <div className="rounded-[22px] bg-[#edf7f4] px-4 py-4">
                  <div className="text-xs text-[#5d867b]">通知配置数</div>
                  <div className="mt-2 text-2xl font-semibold text-[#1d4f45]">{configs.length}</div>
                </div>
                <div className="rounded-[22px] bg-[#eef3fb] px-4 py-4">
                  <div className="text-xs text-[#7184a0]">预警规则数</div>
                  <div className="mt-2 text-2xl font-semibold text-[#243b5a]">{alerts.length}</div>
                </div>
              </div>
            </Card>

            <Card
              bordered={false}
              className="rounded-[30px] border border-[#d9e5e2] bg-[linear-gradient(180deg,#f8fffd_0%,#eef8f5_100%)] shadow-[0_16px_38px_rgba(24,80,70,0.06)]"
              bodyStyle={{ padding: 24 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-[#6a8f86]">Channel Readiness</div>
                  <div className="mt-2 whitespace-nowrap text-2xl font-semibold text-[#17352e]">通知链路</div>
                </div>
                <Tag color={novuConfigured ? 'success' : 'warning'}>
                  {novuConfigured ? 'Novu 已配置' : 'Novu 未配置'}
                </Tag>
              </div>
            </Card>
          </aside>

            <section className="min-w-0 space-y-6">
              <Card
                bordered={false}
                className="min-w-0 rounded-[30px] border border-[#ded5c7] bg-white/90 shadow-[0_16px_38px_rgba(76,61,42,0.06)]"
                bodyStyle={{ padding: 0 }}
              title={
                <div className="px-1 py-1">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-[#a28d76]">Rule Deck</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-[#2f261e]">预警规则</div>
                </div>
              }
            >
              <div className="w-full max-w-full overflow-x-auto">
                <Table
                  style={{ minWidth: 1650 }}
                  columns={alertColumns}
                  dataSource={alerts}
                  rowKey="id"
                  loading={loading}
                  scroll={{ x: 1650 }}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                  }}
                />
              </div>
            </Card>

              <Card
                bordered={false}
                className="min-w-0 rounded-[30px] border border-[#d8e3e1] bg-white/90 shadow-[0_16px_38px_rgba(24,80,70,0.06)]"
                bodyStyle={{ padding: 0 }}
              title={
                <div className="px-1 py-1">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-[#6a8f86]">Delivery Deck</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-[#17352e]">监控配置</div>
                </div>
              }
            >
              <div className="w-full max-w-full overflow-x-auto">
                <Table
                  style={{ minWidth: 1550 }}
                  columns={configColumns}
                  dataSource={configs}
                  rowKey={(r) => r.id || 'config'}
                  loading={loading}
                  scroll={{ x: 1550 }}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                  }}
                />
              </div>
            </Card>
            </section>
          </div>
        </div>
      </div>

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
    </>
  )
}

export default BalanceMonitorPage 
