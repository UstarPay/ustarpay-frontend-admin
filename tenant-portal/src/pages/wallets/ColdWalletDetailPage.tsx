import React from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { ColdWalletDetail } from './components'

const ColdWalletDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <Navigate to="/cold-wallets/list" replace />
  }

  return (
    <ColdWalletDetail
      walletId={id}
      onEdit={(wallet) => {
        // 跳转到编辑页面或打开编辑模态框
        console.log('编辑冷钱包:', wallet)
      }}
      onSettings={(walletId) => {
        // 跳转到设置页面
        console.log('设置冷钱包:', walletId)
      }}
      onBack={() => {
        // 返回列表页面
        window.history.back()
      }}
    />
  )
}

export default ColdWalletDetailPage
