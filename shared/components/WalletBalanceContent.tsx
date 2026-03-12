import React from 'react'
import { Table, Tag } from 'antd'
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

// 格式化USDT价值
const formatUSDTValue = (value?: string) => {
  if (!value) return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  return `$${num.toFixed(2)}`
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

  // 资产详情表格列定义
  const balanceColumns = [
    {
      title: '区块链',
      dataIndex: 'chainCode',
      key: 'chainCode',
      width: 100,
      render: (chainCode: string) => (
        <Tag color="purple">{chainCode}</Tag>
      )
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 100,
      render: (currency: string) => (
        <Tag color="blue">{currency.toUpperCase()}</Tag>
      )
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 150,
      render: (balance: string, record: any) => (
        <span className="font-semibold text-green-600">
          {formatBalance(balance, record.currency)}
        </span>
      )
    }, {
      title: '冻结余额',
      dataIndex: 'frozenBalance',
      key: 'frozenBalance',
      width: 150,
      render: (frozenBalance: string, record: any) => (
        <span className="font-semibold text-red-600">
          {formatBalance(frozenBalance, record.currency)}
        </span>
      )
    },
    {
      title: '区块高度',
      dataIndex: 'lastBlockHeight',
      key: 'lastBlockHeight',
      width: 120,
      render: (height: string) => (
        <span className="text-gray-600 font-mono">
          {height === '0' ? '-' : parseInt(height).toLocaleString()}
        </span>
      )
    },
    {
      title: 'USD价值',
      dataIndex: 'usdtValue',
      key: 'usdtValue',
      width: 100,
      render: (value: string) => (
        <span className="font-medium text-gray-700">
          {formatUSDTValue(value)}
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
        请选择钱包查看资产详情
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 钱包基本信息 */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <span className="text-gray-600">钱包地址：</span>
          <span className="font-mono text-sm">{wallet.wallet?.address || '未生成'}</span>
        </div>
        <div>
          <span className="text-gray-600">状态：</span>
          <Tag color={wallet.wallet?.status === 1 ? 'green' : 'red'}>
            {wallet.wallet?.status === 1 ? '正常' : '禁用'}
          </Tag>
        </div>
        <div>
          <span className="text-gray-600">描述：</span>
          <span>{wallet.wallet?.description || '-'}</span>
        </div>
        <div>
          <span className="text-gray-600">创建时间：</span>
          <span>
            {wallet.wallet?.createdAt 
              ? new Date(wallet.wallet.createdAt).toLocaleString('zh-CN') 
              : '-'
            }
          </span>
        </div>
      </div>

      {/* 资产详情表格 */}
      <div>
        <h4 className="text-lg font-medium mb-3">资产详情</h4>
        <Table
          columns={balanceColumns}
          dataSource={balanceData}
          rowKey={(record) => `${record.chainCode}-${record.currency}`}
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
        />
      </div>
    </div>
  )
}

export default WalletBalanceContent
