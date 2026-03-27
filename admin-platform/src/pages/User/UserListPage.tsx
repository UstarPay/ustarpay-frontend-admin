import React, { useState } from 'react'
import { Card, Typography, Alert, Input, Select, Button } from 'antd'
import { Helmet } from 'react-helmet-async'
import { UserTable, UserDetailModal, UserRoleAssignmentModal } from './components'
import { useUserManagement } from './hooks'

const { Title } = Typography

const { Search } = Input
/**
 * 用户管理页面 - 重构后的简洁版本
 * 负责协调各个子组件，业务逻辑委托给自定义Hook和组件
 */
const UserListPage: React.FC = () => {
  // 模态框状态
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false)

  // 使用自定义Hook管理业务逻辑
  const {
    // 数据
    users,
    allRoles,
    selectedUser,
    transferTargetKeys,
    userRoles,

    // 状态
    usersLoading,
    usersError,
    isAssigningRoles,

    // 操作函数
    selectUser,
    assignRoles,
    clearSelection,
    setTransferTargetKeys,
    handlePageChange,
    fetchRolePermissions,

    // 权限检查
    hasPermission
  } = useUserManagement()

  // 处理查看用户详情
  const handleViewUser = async (user: any) => {
    await selectUser(user)
    setIsDetailModalVisible(true)
  }

  // 处理角色分配
  const handleAssignRoles = async (user: any) => {
    await selectUser(user)
    setIsRoleModalVisible(true)
  }

  // 关闭详情模态框
  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false)
    clearSelection()
  }

  // 关闭角色分配模态框
  const handleCloseRoleModal = () => {
    setIsRoleModalVisible(false)
    clearSelection()
  }

  // 提交角色分配
  const handleSubmitRoleAssignment = () => {
    assignRoles()
    setIsRoleModalVisible(false)
  }

  // 权限检查
  if (!hasPermission('user:list')) {
    return (
      <>
        <Helmet>
          <title>用户管理 - U卡服务管理系统</title>
        </Helmet>
        <Alert
          message="权限不足"
          description="您没有权限查看用户列表"
          type="warning"
          showIcon
        />
      </>
    )
  }

  // 错误处理
  if (usersError) {
    return (
      <>
        <Helmet>
          <title>用户管理 - U卡服务管理系统</title>
        </Helmet>
        <Alert
          message="加载失败"
          description="无法加载用户列表，请检查网络连接或联系管理员。"
          type="error"
          showIcon
        />
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>用户管理 - U卡服务管理系统</title>
      </Helmet>

      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <Title level={2}>用户管理</Title>
        </div>
         
        {/* 用户表格 */}
        <Card>
          <UserTable
            users={users || { items: [], total: 0, page: 1, pageSize: 10 }}
            loading={usersLoading}
            onViewUser={handleViewUser}
            onAssignRoles={handleAssignRoles}
            onPageChange={handlePageChange}
            hasPermission={hasPermission}
          />
        </Card>

        {/* 用户详情模态框 */}
        <UserDetailModal
          visible={isDetailModalVisible}
          user={selectedUser}
          onClose={handleCloseDetailModal}
        />

        {/* 角色分配模态框 */}
        <UserRoleAssignmentModal
          visible={isRoleModalVisible}
          user={selectedUser}
          allRoles={allRoles}
          userRoles={userRoles}
          targetKeys={transferTargetKeys}
          loading={isAssigningRoles}
          onClose={handleCloseRoleModal}
          onSubmit={handleSubmitRoleAssignment}
          onTargetKeysChange={setTransferTargetKeys}
          onViewPermissions={fetchRolePermissions}
        />
      </div>
    </>
  )
}

export default UserListPage
