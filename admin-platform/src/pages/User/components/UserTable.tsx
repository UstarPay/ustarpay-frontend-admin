import React from 'react'
import { Table, Space, Avatar, Typography, Tag, Badge, Tooltip, Button } from 'antd'
import { UserOutlined, EyeOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { Status } from '@shared/types'
import { User, UserList } from '@shared/types/user'
import { getStatusInfo, getUserAvatarColor, formatLastLoginTime } from '../utils'

const { Text } = Typography

interface UserTableProps {
  users: UserList
  loading: boolean
  onViewUser: (user: User) => void
  onAssignRoles: (user: User) => void
  onPageChange?: (page: number, pageSize: number) => void
  hasPermission: (permission: string) => boolean
}

/**
 * 用户表格组件
 */
const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  onViewUser,
  onAssignRoles,
  onPageChange,
  hasPermission
}) => {
  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left'
    },
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      fixed: 'left',
      render: (_, record: User) => (
        <Space>
          <Avatar 
            size="small" 
            icon={<UserOutlined />} 
            style={{ backgroundColor: getUserAvatarColor(record.status) }}
          />
          <div>
            <div>
              <Text strong>{record.fullName || record.userName}</Text>
              {record.isSuperAdmin && (
                <Tag color="red" style={{ marginLeft: 4 }}>超级管理员</Tag>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>@{record.userName}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true
    },
    {
      title: '角色',
      key: 'roles',
      width: 200,
      render: (_, record: User) => (
        <div>
          {record.roleNames ? (
            <Space wrap>
              {record.roleNames.split(',').map((roleName, index) => (
                <Tag key={index} color="blue">
                  {roleName.trim()}
                </Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">未分配角色</Text>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: Status) => {
        const statusInfo = getStatusInfo(status)
        const IconComponent = statusInfo.iconType === 'check' ? CheckCircleOutlined : CloseCircleOutlined
        return (
          <Badge 
            status={status === Status.ACTIVE ? 'success' : status === Status.DELETED ? 'error' : 'default'}
            text={
              <span>
                <IconComponent style={{ marginRight: 4 }} />
                {statusInfo.text}
              </span>
            }
          />
        )
      }
    },
    {
      title: '最后登录',
      key: 'lastLogin',
      width: 180,
      render: (_, record: User) => (
        <div>
          {record.lastLoginAt ? (
            <>
              <div>{formatLastLoginTime(record.lastLoginAt)}</div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.lastLoginIp}
              </Text>
            </>
          ) : (
            <Text type="secondary">从未登录</Text>
          )}
        </div>
      )
    },
    {
      title: '登录次数',
      dataIndex: 'loginCount',
      key: 'loginCount',
      width: 100,
      render: (count: number = 0) => (
        <Tag color="geekblue">{count} 次</Tag>
      )
    },
    {
      title: '权限数量',
      dataIndex: 'permissionCount',
      key: 'permissionCount',
      width: 100,
      render: (count: number = 0) => (
        <Tag color="purple">{count} 个</Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (text: string) => new Date(text).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: User) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onViewUser(record)}
            />
          </Tooltip>
          {hasPermission('user:assign-role') && (
            <Tooltip title="分配角色">
              <Button
                type="text"
                icon={<TeamOutlined />}
                onClick={() => onAssignRoles(record)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  return (
    <Table
      columns={columns}
      dataSource={users.items}
      rowKey="id"
      loading={loading}
      scroll={{ x: 1500, y: 600 }}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => 
          `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        total: users.total,
        current: users.page,
        pageSize: users.pageSize,
        pageSizeOptions: ['10', '20', '50', '100'],
        onChange: onPageChange,
        onShowSizeChange: onPageChange
      }}
    />
  )
}

export default UserTable 