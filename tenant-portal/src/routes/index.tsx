import { Navigate, Route, Routes } from 'react-router-dom'
import { AnonymousRoute, ProtectedRoute } from '@/components/ProtectedRoute'
import { MainLayout } from '@/components/Layout'
import {
  DashboardPage,
  ForbiddenPage,
  LoginPage,
  NotFoundPage,
  TenantInfoPage,
  WalletListPage,
  WalletDetailPage,
  BalanceMonitorPage,


  GasTaskPage,
  ApiLogPage,
  WebhookLogPage,
  TwoFactorAuthPage,
  TransactionListPage,
  TransactionDetailPage,
  TransactionStatsPage,
  InternalTransferPage,
  DepositHistoryPage,
  WithdrawHistoryPage,
  ProfilePage,
  PasswordUpdatePage,
  SecondaryPasswordUpdatePage,
  HotWalletListPage,
  WithdrawalListPage
} from '@/pages'
import { ColdWalletListPage, HotWalletDetailPage, ColdWalletDetailPage } from '@/pages/wallets'
import { CardListPage, CardMerchantListPage, CardTransactionListPage } from '@/pages/cards'
import { CollectionConfigPage, CollectionTaskPage, CollectionStatsPage } from '@/pages/collection'

export function AppRoutes() {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route
        path="/login"
        element={
          <AnonymousRoute>
            <LoginPage />
          </AnonymousRoute>
        }
      />

      {/* 主应用路由 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tenant" element={<TenantInfoPage />} />
        <Route path="wallets/list" element={<WalletListPage />} />
        <Route path="wallets/:id" element={<WalletDetailPage />} />
        <Route path="wallets/monitor" element={<BalanceMonitorPage />} />


        <Route path="wallets/gas-tasks" element={<GasTaskPage />} />
        <Route path="hot-wallets/list" element={<HotWalletListPage />} />
        <Route path="hot-wallets/:id" element={<HotWalletDetailPage />} />
        <Route path="cold-wallets/list" element={<ColdWalletListPage />} />
        <Route path="cold-wallets/:id" element={<ColdWalletDetailPage />} />
        <Route path="cards" element={<Navigate to="/cards/list" replace />} />
        <Route path="cards/list" element={<CardListPage />} />
        <Route path="cards/merchants" element={<CardMerchantListPage />} />
        <Route path="cards/transactions" element={<CardTransactionListPage />} />
        <Route path="collection/configs" element={<CollectionConfigPage />} />
        <Route path="collection/tasks" element={<CollectionTaskPage />} />
        <Route path="collection/stats" element={<CollectionStatsPage />} />
        <Route path="logs/api" element={<ApiLogPage />} />
        <Route path="logs/webhook" element={<WebhookLogPage />} />
        <Route path="security/2fa" element={<TwoFactorAuthPage />} />
        <Route path="security/password" element={<PasswordUpdatePage />} />
        <Route path="security/secondary-password" element={<SecondaryPasswordUpdatePage />} />
        <Route path="transactions" element={<Navigate to="/transactions/list" replace />} />
        <Route path="transactions/list" element={<TransactionListPage />} />
        <Route path="transactions/stats" element={<TransactionStatsPage />} />
        <Route path="transactions/:id" element={<TransactionDetailPage />} />
        <Route path="history/deposits" element={<DepositHistoryPage />} />
        <Route path="history/withdrawals" element={<WithdrawHistoryPage />} />
        <Route path="transactions/internal" element={<InternalTransferPage />} />
        <Route path="transactions/withdraw" element={<WithdrawalListPage />} />
        <Route path="settings/profile" element={<ProfilePage />} />
      </Route>

      {/* 错误页面路由 */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
