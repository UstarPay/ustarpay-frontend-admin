import React from 'react'
import { Tag } from 'antd'

export const cardStatusLabelMap: Record<number, { label: string; color: string; helper: string }> = {
  0: { label: '未激活', color: 'default', helper: '卡片尚未激活，暂不可用于消费' },
  1: { label: '已激活', color: 'success', helper: '卡片已激活，可正常使用' },
  2: { label: '已冻结', color: 'blue', helper: '卡片已被冻结，暂时不可使用' },
  3: { label: '已终止', color: 'volcano', helper: '卡片已终止，不可继续使用' },
  4: { label: '已注销', color: 'default', helper: '卡片申请或卡片状态已取消' },
  99: { label: '待审核', color: 'gold', helper: '卡片仍在审核或待处理阶段' },
}

const transactionTypeMap: Record<string, { label: string; desc: string }> = {
  AUTHORIZATION: { label: '交易授权', desc: '台账主单为授权阶段记录' },
  SETTLEMENT: { label: '资金结算', desc: '台账主单为结算阶段记录' },
  SYNC: { label: '交易同步', desc: '台账主单由上游同步通知驱动更新' },
  CARD_TRANSACTION: { label: '交易通知', desc: '卡交易 webhook 通知记录' },
  AUTH: { label: '交易授权', desc: '兼容旧枚举的授权阶段记录' },
  PURCHASE: { label: '消费授权', desc: '上游消费授权交易' },
  PRESENTMENT: { label: '结算请款', desc: '上游请款结算交易' },
  CAPTURE: { label: '消费结算', desc: '上游结算入账交易' },
  REVERSAL: { label: '冲正撤销', desc: '交易发生冲正或撤销' },
  REFUND: { label: '退款交易', desc: '原交易发生退款' },
}

const transactionStatusMap: Record<string, { label: string; color: string; desc: string }> = {
  AUTH_APPROVED: { label: '授权通过', color: 'success', desc: '授权已通过；若上游事件仍为“同步授权写入”，表示仅完成本地授权与冻结，尚未收到上游交易回调' },
  AUTH_REJECTED: { label: '授权拒绝', color: 'error', desc: '授权已被拒绝，本次交易未通过' },
  SETTLEMENT_PENDING: { label: '待结算', color: 'processing', desc: '交易已进入待结算阶段' },
  SETTLED: { label: '已结算', color: 'default', desc: '交易已完成最终结算' },
  EXCEPTION: { label: '异常', color: 'volcano', desc: '交易存在异常，需要人工关注' },
  PENDING: { label: '处理中', color: 'processing', desc: '交易通知已接收，仍在处理中' },
  APPROVED: { label: '已批准', color: 'success', desc: '上游通知状态为已批准' },
  UNKNOWN: { label: '未知', color: 'default', desc: '未识别的交易状态' },
}

const reconcileStatusMap: Record<string, { label: string; color: string; desc: string }> = {
  MATCHED: { label: '已匹配', color: 'success', desc: '授权与结算金额一致' },
  AMOUNT_MISMATCH: { label: '金额不一致', color: 'gold', desc: '授权金额与结算金额存在差异' },
  AUTH_MISSING: { label: '授权缺失', color: 'volcano', desc: '收到结算或交易通知时未找到授权主单' },
  PENDING: { label: '待核对', color: 'processing', desc: '交易尚未完成最终对账' },
}

const cardFlowTypeMap: Record<string, { label: string; color: string; desc: string }> = {
  HOLD: { label: '授权冻结', color: 'processing', desc: '收到授权后冻结对应卡额度' },
  SETTLE: { label: '结算确认', color: 'success', desc: '结算确认后核销已冻结额度' },
  RELEASE: { label: '差额释放', color: 'gold', desc: '结算金额小于授权金额，释放差额' },
  ADJUST: { label: '补扣调整', color: 'volcano', desc: '结算金额大于授权金额，补扣差额' },
  REVERSE: { label: '冲正回退', color: 'default', desc: '交易被冲正或执行回退处理' },
}

const reconcileDiffTypeMap: Record<string, { label: string; color: string; desc: string }> = {
  AUTH_MISSING: { label: '授权缺失', color: 'volcano', desc: '未找到对应授权交易' },
  AMOUNT_MISMATCH: { label: '金额不一致', color: 'gold', desc: '授权金额与结算金额不一致' },
  OVER_SETTLEMENT: { label: '超额结算', color: 'red', desc: '结算金额高于授权金额且超出可补扣范围' },
}

const reconcileDiffStatusMap: Record<string, { label: string; color: string; desc: string }> = {
  OPEN: { label: '待处理', color: 'error', desc: '差异尚未人工确认' },
  RESOLVED: { label: '已处理', color: 'success', desc: '差异已完成处理闭环' },
}

const providerEventMap: Record<string, { label: string; desc: string }> = {
  SYNC_AUTH: { label: '同步授权写入', desc: '该记录由我方同步授权接口直接写入，表示本地已完成授权决策；若授权通过，资金已冻结，但这不代表已收到上游交易 webhook' },
  CARD_STATUS_CHANGE: { label: '卡状态变更', desc: '卡片状态发生变更时的通知事件' },
  CARD_DELIVERY: { label: '卡配送通知', desc: '卡片配送、物流状态更新通知' },
  CARD_SETTING: { label: '卡设置通知', desc: '卡片设置、限额、自动扣款等变更通知' },
  CARD_TRANSACTION: { label: '上游交易回调更新', desc: '该记录已经收到并处理了上游 CARD_TRANSACTION 回调，可能是授权结果、结算、撤销或退款等交易状态推进' },
}

