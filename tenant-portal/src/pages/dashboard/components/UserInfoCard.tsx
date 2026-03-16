import React from 'react'
import { Avatar, Badge, Card, Typography } from 'antd'
import {
  ClockCircleOutlined,
  CrownOutlined,
  SafetyOutlined,
  UserOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { TenantFullDetail } from '@shared/types'

const { Text, Title } = Typography

interface UserInfoCardProps {
  tenant: TenantFullDetail
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ tenant }) => {
  const statusText = tenant.status === 1 ? '正常' : '异常'
  const statusTone = tenant.status === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'

  const detailItems = [
    {
      label: '账户状态',
      value: statusText,
      icon: <SafetyOutlined />,
      tone: statusTone
    },
    {
      label: '登录次数',
      value: `${tenant.loginCount || 0} 次`,
      icon: <CrownOutlined />,
      tone: 'bg-sky-100 text-sky-800'
    },
    {
      label: '最后登录',
      value: tenant.lastLoginAt ? dayjs(tenant.lastLoginAt).format('YYYY-MM-DD HH:mm') : '从未登录',
      icon: <ClockCircleOutlined />,
      tone: 'bg-slate-100 text-slate-700'
    }
  ]

  return (
    <Card
      bordered={false}
      className="overflow-hidden rounded-[30px] border border-[#dbe6f2] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_52%,#eef6ff_100%)] shadow-[0_18px_46px_rgba(15,23,42,0.07)]"
      bodyStyle={{ padding: 0 }}
    >
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden px-6 py-6 md:px-8 md:py-7">
          <div className="absolute right-[-70px] top-[-50px] h-36 w-36 rounded-full bg-sky-100/70" />
          <div className="relative flex items-center gap-5">
            <Badge color={tenant.status === 1 ? '#10b981' : '#ef4444'} offset={[-8, 78]}>
              <Avatar
                size={88}
                icon={<UserOutlined />}
                className="!bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] shadow-[0_16px_36px_rgba(29,78,216,0.22)]"
              />
            </Badge>

            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.3em] text-sky-700/60">Tenant Identity</div>
              <Title level={3} className="!mb-1 !mt-2 !text-[28px] !font-semibold !tracking-tight !text-slate-900">
                {tenant.name || '未命名租户'}
              </Title>
              <Text className="block truncate !text-sm !text-slate-500">{tenant.email || '暂无邮箱信息'}</Text>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone}`}>{statusText}</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                  订阅 {tenant.computedStatus || '未知'}
                </span>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800">
                  剩余 {tenant.daysRemaining || 0} 天
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-slate-200/80 bg-white/80 px-6 py-6 md:px-8 lg:border-l lg:border-t-0">
          {detailItems.map(item => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-[20px] border border-slate-200/80 bg-white px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{item.value}</div>
                </div>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-medium ${item.tone}`}>Live</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default UserInfoCard
