import React, { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Select, Switch, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import tenantPlanService from '@/services/apis/tenantPlanApi'
import { 
  TenantPlan, 
  CreateTenantPlanRequest, 
  UpdateTenantPlanRequest,
  TENANT_PLAN_TYPES,
  TENANT_PLAN_STATUS_OPTIONS
} from '@shared/types/tenantPlan'

const { Option } = Select
const { TextArea } = Input

interface TenantPlanModalProps {
  visible: boolean
  onCancel: () => void
  plan?: TenantPlan
  mode: 'create' | 'edit'
}

const TenantPlanModal: React.FC<TenantPlanModalProps> = ({
  visible,
  onCancel,
  plan,
  mode
}) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // 创建租户计划mutation
  const createPlanMutation = useMutation({
    mutationFn: (data: CreateTenantPlanRequest) => tenantPlanService.plan.createTenantPlan(data),
    onSuccess: () => {
      message.success('租户计划创建成功')
      queryClient.invalidateQueries({ queryKey: ['tenant-plans'] })
      onCancel()
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(`创建失败: ${error.message}`)
    }
  })

  // 更新租户计划mutation
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantPlanRequest }) => 
      tenantPlanService.plan.updateTenantPlan(id, data),
    onSuccess: () => {
      message.success('租户计划更新成功')
      queryClient.invalidateQueries({ queryKey: ['tenant-plans'] })
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
      
      if (mode === 'create') {
        createPlanMutation.mutate(values)
      } else if (mode === 'edit' && plan) {
        updatePlanMutation.mutate({ id: plan.id, data: values })
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 当模态框打开时，设置表单初始值
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && plan) {
        form.setFieldsValue({
          name: plan.name,
          type: plan.type,
          durationMonths: plan.durationMonths,
          walletLimit: plan.walletLimit,
          currencyLimit: plan.currencyLimit,
          rateLimitPerMinute: plan.rateLimitPerMinute,
          priceUSDT: plan.priceUSDT,
          status: plan.status
        })
      } else {
        form.setFieldsValue({
          type: 'standard',
          durationMonths: 12,
          priceUSDT: '0',
          status: 1
        })
      }
    }
  }, [visible, mode, plan, form])

  return (
    <Modal
      title={mode === 'create' ? '创建租户计划' : '编辑租户计划'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={createPlanMutation.isPending || updatePlanMutation.isPending}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          label="计划名称"
          name="name"
          rules={[
            { required: true, message: '请输入计划名称' },
            { min: 2, max: 100, message: '计划名称长度为2-100个字符' }
          ]}
        >
          <Input placeholder="请输入计划名称" />
        </Form.Item>

        <Form.Item
          label="计划类型"
          name="type"
          rules={[
            { required: true, message: '请选择计划类型' }
          ]}
        >
          <Select placeholder="请选择计划类型" disabled={mode === 'edit'}>
            {TENANT_PLAN_TYPES.map(type => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="持续月数"
          name="durationMonths"
          rules={[
            { required: true, message: '请输入持续月数' },
            { type: 'number', min: 1, max: 120, message: '持续月数范围为1-120个月' }
          ]}
        >
          <InputNumber 
            min={1} 
            max={120} 
            placeholder="请输入持续月数" 
            style={{ width: '100%' }}
            addonAfter="个月"
          />
        </Form.Item>

        <Form.Item
          label="钱包数量限制"
          name="walletLimit"
          rules={[
            { type: 'number', min: 1, message: '钱包数量必须大于0' }
          ]}
        >
          <InputNumber 
            min={1} 
            placeholder="请输入钱包数量限制，留空表示无限制" 
            style={{ width: '100%' }}
            addonAfter="个"
          />
        </Form.Item>

        <Form.Item
          label="货币数量限制"
          name="currencyLimit"
          rules={[
            { type: 'number', min: 1, message: '货币数量必须大于0' }
          ]}
        >
          <InputNumber 
            min={1} 
            placeholder="请输入货币数量限制，留空表示无限制" 
            style={{ width: '100%' }}
            addonAfter="种"
          />
        </Form.Item>

        <Form.Item
          label="每分钟请求速率限制"
          name="rateLimitPerMinute"
          rules={[
            { type: 'number', min: 1, message: '请求速率必须大于0' }
          ]}
        >
          <InputNumber 
            min={1} 
            placeholder="请输入每分钟请求速率限制，留空表示无限制" 
            style={{ width: '100%' }}
            addonAfter="次/分钟"
          />
        </Form.Item>

        <Form.Item
          label="USDT价格"
          name="priceUSDT"
          rules={[
            { required: true, message: '请输入USDT价格' },
            { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的价格' }
          ]}
        >
          <Input 
            placeholder="请输入USDT价格" 
            addonAfter="USDT"
          />
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
              {TENANT_PLAN_STATUS_OPTIONS.map(status => (
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

export default TenantPlanModal 