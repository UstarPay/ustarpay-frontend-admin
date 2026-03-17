import React from 'react'
import { Modal, Button } from 'antd'
import { ExclamationCircleOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons'

export interface ConfirmDialogProps {
  visible: boolean
  title?: string
  content?: React.ReactNode
  type?: 'confirm' | 'warning' | 'danger'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  icon?: React.ReactNode
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title = '确认操作',
  content = '您确定要执行此操作吗？',
  type = 'confirm',
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  loading = false,
  icon,
}) => {
  const getIcon = () => {
    if (icon) return icon
    
    switch (type) {
      case 'danger':
        return <DeleteOutlined className="text-red-500" />
      case 'warning':
        return <WarningOutlined className="text-yellow-500" />
      default:
        return <ExclamationCircleOutlined className="text-blue-500" />
    }
  }

  const getConfirmButtonProps = () => {
    switch (type) {
      case 'danger':
        return { danger: true }
      case 'warning':
        return { type: 'primary' as const, className: 'bg-yellow-500 hover:bg-yellow-600' }
      default:
        return { type: 'primary' as const }
    }
  }

  return (
    <Modal
      open={visible}
      title={
        <div className="flex items-center gap-2">
          {getIcon()}
          <span>{title}</span>
        </div>
      }
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>,
        <Button
          key="confirm"
          loading={loading}
          onClick={onConfirm}
          {...getConfirmButtonProps()}
        >
          {confirmText}
        </Button>,
      ]}
      centered
      destroyOnClose
    >
      <div className="py-4">
        {typeof content === 'string' ? (
          <p className="text-gray-600">{content}</p>
        ) : (
          content
        )}
      </div>
    </Modal>
  )
}

// 使用 Modal.confirm 的简化版本
export const showConfirmDialog = (props: Omit<ConfirmDialogProps, 'visible'>) => {
  const { title, content, onConfirm, onCancel, type = 'confirm' } = props

  return Modal.confirm({
    title,
    content,
    icon: type === 'danger' ? <DeleteOutlined /> : <ExclamationCircleOutlined />,
    okText: props.confirmText || '确定',
    cancelText: props.cancelText || '取消',
    okType: type === 'danger' ? 'danger' : 'primary',
    onOk: onConfirm,
    onCancel: onCancel,
    centered: true,
  })
}