const providerTransactionTypeMap: Record<string, { label: string; desc: string }> = {
  AUTHORIZATION: { label: '授权交易', desc: '授权阶段交易。若上游事件为“同步授权写入”，表示本地授权写入；若为“上游交易回调更新”，表示已收到上游授权结果回调' },
  PRESENTMENT: { label: '结算请款', desc: '上游原始交易类型为请款结算' },
  PURCHASE: { label: '消费授权', desc: '标准化后的消费授权交易' },
  CAPTURE: { label: '消费结算', desc: '标准化后的结算入账交易' },
  REVERSAL: { label: '冲正撤销', desc: '授权或结算发生冲正撤销' },
  REFUND: { label: '退款交易', desc: '原交易发生退款' },
}

const providerTransactionStateMap: Record<string, { label: string; desc: string }> = {
  APPROVED: { label: '已批准', desc: '上游原始状态为批准通过' },
  DECLINED: { label: '已拒绝', desc: '上游原始状态为拒绝' },
  PENDING: { label: '处理中', desc: '上游交易仍在处理中' },
  SETTLED: { label: '已结算', desc: '上游原始状态为已结算' },
  REVERSED: { label: '已冲正', desc: '上游交易已冲正或撤回' },
  REFUNDED: { label: '已退款', desc: '上游交易已退款' },
  AUTHORIZED: { label: '已授权', desc: '标准化后的授权通过状态' },
  DENIED: { label: '授权拒绝', desc: '标准化后的授权拒绝状态' },
  CAPTURED: { label: '已入账', desc: '标准化后的结算入账状态' },
}

function normalizeMappingKey(value?: string) {
  if (!value) return ''
  return value.trim().toUpperCase().replace(/[\s-]+/g, '_')
}

export function getCardStatusMeta(status: number, fallback?: string, cardMaterial?: number) {
  if (status === 99 && cardMaterial === 2) {
    return {
      label: '待激活',
      color: 'gold',
      helper: '实体卡已绑定成功，等待用户完成激活',
    }
  }
  return cardStatusLabelMap[status] || { label: `状态 ${status}`, color: 'default', helper: fallback || '未知状态' }
}

export function getTransactionTypeLabel(type?: string) {
  if (!type) return '-'
  const normalizedType = normalizeMappingKey(type)
  return transactionTypeMap[normalizedType]?.label || `其他类型 (${type})`
}

export function getTransactionTypeMeta(type?: string) {
  if (!type) return { label: '-', desc: '' }
  const normalizedType = normalizeMappingKey(type)
  return transactionTypeMap[normalizedType] || { label: `其他类型 (${type})`, desc: '未纳入当前已确认的交易类型映射，请结合原始 type 排查' }
}

export function getTransactionStatusMeta(status?: string) {
  if (!status) return { label: '-', color: 'default', desc: '' }
  const normalizedStatus = normalizeMappingKey(status)
  return transactionStatusMap[normalizedStatus] || { label: `未知状态 (${status})`, color: 'default', desc: '请结合原始上游状态码排查' }
}

export function getReconcileStatusMeta(status?: string) {
  if (!status) return { label: '-', color: 'default', desc: '' }
  const normalizedStatus = normalizeMappingKey(status)
  return reconcileStatusMap[normalizedStatus] || { label: `未知状态 (${status})`, color: 'default', desc: '请结合原始对账状态码排查' }
}

export function getCardFlowTypeMeta(type?: string) {
  if (!type) return { label: '-', color: 'default', desc: '' }
  const normalizedType = normalizeMappingKey(type)
  return cardFlowTypeMap[normalizedType] || { label: `未知类型 (${type})`, color: 'default', desc: '请结合原始流水类型排查' }
}

export function getReconcileDiffTypeMeta(type?: string) {
  if (!type) return { label: '-', color: 'default', desc: '' }
  const normalizedType = normalizeMappingKey(type)
  return reconcileDiffTypeMap[normalizedType] || { label: `未知类型 (${type})`, color: 'default', desc: '请结合原始差异类型排查' }
}

export function getReconcileDiffStatusMeta(status?: string) {
  if (!status) return { label: '-', color: 'default', desc: '' }
  const normalizedStatus = normalizeMappingKey(status)
  return reconcileDiffStatusMap[normalizedStatus] || { label: `未知状态 (${status})`, color: 'default', desc: '请结合原始状态码排查' }
}

export function getProviderEventMeta(event?: string) {
  if (!event) return { label: '-', desc: '' }
  const normalizedEvent = normalizeMappingKey(event)
  return providerEventMap[normalizedEvent] || { label: `其他事件 (${event})`, desc: '未纳入当前已确认事件映射，请结合原始 event 排查' }
}

export function getProviderTransactionTypeMeta(type?: string) {
  if (!type) return { label: '-', desc: '' }
  const normalizedType = normalizeMappingKey(type)
  return (
    providerTransactionTypeMap[normalizedType] || {
      label: `其他类型 (${type})`,
      desc: '未纳入当前已确认的上游交易类型映射，请结合原始 type 排查',
    }
  )
}

export function getProviderTransactionStateMeta(state?: string) {
  if (!state) return { label: '-', desc: '' }
  const normalizedState = normalizeMappingKey(state)
  return (
    providerTransactionStateMap[normalizedState] || {
      label: `其他状态 (${state})`,
      desc: '未纳入当前已确认的上游交易状态映射，请结合原始 state 排查',
    }
  )
}

export function renderMappedTag(label: string, color: string, raw?: string) {
  return <Tag color={color}>{raw && raw !== label ? `${label} (${raw})` : label}</Tag>
}
