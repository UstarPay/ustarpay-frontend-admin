import React from 'react'
import { Empty, Button } from 'antd'
import { EmptyProps } from 'antd/es/empty'

export interface EmptyStateProps extends Omit<EmptyProps, 'children'> {
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
  icon?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = '暂无数据',
  description,
  actionText,
  onAction,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 mb-1">
              {title}
            </div>
            {description && (
              <div className="text-sm text-gray-500">
                {description}
              </div>
            )}
          </div>
        }
        {...props}
      >
        {actionText && onAction && (
          <Button type="primary" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  )
}
