import React, { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { HotWalletDetail, WithdrawalLimitSettingsModal } from './components'
import type { HotWallet } from '@shared/types'

const HotWalletDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [settingsWallet, setSettingsWallet] = useState<HotWallet | null>(null)

  if (!id) {
    return <Navigate to="/hot-wallets/list" replace />
  }

  return (
    <>
      <HotWalletDetail
        walletId={id}
        onSettings={(wallet) => setSettingsWallet(wallet)}
        onBack={() => window.history.back()}
      />

      <WithdrawalLimitSettingsModal
        open={!!settingsWallet}
        wallet={settingsWallet}
        onClose={() => setSettingsWallet(null)}
      />
    </>
  )
}

export default HotWalletDetailPage
