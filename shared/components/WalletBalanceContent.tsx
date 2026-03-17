import React from 'react'
import { Table, Tag, Typography } from 'antd'
import {
  BankOutlined,
  CalendarOutlined,
  CopyOutlined,
  DeploymentUnitOutlined,
  WalletOutlined
} from '@ant-design/icons'
import { WalletWithBalance } from '../types'

interface WalletBalanceContentProps {
  wallet: WalletWithBalance | null
  className?: string
}

// 格式化余额显示
const formatBalance = (balance: string, currency: string) => {
  const num = parseFloat(balance)
  if (isNaN(num)) return '0'
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M ${currency}`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K ${currency}`
  } else {
    return `${num.toFixed(6)} ${currency}`
  }
}

/**
 * 钱包余额内容组件
 * 只负责展示内容，不包含Modal包装
 * 可以在Modal、页面、卡片等任何地方使用
 */
const WalletBalanceContent: React.FC<WalletBalanceContentProps> = ({
  wallet,
  className = ''
}) => {
  // 从balanceByChain中提取资产数据
  const balanceData = React.useMemo(() => {
    if (!wallet?.balanceByChain || Object.keys(wallet.balanceByChain).length === 0) {
      return []
    }
    
    return Object.entries(wallet.balanceByChain).flatMap(([chainCode, chainData]) => {
      if (chainData && typeof chainData === 'object') {
        return Object.entries(chainData)
          .filter(([symbol]) => symbol !== 'unknown')
          .map(([symbol, balanceData]) => ({
            chainCode,
            currency: symbol,
            balance: balanceData?.balance || '0',
            frozenBalance: balanceData?.frozenBalance || '0',
            lastBlockHeight: balanceData?.lastBlockHeight || '0',
            usdtValue: '0',
            change24h: '0'
          }))
      }
      return []
    })
  }, [wallet?.balanceByChain])
  const summary = React.useMemo(() => {
    const chainCount = new Set(balanceData.map(item => item.chainCode)).size
    const assetCount = balanceData.length
    const totalAvailable = balanceData.reduce((sum, item) => {
      const num = Number(item.balance)
      return Number.isFinite(num) ? sum + num : sum
    }, 0)

    return {
      chainCount,
      assetCount,
      totalAvailable
    }
  }, [balanceData])

  // 资产详情表格列定义
  const balanceColumns = [
    {
      title: '区块链',
      dataIndex: 'chainCode',
      key: 'chainCode',
      width: 100,
      render: (chainCode: string) => (
        <Tag color="purple" className="rounded-full px-3 py-1 text-xs">{chainCode}</Tag>
      )
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 100,
      render: (currency: string) => (
        <Tag color="blue" className="rounded-full px-3 py-1 text-xs">{currency.toUpperCase()}</Tag>
      )
    },
    {
      title: '链上余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 150,
      render: (balance: string, record: any) => (
        <span className="font-semibold text-emerald-600">
          {formatBalance(balance, record.currency)}
        </span>
      )
    },
    // {
    //   title: '24h变化',
    //   dataIndex: 'change24h',
    //   key: 'change24h',
    //   width: 100,
    //   render: (change: string) => {
    //     if (!change) return '-'
    //     const num = parseFloat(change)
    //     const isPositive = num >= 0
    //     return (
    //       <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
    //         {isPositive ? '+' : ''}{num.toFixed(2)}%
    //       </span>
    //     )
    //   }
    // }
  ]

  if (!wallet) {
    return (
      <div className={`text-center text-gray-500 py-8 ${className}`}>
        请选择钱包查看详情
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-5 text-white">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-100/80">地址信息</div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                {wallet.wallet?.address ? (
                  <Typography.Text
                    copyable={{
                      text: wallet.wallet.address,
                      icon: [<CopyOutlined key="copy" />, <CopyOutlined key="copied" />],
                      tooltips: ['复制地址', '已复制'],
                    }}
                    className="font-mono text-sm !text-white"
                  >
                    {wallet.wallet.address}
                  </Typography.Text>
                ) : (
                  <span className="font-mono text-sm text-white/70">未生成</span>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div className="flex items-center justify-between text-xs text-cyan-100/70">
                  <span>支持网络</span>
                  <DeploymentUnitOutlined />
                </div>
                <div className="mt-2 text-2xl font-semibold">{summary.chainCount}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div className="flex items-center justify-between text-xs text-cyan-100/70">
                  <span>资产项</span>
                  <BankOutlined />
                </div>
                <div className="mt-2 text-2xl font-semibold">{summary.assetCount}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div className="flex items-center justify-between text-xs text-cyan-100/70">
                  <span>余额汇总</span>
                  <WalletOutlined />
                </div>
                <div className="mt-2 text-2xl font-semibold">{summary.totalAvailable.toFixed(6)}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl bg-white px-4 py-4 text-slate-800 shadow-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">状态</div>
              <div className="mt-2">
                <Tag color={wallet.wallet?.status === 1 ? 'green' : 'red'} className="rounded-full px-3 py-1 text-xs font-medium">
                  {wallet.wallet?.status === 1 ? '正常' : '禁用'}
                </Tag>
              </div>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4 text-slate-800 shadow-sm">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                <CalendarOutlined />
                <span>创建时间</span>
              </div>
              <div className="mt-2 text-sm font-medium text-slate-700">
                {wallet.wallet?.createdAt
                  ? new Date(wallet.wallet.createdAt).toLocaleString('zh-CN')
                  : '-'}
              </div>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4 text-slate-800 shadow-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">备注</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                {wallet.wallet?.description || '暂无描述信息'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h4 className="mb-1 text-lg font-semibold text-slate-900">资产明细</h4>
            <div className="text-sm text-slate-500">按网络与币种查看链上可用余额</div>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            共 {balanceData.length} 项
          </div>
        </div>
        <Table
          columns={balanceColumns}
          dataSource={balanceData}
          rowKey={(record) => `${record.chainCode}-${record.currency}`}
          pagination={false}
          size="middle"
          scroll={{ x: 600 }}
        />
      </div>
    </div>
  )
}

export default WalletBalanceContent
