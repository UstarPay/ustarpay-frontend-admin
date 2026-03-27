import React, { useState } from 'react'
import { Card, Typography, Alert, Table, Tag, Collapse, Space, Button, Input, Select, Modal, message, Dropdown, Menu } from 'antd'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons'
import rbacApi from '@/services/apis/rbacApi'
import { useAuthStore } from '@/stores/authStore'
import { PermissionModule, Permission } from '@shared/types/permission'
import PermissionModuleModal from './components/PermissionModuleModal'
import PermissionModal from './components/PermissionModal'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

/**
 * 权限管理页面
 */
const PermissionListPage: React.FC = () => {
  const { hasPermission } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedModuleId, setSelectedModuleId] = useState<number | undefined>()
  const [searchText, setSearchText] = useState<string>('')
  
  // 模态框状态
  const [moduleModalVisible, setModuleModalVisible] = useState(false)
  const [moduleModalMode, setModuleModalMode] = useState<'create' | 'edit'>('create')
  const [selectedModule, setSelectedModule] = useState<PermissionModule | undefined>()
  
  const [permissionModalVisible, setPermissionModalVisible] = useState(false)
  const [permissionModalMode, setPermissionModalMode] = useState<'create' | 'edit'>('create')
  const [selectedPermission, setSelectedPermission] = useState<Permission | undefined>()
  const [preselectedModuleId, setPreselectedModuleId] = useState<number | undefined>()

  // 获取权限模块列表
  const {
    data: permissionModules = [],
    isLoading: modulesLoading,
    error: modulesError,
    refetch: refetchModules
  } = useQuery({
    queryKey: ['permission-modules'],
    queryFn: () => rbacApi.permission.getPermissionModules(),
    enabled: hasPermission('rbac:modules:list')
  })

  // 获取权限列表
  const {
    data: permissions = [],
    isLoading: permissionsLoading,
    error: permissionsError,
    refetch: refetchPermissions
  } = useQuery({
    queryKey: ['permissions', selectedModuleId],
    queryFn: () => rbacApi.permission.getPermissions(selectedModuleId),
    enabled: hasPermission('rbac:permissions:list')
  })

  // 删除权限模块mutation
  const deleteModuleMutation = useMutation({
    mutationFn: (id: number) => rbacApi.permission.deletePermissionModule(id),
    onSuccess: () => {
      message.success('权限模块删除成功')
      queryClient.invalidateQueries({ queryKey: ['permission-modules'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
    },
    onError: (error: any) => {
      message.error(`删除失败: ${error.message}`)
    }
  })

  // 删除权限mutation
  const deletePermissionMutation = useMutation({
    mutationFn: (id: number) => rbacApi.permission.deletePermission(id),
    onSuccess: () => {
      message.success('权限删除成功')
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
    },
    onError: (error: any) => {
      message.error(`删除失败: ${error.message}`)
    }
  })

  // 权限检查
  if (!hasPermission('rbac:modules:list') && !hasPermission('rbac:permissions:list')) {
    return (
      <>
        <Helmet>
          <title>权限管理 - U卡服务管理系统</title>
        </Helmet>
        <Alert
          message="权限不足"
          description="您没有权限查看权限信息"
          type="warning"
          showIcon
        />
      </>
    )
  }

  // 错误处理
  if (modulesError || permissionsError) {
    return (
      <>
        <Helmet>
          <title>权限管理 - U卡服务管理系统</title>
        </Helmet>
        <Alert
          message="加载失败"
          description="无法加载权限信息，请检查网络连接或联系管理员。"
          type="error"
          showIcon
        />
      </>
    )
  }

  // 权限表格列定义
  const permissionColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left' as const
    },
    {
      title: '权限名称',
      dataIndex: 'permission_name',
      key: 'permission_name',
      width: 200,
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: Permission) =>
        record.permission_name.toLowerCase().includes(value.toLowerCase()) ||
        record.permission_code.toLowerCase().includes(value.toLowerCase())
    },
    {
      title: '权限代码',
      dataIndex: 'permission_code',
      key: 'permission_code',
      width: 200,
      render: (code: string) => <Tag color="blue">{code}</Tag>
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      width: 150,
      render: (resource: string) => resource || '-'
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => {
        const actionColors: Record<string, string> = {
          create: 'green',
          read: 'blue',
          update: 'orange',
          delete: 'red',
          execute: 'purple'
        }
        return action ? <Tag color={actionColors[action] || 'default'}>{action}</Tag> : '-'
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => description || '-'
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
      key: 'operations',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Permission) => (
        <Space size="small">
          {hasPermission('rbac:permissions:update') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditPermission(record)}
            />
          )}
          {hasPermission('rbac:permissions:delete') && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeletePermission(record)}
            />
          )}
        </Space>
      )
    }
  ]

  // 模块折叠面板项
  const moduleCollapseItems = permissionModules.map((module: PermissionModule) => {
    const modulePermissions = permissions.filter(p => p.module_id === module.id)
    
    return {
      key: module.id.toString(),
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontWeight: 'bold' }}>
            {module.module_name} ({module.module_code})
          </span>
          <Space>
            <Tag color={module.is_active ? 'green' : 'red'}>
              {module.is_active ? '启用' : '禁用'}
            </Tag>
            <Tag color="blue">{modulePermissions.length} 个权限</Tag>
          </Space>
        </div>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#666' }}>
              {module.description || '无描述'}
            </div>
            <Space>
              {hasPermission('rbac:permissions:create') && (
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => handleCreatePermission(module.id)}
                >
                  添加权限
                </Button>
              )}
              {hasPermission('rbac:modules:update') && (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditModule(module)}
                >
                  编辑模块
                </Button>
              )}
              {hasPermission('rbac:modules:delete') && (
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteModule(module)}
                >
                  删除模块
                </Button>
              )}
            </Space>
          </div>
          <Table
            dataSource={modulePermissions}
            columns={permissionColumns}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 1200 }}
          />
        </div>
      )
    }
  })

  const handleRefresh = () => {
    refetchModules()
    refetchPermissions()
  }

  const handleModuleFilter = (moduleId: number | undefined) => {
    setSelectedModuleId(moduleId)
  }

  // 权限模块相关操作
  const handleCreateModule = () => {
    setModuleModalMode('create')
    setSelectedModule(undefined)
    setModuleModalVisible(true)
  }

  const handleEditModule = (module: PermissionModule) => {
    setModuleModalMode('edit')
    setSelectedModule(module)
    setModuleModalVisible(true)
  }

  const handleDeleteModule = (module: PermissionModule) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除权限模块 "${module.module_name}" 吗？删除后该模块下的所有权限也将被删除。`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        deleteModuleMutation.mutate(module.id)
      }
    })
  }

  const handleCloseModuleModal = () => {
    setModuleModalVisible(false)
    setSelectedModule(undefined)
  }

  // 权限相关操作
  const handleCreatePermission = (moduleId?: number) => {
    setPermissionModalMode('create')
    setSelectedPermission(undefined)
    setPreselectedModuleId(moduleId)
    setPermissionModalVisible(true)
  }

  const handleEditPermission = (permission: Permission) => {
    setPermissionModalMode('edit')
    setSelectedPermission(permission)
    setPermissionModalVisible(true)
  }

  const handleDeletePermission = (permission: Permission) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除权限 "${permission.permission_name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        deletePermissionMutation.mutate(permission.id)
      }
    })
  }

  const handleClosePermissionModal = () => {
    setPermissionModalVisible(false)
    setSelectedPermission(undefined)
    setPreselectedModuleId(undefined)
  }

  return (
    <>
      <Helmet>
        <title>权限管理 - U卡服务管理系统</title>
      </Helmet>

      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <Title level={2}>权限管理</Title>
          <Space>
            {hasPermission('rbac:modules:create') && (
              <Button 
                type="primary"
                icon={<PlusOutlined />} 
                onClick={handleCreateModule}
              >
                创建权限模块
              </Button>
            )}
            {hasPermission('rbac:permissions:create') && (
              <Button 
                type="primary"
                icon={<PlusOutlined />} 
                onClick={() => handleCreatePermission()}
              >
                创建权限
              </Button>
            )}
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={modulesLoading || permissionsLoading}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 筛选工具栏 */}
        <Card size="small">
          <Space wrap>
            <Search
              placeholder="搜索权限名称或代码"
              allowClear
              style={{ width: 300 }}
              onSearch={setSearchText}
              onChange={(e) => !e.target.value && setSearchText('')}
            />
            <Select
              placeholder="选择权限模块"
              allowClear
              style={{ width: 200 }}
              value={selectedModuleId}
              onChange={handleModuleFilter}
            >
              {permissionModules.map(module => (
                <Option key={module.id} value={module.id}>
                  {module.module_name}
                </Option>
              ))}
            </Select>
          </Space>
        </Card>

        {/* 按模块分组显示 */}
        <Card title="权限模块" loading={modulesLoading}>
          <Collapse
            ghost
            items={moduleCollapseItems}
            defaultActiveKey={permissionModules.map(m => m.id.toString())}
          />
        </Card>

        {/* 所有权限表格视图 */}
        <Card title="所有权限" loading={permissionsLoading}>
          <Table
            dataSource={permissions}
            columns={permissionColumns}
            rowKey="id"
            size="small"
            scroll={{ x: 1200, y: 600 }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
          />
        </Card>
      </div>

      {/* 权限模块模态框 */}
      <PermissionModuleModal
        visible={moduleModalVisible}
        onCancel={handleCloseModuleModal}
        module={selectedModule}
        mode={moduleModalMode}
      />

      {/* 权限模态框 */}
      <PermissionModal
        visible={permissionModalVisible}
        onCancel={handleClosePermissionModal}
        permission={selectedPermission}
        mode={permissionModalMode}
        preselectedModuleId={preselectedModuleId}
      />
    </>
  )
}

export default PermissionListPage
