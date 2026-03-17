import React from 'react'
import {
  BellOutlined,
  DashboardOutlined,
  DownloadOutlined,
  FileTextOutlined,
  SettingOutlined,
  SwapOutlined,
  UploadOutlined,
  WalletOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate()

  const actions = [
    {
      title: '数字钱包',
      caption: '资产与地址总览',
      icon: <WalletOutlined />,
      accent: 'from-[#0f766e] to-[#14b8a6]',
      path: '/wallets/list'
    },
    {
      title: '充值流水',
      caption: '入账处理记录',
      icon: <DownloadOutlined />,
      accent: 'from-[#166534] to-[#4ade80]',
      path: '/history/deposits'
    },
    {
      title: '提现管理',
      caption: '出账执行跟踪',
      icon: <UploadOutlined />,
      accent: 'from-[#b45309] to-[#f59e0b]',
      path: '/history/withdrawals'
    },
    {
      title: '归集控制',
      caption: '任务与配置入口',
      icon: <SwapOutlined />,
      accent: 'from-[#1d4ed8] to-[#60a5fa]',
      path: '/collection/configs'
    },
    {
      title: '余额预警',
      caption: '规则与触发记录',
      icon: <BellOutlined />,
      accent: 'from-[#be185d] to-[#f472b6]',
      path: '/wallets/monitor'
    },
    {
      title: '交易记录',
      caption: '统一检索明细',
      icon: <FileTextOutlined />,
      accent: 'from-[#0f172a] to-[#475569]',
      path: '/transactions/list'
    },
    {
      title: '系统设置',
      caption: '租户资料与偏好',
      icon: <SettingOutlined />,
      accent: 'from-[#334155] to-[#94a3b8]',
      path: '/settings/profile'
    },
    {
      title: '统计面板',
      caption: '返回数据中心',
      icon: <DashboardOutlined />,
      accent: 'from-[#7c2d12] to-[#fb7185]',
      path: '/dashboard'
    }
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map(action => (
        <button
          key={action.title}
          type="button"
          onClick={() => navigate(action.path)}
          className="group relative min-h-[108px] overflow-hidden rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-left shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_36px_rgba(15,23,42,0.10)]"
        >
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${action.accent}`} />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 pr-1">
              <div className="text-sm font-semibold text-slate-900">{action.title}</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">{action.caption}</div>
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${action.accent} text-lg text-white transition-transform duration-300 group-hover:scale-110`}>
              {action.icon}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export default QuickActionsCard
