import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AnonymousRoute, ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/Layout";
import { TENANT_PERMISSION } from "@/constants/rbac";
import {
  ApiLogPage,
  BalanceMonitorPage,
  DashboardPage,
  DepositConfigPage,
  DepositHistoryPage,
  ForbiddenPage,
  FundAccountListPage,
  FundFlowListPage,
  GasTaskPage,
  HotWalletListPage,
  InternalTransferPage,
  InvitationListPage,
  KycListPage,
  LoginPage,
  NotFoundPage,
  NotificationRecordPage,
  NotificationTemplatePage,
  PasswordUpdatePage,
  ProfilePage,
  SecondaryPasswordUpdatePage,
  TenantInfoPage,
  TenantRbacPermissionPage,
  TenantRbacRolePage,
  TenantRbacUserPage,
  TransactionDetailPage,
  TransactionListPage,
  TransactionStatsPage,
  TwoFactorAuthPage,
  UserListPage,
  WalletDetailPage,
  WalletListPage,
  WebhookLogPage,
  WithdrawHistoryPage,
  WithdrawalConfigPage,
  WithdrawalListPage,
  CardFundAccountListPage,
} from "@/pages";
import {
  ColdWalletDetailPage,
  ColdWalletListPage,
  HotWalletDetailPage,
} from "@/pages/wallets";
import {
  CardAccountFlowPage,
  CardFundFlowPage,
  CardListPage,
  CardMerchantListPage,
  CardReconcileDiffPage,
  CardSettlementBatchPage,
  CardTransactionListPage,
  PhysicalCardApplicationPage,
  PhysicalCardInventoryPage,
} from "@/pages/cards";
import {
  CollectionConfigPage,
  CollectionStatsPage,
  CollectionTaskPage,
} from "@/pages/collection";

