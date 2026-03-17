import React from 'react'
import { Modal, Button } from 'antd'
import { SafetyCertificateOutlined, WalletOutlined } from '@ant-design/icons'
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
  width = 820
}) => {
  const assetCount = wallet?.balanceByChain
    ? Object.values(wallet.balanceByChain).reduce((sum, chainData) => {
      if (!chainData || typeof chainData !== 'object') {
        return sum
      }
      return sum + Object.keys(chainData).filter(symbol => symbol !== 'unknown').length
    }, 0)
    : 0

  const modalTitle = title || (
    <div className="flex items-center justify-between gap-4 pr-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
          <WalletOutlined />
        </div>
        <div>
          <div className="text-base font-semibold text-slate-900">
            {wallet?.wallet?.name || '未命名钱包'}
          </div>
          <div className="text-xs text-slate-500">钱包资产详情</div>
        </div>
      </div>
      <div className="hidden rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right md:block">
        <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-600">资产项</div>
        <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <SafetyCertificateOutlined />
          <span>{assetCount}</span>
        </div>
      </div>
    </div>
  )

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={onClose}
      width={width}
      centered
      className="wallet-balance-modal"
      styles={{
        body: { paddingTop: 8, paddingBottom: 12, maxHeight: '62vh', overflowY: 'auto' },
        header: { paddingBottom: 8 },
        footer: { paddingTop: 8 }
      }}
      footer={[
        <Button key="close" size="large" className="rounded-xl" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      <WalletBalanceContent wallet={wallet} />
    </Modal>
  )
}

export default WalletBalanceModal
