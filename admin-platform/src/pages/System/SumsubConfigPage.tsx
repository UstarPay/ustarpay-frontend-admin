import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  ApiOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { Helmet } from 'react-helmet-async'
import dayjs from 'dayjs'

import {
  sumsubConfigApi,
  type SumsubConfigView,
  type SumsubForwardTargetPayload,
  type SumsubForwardTargetView,
} from '@/services/apis/sumsubConfigApi'
import { useAuthStore } from '@/stores/authStore'

const { Paragraph, Text, Title } = Typography

const matchTypeOptions = [
  { label: 'Applicant ID', value: 'applicant_id' },
  { label: 'External User ID', value: 'external_user_id' },
  { label: 'User ID', value: 'user_id' },
  { label: '用户邮箱', value: 'user_email' },
  { label: '当前环境全部', value: 'all' },
]

type ConfigFormValues = {
  appToken?: string
  secretKey?: string
  baseUrl: string
  sandboxEnabled: boolean
  l2LevelName: string
  webhookSecret?: string
  websdkTtlSecs: number
  environmentTag?: string
  webhookForwardEnabled?: boolean
}

type TargetFormValues = {
  name: string
  enabled: boolean
  environmentTag: string
  matchType: string
  matchValue?: string
  targetUrl: string
  sharedSecret?: string
  timeoutSeconds: number
  silentOnFailure: boolean
}

const matchTypeLabelMap = new Map(matchTypeOptions.map((item) => [item.value, item.label]))

