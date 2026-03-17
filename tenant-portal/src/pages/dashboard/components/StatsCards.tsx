import React from 'react'
import {
  ArrowUpOutlined,
  SafetyCertificateOutlined,
  TransactionOutlined,
  WalletOutlined
} from '@ant-design/icons'
import type { DashboardData } from '@/services'

function formatVolume(value: string | number | undefined): string {
  if (value === undefined || value === null) return '0.00000000'
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (isNaN(num)) return '0.00000000'
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8
  })
}

interface StatsCardsProps {
  stats: DashboardData
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const wallets = stats?.wallets ?? { totalWallets: 0, activeWallets: 0 }
  const transactions = stats?.transactions ?? {
    totalTransactions: 0,
    successTransactions: 0,
    volumeStats: { totalVolume: '0' }
  }

  const cards = [
    {
      title: '钱包基座',
      value: Number(wallets.totalWallets ?? 0),
      helper: `${Number(wallets.activeWallets ?? 0)} 个活跃钱包`,
      accent: 'from-[#0f766e] via-[#14b8a6] to-[#5eead4]',
      icon: <WalletOutlined />
    },
    {
      title: '交易吞吐',
      value: Number(transactions.totalTransactions ?? 0),
      helper: `${Number(transactions.successTransactions ?? 0)} 笔已完成`,
      accent: 'from-[#1d4ed8] via-[#3b82f6] to-[#93c5fd]',
      icon: <TransactionOutlined />
    },
    {
      title: '资产体量',
      value: formatVolume(transactions.volumeStats?.totalVolume ?? '0'),
      helper: '累计链上资产流转',
      accent: 'from-[#b45309] via-[#f59e0b] to-[#fcd34d]',
      icon: <ArrowUpOutlined />
    },
    {
      title: '安全等级',
      value: `${Math.round(([stats.tenant.hasPassword, stats.tenant.hasSecondaryPassword, stats.tenant.has2FA].filter(Boolean).length / 3) * 100)}%`,
      helper: '账户保护覆盖度',
      accent: 'from-[#111827] via-[#334155] to-[#94a3b8]',
      icon: <SafetyCertificateOutlined />
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(card => (
        <div
          key={card.title}
          className="group relative overflow-hidden rounded-[26px] border border-white/70 bg-white/92 p-5 shadow-[0_20px_44px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1"
        >
          <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`} />
          <div className="absolute right-[-26px] top-[-30px] h-24 w-24 rounded-full bg-slate-100/70 transition-transform duration-300 group-hover:scale-110" />

          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{card.title}</div>
              <div className="mt-4 text-[30px] font-semibold tracking-tight text-slate-900">{card.value}</div>
              <div className="mt-2 text-sm text-slate-500">{card.helper}</div>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-lg text-white shadow-lg`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards
