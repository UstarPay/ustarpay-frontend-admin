import { Status } from '@shared/types'
import { AdminRole } from '@shared/types/role'

/**
 * 用户相关工具函数
 */

interface StatusInfo {
  color: string
  text: string
  iconType: 'check' | 'close'
}

/**
 * 获取用户状态对应的颜色和文本
 */
export const getStatusInfo = (status: Status): StatusInfo => {
  switch (status) {
    case Status.ACTIVE:
      return { color: 'green', text: '正常', iconType: 'check' }
    case Status.INACTIVE:
      return { color: 'gray', text: '未激活', iconType: 'close' }
    case Status.DELETED:
      return { color: 'red', text: '已停用', iconType: 'close' }
    default:
      return { color: 'default', text: '未知', iconType: 'close' }
  }
}

/**
 * 获取用户头像颜色
 */
export const getUserAvatarColor = (status: Status): string => {
  return status === Status.ACTIVE ? '#f56a00' : '#1890ff'
}

/**
 * 格式化最后登录时间
 */
export const formatLastLoginTime = (lastLoginAt?: string): string => {
  if (!lastLoginAt) return '从未登录'
  return new Date(lastLoginAt).toLocaleString()
}

/**
 * 准备角色穿梭框数据
 */
export const prepareTransferData = (roles: AdminRole[]) => {
  return roles.map(role => ({
    key: role.id.toString(),
    title: role.role_name,
    description: role.description || '无描述'
  }))
}

/**
 * 格式化用户显示名称
 */
export const getUserDisplayName = (user: any): string => {
  return user.fullName || user.userName
}

/**
 * 格式化角色状态标签
 */
export const getRoleStatusTag = (role: AdminRole) => {
  if (!role.is_active) {
    return { color: 'red', text: '已禁用' }
  }
  if (role.is_system) {
    return { color: 'orange', text: '系统角色' }
  }
  return { color: 'green', text: '正常' }
}