function protect(element: ReactNode, requiredPermissions: string[] = []) {
  return (
    <ProtectedRoute requiredPermissions={requiredPermissions}>
      {element}
    </ProtectedRoute>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AnonymousRoute>
            <LoginPage />
          </AnonymousRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route
          path="dashboard"
          element={protect(<DashboardPage />, [TENANT_PERMISSION.DASHBOARD_VIEW])}
        />
        <Route
          path="tenant"
          element={protect(<TenantInfoPage />, [TENANT_PERMISSION.TENANT_VIEW])}
        />

        <Route
          path="tenant-users/list"
          element={protect(<UserListPage />, [TENANT_PERMISSION.TENANT_USERS_VIEW])}
        />
        <Route
          path="tenant-users/kyc"
          element={protect(<KycListPage />, [TENANT_PERMISSION.TENANT_USER_KYC_VIEW])}
        />
        <Route
          path="tenant-users/invitations"
          element={protect(<InvitationListPage />, [TENANT_PERMISSION.TENANT_USERS_VIEW])}
        />
        <Route
          path="tenant-users/address-books"
          element={<Navigate to="/tenant-users/list" replace />}
        />

        <Route
          path="wallets/list"
          element={protect(<WalletListPage />, [TENANT_PERMISSION.WALLETS_VIEW])}
        />
        <Route
          path="wallets/fund-accounts"
          element={protect(<FundAccountListPage />, [TENANT_PERMISSION.WALLETS_VIEW])}
        />
        <Route
          path="wallets/card-fund-accounts"
          element={protect(<CardFundAccountListPage />, [TENANT_PERMISSION.WALLETS_VIEW])}
        />
        <Route
          path="wallets/:id"
          element={protect(<WalletDetailPage />, [TENANT_PERMISSION.WALLETS_VIEW])}
        />
        <Route
          path="wallets/monitor"
          element={protect(<BalanceMonitorPage />, [TENANT_PERMISSION.BALANCE_MONITOR_VIEW])}
        />
        <Route
          path="wallets/gas-tasks"
          element={protect(<GasTaskPage />, [TENANT_PERMISSION.BALANCE_MONITOR_VIEW])}
        />

        <Route
          path="hot-wallets/list"
          element={protect(<HotWalletListPage />, [TENANT_PERMISSION.HOT_WALLETS_VIEW])}
        />
        <Route
          path="hot-wallets/:id"
          element={protect(<HotWalletDetailPage />, [TENANT_PERMISSION.HOT_WALLETS_VIEW])}
        />
        <Route
          path="cold-wallets/list"
          element={protect(<ColdWalletListPage />, [TENANT_PERMISSION.COLD_WALLETS_VIEW])}
        />
        <Route
          path="cold-wallets/:id"
          element={protect(<ColdWalletDetailPage />, [TENANT_PERMISSION.COLD_WALLETS_VIEW])}
        />

        <Route path="cards" element={<Navigate to="/cards/list" replace />} />
        <Route
          path="cards/list"
          element={protect(<CardListPage />, [TENANT_PERMISSION.CARDS_VIEW])}
        />
        <Route
          path="cards/merchants"
          element={protect(<CardMerchantListPage />, [TENANT_PERMISSION.CARDS_VIEW])}
        />
        <Route
          path="cards/physical-inventories"
          element={protect(<PhysicalCardInventoryPage />, [TENANT_PERMISSION.CARDS_VIEW])}
        />
        <Route
          path="cards/physical-applications"
          element={protect(<PhysicalCardApplicationPage />, [TENANT_PERMISSION.CARDS_VIEW])}
        />
        <Route
          path="cards/transactions"
          element={protect(<CardTransactionListPage />, [TENANT_PERMISSION.CARDS_VIEW])}
        />
        <Route
          path="cards/account-flows"
          element={protect(<CardAccountFlowPage />, [TENANT_PERMISSION.CARDS_VIEW])}
        />
        <Route
          path="cards/fund-flows"
          element={protect(<CardFundFlowPage />, [TENANT_PERMISSION.CARDS_VIEW])}
        />
        <Route
          path="cards/settlement-batches"
          element={protect(<CardSettlementBatchPage />, [TENANT_PERMISSION.CARDS_VIEW])}
        />
        <Route
          path="cards/reconcile-diffs"
          element={protect(<CardReconcileDiffPage />, [TENANT_PERMISSION.CARDS_VIEW])}
        />

        <Route
          path="collection/configs"
          element={protect(<CollectionConfigPage />, [TENANT_PERMISSION.COLLECTION_VIEW])}
        />
        <Route
          path="collection/tasks"
          element={protect(<CollectionTaskPage />, [TENANT_PERMISSION.COLLECTION_VIEW])}
        />
        <Route
          path="collection/stats"
          element={protect(<CollectionStatsPage />, [TENANT_PERMISSION.COLLECTION_VIEW])}
        />

        <Route
          path="logs/api"
          element={protect(<ApiLogPage />, [TENANT_PERMISSION.TENANT_VIEW])}
        />
        <Route
          path="logs/webhook"
          element={protect(<WebhookLogPage />, [TENANT_PERMISSION.TENANT_VIEW])}
        />

        <Route
          path="security/2fa"
          element={protect(<TwoFactorAuthPage />, [TENANT_PERMISSION.SECURITY_2FA])}
        />
        <Route
          path="security/password"
          element={protect(<PasswordUpdatePage />, [TENANT_PERMISSION.TENANT_VIEW])}
        />
        <Route
          path="security/secondary-password"
          element={protect(<SecondaryPasswordUpdatePage />, [TENANT_PERMISSION.TENANT_VIEW])}
        />

        <Route path="transactions" element={<Navigate to="/transactions/list" replace />} />
        <Route
          path="transactions/list"
          element={protect(<TransactionListPage />, [TENANT_PERMISSION.TRANSACTIONS_VIEW])}
        />
        <Route
          path="transactions/fund-flows"
          element={protect(<FundFlowListPage />, [TENANT_PERMISSION.TRANSACTIONS_VIEW])}
        />
        <Route
          path="transactions/stats"
          element={protect(<TransactionStatsPage />, [TENANT_PERMISSION.TRANSACTIONS_VIEW])}
        />
        <Route
          path="transactions/internal"
          element={protect(<InternalTransferPage />, [TENANT_PERMISSION.INTERNAL_TRANSFERS_VIEW])}
        />
        <Route
          path="transactions/withdraw"
          element={protect(<WithdrawalListPage />, [TENANT_PERMISSION.WITHDRAWALS_VIEW])}
        />
        <Route
          path="transactions/withdraw-config"
          element={protect(<WithdrawalConfigPage />, [TENANT_PERMISSION.WITHDRAWALS_VIEW])}
        />
        <Route
          path="transactions/:id"
          element={protect(<TransactionDetailPage />, [TENANT_PERMISSION.TRANSACTIONS_VIEW])}
        />

        <Route
          path="history/deposits"
          element={protect(<DepositHistoryPage />, [TENANT_PERMISSION.DEPOSITS_VIEW])}
        />
        <Route
          path="history/deposit-config"
          element={protect(<DepositConfigPage />, [TENANT_PERMISSION.DEPOSITS_VIEW])}
        />
        <Route
          path="history/withdrawals"
          element={protect(<WithdrawHistoryPage />, [TENANT_PERMISSION.WITHDRAWALS_VIEW])}
        />

        <Route path="notifications" element={<Navigate to="/notifications/records" replace />} />
        <Route
          path="notifications/records"
          element={protect(<NotificationRecordPage />, [TENANT_PERMISSION.CONFIG_VIEW])}
        />
        <Route
          path="notifications/templates"
          element={protect(<NotificationTemplatePage />, [TENANT_PERMISSION.CONFIG_VIEW])}
        />

        <Route
          path="settings/profile"
          element={protect(<ProfilePage />, [TENANT_PERMISSION.TENANT_VIEW])}
        />

        <Route
          path="rbac/users"
          element={protect(<TenantRbacUserPage />, [TENANT_PERMISSION.TENANT_RBAC_USERS_VIEW])}
        />
        <Route
          path="rbac/roles"
          element={protect(<TenantRbacRolePage />, [TENANT_PERMISSION.TENANT_RBAC_ROLES_VIEW])}
        />
        <Route
          path="rbac/permissions"
          element={protect(<TenantRbacPermissionPage />, [TENANT_PERMISSION.TENANT_RBAC_PERMISSIONS_VIEW])}
        />
      </Route>

      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
