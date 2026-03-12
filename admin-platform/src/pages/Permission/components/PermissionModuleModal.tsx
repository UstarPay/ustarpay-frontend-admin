import React, { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Switch, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import rbacApi from '@/services/apis/rbacApi'
import { 
  PermissionModule, 
  CreatePermissionModuleRequest, 
  UpdatePermissionModuleRequest 
} from '@shared/types/permission'

interface PermissionModuleModalProps {
  visible: boolean
  onCancel: () => void
  module?: PermissionModule
  mode: 'create' | 'edit'
}

const PermissionModuleModal: React.FC<PermissionModuleModalProps> = ({
  visible,
  onCancel,
  module,
  mode
}) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // 创建权限模块mutation
  const createModuleMutation = useMutation({
    mutationFn: (data: CreatePermissionModuleRequest) => rbacApi.permission.createPermissionModule(data),
    onSuccess: () => {
      message.success('权限模块创建成功')
      queryClient.invalidateQueries({ queryKey: ['permission-modules'] })
      onCancel()
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(`创建失败: ${error.message}`)
    }
  })

  // 更新权限模块mutation
  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePermissionModuleRequest }) => 
      rbacApi.permission.updatePermissionModule(id, data),
    onSuccess: () => {
      message.success('权限模块更新成功')
      queryClient.invalidateQueries({ queryKey: ['permission-modules'] })
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
        createModuleMutation.mutate(values)
      } else if (mode === 'edit' && module) {
        updateModuleMutation.mutate({ id: module.id, data: values })
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 当模态框打开时，设置表单初始值
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && module) {
        form.setFieldsValue({
          module_name: module.module_name,
          module_code: module.module_code,
          description: module.description,
          sort_order: module.sort_order,
          is_active: module.is_active
        })
      } else {
        form.setFieldsValue({
          sort_order: 1,
          is_active: true
        })
      }
    }
  }, [visible, mode, module, form])

  return (
    <Modal
      title={mode === 'create' ? '创建权限模块' : '编辑权限模块'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={createModuleMutation.isPending || updateModuleMutation.isPending}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          label="模块名称"
          name="module_name"
          rules={[
            { required: true, message: '请输入模块名称' },
            { min: 2, max: 50, message: '模块名称长度为2-50个字符' }
          ]}
        >
          <Input placeholder="请输入模块名称" />
        </Form.Item>

        <Form.Item
          label="模块代码"
          name="module_code"
          rules={[
            { required: true, message: '请输入模块代码' },
            { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '模块代码必须以字母开头，只能包含字母、数字和下划线' }
          ]}
        >
          <Input placeholder="请输入模块代码" />
        </Form.Item>

        <Form.Item
          label="描述"
          name="description"
          rules={[
            { max: 200, message: '描述长度不能超过200个字符' }
          ]}
        >
          <Input.TextArea 
            rows={3} 
            placeholder="请输入模块描述" 
            showCount 
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          label="排序"
          name="sort_order"
          rules={[
            { required: true, message: '请输入排序值' },
            { type: 'number', min: 1, max: 999, message: '排序值范围为1-999' }
          ]}
        >
          <InputNumber 
            min={1} 
            max={999} 
            placeholder="请输入排序值" 
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="启用状态"
          name="is_active"
          valuePropName="checked"
          rules={[
            { required: true, message: '请选择启用状态' }
          ]}
        >
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default PermissionModuleModal 