const SumsubConfigPage: React.FC = () => {
  const [configForm] = Form.useForm<ConfigFormValues>()
  const [targetForm] = Form.useForm<TargetFormValues>()
  const canManage = useAuthStore((state) => state.hasPermission('system:settings'))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SumsubConfigView | null>(null)
  const [targets, setTargets] = useState<SumsubForwardTargetView[]>([])
  const [targetsLoading, setTargetsLoading] = useState(false)
  const [targetModalOpen, setTargetModalOpen] = useState(false)
  const [savingTarget, setSavingTarget] = useState(false)
  const [editingTarget, setEditingTarget] = useState<SumsubForwardTargetView | null>(null)

  const applyConfigToForm = useCallback(
    (next: SumsubConfigView) => {
      setConfig(next)
      configForm.setFieldsValue({
        appToken: '',
        secretKey: '',
        baseUrl: next.baseUrl,
        sandboxEnabled: next.sandboxEnabled,
        l2LevelName: next.l2LevelName,
        webhookSecret: '',
        websdkTtlSecs: next.websdkTtlSecs,
        environmentTag: next.environmentTag,
        webhookForwardEnabled: next.webhookForwardEnabled,
      })
    },
    [configForm],
  )

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      const next = await sumsubConfigApi.getConfig()
      applyConfigToForm(next)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载 Sumsub 配置失败')
    } finally {
      setLoading(false)
    }
  }, [applyConfigToForm])

  const loadTargets = useCallback(async () => {
    if (!config?.showForwardTargetModule) {
      setTargets([])
      return
    }
    try {
      setTargetsLoading(true)
      const next = await sumsubConfigApi.listForwardTargets()
      setTargets(next)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载本地下游目标失败')
    } finally {
      setTargetsLoading(false)
    }
  }, [config?.showForwardTargetModule])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  useEffect(() => {
    void loadTargets()
  }, [loadTargets])

  const handleSave = useCallback(async () => {
    try {
      const values = await configForm.validateFields()
      setSaving(true)
      const payload = {
        baseUrl: values.baseUrl.trim(),
        sandboxEnabled: !!values.sandboxEnabled,
        l2LevelName: values.l2LevelName.trim(),
        websdkTtlSecs: Number(values.websdkTtlSecs),
        ...(values.appToken?.trim() ? { appToken: values.appToken.trim() } : {}),
        ...(values.secretKey?.trim() ? { secretKey: values.secretKey.trim() } : {}),
        ...(values.webhookSecret?.trim() ? { webhookSecret: values.webhookSecret.trim() } : {}),
        ...(config?.showEnvironmentTagEditor && values.environmentTag?.trim()
          ? { environmentTag: values.environmentTag.trim() }
          : {}),
        ...(config?.showWebhookForwardToggle ? { webhookForwardEnabled: !!values.webhookForwardEnabled } : {}),
      }
      const next = await sumsubConfigApi.updateConfig(payload)
      applyConfigToForm(next)
      message.success('Sumsub 配置已保存')
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        return
      }
      message.error(error instanceof Error ? error.message : '保存 Sumsub 配置失败')
    } finally {
      setSaving(false)
    }
  }, [applyConfigToForm, config?.showEnvironmentTagEditor, config?.showWebhookForwardToggle, configForm])

  const openCreateTarget = useCallback(() => {
    setEditingTarget(null)
    targetForm.resetFields()
    targetForm.setFieldsValue({
      enabled: true,
      environmentTag: '',
      matchType: 'external_user_id',
      timeoutSeconds: 5,
      silentOnFailure: true,
    })
    setTargetModalOpen(true)
  }, [targetForm])

  const openEditTarget = useCallback(
    (record: SumsubForwardTargetView) => {
      setEditingTarget(record)
      targetForm.setFieldsValue({
        name: record.name,
        enabled: record.enabled,
        environmentTag: record.environmentTag,
        matchType: record.matchType,
        matchValue: record.matchValue,
        targetUrl: record.targetUrl,
        sharedSecret: '',
        timeoutSeconds: record.timeoutSeconds,
        silentOnFailure: record.silentOnFailure,
      })
      setTargetModalOpen(true)
    },
    [targetForm],
  )

  const handleSaveTarget = useCallback(async () => {
    try {
      const values = await targetForm.validateFields()
      setSavingTarget(true)
      const payload: SumsubForwardTargetPayload = {
        name: values.name.trim(),
        enabled: !!values.enabled,
        environmentTag: values.environmentTag.trim(),
        matchType: values.matchType,
        ...(values.matchType !== 'all' && values.matchValue?.trim() ? { matchValue: values.matchValue.trim() } : {}),
        targetUrl: values.targetUrl.trim(),
        ...(values.sharedSecret?.trim() ? { sharedSecret: values.sharedSecret.trim() } : {}),
        timeoutSeconds: Number(values.timeoutSeconds),
        silentOnFailure: !!values.silentOnFailure,
      }

      if (editingTarget) {
        await sumsubConfigApi.updateForwardTarget(editingTarget.id, payload)
        message.success('本地下游目标已更新')
      } else {
        await sumsubConfigApi.createForwardTarget(payload)
        message.success('本地下游目标已创建')
      }

      setTargetModalOpen(false)
      setEditingTarget(null)
      targetForm.resetFields()
      await loadTargets()
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        return
      }
      message.error(error instanceof Error ? error.message : '保存本地下游目标失败')
    } finally {
      setSavingTarget(false)
    }
  }, [editingTarget, loadTargets, targetForm])

  const handleToggleTarget = useCallback(async (record: SumsubForwardTargetView) => {
    try {
      if (record.enabled) {
        await sumsubConfigApi.disableForwardTarget(record.id)
        message.success('目标已停用')
      } else {
        await sumsubConfigApi.enableForwardTarget(record.id)
        message.success('目标已启用')
      }
      await loadTargets()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新目标状态失败')
    }
  }, [loadTargets])

  const handleTestTarget = useCallback(async (record: SumsubForwardTargetView) => {
    try {
      const result = await sumsubConfigApi.testForwardTarget(record.id)
      message.success(`测试转发成功，耗时 ${result.durationMs ?? 0}ms`)
      await loadTargets()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '测试转发失败')
    }
  }, [loadTargets])

  const handleReplayTarget = useCallback(async (record: SumsubForwardTargetView) => {
    try {
      const result = await sumsubConfigApi.replayForwardTarget(record.id)
      message.success(`已重放最近事件${result.eventKey ? `：${result.eventKey}` : ''}`)
      await loadTargets()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '重放最近事件失败')
    }
  }, [loadTargets])

  const statusTags = useMemo(
    () => [
      { label: 'App Token', configured: !!config?.appTokenConfigured, masked: config?.appToken || '未配置' },
      { label: 'Secret Key', configured: !!config?.secretKeyConfigured, masked: config?.secretKey || '未配置' },
      { label: 'Webhook Secret', configured: !!config?.webhookSecretConfigured, masked: config?.webhookSecret || '未配置' },
    ],
    [config],
  )

  const isLocalConsole = !!config?.showEnvironmentTagEditor && !config?.showForwardTargetModule && !config?.showWebhookForwardToggle
  const heroDescription = isLocalConsole
    ? '本地环境可维护 Sumsub 基础对接参数，并配置当前实例唯一的 Environment Tag；测试服专属的本地下发开关和目标管理不会在本地显示。'
    : '统一管理平台级 Sumsub 令牌、密钥、Webhook 密钥、L2 级别名称和 SDK 有效期；测试服可额外管理本地下游转发目标，本地环境只维护自己的唯一 environmentTag。'

  const targetColumns = useMemo(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '环境标记',
        dataIndex: 'environmentTag',
        key: 'environmentTag',
        render: (value: string) => <Tag color="processing">{value}</Tag>,
      },
      {
        title: '匹配方式',
        dataIndex: 'matchType',
        key: 'matchType',
        render: (value: string) => matchTypeLabelMap.get(value) || value,
      },
      {
        title: '匹配值',
        dataIndex: 'matchValue',
        key: 'matchValue',
        render: (value?: string) => value || <Text type="secondary">当前环境全部</Text>,
      },
      {
        title: '目标地址',
        dataIndex: 'targetUrl',
        key: 'targetUrl',
        ellipsis: true,
      },
      {
        title: '状态',
        dataIndex: 'enabled',
        key: 'enabled',
        render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? '已启用' : '已停用'}</Tag>,
      },
      {
        title: '最近状态',
        key: 'lastStatus',
        render: (_: unknown, record: SumsubForwardTargetView) => (
          <Space direction="vertical" size={0}>
            <Text type="secondary">心跳：{record.lastHeartbeatAt ? dayjs(record.lastHeartbeatAt).format('YYYY-MM-DD HH:mm:ss') : '无'}</Text>
            <Text type="secondary">转发：{record.lastForwardedAt ? dayjs(record.lastForwardedAt).format('YYYY-MM-DD HH:mm:ss') : '无'}</Text>
            <Text type="secondary">测试：{record.lastTestedAt ? dayjs(record.lastTestedAt).format('YYYY-MM-DD HH:mm:ss') : '无'}</Text>
            {record.lastErrorMessage ? <Text type="danger">错误：{record.lastErrorMessage}</Text> : null}
          </Space>
        ),
      },
      {
        title: '操作',
        key: 'actions',
        render: (_: unknown, record: SumsubForwardTargetView) => (
          <Space wrap>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditTarget(record)}>
              编辑
            </Button>
            <Button size="small" onClick={() => void handleToggleTarget(record)}>
              {record.enabled ? '停用' : '启用'}
            </Button>
            <Button size="small" onClick={() => void handleTestTarget(record)}>
              测试转发
            </Button>
            <Button size="small" icon={<SyncOutlined />} onClick={() => void handleReplayTarget(record)}>
              重放最近
            </Button>
          </Space>
        ),
      },
    ],
    [handleReplayTarget, handleTestTarget, handleToggleTarget, openEditTarget],
  )

  if (!canManage) {
    return (
      <Card>
        <Alert type="error" showIcon message="权限不足" description="当前账号没有管理平台级 Sumsub 配置的权限。" />
      </Card>
    )
  }

  return (
    <>
      <Helmet>
        <title>Sumsub 配置 - NH资产钱包托管系统</title>
      </Helmet>

      <div className="flex flex-col gap-6 p-6">
        <Card
          bordered={false}
          className="overflow-hidden rounded-[30px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#111827_52%,#155e75_100%)] text-white shadow-[0_26px_80px_rgba(8,47,73,0.24)]"
          bodyStyle={{ padding: 0 }}
        >
          <div className="relative overflow-hidden px-6 py-6 lg:px-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.18),transparent_34%)]" />
            <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <div className="text-[11px] uppercase tracking-[0.34em] text-cyan-100/80">Platform Integration</div>
                <div className="flex flex-col gap-2">
                  <Title level={2} className="!m-0 !text-white">
                    Sumsub 对接配置
                  </Title>
                  <Paragraph className="!m-0 !text-sm !leading-6 !text-slate-200">
                    {heroDescription}
                  </Paragraph>
                </div>
                <Space wrap>
                  <Button
                    icon={<ReloadOutlined />}
                    loading={loading || targetsLoading}
                    onClick={() => {
                      void loadConfig()
                      void loadTargets()
                    }}
                    className="h-9 rounded-full border-white/15 bg-white/10 px-4 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white"
                  >
                    刷新数据
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={() => void handleSave()}
                    className="h-9 rounded-full bg-cyan-300 px-4 text-slate-950 shadow-none hover:!bg-cyan-200 hover:!text-slate-950"
                  >
                    保存配置
                  </Button>
                </Space>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {statusTags.map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</div>
                      <Tag color={item.configured ? 'success' : 'default'}>{item.configured ? '已配置' : '未配置'}</Tag>
                    </div>
                    <div className="mt-3 break-all font-mono text-sm text-white">{item.masked}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Alert
          type="info"
          showIcon
          message="敏感字段留空即保留原值"
          description="App Token、Secret Key、Webhook Secret、Shared Secret 在页面中只显示脱敏状态。保存时留空会继续沿用当前已生效的值。"
          className="rounded-[22px] border border-cyan-100 bg-cyan-50/80"
        />

        <Card bordered={false} className="rounded-[28px] border border-slate-200 bg-white shadow-sm" bodyStyle={{ padding: 24 }}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <SafetyCertificateOutlined />
            </div>
            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-slate-500">Credential & Runtime</Text>
              <Title level={4} className="!m-0">
                平台级认证参数
              </Title>
            </div>
          </div>

          <Form<ConfigFormValues>
            form={configForm}
            layout="vertical"
            disabled={loading}
            initialValues={{
              baseUrl: 'https://api.sumsub.com',
              sandboxEnabled: false,
              l2LevelName: '',
              websdkTtlSecs: 1800,
              webhookForwardEnabled: false,
            }}
          >
            <Row gutter={16}>
              <Col xs={24} xl={12}>
                <Form.Item label="App Token" name="appToken">
                  <Input.Password placeholder={config?.appTokenConfigured ? '留空则保留当前 App Token' : '请输入 Sumsub App Token'} />
                </Form.Item>
              </Col>
              <Col xs={24} xl={12}>
                <Form.Item label="Secret Key" name="secretKey">
                  <Input.Password placeholder={config?.secretKeyConfigured ? '留空则保留当前 Secret Key' : '请输入 Sumsub Secret Key'} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} xl={12}>
                <Form.Item label="Webhook Secret" name="webhookSecret" extra="本地 forwarded webhook 会优先使用这里的密钥做内部签名校验。">
                  <Input.Password placeholder={config?.webhookSecretConfigured ? '留空则保留当前 Webhook Secret' : '可选，建议单独配置'} />
                </Form.Item>
              </Col>
              <Col xs={24} xl={12}>
                <Form.Item label="Base URL" name="baseUrl" rules={[{ required: true, message: '请输入 Sumsub Base URL' }]}>
                  <Input prefix={<ApiOutlined />} placeholder="https://api.sumsub.com" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="L2 Level 名称" name="l2LevelName" rules={[{ required: true, message: '请输入 L2 Level 名称' }]}>
                  <Input placeholder="例如 test-l2" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="WebSDK TTL（秒）" name="websdkTtlSecs" rules={[{ required: true, message: '请输入 WebSDK TTL' }]}>
                  <InputNumber min={60} max={86400} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            {isLocalConsole ? null : (
              <Form.Item label="Sandbox 模式" name="sandboxEnabled" valuePropName="checked" extra="关闭后将按正式环境口径与 Sumsub 通信，请确认令牌和级别配置已切换。">
                <Switch checkedChildren="Sandbox" unCheckedChildren="Production" />
              </Form.Item>
            )}

            {config?.showEnvironmentTagEditor ? (
              <Form.Item
                label="本地 Environment Tag"
                name="environmentTag"
                rules={[
                  { required: true, message: '请输入本地 environmentTag' },
                  { pattern: /^[a-z0-9-]{2,32}$/, message: '仅支持小写字母、数字和短横线，长度 2-32' },
                  {
                    validator: async (_, value) => {
                      if (String(value).trim() === 'local') {
                        throw new Error('请使用开发者级唯一值，例如 local-jxy')
                      }
                    },
                  },
                ]}
                extra="用于生成新的 Sumsub externalUserID。本地必须使用开发者级唯一值，例如 local-jxy，不要使用笼统的 local。"
              >
                <Input placeholder="例如 local-jxy" />
              </Form.Item>
            ) : config?.fixedEnvironmentTag ? (
              <Alert
                type="info"
                showIcon
                message={`当前固定环境标记：${config.fixedEnvironmentTag}`}
                description="测试服不开放基础 environmentTag 编辑，新的 applicant 会固定使用 staging 作为环境标记。"
                className="mb-4 rounded-[18px]"
              />
            ) : null}

            {config?.showWebhookForwardToggle ? (
              <Form.Item
                label="启用本地下发"
                name="webhookForwardEnabled"
                valuePropName="checked"
                extra="关闭时，测试服只命中正式 webhook 处理链路；开启后才会在正式处理完成后按规则异步转发到本地下游。"
              >
                <Switch checkedChildren="已开启" unCheckedChildren="已关闭" />
              </Form.Item>
            ) : null}
          </Form>
        </Card>

        {config?.showForwardTargetModule ? (
          <Card bordered={false} className="rounded-[28px] border border-slate-200 bg-white shadow-sm" bodyStyle={{ padding: 24 }}>
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <SyncOutlined />
                </div>
                <div className="flex flex-col gap-1">
                  <Text className="text-sm font-medium text-slate-500">Forward Targets</Text>
                  <Title level={4} className="!m-0">
                    本地Webhook转发目标
                  </Title>
                </div>
              </div>
              <Space>
                <Button icon={<ReloadOutlined />} loading={targetsLoading} onClick={() => void loadTargets()}>
                  刷新目标
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateTarget}>
                  新增目标
                </Button>
              </Space>
            </div>

            <Alert
              type="warning"
              showIcon
              className="mb-5 rounded-[18px]"
              message="测试服只负责正式处理 + 可选镜像转发"
              description="正式 webhook 会先更新测试服的 KYC 状态，只有在开启“启用本地下发”并匹配到有效目标时，才会把事件异步转发到本地 tunnel。测试转发和重放最近事件不受总开关限制。"
            />

            <Table<SumsubForwardTargetView>
              rowKey="id"
              loading={targetsLoading}
              columns={targetColumns}
              dataSource={targets}
              pagination={false}
              scroll={{ x: 1280 }}
            />
          </Card>
        ) : null}
      </div>

      <Modal
        title={editingTarget ? '编辑本地下游目标' : '新增本地下游目标'}
        open={targetModalOpen}
        onCancel={() => {
          setTargetModalOpen(false)
          setEditingTarget(null)
        }}
        onOk={() => void handleSaveTarget()}
        confirmLoading={savingTarget}
        okText="保存"
        destroyOnClose
        width={720}
      >
        <Form<TargetFormValues> form={targetForm} layout="vertical" initialValues={{ enabled: true, timeoutSeconds: 5, silentOnFailure: true }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="目标名称" name="name" rules={[{ required: true, message: '请输入目标名称' }]}>
                <Input placeholder="例如 jxy-local-01" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Environment Tag"
                name="environmentTag"
                rules={[
                  { required: true, message: '请输入 environmentTag' },
                  { pattern: /^[a-z0-9-]{2,32}$/, message: '仅支持小写字母、数字和短横线，长度 2-32' },
                ]}
              >
                <Input placeholder="例如 local-jxy" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="匹配方式" name="matchType" rules={[{ required: true, message: '请选择匹配方式' }]}>
                <Select options={matchTypeOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prev, next) => prev.matchType !== next.matchType}
              >
                {({ getFieldValue }) => (
                  <Form.Item
                    label="匹配值"
                    name="matchValue"
                    rules={
                      getFieldValue('matchType') === 'all'
                        ? []
                        : [{ required: true, message: '请输入匹配值' }]
                    }
                  >
                    <Input placeholder={getFieldValue('matchType') === 'all' ? '当前环境全部转发时可留空' : '请输入对应的 applicantId / externalUserID / userId / email'} disabled={getFieldValue('matchType') === 'all'} />
                  </Form.Item>
                )}
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="目标地址" name="targetUrl" rules={[{ required: true, message: '请输入本地 tunnel 地址' }]}>
            <Input placeholder="https://xxx.loca.lt/auth/v1/webhooks/sumsub-forwarded" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Shared Secret" name="sharedSecret" extra={editingTarget ? '留空则保留当前 Shared Secret' : '请输入测试服转发到本地时使用的 HMAC 密钥'}>
                <Input.Password placeholder={editingTarget ? '留空保留原值' : '请输入 Shared Secret'} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="超时秒数" name="timeoutSeconds" rules={[{ required: true, message: '请输入超时秒数' }]}>
                <InputNumber min={1} max={30} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="启用状态" name="enabled" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="失败静默" name="silentOnFailure" valuePropName="checked" extra="开启后，自动转发失败只记录 last_error，不额外升级日志告警。">
                <Switch checkedChildren="静默" unCheckedChildren="告警" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  )
}

export default SumsubConfigPage
