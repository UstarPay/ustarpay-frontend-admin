import React from 'react'
import { Modal, Button } from 'antd'
import { WalletOutlined } from '@ant-design/icons'
import { WalletWithBalance } from '../types'
import WalletBalanceContent from './WalletBalanceContent'

interface WalletBalanceModalProps {
  visible: boolean
  onClose: () => void
  wallet: WalletWithBalance | null
  title?: string
  width?: number
}

/**
 * 钱包余额Modal组件
 * 包装了WalletBalanceContent，提供Modal功能
 */
const WalletBalanceModal: React.FC<WalletBalanceModalProps> = ({
  visible,
  onClose,
  wallet,
  title,
  width = 1000
}) => {
  const modalTitle = title || (
    <div className="flex items-center gap-2">
      <WalletOutlined />
      <span>{wallet?.wallet?.name || '未命名钱包'} - 资产详情</span>
    </div>
  )

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={onClose}
      width={width}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      <WalletBalanceContent wallet={wallet} />
    </Modal>
  )
}

export default WalletBalanceModal