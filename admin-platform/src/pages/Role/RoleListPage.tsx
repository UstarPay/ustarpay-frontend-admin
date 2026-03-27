import React, { useState } from 'react'
import { 
  Card, 
  Typography, 
  Alert, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Modal, 
  Form, 
  message,
  Popconfirm,
  Transfer,
  Descriptions
} from 'antd'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SafetyOutlined,
  ReloadOutlined,
  KeyOutlined
} from '@ant-design/icons'
import rbacApi from '@/services/apis/rbacApi'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { AdminRole, CreateRoleRequest, UpdateRoleRequest } from '@shared/types/role'
import { Permission } from '@shared/types/permission'

const { Title } = Typography
const { Search } = Input

/**
 * 角色管理页面
 */
const RoleListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuthStore()
  const { addNotification } = useAppStore()
  
  const [searchText, setSearchText] = useState<string>('')
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false)
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null)
  const [permissionTargetKeys, setPermissionTargetKeys] = useState<string[]>([])
  
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()

  // 获取角色列表
  const {
    data: roles = [],
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rbacApi.role.getRoles(true), // 包含禁用的角色
    enabled: hasPermission('rbac:roles:list')
  })

  // 获取所有权限
  const {
    data: allPermissions = [],
    isLoading: permissionsLoading
  } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: () => rbacApi.permission.getPermissions(),
    enabled: hasPermission('rbac:roles:create') || hasPermission('rbac:roles:update')
  })

  // 创建角色
  const createRoleMutation = useMutation({
    mutationFn: (data: CreateRoleRequest) => rbacApi.role.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setIsCreateModalVisible(false)
      createForm.resetFields()
      addNotification({
        type: 'success',
        title: '创建成功',
        message: '角色创建成功'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '创建失败',
        message: error.response?.data?.message || '角色创建失败'
      })
    }
  })

  // 更新角色
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleRequest }) => 
      rbacApi.role.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setIsEditModalVisible(false)
      setIsPermissionModalVisible(false)
      editForm.resetFields()
      setSelectedRole(null)
      addNotification({
        type: 'success',
        title: '更新成功',
        message: '角色更新成功'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '更新失败',
        message: error.response?.data?.message || '角色更新失败'
      })
    }
  })

  // 删除角色
  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => rbacApi.role.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      addNotification({
        type: 'success',
        title: '删除成功',
        message: '角色删除成功'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '删除失败',
        message: error.response?.data?.message || '角色删除失败'
      })
    }
  })

  // 权限检查
  if (!hasPermission('rbac:roles:list')) {
    return (
      <>
        <Helmet>
          <title>角色管理 - U卡服务管理系统</title>
        </Helmet>
        <Alert
          message="权限不足"
          description="您没有权限查看角色信息"
          type="warning"
          showIcon
        />
      </>
    )
  }

  // 错误处理
  if (rolesError) {
    return (
      <>
        <Helmet>
          <title>角色管理 - U卡服务管理系统</title>
        </Helmet>
        <Alert
          message="加载失败"
          description="无法加载角色信息，请检查网络连接或联系管理员。"
          type="error"
          showIcon
        />
      </>
    )
  }

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left' as const
    },
    {
      title: '角色名称',
      dataIndex: 'role_name',
      key: 'role_name',
      width: 150,
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: AdminRole) =>
        record.role_name.toLowerCase().includes(value.toLowerCase()) ||
        record.role_code.toLowerCase().includes(value.toLowerCase()),
      render: (name: string, record: AdminRole) => (
        <Space>
          <SafetyOutlined style={{ color: record.is_system ? '#faad14' : '#52c41a' }} />
          <span style={{ fontWeight: 'bold' }}>{name}</span>
        </Space>
      )
    },
    {
      title: '角色代码',
      dataIndex: 'role_code',
      key: 'role_code',
      width: 120,
      render: (code: string) => <Tag color="blue">{code}</Tag>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => description || '-'
    },
    {
      title: '权限数量',
      key: 'permission_count',
      width: 100,
      render: (_: any, record: AdminRole) => (
        <Tag color="purple">{record.permissions?.length || 0}</Tag>
      )
    },
    {
      title: '类型',
      dataIndex: 'is_system',
      key: 'is_system',
      width: 80,
      render: (isSystem: boolean) => (
        <Tag color={isSystem ? 'orange' : 'green'}>
          {isSystem ? '系统' : '自定义'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: AdminRole) => (
        <Space>
          <Button
            type="link"
            icon={<KeyOutlined />}
            onClick={() => handlePermissionAssignment(record)}
            disabled={!hasPermission('rbac:roles:update')}
          >
            权限
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={!hasPermission('rbac:roles:update') || record.is_system}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除角色 "${record.role_name}" 吗？`}
            onConfirm={() => deleteRoleMutation.mutate(record.id)}
            disabled={!hasPermission('rbac:roles:delete') || record.is_system}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={!hasPermission('rbac:roles:delete') || record.is_system}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 准备权限穿梭框数据
  const preparePermissionTransferData = () => {
    return allPermissions.map(permission => ({
      key: permission.id.toString(),
      title: permission.permission_name,
      description: `${permission.permission_code} - ${permission.description || '无描述'}`
    }))
  }

  // 处理创建角色
  const handleCreate = () => {
    setIsCreateModalVisible(true)
  }

  // 处理编辑角色
  const handleEdit = (role: AdminRole) => {
    setSelectedRole(role)
    editForm.setFieldsValue({
      role_name: role.role_name,
      role_code: role.role_code,
      description: role.description,
      is_active: role.is_active
    })
    setIsEditModalVisible(true)
  }

  // 处理权限分配
  const handlePermissionAssignment = async (role: AdminRole) => {
    try {
      const roleDetail = await rbacApi.role.getRoleById(role.id)
      setSelectedRole(roleDetail)
      setPermissionTargetKeys(roleDetail.permissions?.map(p => p.id.toString()) || [])
      setIsPermissionModalVisible(true)
    } catch (error) {
      addNotification({
        type: 'error',
        title: '获取角色详情失败',
        message: '无法获取角色权限信息'
      })
    }
  }

  // 创建角色提交
  const handleCreateSubmit = (values: any) => {
    createRoleMutation.mutate(values)
  }

  // 编辑角色提交
  const handleEditSubmit = (values: any) => {
    if (!selectedRole) return
    updateRoleMutation.mutate({
      id: selectedRole.id,
      data: values
    })
  }

  // 权限分配提交
  const handlePermissionSubmit = () => {
    if (!selectedRole) return
    updateRoleMutation.mutate({
      id: selectedRole.id,
      data: {
        permission_ids: permissionTargetKeys.map(key => parseInt(key))
      }
    })
  }

  const handleRefresh = () => {
    refetchRoles()
  }

  return (
    <>
      <Helmet>
        <title>角色管理 - U卡服务管理系统</title>
      </Helmet>

      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <Title level={2}>角色管理</Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={rolesLoading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              disabled={!hasPermission('rbac:roles:create')}
            >
              新建角色
            </Button>
          </Space>
        </div>

        {/* 筛选工具栏 */}
        <Card size="small">
          <Search
            placeholder="搜索角色名称或代码"
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
            onChange={(e) => !e.target.value && setSearchText('')}
          />
        </Card>

        {/* 角色表格 */}
        <Card title="角色列表" loading={rolesLoading}>
          <Table
            dataSource={roles}
            columns={columns}
            rowKey="id"
            scroll={{ x: 1200, y: 600 }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
          />
        </Card>

        {/* 创建角色模态框 */}
        <Modal
          title="新建角色"
          open={isCreateModalVisible}
          onCancel={() => setIsCreateModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreateSubmit}
          >
            <Form.Item
              name="role_name"
              label="角色名称"
              rules={[{ required: true, message: '请输入角色名称' }]}
            >
              <Input placeholder="请输入角色名称" />
            </Form.Item>
            <Form.Item
              name="role_code"
              label="角色代码"
              rules={[{ required: true, message: '请输入角色代码' }]}
            >
              <Input placeholder="请输入角色代码，如: admin" />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea placeholder="请输入角色描述" rows={3} />
            </Form.Item>
            <Form.Item
              name="permission_ids"
              label="权限分配"
              initialValue={[]}
            >
              <Transfer
                dataSource={preparePermissionTransferData()}
                targetKeys={[]}
                render={item => `${item.title} - ${item.description}`}
                titles={['可选权限', '已分配权限']}
                showSearch
                style={{ width: '100%' }}
                listStyle={{ width: 250, height: 300 }}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createRoleMutation.isPending}
                >
                  创建
                </Button>
                <Button onClick={() => setIsCreateModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 编辑角色模态框 */}
        <Modal
          title="编辑角色"
          open={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditSubmit}
          >
            <Form.Item
              name="role_name"
              label="角色名称"
              rules={[{ required: true, message: '请输入角色名称' }]}
            >
              <Input placeholder="请输入角色名称" />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea placeholder="请输入角色描述" rows={3} />
            </Form.Item>
            <Form.Item
              name="is_active"
              label="状态"
              valuePropName="checked"
              initialValue={true}
            >
              <input type="checkbox" /> 启用
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updateRoleMutation.isPending}
                >
                  保存
                </Button>
                <Button onClick={() => setIsEditModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 权限分配模态框 */}
        <Modal
          title={`权限分配 - ${selectedRole?.role_name}`}
          open={isPermissionModalVisible}
          onCancel={() => setIsPermissionModalVisible(false)}
          width={900}
          footer={[
            <Button key="cancel" onClick={() => setIsPermissionModalVisible(false)}>
              取消
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={updateRoleMutation.isPending}
              onClick={handlePermissionSubmit}
            >
              保存
            </Button>
          ]}
        >
          {selectedRole && (
            <div>
              <Descriptions column={2} size="small" style={{ marginBottom: 16 }} bordered>
                <Descriptions.Item label="角色名称">{selectedRole.role_name}</Descriptions.Item>
                <Descriptions.Item label="角色代码">{selectedRole.role_code}</Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>
                  {selectedRole.description || '无描述'}
                </Descriptions.Item>
              </Descriptions>
              
              <Transfer
                dataSource={preparePermissionTransferData()}
                targetKeys={permissionTargetKeys}
                                 onChange={(targetKeys) => setPermissionTargetKeys(targetKeys.map(k => k.toString()))}
                render={item => `${item.title} - ${item.description}`}
                titles={['可选权限', '已分配权限']}
                showSearch
                filterOption={(inputValue, option) =>
                  option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.description.toLowerCase().includes(inputValue.toLowerCase())
                }
                style={{ width: '100%' }}
                listStyle={{ width: 400, height: 400 }}
              />
            </div>
          )}
        </Modal>
      </div>
    </>
  )
}

export default RoleListPage
