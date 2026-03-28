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
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  EditOutlined,
  MailOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { Helmet } from 'react-helmet-async'
import dayjs from 'dayjs'

import {
  emailDeliveryApi,
  type EmailDeliveryConfigView,
  type EmailTemplatePayload,
  type EmailTemplateView,
} from '@/services/apis/emailDeliveryApi'
import { useAuthStore } from '@/stores/authStore'

const { Paragraph, Text, Title } = Typography

const sceneOptions = [
  { label: '注册验证码', value: 'register_verify' },
  { label: '忘记密码验证码', value: 'forgot_password_verify' },
  { label: 'PIN 重置验证码', value: 'pin_reset_verify' },
]

const localeOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en' },
]

const envOptions = [
  { label: 'local', value: 'local' },
  { label: 'development', value: 'development' },
  { label: 'test', value: 'test' },
  { label: 'staging', value: 'staging' },
  { label: 'production', value: 'production' },
]

type ConfigFormValues = {
  enabled: boolean
  provider: string
  apiKey?: string
  fromName: string
  fromEmail: string
  replyTo: string
  webhookSecret?: string
  sendTimeoutSeconds: number
  universalCodeEnabled: boolean
  universalCode?: string
  universalCodeScopes: string[]
  universalCodeAllowedEnvs: string[]
  universalCodeAllowedEmails: string[]
  universalCodeAllowedIPs: string[]
}

type TemplateFormValues = {
  scene: string
  locale: string
  name: string
  subjectTemplate: string
  htmlTemplate: string
  textTemplate?: string
  enabled: boolean
  remark?: string
}

const sceneLabelMap = new Map(sceneOptions.map((item) => [item.value, item.label]))
const localeLabelMap = new Map(localeOptions.map((item) => [item.value, item.label]))

