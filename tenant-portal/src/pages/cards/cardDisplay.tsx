import React from 'react'
import { Tag } from 'antd'

export const cardStatusLabelMap: Record<number, { label: string; color: string; helper: string }> = {
  0: { label: '未激活', color: 'default', helper: '卡片未激活' },
  1: { label: '已激活', color: 'success', helper: '卡片已激活，可正常使用' },
  2: { label: '已冻结', color: 'blue', helper: '卡片已冻结，暂不可用' },
  3: { label: '已终止', color: 'volcano', helper: '卡片已终止，不可继续使用' },
  4: { label: '已注销', color: 'default', helper: '卡片申请或卡片状态已取消' },
  99: { label: '待审核', color: 'gold', helper: '卡片仍在审核或待处理阶段' },
}

const transactionTypeMap: Record<string, string> = {
  AUTHORIZATION: '交易授权',
  SETTLEMENT: '资金结算',
  SYNC: '交易同步',
  CARD_TRANSACTION: '交易通知',
}

const transactionStatusMap: Record<string, { label: string; color: string; desc: string }> = {
  AUTH_APPROVED: { label: '授权通过', color: 'success', desc: '授权已通过，等待后续结算或状态同步' },
  AUTH_REJECTED: { label: '授权拒绝', color: 'error', desc: '授权已拒绝，本次交易未通过' },
  SETTLEMENT_PENDING: { label: '待结算', color: 'processing', desc: '交易已进入待结算阶段' },
  SETTLED: { label: '已结算', color: 'default', desc: '交易已完成最终结算' },
  EXCEPTION: { label: '异常', color: 'volcano', desc: '交易存在异常，需人工关注' },
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

const settlementBatchStatusMap: Record<string, { label: string; color: string; desc: string }> = {
  PENDING: { label: '处理中', color: 'processing', desc: '批次已接收，仍在归集或对账中' },
  PROCESSED: { label: '已处理', color: 'success', desc: '批次已完成归集处理' },
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
  CARD_STATUS_CHANGE: { label: '卡状态变更', desc: '卡片状态发生变更时的通知事件' },
  CARD_DELIVERY: { label: '卡配送通知', desc: '卡片配送、物流状态更新通知' },
  CARD_SETTING: { label: '卡设置通知', desc: '卡片设置、限额、自动扣款等变更通知' },
  CARD_TRANSACTION: { label: '卡交易通知', desc: '消费授权、结算、同步等交易类通知' },
}

export function getCardStatusMeta(status: number, fallback?: string) {
  return cardStatusLabelMap[status] || { label: `状态${status}`, color: 'default', helper: fallback || '未知状态' }
}

export function getTransactionTypeLabel(type?: string) {
  if (!type) return '-'
  return transactionTypeMap[type] || `交易通知 (${type})`
}

export function getTransactionStatusMeta(status?: string) {
  if (!status) return { label: '-', color: 'default', desc: '' }
  return transactionStatusMap[status] || { label: `未知状态 (${status})`, color: 'default', desc: '请结合原始上游状态码排查' }
}

export function getReconcileStatusMeta(status?: string) {
  if (!status) return { label: '-', color: 'default', desc: '' }
  return reconcileStatusMap[status] || { label: `未知状态 (${status})`, color: 'default', desc: '请结合原始对账状态码排查' }
}

export function getCardFlowTypeMeta(type?: string) {
  if (!type) return { label: '-', color: 'default', desc: '' }
  return cardFlowTypeMap[type] || { label: `未知类型 (${type})`, color: 'default', desc: '请结合原始流水类型排查' }
}

export function getSettlementBatchStatusMeta(status?: string) {
  if (!status) return { label: '-', color: 'default', desc: '' }
  return settlementBatchStatusMap[status] || { label: `未知状态 (${status})`, color: 'default', desc: '请结合原始批次状态排查' }
}

export function getReconcileDiffTypeMeta(type?: string) {
  if (!type) return { label: '-', color: 'default', desc: '' }
  return reconcileDiffTypeMap[type] || { label: `未知类型 (${type})`, color: 'default', desc: '请结合原始差异类型排查' }
}

export function getReconcileDiffStatusMeta(status?: string) {
  if (!status) return { label: '-', color: 'default', desc: '' }
  return reconcileDiffStatusMap[status] || { label: `未知状态 (${status})`, color: 'default', desc: '请结合原始状态码排查' }
}

export function getProviderEventMeta(event?: string) {
  if (!event) return { label: '-', desc: '' }
  return providerEventMap[event] || { label: `其他事件 (${event})`, desc: '未纳入当前已确认事件映射，请结合原始 event 排查' }
}

export function renderMappedTag(label: string, color: string, raw?: string) {
  return <Tag color={color}>{raw && raw !== label ? `${label} (${raw})` : label}</Tag>
}
