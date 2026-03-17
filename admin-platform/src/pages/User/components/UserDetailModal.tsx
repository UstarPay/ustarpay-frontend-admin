import React, { useState, useEffect } from 'react'
import { Modal, Button, Descriptions, Tag, Space, Tabs, List, Spin, Alert, Typography } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, SafetyOutlined, KeyOutlined, LockOutlined } from '@ant-design/icons'
import { User } from '@shared/types/user'
import { Permission } from '@shared/types/permission'
import { AdminRole } from '@shared/types/role'
import { getStatusInfo, formatLastLoginTime } from '../utils'
import rbacApi from '@/services/apis/rbacApi'

const { Text } = Typography

interface UserDetailModalProps {
  visible: boolean
  user: User | null
  onClose: () => void
}

/**
 * 用户详情模态框组件
 */
const UserDetailModal: React.FC<UserDetailModalProps> = ({
  visible,
  user,
  onClose
}) => {
  const [userPermissions, setUserPermissions] = useState<Permission[]>([])
  const [userRoles, setUserRoles] = useState<AdminRole[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [permissionsError, setPermissionsError] = useState<string | null>(null)

  useEffect(() => {
    if (visible && user) {
      fetchUserRoles()
      fetchUserPermissions()
    }
  }, [visible, user])

  const fetchUserRoles = async () => {
    if (!user) return
    
    setLoadingRoles(true)
    try {
      const roles = await rbacApi.userRole.getUserRoles(user.id)
      setUserRoles(roles)
    } catch (error) {
      console.error('获取用户角色失败:', error)
    } finally {
      setLoadingRoles(false)
    }
  }

  const fetchUserPermissions = async () => {
    if (!user) return
    
    setLoadingPermissions(true)
    setPermissionsError(null)
    try {
      const permissions = await rbacApi.permission.getUserPermissions(user.id)
      setUserPermissions(permissions)
    } catch (error) {
      console.error('获取用户权限失败:', error)
      setPermissionsError('获取权限信息失败')
    } finally {
      setLoadingPermissions(false)
    }
  }

  if (!user) return null

  const statusInfo = getStatusInfo(user.status)
  const IconComponent = statusInfo.iconType === 'check' ? CheckCircleOutlined : CloseCircleOutlined

  // 按模块分组权限
  const groupedPermissions = userPermissions.reduce((groups, permission) => {
    const moduleId = permission.module_id
    const moduleName = permission.module?.module_name || `模块 ${moduleId}`
    
    if (!groups[moduleName]) {
      groups[moduleName] = []
    }
    groups[moduleName].push(permission)
    return groups
  }, {} as Record<string, Permission[]>)

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="用户ID">{user.id}</Descriptions.Item>
          
          <Descriptions.Item label="用户名">{user.userName}</Descriptions.Item>
          
          <Descriptions.Item label="全名">
            {user.fullName || '未设置'}
          </Descriptions.Item>
          
          <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
          
          <Descriptions.Item label="超级管理员">
            {user.isSuperAdmin ? 
              <Tag color="red" icon={<SafetyOutlined />}>是</Tag> : 
              <Tag>否</Tag>
            }
          </Descriptions.Item>
          
          <Descriptions.Item label="状态">
            <Tag color={statusInfo.color}>
              <IconComponent style={{ marginRight: 4 }} />
              {statusInfo.text}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="角色">
            {user.roleNames ? (
              <Space wrap>
                {user.roleNames.split(',').map((roleName, index) => (
                  <Tag key={index} color="blue">
                    <SafetyOutlined /> {roleName.trim()}
                  </Tag>
                ))}
              </Space>
            ) : (
              <span style={{ color: '#999' }}>未分配角色</span>
            )}
          </Descriptions.Item>
          
          <Descriptions.Item label="权限数量">
            <Tag color="purple">{user.permissionCount} 个</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="登录次数">
            <Tag color="geekblue">{user.loginCount || 0} 次</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="最后登录时间">
            {user.lastLoginAt ? (
              <div>
                <div>{formatLastLoginTime(user.lastLoginAt)}</div>
                {user.lastLoginIp && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: 4 }}>
                    IP: {user.lastLoginIp}
                  </div>
                )}
              </div>
            ) : (
              <span style={{ color: '#999' }}>从未登录</span>
            )}
          </Descriptions.Item>
          
          <Descriptions.Item label="密码修改时间">
            {user.passwordChangedAt ? (
              formatLastLoginTime(user.passwordChangedAt)
            ) : (
              <span style={{ color: '#999' }}>从未修改</span>
            )}
          </Descriptions.Item>
          
          <Descriptions.Item label="创建时间">
            {new Date(user.createdAt).toLocaleString()}
          </Descriptions.Item>
          
          <Descriptions.Item label="更新时间">
            {new Date(user.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'roles',
      label: `角色信息 (${userRoles.length})`,
      children: (
        <Spin spinning={loadingRoles}>
          {userRoles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              <SafetyOutlined style={{ fontSize: '24px', marginBottom: 16 }} />
              <div>该用户暂无分配任何角色</div>
            </div>
          ) : (
            <List
              dataSource={userRoles}
              renderItem={(role) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<SafetyOutlined style={{ color: role.is_system ? '#faad14' : '#52c41a', fontSize: '20px' }} />}
                    title={
                      <Space>
                        <Text strong>{role.role_name}</Text>
                        <Tag color="blue">{role.role_code}</Tag>
                        {role.is_system && <Tag color="orange">系统角色</Tag>}
                        {!role.is_active && <Tag color="red">已禁用</Tag>}
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          {role.description || '无描述'}
                        </div>
                        <div>
                          <Tag color="purple">
                            {role.permissions?.length || 0} 个权限
                          </Tag>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            创建时间：{new Date(role.created_at).toLocaleString()}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      )
    },
    {
      key: 'permissions',
      label: `权限详情 (${userPermissions.length})`,
      children: (
        <Spin spinning={loadingPermissions}>
          {permissionsError ? (
            <Alert
              message="获取权限信息失败"
              description={permissionsError}
              type="error"
              showIcon
              action={
                <Button size="small" onClick={fetchUserPermissions}>
                  重试
                </Button>
              }
            />
          ) : userPermissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              <LockOutlined style={{ fontSize: '24px', marginBottom: 16 }} />
              <div>该用户暂无任何权限</div>
            </div>
          ) : (
            <div>
              {Object.entries(groupedPermissions).map(([moduleName, permissions]) => (
                <div key={moduleName} style={{ marginBottom: 24 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '16px', 
                    marginBottom: 12,
                    borderBottom: '1px solid #f0f0f0',
                    paddingBottom: 8
                  }}>
                    <KeyOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    {moduleName} ({permissions.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {permissions.map((permission) => (
                      <Tag
                        key={permission.id}
                        color={permission.is_active ? 'blue' : 'default'}
                        style={{ marginBottom: 8 }}
                      >
                        <div style={{ fontSize: '12px' }}>
                          <div style={{ fontWeight: 'bold' }}>{permission.permission_name}</div>
                          <div style={{ opacity: 0.8 }}>{permission.permission_code}</div>
                          {permission.action && (
                            <div style={{ fontSize: '10px', marginTop: 2 }}>
                              {permission.action}
                            </div>
                          )}
                        </div>
                      </Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Spin>
      )
    }
  ]

  return (
    <Modal
      title={`用户详情 - ${user.userName}`}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      <Tabs defaultActiveKey="basic" items={tabItems} />
    </Modal>
  )
}

export default UserDetailModal 