const EmailDeliveryPage: React.FC = () => {
  const [configForm] = Form.useForm<ConfigFormValues>()
  const [templateForm] = Form.useForm<TemplateFormValues>()
  const canManage = useAuthStore((state) => state.hasPermission('system:settings'))

  const [config, setConfig] = useState<EmailDeliveryConfigView | null>(null)
  const [templates, setTemplates] = useState<EmailTemplateView[]>([])
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateView | null>(null)

  const applyConfigToForm = useCallback(
    (next: EmailDeliveryConfigView) => {
      setConfig(next)
      configForm.setFieldsValue({
        enabled: next.enabled,
        provider: next.provider,
        apiKey: '',
        fromName: next.fromName,
        fromEmail: next.fromEmail,
        replyTo: next.replyTo,
        webhookSecret: '',
        sendTimeoutSeconds: next.sendTimeoutSeconds,
        universalCodeEnabled: next.universalCodeEnabled,
        universalCode: '',
        universalCodeScopes: next.universalCodeScopes || [],
        universalCodeAllowedEnvs: next.universalCodeAllowedEnvs || [],
        universalCodeAllowedEmails: next.universalCodeAllowedEmails || [],
        universalCodeAllowedIPs: next.universalCodeAllowedIPs || [],
      })
    },
    [configForm],
  )

  const loadConfig = useCallback(async () => {
    try {
      setLoadingConfig(true)
      const next = await emailDeliveryApi.getConfig()
      applyConfigToForm(next)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载邮件投递配置失败')
    } finally {
      setLoadingConfig(false)
    }
  }, [applyConfigToForm])

  const loadTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true)
      const next = await emailDeliveryApi.listTemplates()
      setTemplates(next)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载邮件模板失败')
    } finally {
      setLoadingTemplates(false)
    }
  }, [])

  useEffect(() => {
    void loadConfig()
    void loadTemplates()
  }, [loadConfig, loadTemplates])

  const handleSaveConfig = useCallback(async () => {
    try {
      const values = await configForm.validateFields()
      setSavingConfig(true)
      const payload = {
        enabled: !!values.enabled,
        provider: values.provider,
        fromName: values.fromName?.trim() || '',
        fromEmail: values.fromEmail.trim(),
        replyTo: values.replyTo?.trim() || '',
        sendTimeoutSeconds: Number(values.sendTimeoutSeconds),
        universalCodeEnabled: !!values.universalCodeEnabled,
        universalCodeScopes: values.universalCodeScopes || [],
        universalCodeAllowedEnvs: values.universalCodeAllowedEnvs || [],
        universalCodeAllowedEmails: values.universalCodeAllowedEmails || [],
        universalCodeAllowedIPs: values.universalCodeAllowedIPs || [],
        ...(values.apiKey?.trim() ? { apiKey: values.apiKey.trim() } : {}),
        ...(values.webhookSecret?.trim() ? { webhookSecret: values.webhookSecret.trim() } : {}),
        ...(values.universalCode?.trim() ? { universalCode: values.universalCode.trim() } : {}),
      }
      const next = await emailDeliveryApi.updateConfig(payload)
      applyConfigToForm(next)
      message.success('邮件投递配置已保存')
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        return
      }
      message.error(error instanceof Error ? error.message : '保存邮件投递配置失败')
    } finally {
      setSavingConfig(false)
    }
  }, [applyConfigToForm, configForm])

  const openCreateTemplate = useCallback(() => {
    setEditingTemplate(null)
    templateForm.resetFields()
    templateForm.setFieldsValue({
      scene: 'register_verify',
      locale: 'zh-CN',
      enabled: true,
    })
    setTemplateModalOpen(true)
  }, [templateForm])

  const openEditTemplate = useCallback(
    (record: EmailTemplateView) => {
      setEditingTemplate(record)
      templateForm.setFieldsValue({
        scene: record.scene,
        locale: record.locale,
        name: record.name,
        subjectTemplate: record.subjectTemplate,
        htmlTemplate: record.htmlTemplate,
        textTemplate: record.textTemplate,
        enabled: record.enabled,
        remark: record.remark,
      })
      setTemplateModalOpen(true)
    },
    [templateForm],
  )

  const handleSaveTemplate = useCallback(async () => {
    try {
      const values = await templateForm.validateFields()
      setSavingTemplate(true)
      const payload: EmailTemplatePayload = {
        scene: values.scene,
        locale: values.locale,
        name: values.name.trim(),
        subjectTemplate: values.subjectTemplate.trim(),
        htmlTemplate: values.htmlTemplate.trim(),
        textTemplate: values.textTemplate?.trim() || '',
        enabled: !!values.enabled,
        remark: values.remark?.trim() || '',
      }

      if (editingTemplate) {
        await emailDeliveryApi.updateTemplate(editingTemplate.id, payload)
        message.success('邮件模板已更新')
      } else {
        await emailDeliveryApi.createTemplate(payload)
        message.success('邮件模板已创建')
      }

      setTemplateModalOpen(false)
      setEditingTemplate(null)
      templateForm.resetFields()
      await loadTemplates()
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        return
      }
      message.error(error instanceof Error ? error.message : '保存邮件模板失败')
    } finally {
      setSavingTemplate(false)
    }
  }, [editingTemplate, loadTemplates, templateForm])

  const configStatusTags = useMemo(
    () => [
      {
        label: 'API Key',
        configured: !!config?.apiKeyConfigured,
        masked: config?.apiKey || '未配置',
      },
      {
        label: 'Webhook Secret',
        configured: !!config?.webhookSecretConfigured,
        masked: config?.webhookSecret || '未配置',
      },
      {
        label: '万能验证码',
        configured: !!config?.universalCodeConfigured,
        masked: config?.universalCode || '未配置',
      },
    ],
    [config],
  )

  if (!canManage) {
    return (
      <Card>
        <Alert
          type="error"
          showIcon
          message="权限不足"
          description="当前账号没有管理平台级邮件投递配置的权限。"
        />
      </Card>
    )
  }

  return (
    <>
      <Helmet>
        <title>邮件投递配置 - NH资产钱包托管系统</title>
      </Helmet>

      <div className="flex flex-col gap-6 p-6">
        <Card
          bordered={false}
          className="overflow-hidden rounded-[30px] border-0 bg-[linear-gradient(135deg,#111827_0%,#1f2937_48%,#0f766e_100%)] text-white shadow-[0_26px_80px_rgba(15,118,110,0.18)]"
          bodyStyle={{ padding: 0 }}
        >
          <div className="relative overflow-hidden px-6 py-6 lg:px-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.16),transparent_34%)]" />
            <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <div className="text-[11px] uppercase tracking-[0.34em] text-emerald-100/80">
                  Email Delivery
                </div>
                <div className="flex flex-col gap-2">
                  <Title level={2} className="!m-0 !text-white">
                    Resend 邮件投递与模板管理
                  </Title>
                  <Paragraph className="!m-0 !text-sm !leading-6 !text-slate-200">
                    统一管理平台级发件账号、API Key、Webhook 密钥、万能验证码策略，以及注册/忘记密码/PIN 重置邮件模板。保存后，认证服务会直接读取数据库配置。
                  </Paragraph>
                </div>
                <Space wrap>
                  <Button
                    icon={<ReloadOutlined />}
                    loading={loadingConfig || loadingTemplates}
                    onClick={() => {
                      void loadConfig()
                      void loadTemplates()
                    }}
                    className="h-9 rounded-full border-white/15 bg-white/10 px-4 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white"
                  >
                    刷新数据
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={savingConfig}
                    onClick={() => void handleSaveConfig()}
                    className="h-9 rounded-full bg-emerald-300 px-4 text-slate-950 shadow-none hover:!bg-emerald-200 hover:!text-slate-950"
                  >
                    保存投递配置
                  </Button>
                </Space>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {configStatusTags.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</div>
                      <Tag color={item.configured ? 'success' : 'default'}>
                        {item.configured ? '已配置' : '未配置'}
                      </Tag>
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
          description="API Key、Webhook Secret、万能验证码在页面中只显示脱敏结果。保存时如保持为空，后台会继续沿用当前已生效的值，不会把密钥清空。"
          className="rounded-[22px] border border-emerald-100 bg-emerald-50/80"
        />

        <Tabs
          items={[
            {
              key: 'config',
              label: '投递配置',
              children: (
                <Card
                  bordered={false}
                  className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
                  bodyStyle={{ padding: 24 }}
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <MailOutlined />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Text className="text-sm font-medium text-slate-500">Credential & Policy</Text>
                      <Title level={4} className="!m-0">
                        邮件投递参数与万能码策略
                      </Title>
                    </div>
                  </div>

                  <Form<ConfigFormValues>
                    form={configForm}
                    layout="vertical"
                    disabled={loadingConfig}
                    initialValues={{
                      enabled: true,
                      provider: 'resend',
                      sendTimeoutSeconds: 10,
                      universalCodeEnabled: true,
                      universalCodeScopes: ['register', 'forgot_password', 'pin_reset'],
                      universalCodeAllowedEnvs: ['local', 'development', 'test'],
                    }}
                  >
                    <Row gutter={16}>
                      <Col xs={24} xl={8}>
                        <Form.Item label="启用邮件投递" name="enabled" valuePropName="checked">
                          <Switch checkedChildren="已启用" unCheckedChildren="已关闭" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={8}>
                        <Form.Item label="邮件服务商" name="provider" rules={[{ required: true }]}>
                          <Select options={[{ label: 'Resend', value: 'resend' }]} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={8}>
                        <Alert
                          showIcon
                          type="info"
                          message="邮件语言由前端请求头决定"
                          description="App 会自动携带 X-Locale / Accept-Language，后台这里只维护中英文模板，不再配置默认发送语言。"
                        />
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} xl={12}>
                        <Form.Item label="API Key" name="apiKey">
                          <Input.Password
                            placeholder={config?.apiKeyConfigured ? '留空则保留当前 API Key' : '请输入 Resend API Key'}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={12}>
                        <Form.Item label="Webhook Secret" name="webhookSecret">
                          <Input.Password
                            placeholder={
                              config?.webhookSecretConfigured
                                ? '留空则保留当前 Webhook Secret'
                                : '请输入 Resend Webhook Secret'
                            }
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} xl={8}>
                        <Form.Item label="发件人名称" name="fromName">
                          <Input placeholder="例如：UStarPay" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={8}>
                        <Form.Item
                          label="发件邮箱"
                          name="fromEmail"
                          rules={[
                            { required: true, message: '请输入发件邮箱' },
                            { type: 'email', message: '请输入合法邮箱地址' },
                          ]}
                        >
                          <Input placeholder="例如：no-reply@ustarpay.biz" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={8}>
                        <Form.Item
                          label="回复邮箱"
                          name="replyTo"
                          rules={[{ type: 'email', message: '请输入合法邮箱地址' }]}
                        >
                          <Input placeholder="可留空" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} xl={8}>
                        <Form.Item
                          label="发送超时（秒）"
                          name="sendTimeoutSeconds"
                          rules={[{ required: true, message: '请输入发送超时秒数' }]}
                        >
                          <InputNumber min={1} max={120} className="w-full" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={8}>
                        <Form.Item label="启用万能验证码" name="universalCodeEnabled" valuePropName="checked">
                          <Switch checkedChildren="已启用" unCheckedChildren="已关闭" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={8}>
                        <Form.Item label="万能验证码" name="universalCode">
                          <Input.Password
                            placeholder={
                              config?.universalCodeConfigured ? '留空则保留当前万能验证码' : '请输入万能验证码'
                            }
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} xl={12}>
                        <Form.Item label="万能码适用场景" name="universalCodeScopes">
                          <Select
                            mode="multiple"
                            options={[
                              { label: '注册', value: 'register' },
                              { label: '忘记密码', value: 'forgot_password' },
                              { label: 'PIN 重置', value: 'pin_reset' },
                            ]}
                            placeholder="选择允许万能码生效的业务场景"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={12}>
                        <Form.Item label="万能码允许环境" name="universalCodeAllowedEnvs">
                          <Select
                            mode="multiple"
                            options={envOptions}
                            placeholder="选择允许万能码生效的环境"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} xl={12}>
                        <Form.Item label="万能码邮箱白名单" name="universalCodeAllowedEmails">
                          <Select mode="tags" tokenSeparators={[',', ' ']} placeholder="输入邮箱后回车" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={12}>
                        <Form.Item label="万能码 IP 白名单" name="universalCodeAllowedIPs">
                          <Select mode="tags" tokenSeparators={[',', ' ']} placeholder="输入 IP 后回车" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>
              ),
            },
            {
              key: 'templates',
              label: '模板管理',
              children: (
                <Card
                  bordered={false}
                  className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
                  bodyStyle={{ padding: 24 }}
                >
                  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                        <MailOutlined />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Text className="text-sm font-medium text-slate-500">Templates</Text>
                        <Title level={4} className="!m-0">
                          验证码邮件模板
                        </Title>
                      </div>
                    </div>
                    <Space wrap>
                      <Button icon={<ReloadOutlined />} loading={loadingTemplates} onClick={() => void loadTemplates()}>
                        刷新模板
                      </Button>
                      <Button type="primary" icon={<PlusOutlined />} onClick={openCreateTemplate}>
                        新建模板
                      </Button>
                    </Space>
                  </div>

                  <Table<EmailTemplateView>
                    rowKey="id"
                    dataSource={templates}
                    loading={loadingTemplates}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    scroll={{ x: 980 }}
                    columns={[
                      {
                        title: '场景',
                        dataIndex: 'scene',
                        key: 'scene',
                        render: (value: string) => sceneLabelMap.get(value) || value,
                      },
                      {
                        title: '语言',
                        dataIndex: 'locale',
                        key: 'locale',
                        render: (value: string) => localeLabelMap.get(value) || value,
                      },
                      {
                        title: '模板名称',
                        dataIndex: 'name',
                        key: 'name',
                      },
                      {
                        title: '状态',
                        dataIndex: 'enabled',
                        key: 'enabled',
                        render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? '启用' : '停用'}</Tag>,
                      },
                      {
                        title: '版本',
                        dataIndex: 'version',
                        key: 'version',
                        width: 80,
                      },
                      {
                        title: '更新时间',
                        dataIndex: 'updatedAt',
                        key: 'updatedAt',
                        render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
                      },
                      {
                        title: '操作',
                        key: 'actions',
                        width: 120,
                        render: (_, record) => (
                          <Button type="link" icon={<EditOutlined />} onClick={() => openEditTemplate(record)}>
                            编辑
                          </Button>
                        ),
                      },
                    ]}
                  />
                </Card>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={editingTemplate ? '编辑邮件模板' : '新建邮件模板'}
        open={templateModalOpen}
        onCancel={() => {
          setTemplateModalOpen(false)
          setEditingTemplate(null)
        }}
        onOk={() => void handleSaveTemplate()}
        confirmLoading={savingTemplate}
        width={860}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="支持的模板变量"
          description="可用变量包括 .Code、.ExpireMinutes、.SceneLabel、.ProductName、.SupportEmail、.UserEmail。服务端保存前会先做模板语法校验。"
        />

        <Form<TemplateFormValues>
          form={templateForm}
          layout="vertical"
          initialValues={{
            scene: 'register_verify',
            locale: 'zh-CN',
            enabled: true,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="场景" name="scene" rules={[{ required: true, message: '请选择模板场景' }]}>
                <Select options={sceneOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="语言" name="locale" rules={[{ required: true, message: '请选择语言' }]}>
                <Select options={localeOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item label="模板名称" name="name" rules={[{ required: true, message: '请输入模板名称' }]}>
                <Input placeholder="例如：注册验证码（中文）" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="启用状态" name="enabled" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="邮件标题模板"
            name="subjectTemplate"
            rules={[{ required: true, message: '请输入邮件标题模板' }]}
          >
            <Input placeholder="例如：您的 UStarPay 注册验证码" />
          </Form.Item>

          <Form.Item
            label="HTML 模板"
            name="htmlTemplate"
            rules={[{ required: true, message: '请输入 HTML 模板' }]}
          >
            <Input.TextArea rows={8} placeholder="请输入 HTML 模板内容" />
          </Form.Item>

          <Form.Item label="纯文本模板" name="textTemplate">
            <Input.TextArea rows={4} placeholder="可留空" />
          </Form.Item>

          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="可选备注" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default EmailDeliveryPage
