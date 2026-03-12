import React from 'react'
import { Badge, Tag } from 'antd'
import {
  Status,
  WalletStatus,
  TransactionStatus,
} from '../types'

interface StatusBadgeProps {
  status: Status | WalletStatus | TransactionStatus | string
  type?: 'badge' | 'tag'
  size?: 'small' | 'default'
  className?: string
}

/**
 * 状态徽章组件
 * 根据不同的状态显示对应的颜色和文本
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'tag',
  size = 'default',
  className,
}) => {
  // 获取状态配置
  const getStatusConfig = (status: Status | WalletStatus | TransactionStatus | string) => {
    // 租户状态（字符串值）
    if (status === Status.ACTIVE) return { color: 'green', text: '正常', status: 'success' as const }
    if (status === Status.INACTIVE) return { color: 'red', text: '禁用', status: 'error' as const }
    if (status === Status.DELETED) return { color: 'volcano', text: '暂停', status: 'error' as const }

    // 交易状态（字符串值）
    if (status === TransactionStatus.PENDING) return { color: 'orange', text: '待处理', status: 'warning' as const }
    if (status === TransactionStatus.CONFIRMED) return { color: 'green', text: '已确认', status: 'success' as const }
    if (status === TransactionStatus.FAILED) return { color: 'red', text: '失败', status: 'error' as const }
    if (status === TransactionStatus.CANCELLED) return { color: 'gray', text: '取消', status: 'default' as const }

    // 数字值状态处理
    if (status === 1) {
      // 可能是 UserStatus.ACTIVE, WalletStatus.ACTIVE, 或 AddressStatus.ACTIVE
      return { color: 'green', text: '正常', status: 'success' as const }
    }
    if (status === 0) {
      // 可能是 UserStatus.INACTIVE, WalletStatus.INACTIVE, 或 AddressStatus.INACTIVE
      return { color: 'red', text: '禁用', status: 'error' as const }
    }
    if (status === -1) {
      // 可能是 UserStatus.LOCKED, WalletStatus.FROZEN, 或 AddressStatus.COMPROMISED
      return { color: 'volcano', text: '锁定/冻结/泄露', status: 'error' as const }
    }

    // 默认情况
    return { color: 'default', text: String(status), status: 'default' as const }
  }

  const config = getStatusConfig(status)

  if (type === 'badge') {
    return (
      <Badge
        status={config.status}
        text={config.text}
        className={className}
      />
    )
  }

  return (
    <Tag
      color={config.color}
      className={`${size === 'small' ? 'text-xs px-1' : ''} ${className}`}
    >
      {config.text}
    </Tag>
  )
}

export default StatusBadge
