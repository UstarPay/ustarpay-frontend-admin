import { useState } from 'react'
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
  Alert,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import type { TenantCreateRequest, TenantFullDetail } from '@shared/types'
import { tenantApi } from '@/services/apis/tenantApi'
import tenantPlanService from '@/services/apis/tenantPlanApi'
import { TENANT_PLAN_TYPES, TenantPlan } from '@shared/types/tenantPlan'
import { generateRandomPassword } from '@shared/utils'


const { Title } = Typography
const { TextArea } = Input

/**
 * 租户创建页面
 */
const TenantCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<TenantPlan | null>(null)



  // 获取租户计划列表
  const { data: plansResponse } = useQuery({
    queryKey: ['tenant-plans'],
    queryFn: () => tenantPlanService.plan.getTenantPlans({ page: 1, pageSize: 1000, status: 1 }),
  })

  const plans = plansResponse?.items || []

  // 创建租户
  const createMutation = useMutation({
    mutationFn: async (values: TenantCreateRequest): Promise<TenantFullDetail> => {
      return tenantApi.createTenant(values)
    },
    onSuccess: async (data) => {
      message.success('租户创建成功')
      
      // 如果选择了计划，创建订阅
      if (selectedPlan) {
        try {
          await tenantPlanService.subscription.createTenantPlanSubscription({
            tenantId: data.id,
            planId: selectedPlan.id,
            startAt: new Date().toISOString(),
          })
          message.success('租户计划订阅创建成功')
        } catch (error: any) {
          message.warning(`租户创建成功，但订阅创建失败: ${error.message}`)
        }
      }
      
      navigate(`/tenants/${data.id}`)
    },
    onError: (error: any) => {
      message.error(error.message || '创建失败，请重试')
    },
  })

  // 处理计划选择变化
  const handlePlanChange = (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    setSelectedPlan(plan || null)
  }



  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      
      // 处理 allowedIps 字段
      const allowedIps = values.allowedIps 
        ? values.allowedIps.split(',').map((ip: string) => ip.trim()).filter(Boolean)
        : []

      const submitData: TenantCreateRequest = {
        name: values.name,
        email: values.email,
        password: values.password || undefined,
        status: Number(values.status || 1), // 默认状态为激活
        allowedIps,
        webhookUrl: values.webhookUrl || null,
        webhookSecret: values.webhookSecret || null,
      }

      await createMutation.mutateAsync(submitData)
    } catch (error) {
      console.error('Create tenant error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>创建租户 - U卡服务管理系统</title>
      </Helmet>

      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center space-x-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/tenants')}
          >
            返回列表
          </Button>
          <Title level={2} className="mb-0">
            创建租户
          </Title>
        </div>

        {/* 表单 */}
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            scrollToFirstError
            initialValues={{
              status: 1,
            }}
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
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' },
                  ]}
                >
                  <Input placeholder="请输入邮箱地址" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="password"
                  label="租户密码"
                  extra="设置租户登录密码，留空则使用默认密码"
                  rules={[
                    { min: 6, message: '密码长度至少6位' },
                  ]}
                >
                  <Input.Password
                    placeholder="请输入租户密码（可选）"
                    addonAfter={
                      <Button
                        type="link"
                        style={{ padding: 0 }}
                        onClick={() => {
                          const pwd = generateRandomPassword()
                          form.setFieldsValue({ password: pwd })
                          message.success('已生成随机密码')
                        }}
                      >
                        生成随机密码
                      </Button>
                    }
                  />
                </Form.Item>
              </Col>

              {/* API密钥生成提示 */}
              <Col span={24}>
                <Alert
                  type="info"
                  showIcon
                  message="API Key 和 API Secret 会在租户创建成功后由服务端自动生成，请在租户详情页查看。"
                  style={{ marginBottom: 16 }}
                />
              </Col>

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
                    ]}
                  />
                </Form.Item>
              </Col>

              {/* 订阅计划 */}
              <Col span={24}>
                <Divider />
                <Title level={4}>订阅计划</Title>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="planId"
                  label="订阅计划"
                  extra="选择计划后将自动配置相关限制参数，可选填"
                >
                  <Select
                    placeholder="请选择订阅计划（可选）"
                    onChange={handlePlanChange}
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {plans.map(plan => (
                      <Select.Option key={plan.id} value={plan.id}>
                        <div className="font-medium">{plan.name} ({TENANT_PLAN_TYPES.find(p => p.value === plan.type)?.label} - {plan.priceUSDT} USDT/{plan.durationMonths}个月)</div>
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
            </Row>

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button onClick={() => navigate('/tenants')}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading || createMutation.isPending}
              >
                创建租户
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </>
  )
}

export default TenantCreatePage
