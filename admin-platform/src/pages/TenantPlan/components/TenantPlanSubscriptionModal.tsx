import React, { useEffect } from 'react'
import { Modal, Form, Input, Select, DatePicker, message } from 'antd'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import tenantPlanService from '@/services/apis/tenantPlanApi'
import { tenantApi } from '@/services/apis/tenantApi'
import { 
  TenantPlanSubscription, 
  CreateTenantPlanSubscriptionRequest, 
  UpdateTenantPlanSubscriptionRequest,
  SUBSCRIPTION_STATUS_OPTIONS
} from '@shared/types/tenantPlan'

const { Option } = Select

interface TenantPlanSubscriptionModalProps {
  visible: boolean
  onCancel: () => void
  subscription?: TenantPlanSubscription
  mode: 'create' | 'edit'
}

const TenantPlanSubscriptionModal: React.FC<TenantPlanSubscriptionModalProps> = ({
  visible,
  onCancel,
  subscription,
  mode
}) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // 获取租户列表
  const { data: tenantsResponse } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getTenants({ page: 1, pageSize: 1000 }),
    enabled: visible && mode === 'create'
  })

  const tenants = tenantsResponse?.items || []

  // 获取租户计划列表
  const { data: plansResponse } = useQuery({
    queryKey: ['tenant-plans'],
    queryFn: () => tenantPlanService.plan.getTenantPlans({ page: 1, pageSize: 1000, status: 1 }),
    enabled: visible
  })

  const plans = plansResponse?.items || []

  // 创建订阅mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: (data: CreateTenantPlanSubscriptionRequest) => 
      tenantPlanService.subscription.createTenantPlanSubscription(data),
    onSuccess: () => {
      message.success('租户计划订阅创建成功')
      queryClient.invalidateQueries({ queryKey: ['tenant-plan-subscriptions'] })
      onCancel()
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(`创建失败: ${error.message}`)
    }
  })

  // 更新订阅mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantPlanSubscriptionRequest }) => 
      tenantPlanService.subscription.updateTenantPlanSubscription(id, data),
    onSuccess: () => {
      message.success('租户计划订阅更新成功')
      queryClient.invalidateQueries({ queryKey: ['tenant-plan-subscriptions'] })
      onCancel()
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(`更新失败: ${error.message}`)
    }
  })

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      // 格式化日期
      const formattedValues = {
        ...values,
        startAt: values.startAt ? dayjs(values.startAt).toISOString() : undefined,
        endAt: values.endAt ? dayjs(values.endAt).toISOString() : undefined
      }
      
      if (mode === 'create') {
        createSubscriptionMutation.mutate(formattedValues)
      } else if (mode === 'edit' && subscription) {
        updateSubscriptionMutation.mutate({ id: subscription.id, data: formattedValues })
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 监听计划变化，自动计算结束时间
  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(plan => plan.id === planId)
    const startAt = form.getFieldValue('startAt')
    
    if (selectedPlan && startAt) {
      const endAt = dayjs(startAt).add(selectedPlan.durationMonths, 'month')
      form.setFieldValue('endAt', endAt)
    }
  }

  // 监听开始时间变化，自动计算结束时间
  const handleStartTimeChange = (startAt: dayjs.Dayjs | null) => {
    const planId = form.getFieldValue('planId')
    const selectedPlan = plans.find(plan => plan.id === planId)
    
    if (selectedPlan && startAt) {
      const endAt = startAt.add(selectedPlan.durationMonths, 'month')
      form.setFieldValue('endAt', endAt)
    }
  }

  // 当模态框打开时，设置表单初始值
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && subscription) {
        form.setFieldsValue({
          tenantId: subscription.tenantId,
          planId: subscription.planId,
          startAt: subscription.startAt ? dayjs(subscription.startAt) : undefined,
          endAt: subscription.endAt ? dayjs(subscription.endAt) : undefined,
          status: subscription.status,
          paymentTxHash: subscription.paymentTxHash
        })
      } else {
        form.setFieldsValue({
          startAt: dayjs()
        })
      }
    }
  }, [visible, mode, subscription, form])

  return (
    <Modal
      title={mode === 'create' ? '创建租户计划订阅' : '编辑租户计划订阅'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={createSubscriptionMutation.isPending || updateSubscriptionMutation.isPending}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          label="租户"
          name="tenantId"
          rules={[
            { required: true, message: '请选择租户' }
          ]}
        >
          <Select 
            placeholder="请选择租户" 
            disabled={mode === 'edit'}
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {tenants.map((tenant: any) => (
              <Option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.code})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="计划"
          name="planId"
          rules={[
            { required: true, message: '请选择计划' }
          ]}
        >
          <Select 
            placeholder="请选择计划"
            disabled={mode === 'edit'}
            onChange={handlePlanChange}
          >
            {plans.map(plan => (
              <Option key={plan.id} value={plan.id}>
                {plan.name} ({plan.type} - {plan.durationMonths}个月 - {plan.priceUSDT} USDT)
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="开始时间"
          name="startAt"
          rules={[
            { required: true, message: '请选择开始时间' }
          ]}
        >
          <DatePicker 
            style={{ width: '100%' }}
            showTime
            placeholder="请选择开始时间"
            onChange={handleStartTimeChange}
          />
        </Form.Item>

        <Form.Item
          label="结束时间"
          name="endAt"
        >
          <DatePicker 
            style={{ width: '100%' }}
            showTime
            placeholder="将根据计划自动计算"
            disabled={mode === 'create'}
          />
        </Form.Item>

        <Form.Item
          label="支付交易哈希"
          name="paymentTxHash"
          rules={[
            { pattern: /^0x[a-fA-F0-9]{64}$/, message: '请输入有效的交易哈希' }
          ]}
        >
          <Input placeholder="请输入支付交易哈希（可选）" />
        </Form.Item>

        {mode === 'edit' && (
          <Form.Item
            label="状态"
            name="status"
            rules={[
              { required: true, message: '请选择状态' }
            ]}
          >
            <Select placeholder="请选择状态">
              {SUBSCRIPTION_STATUS_OPTIONS.map(status => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}

export default TenantPlanSubscriptionModal 