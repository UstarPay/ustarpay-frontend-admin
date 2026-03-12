import React, { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Switch, Select, message } from 'antd'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import rbacApi from '@/services/apis/rbacApi'
import { 
  Permission, 
  CreatePermissionRequest, 
  UpdatePermissionRequest 
} from '@shared/types/permission'

const { Option } = Select

interface PermissionModalProps {
  visible: boolean
  onCancel: () => void
  permission?: Permission
  mode: 'create' | 'edit'
  preselectedModuleId?: number
}

const PermissionModal: React.FC<PermissionModalProps> = ({
  visible,
  onCancel,
  permission,
  mode,
  preselectedModuleId
}) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // 获取权限模块列表
  const { data: permissionModules = [] } = useQuery({
    queryKey: ['permission-modules'],
    queryFn: () => rbacApi.permission.getPermissionModules(),
    enabled: visible
  })

  // 创建权限mutation
  const createPermissionMutation = useMutation({
    mutationFn: (data: CreatePermissionRequest) => rbacApi.permission.createPermission(data),
    onSuccess: () => {
      message.success('权限创建成功')
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      onCancel()
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(`创建失败: ${error.message}`)
    }
  })

  // 更新权限mutation
  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePermissionRequest }) => 
      rbacApi.permission.updatePermission(id, data),
    onSuccess: () => {
      message.success('权限更新成功')
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
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
        createPermissionMutation.mutate(values)
      } else if (mode === 'edit' && permission) {
        updatePermissionMutation.mutate({ id: permission.id, data: values })
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 当模态框打开时，设置表单初始值
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && permission) {
        form.setFieldsValue({
          module_id: permission.module_id,
          permission_name: permission.permission_name,
          permission_code: permission.permission_code,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
          sort_order: permission.sort_order,
          is_active: permission.is_active
        })
      } else {
        form.setFieldsValue({
          module_id: preselectedModuleId,
          sort_order: 1,
          is_active: true
        })
      }
    }
  }, [visible, mode, permission, preselectedModuleId, form])

  return (
    <Modal
      title={mode === 'create' ? '创建权限' : '编辑权限'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={createPermissionMutation.isPending || updatePermissionMutation.isPending}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          label="权限模块"
          name="module_id"
          rules={[
            { required: true, message: '请选择权限模块' }
          ]}
        >
          <Select placeholder="请选择权限模块" allowClear>
            {permissionModules.map(module => (
              <Option key={module.id} value={module.id}>
                {module.module_name} ({module.module_code})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="权限名称"
          name="permission_name"
          rules={[
            { required: true, message: '请输入权限名称' },
            { min: 2, max: 50, message: '权限名称长度为2-50个字符' }
          ]}
        >
          <Input placeholder="请输入权限名称" />
        </Form.Item>

        <Form.Item
          label="权限代码"
          name="permission_code"
          rules={[
            { required: true, message: '请输入权限代码' },
            { pattern: /^[a-zA-Z][a-zA-Z0-9_:]*$/, message: '权限代码必须以字母开头，只能包含字母、数字、下划线和冒号' }
          ]}
        >
          <Input placeholder="请输入权限代码，如：rbac:permissions:create" />
        </Form.Item>

        <Form.Item
          label="资源"
          name="resource"
          rules={[
            { max: 100, message: '资源长度不能超过100个字符' }
          ]}
        >
          <Input placeholder="请输入资源路径或API端点" />
        </Form.Item>

        <Form.Item
          label="操作"
          name="action"
          rules={[
            { max: 20, message: '操作长度不能超过20个字符' }
          ]}
        >
          <Select placeholder="请选择操作类型" allowClear>
            <Option value="create">create</Option>
            <Option value="read">read</Option>
            <Option value="update">update</Option>
            <Option value="delete">delete</Option>
            <Option value="execute">execute</Option>
          </Select>
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
            placeholder="请输入权限描述" 
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

export default PermissionModal 