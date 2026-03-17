import React, { useState } from 'react'
import { Modal, Button, Descriptions, Divider, Transfer, Tabs, Tag, Collapse, Space } from 'antd'
import type { Key } from 'antd/es/table/interface'
import { User } from '@shared/types/user'
import { AdminRole } from '@shared/types/role'
import { Permission } from '@shared/types/permission'
import { Status } from '@shared/types'
import { prepareTransferData } from '../utils'

interface UserRoleAssignmentModalProps {
  visible: boolean
  user: User | null
  allRoles: AdminRole[]
  userRoles: AdminRole[]
  targetKeys: string[]
  loading: boolean
  onClose: () => void
  onSubmit: () => void
  onTargetKeysChange: (targetKeys: string[]) => void
  onViewPermissions?: (roleId: number) => Promise<Permission[]>
}

/**
 * 用户角色分配模态框组件
 */
const UserRoleAssignmentModal: React.FC<UserRoleAssignmentModalProps> = ({
  visible,
  user,
  allRoles,
  userRoles,
  targetKeys,
  loading,
  onClose,
  onSubmit,
  onTargetKeysChange,
  onViewPermissions
}) => {
  const [rolePermissions, setRolePermissions] = useState<Record<number, Permission[]>>({})
  const [loadingPermissions, setLoadingPermissions] = useState<Record<number, boolean>>({})

  if (!user) return null

  const transferData = prepareTransferData(allRoles)

  const handleTargetKeysChange = (newTargetKeys: Key[]) => {
    onTargetKeysChange(newTargetKeys.map(key => key.toString()))
  }

  const handleViewRolePermissions = async (roleId: number) => {
    if (!onViewPermissions || rolePermissions[roleId]) return

    setLoadingPermissions(prev => ({ ...prev, [roleId]: true }))
    try {
      const permissions = await onViewPermissions(roleId)
      setRolePermissions(prev => ({ ...prev, [roleId]: permissions }))
    } catch (error) {
      console.error('获取角色权限失败:', error)
    } finally {
      setLoadingPermissions(prev => ({ ...prev, [roleId]: false }))
    }
  }

  const renderRoleItem = (role: AdminRole) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
        {role.role_name}
        {role.is_system && <Tag color="orange" style={{ marginLeft: 8 }}>系统角色</Tag>}
        {!role.is_active && <Tag color="red" style={{ marginLeft: 8 }}>已禁用</Tag>}
      </div>
      <div style={{ color: '#666', fontSize: '12px', marginBottom: 4 }}>
        {role.description || '无描述'}
      </div>
      {onViewPermissions && (
        <Button
          size="small"
          type="link"
          loading={loadingPermissions[role.id]}
          onClick={() => handleViewRolePermissions(role.id)}
          style={{ padding: 0, height: 'auto' }}
        >
          查看权限
        </Button>
      )}
      {rolePermissions[role.id] && (
        <div style={{ marginTop: 8 }}>
          <Space wrap>
            {rolePermissions[role.id].map(permission => (
              <Tag key={permission.id}>
                {permission.permission_name}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </div>
  )

  const tabItems = [
    {
      key: 'assign',
      label: '角色分配',
      children: (
        <div>
          <Transfer
            dataSource={transferData}
            targetKeys={targetKeys}
            onChange={handleTargetKeysChange}
            render={item => `${item.title} - ${item.description}`}
            titles={['可用角色', '已分配角色']}
            showSearch
            filterOption={(inputValue, option) =>
              option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
              option.description.toLowerCase().includes(inputValue.toLowerCase())
            }
            style={{ width: '100%' }}
            listStyle={{
              width: 350,
              height: 300,
            }}
          />
          
          <div style={{ marginTop: 16, fontSize: '12px', color: '#999' }}>
            提示：左侧选择需要分配的角色，点击右箭头添加到右侧；右侧显示已分配的角色，点击左箭头可以移除。
          </div>
        </div>
      )
    },
    {
      key: 'current',
      label: `当前角色 (${userRoles.length})`,
      children: (
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {userRoles.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
              该用户暂无分配任何角色
            </div>
          ) : (
            <Collapse ghost>
              {userRoles.map(role => (
                <Collapse.Panel
                  key={role.id}
                  header={renderRoleItem(role)}
                  showArrow={false}
                >
                  {/* 角色详细信息可以在这里展示 */}
                </Collapse.Panel>
              ))}
            </Collapse>
          )}
        </div>
      )
    }
  ]

  return (
    <Modal
      title="用户角色分配"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={onSubmit}
        >
          保存
        </Button>
      ]}
    >
      <div>
        <Descriptions column={2} size="small" style={{ marginBottom: 16 }} bordered>
          <Descriptions.Item label="用户名">{user.userName}</Descriptions.Item>
          <Descriptions.Item label="全名">
            {user.fullName || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={user.status === Status.ACTIVE ? 'green' : 'red'}>
              {user.status === Status.ACTIVE ? '正常' : '已停用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="超级管理员" span={2}>
            <Tag color={user.isSuperAdmin ? 'gold' : 'default'}>
              {user.isSuperAdmin ? '是' : '否'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
        
        <Divider>角色管理</Divider>
        
        <Tabs defaultActiveKey="assign" items={tabItems} />
      </div>
    </Modal>
  )
}

export default UserRoleAssignmentModal