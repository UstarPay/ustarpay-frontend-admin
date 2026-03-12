import { useState, useEffect } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  message,
  Divider,
  Col,
  Row,
  Spin,
  Modal,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import type { TenantFullDetail, TenantUpdateRequest } from '@shared/types'
import { tenantApi } from '@/services/apis/tenantApi'
import tenantPlanService from '@/services/apis/tenantPlanApi'
import { TENANT_PLAN_TYPES, TenantPlan } from '@shared/types/tenantPlan'


const { Title } = Typography
const { TextArea } = Input

/**
 * 租户编辑页面
 */
const TenantEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<TenantPlan | null>(null)
  const [initialPlanId, setInitialPlanId] = useState<string | null>(null)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)

  // 获取租户详情
  const { data: tenant, isLoading: isFetching } = useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      if (!id) return null
      const response = await tenantApi.getTenant(id)
      return response
    },
    enabled: !!id,
  })

  // 获取租户计划列表
  const { data: plansResponse } = useQuery({
    queryKey: ['tenant-plans'],
    queryFn: () => tenantPlanService.plan.getTenantPlans({ page: 1, pageSize: 1000, status: 1 }),
  })

  const plans = plansResponse?.items || []

  // 更新租户
  const updateMutation = useMutation({
    mutationFn: async (values: TenantUpdateRequest) => {
      if (!id) throw new Error('租户ID不能为空')
      return tenantApi.updateTenant(id, values)
    },
    onSuccess: async (data) => {
      message.success('租户更新成功')
      
      // 如果计划ID发生了变化，创建新的订阅
      if (selectedPlan && selectedPlan.id !== initialPlanId) {
        try {
          await tenantPlanService.subscription.createTenantPlanSubscription({
            tenantId: data.id,
            planId: selectedPlan.id,
            startAt: new Date().toISOString(),
          })
          message.success('租户计划订阅已更新')
        } catch (error: any) {
          message.warning(`租户更新成功，但订阅更新失败: ${error.message}`)
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['tenant', id] })
      navigate(`/tenants/${id}`)
    },
    onError: (error: any) => {
      message.error(error.message || '更新失败，请重试')
    },
  })

  // 处理计划选择变化
  const handlePlanChange = (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    setSelectedPlan(plan || null)
  }

  // 重新生成API密钥
  const regenerateApiCredentialsMutation = useMutation({
    mutationFn: () => tenantApi.regenerateAPICredentials(id!),
    onSuccess: (data) => {
      message.success('API密钥已重新生成')
      // 刷新租户数据
      queryClient.invalidateQueries({ queryKey: ['tenant', id] })
    },
    onError: (error: any) => {
      message.error(error.message || '重新生成API密钥失败，请重试')
    },
  })

  // 更新密码
  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      return tenantApi.updatePassword(id!, password)
    },
    onSuccess: () => {
      message.success('密码更新成功')
      setPasswordModalVisible(false)
      passwordForm.resetFields()
    },
    onError: (error: any) => {
      message.error(error.message || '密码更新失败，请重试')
    },
  })

  const handleRegenerateApiCredentials = () => {
    regenerateApiCredentialsMutation.mutate()
  }

  const handleUpdatePassword = async (values: any) => {
    if (!id) return
    const formValues = form.getFieldsValue()
    await updateMutation.mutateAsync({
      id,
      name: formValues.name || null,
      email: formValues.email || null,
      allowedIps: formValues.allowedIps
        ? formValues.allowedIps.split(',').map((ip: string) => ip.trim()).filter(Boolean)
        : [],
      webhookUrl: formValues.webhookUrl || null,
      webhookSecret: formValues.webhookSecret || null,
      status: Number(formValues.status),
      password: values.password,
    })
    setPasswordModalVisible(false)
    passwordForm.resetFields()
  }

  // 当租户数据加载完成时，设置表单初始值
  useEffect(() => {
    if (tenant) {
      // 记录初始计划ID
      setInitialPlanId(tenant.planId || null)

      // 设置表单值
      form.setFieldsValue({
        name: tenant.name,
        email: tenant.email,
        status: tenant.status,
        allowedIps: tenant.allowedIps?.join(', ') || '',
        webhookUrl: tenant.webhookUrl || '',
        webhookSecret: tenant.webhookSecret || '',
        planId: tenant.planId,
      })

      // 如果租户有计划ID，找到对应的计划
      if (tenant.planId && plans.length > 0) {
        const plan = plans.find(p => p.id === tenant.planId)
        setSelectedPlan(plan || null)
      }
    }
  }, [tenant, form, plans])

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      
      // 处理 allowedIps 字段
      const allowedIps = values.allowedIps 
        ? values.allowedIps.split(',').map((ip: string) => ip.trim()).filter(Boolean)
        : []

      const submitData: TenantUpdateRequest = {
        id: id!,
        name: values.name || null,
        email: values.email || null,
        password: values.password || null,
        allowedIps,
        status: Number(values.status || 1),
        webhookUrl: values.webhookUrl || null,
        webhookSecret: values.webhookSecret || null,
      }

      await updateMutation.mutateAsync(submitData)
    } catch (error) {
      console.error('Update tenant error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-3 text-gray-600">加载租户信息中...</div>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Title level={4} type="secondary">租户不存在</Title>
          <Button onClick={() => navigate('/tenants')}>返回列表</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>编辑租户 - {tenant.name} - NH资产钱包托管系统</title>
      </Helmet>

      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center space-x-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/tenants/${id}`)}
          >
            返回详情
          </Button>
          <Title level={2} className="mb-0">
            编辑租户 - {tenant.name}
          </Title>
        </div>

        {/* 表单 */}
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            scrollToFirstError
          >
            <Row gutter={24}>
              {/* 基本信息 */}
              <Col span={24}>
                <Title level={4}>基本信息</Title>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="租户名称"
                  rules={[
                    { required: true, message: '请输入租户名称' },
                    { min: 2, max: 50, message: '租户名称长度为2-50个字符' },
                  ]}
                >
                  <Input placeholder="请输入租户名称" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="email"
                  label="邮箱地址"
                  rules={[
                    { type: 'email', message: '请输入有效的邮箱地址' },
                  ]}
                >
                  <Input placeholder="请输入邮箱地址" />
                </Form.Item>
              </Col>

              {/* 1. 恢复状态字段编辑 */}
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="状态"
                  rules={[{ required: true, message: '请选择状态' }]}
                >
                  <Select
                    placeholder="请选择状态"
                    options={[
                      { label: '激活', value: 1 },
                      { label: '暂停', value: 0 },
                      { label: '冻结', value: -1 },
                    ]}
                  />
                </Form.Item>
              </Col>

              {/* 密码管理 */}
              <Col span={24}>
                <Divider />
                <Title level={4}>密码管理</Title>
              </Col>

              <Col span={24}>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-3">
                    <div className="font-medium text-gray-700 mb-1">租户密码</div>
                    <div className="text-sm text-gray-600">
                      租户登录密码管理，点击下方按钮修改密码
                    </div>
                  </div>
                  <Button 
                    type="primary"
                    onClick={() => setPasswordModalVisible(true)}
                    className="mb-2"
                  >
                    🔑 修改租户密码
                  </Button>
                  <div className="text-sm text-blue-600">
                    ℹ️ 修改密码后，租户需要使用新密码登录
                  </div>
                </div>
              </Col>

              {/* API密钥管理 */}
              <Col span={24}>
                <Divider />
                <Title level={4}>API密钥管理</Title>
              </Col>

              <Col span={24}>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-3">
                    <div className="font-medium text-gray-700 mb-1">API密钥信息</div>
                    <div className="text-sm text-gray-600">
                      当前租户的API密钥由系统自动生成和管理，如需重新生成请点击下方按钮
                    </div>
                  </div>
                  <Button 
                    type="primary" 
                    danger
                    onClick={handleRegenerateApiCredentials}
                    loading={regenerateApiCredentialsMutation.isPending}
                    className="mb-2"
                  >
                    🔐 重新生成API密钥
                  </Button>
                  <div className="text-sm text-red-600">
                    ⚠️ 重新生成后，旧的API密钥将立即失效，请确保更新客户端配置
                  </div>
                </div>
              </Col>

              {/* 订阅计划 */}
              <Col span={24}>
                <Divider />
                <Title level={4}>订阅计划</Title>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="planId"
                  label="订阅计划"
                  rules={[{ required: true, message: '请选择订阅计划' }]}
                  extra="选择计划后将自动配置相关限制参数"
                >
                  <Select
                    placeholder="请选择订阅计划"
                    onChange={handlePlanChange}
                    showSearch
                    filterOption={(input, option) =>
                      String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {plans.map(plan => (
                      <Select.Option key={plan.id} value={plan.id}>
                        <div>
                          <div className="font-medium">{plan.name}  ({TENANT_PLAN_TYPES.find(p => p.value === plan.type)?.label} - {plan.priceUSDT} USDT/{plan.durationMonths}个月)</div>
                          
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>



              {/* 自动配置信息展示 */}
              {selectedPlan && (
                <Col span={24} style={{ marginTop: '16px' }}>
                  <Card size="small" className="bg-blue-50 border-blue-200">
                    <Title level={5} className="mb-3 text-blue-700">计划配置信息</Title>
                    <Row gutter={16}>
                      <Col span={8}>
                        <div className="text-sm">
                          <span className="text-gray-600">API限流:</span>
                          <span className="ml-2 font-medium">{selectedPlan.rateLimitPerMinute || '无限制'} 次/分钟</span>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="text-sm">
                          <span className="text-gray-600">钱包限制:</span>
                          <span className="ml-2 font-medium">{selectedPlan.walletLimit || '无限制'} 个</span>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="text-sm">
                          <span className="text-gray-600">货币限制:</span>
                          <span className="ml-2 font-medium">{selectedPlan.currencyLimit || '无限制'} 种</span>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              )}

              {/* Webhook配置 */}
              <Col span={24}>
                <Divider />
                <Title level={4}>Webhook配置</Title>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="webhookUrl"
                  label="Webhook URL"
                  rules={[
                    { type: 'url', message: '请输入有效的URL' },
                  ]}
                >
                  <Input placeholder="https://your-domain.com/webhook" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="webhookSecret"
                  label="Webhook密钥"
                >
                  <Input.Password placeholder="请输入Webhook验证密钥" />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="allowedIps"
                  label="IP白名单"
                  extra="多个IP用逗号分隔，如: 192.168.1.1,10.0.0.1，留空表示不限制"
                >
                  <TextArea
                    rows={3}
                    placeholder="请输入允许访问的IP地址"
                  />
                </Form.Item>
              </Col>

              {/* 操作按钮 */}
              <Col span={24}>
                <Divider />
                <div className="flex justify-end space-x-4">
                  <Button onClick={() => navigate(`/tenants/${id}`)}>
                    取消
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading || updateMutation.isPending}
                  >
                    保存更改
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card>
      </div>

      {/* 密码修改模态框 */}
      <Modal
        title="修改租户密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false)
          passwordForm.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleUpdatePassword}
        >
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <div className="flex justify-end space-x-4">
            <Button onClick={() => {
              setPasswordModalVisible(false)
              passwordForm.resetFields()
            }}>
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updatePasswordMutation.isPending}
            >
              确认修改
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  )
}

export default TenantEditPage 