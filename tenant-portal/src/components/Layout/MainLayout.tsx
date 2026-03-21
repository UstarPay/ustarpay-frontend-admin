import { authService } from "@/services";
import { useAppStore } from "@/stores/appStore";
import { useAuthStore } from "@/stores/authStore";
import {
  BellOutlined,
  ControlOutlined,
  CreditCardOutlined,
  BankOutlined,
  DashboardOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  TeamOutlined,
  TransactionOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Layout,
  Menu,
  theme,
} from "antd";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const { Header, Sider, Content } = Layout;
const { useToken } = theme;

type MenuItem = Required<MenuProps>["items"][number];
type MenuNode = {
  key: string;
  label: string;
  icon?: ReactNode;
  permissions?: string[];
  children?: MenuNode[];
};

const menuTree: MenuNode[] = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "\u4eea\u8868\u76d8",
    permissions: ["dashboard:view"],
  },
  {
    key: "/tenant-users",
    icon: <UserOutlined />,
    label: "\u7528\u6237\u7ba1\u7406",
    permissions: ["tenant_users:view", "tenant_user_kyc:view"],
    children: [
      {
        key: "/tenant-users/list",
        label: "\u7528\u6237\u5217\u8868",
        permissions: ["tenant_users:view"],
      },
      {
        key: "/tenant-users/invitations",
        label: "\u9080\u8bf7\u5173\u7cfb",
        permissions: ["tenant_users:view"],
      },
      {
        key: "/tenant-users/kyc",
        label: "KYC \u5217\u8868",
        permissions: ["tenant_user_kyc:view"],
      },
    ],
  },
  {
    key: "/cards",
    icon: <CreditCardOutlined />,
    label: "\u5361\u7247\u7ba1\u7406",
    permissions: ["cards:view"],
    children: [
      {
        key: "/cards/merchants",
        label: "\u5361\u5546\u5217\u8868",
        permissions: ["cards:view"],
      },
      {
        key: "/cards/list",
        label: "\u5361\u7247\u5217\u8868",
        permissions: ["cards:view"],
      },
      {
        key: "/cards/transactions",
        label: "\u5361\u4ea4\u6613\u53f0\u8d26",
        permissions: ["cards:view"],
      },
      {
        key: "/cards/account-flows",
        label: "\u5361\u989d\u5ea6\u6d41\u6c34",
        permissions: ["cards:view"],
      },
      {
        key: "/cards/fund-flows",
        label: "\u5361\u8d44\u91d1\u603b\u8d26",
        permissions: ["cards:view"],
      },
      {
        key: "/cards/settlement-batches",
        label: "\u5361\u7ed3\u7b97\u6279\u6b21",
        permissions: ["cards:view"],
      },
      {
        key: "/cards/reconcile-diffs",
        label: "\u5361\u5bf9\u8d26\u5dee\u5f02",
        permissions: ["cards:view"],
      },
    ],
  },
  {
    key: "/wallets",
    icon: <WalletOutlined />,
    label: "资产管理",
    permissions: ["wallets:view"],
    children: [
      {
        key: "/wallets/list",
        label: "用户钱包管理",
        permissions: ["wallets:view"],
      },
      {
        key: "/wallets/fund-accounts",
        label: "用户资金管理",
        permissions: ["wallets:view"],
      },
      {
        key: "/wallets/card-fund-accounts",
        label: "用户卡账户管理",
        permissions: ["wallets:view"],
      },
    ],
  },
  {
    key: "/hot-wallets",
    icon: <WalletOutlined />,
    label: "\u70ed\u94b1\u5305\u7ba1\u7406",
    permissions: ["hot_wallets:view"],
    children: [
      {
        key: "/hot-wallets/list",
        label: "\u70ed\u94b1\u5305\u5217\u8868",
        permissions: ["hot_wallets:view"],
      },
    ],
  },
  {
    key: "/cold-wallets",
    icon: <WalletOutlined />,
    label: "\u51b7\u94b1\u5305\u7ba1\u7406",
    permissions: ["cold_wallets:view"],
    children: [
      {
        key: "/cold-wallets/list",
        label: "\u51b7\u94b1\u5305\u5217\u8868",
        permissions: ["cold_wallets:view"],
      },
    ],
  },
  {
    key: "tasks",
    icon: <ControlOutlined />,
    label: "\u4efb\u52a1\u7ba1\u7406",
    permissions: ["balance_monitor:view", "collection:view"],
    children: [
      {
        key: "/wallets/monitor",
        label: "余额监控",
        permissions: ["balance_monitor:view"],
      },
      {
        key: "/collection/configs",
        label: "归集配置",
        permissions: ["collection:view"],
      },
      {
        key: "/collection/tasks",
        label: "\u5f52\u96c6\u4efb\u52a1",
        permissions: ["collection:view"],
      },
    ],
  },
  {
    key: "/transactions",
    icon: <TransactionOutlined />,
    label: "\u4ea4\u6613\u7ba1\u7406",
    permissions: [
      "transactions:view",
      "internal_transfers:view",
      "withdrawals:view",
    ],
    children: [
      {
        key: "/transactions/list",
        label: "\u4ea4\u6613\u8bb0\u5f55",
        permissions: ["transactions:view"],
      },
      {
        key: "/transactions/fund-flows",
        label: "资金变动",
        permissions: ["transactions:view"],
      },
      {
        key: "/transactions/withdraw",
        label: "提现管理",
        permissions: ["withdrawals:view"],
      },
    ],
  },
  {
    key: "/history",
    icon: <HistoryOutlined />,
    label: "\u5386\u53f2\u8bb0\u5f55",
    permissions: ["deposits:view", "withdrawals:view"],
    children: [
      {
        key: "/history/deposits",
        label: "\u5145\u503c\u8bb0\u5f55",
        permissions: ["deposits:view"],
      },
      {
        key: "/history/withdrawals",
        label: "\u63d0\u73b0\u8bb0\u5f55",
        permissions: ["withdrawals:view"],
      },
    ],
  },
  {
    key: "/security",
    icon: <SecurityScanOutlined />,
    label: "\u5b89\u5168\u4e2d\u5fc3",
    permissions: ["security:2fa"],
    children: [
      {
        key: "/security/2fa",
        label: "\u4e24\u6b65\u9a8c\u8bc1",
        permissions: ["security:2fa"],
      },
    ],
  },
  {
    key: "/notifications",
    icon: <BellOutlined />,
    label: "消息通知",
    permissions: ["config:view"],
    children: [
      {
        key: "/notifications/records",
        label: "消息记录",
        permissions: ["config:view"],
      },
      {
        key: "/notifications/templates",
        label: "模板管理",
        permissions: ["config:view"],
      },
    ],
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "\u7cfb\u7edf\u8bbe\u7f6e",
    permissions: ["tenant:view"],
    children: [
      {
        key: "/settings/profile",
        label: "\u8d26\u6237\u8d44\u6599",
        permissions: ["tenant:view"],
      },
    ],
  },
  {
    key: "/rbac",
    icon: <TeamOutlined />,
    label: "RBAC管理",
    permissions: [
      "tenant_rbac_users:view",
      "tenant_rbac_roles:view",
      "tenant_rbac_permissions:view",
    ],
    children: [
      {
        key: "/rbac/users",
        label: "用户管理",
        permissions: ["tenant_rbac_users:view"],
      },
      {
        key: "/rbac/roles",
        label: "角色管理",
        permissions: ["tenant_rbac_roles:view"],
      },
      {
        key: "/rbac/permissions",
        label: "权限管理",
        permissions: ["tenant_rbac_permissions:view"],
      },
    ],
  },
];

function hasAnyPermission(userPermissions: string[], required?: string[]) {
  if (!required || required.length === 0) {
    return true;
  }
  return required.some((permission) => userPermissions.includes(permission));
}

function filterMenuTree(
  nodes: MenuNode[],
  userPermissions: string[],
): MenuNode[] {
  return nodes.reduce<MenuNode[]>((result, node) => {
    const filteredChildren = node.children
      ? filterMenuTree(node.children, userPermissions)
      : undefined;
    const selfVisible = hasAnyPermission(userPermissions, node.permissions);

    if (!selfVisible && (!filteredChildren || filteredChildren.length === 0)) {
      return result;
    }

    result.push({
      ...node,
      children: filteredChildren,
    });
    return result;
  }, []);
}

function toMenuItems(nodes: MenuNode[]): MenuItem[] {
  return nodes.map((node) => ({
    key: node.key,
    icon: node.icon,
    label: node.label,
    children: node.children ? toMenuItems(node.children) : undefined,
  }));
}

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useToken();
  const { user, clearAuth, permissions } = useAuthStore();
  const { sidebar, setSidebarCollapsed, setSidebarMobile } = useAppStore();
  const canViewNotificationTemplates = permissions.includes("config:view");

  const visibleMenuItems = useMemo(() => {
    return toMenuItems(filterMenuTree(menuTree, permissions));
  }, [permissions]);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setSidebarMobile(isMobile);
      if (isMobile) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarCollapsed, setSidebarMobile]);

  const getSelectedKeys = () => {
    const pathname =
      location.pathname === "/collection/tasks"
        ? "/collection/configs"
        : location.pathname;
    if (visibleMenuItems.some((item) => item?.key === pathname)) {
      return [pathname];
    }

    for (const item of visibleMenuItems) {
      if (item && "children" in item && item.children) {
        for (const child of item.children) {
          if (
            child &&
            "key" in child &&
            pathname.startsWith(String(child.key))
          ) {
            return [String(child.key)];
          }
        }
      }
    }

    return [pathname];
  };

  const getOpenKeys = () => {
    const pathname =
      location.pathname === "/collection/tasks"
        ? "/collection/configs"
        : location.pathname;
    const openKeys: string[] = [];

    for (const item of visibleMenuItems) {
      if (item && "children" in item && item.children) {
        for (const child of item.children) {
          if (
            child &&
            "key" in child &&
            pathname.startsWith(String(child.key))
          ) {
            openKeys.push(String(item.key));
            break;
          }
        }
      }
    }

    return openKeys;
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = async ({ key }: { key: string }) => {
    switch (key) {
      case "profile":
      case "settings":
        navigate("/settings/profile");
        break;
      case "logout":
        try {
          await authService.logout();
          navigate("/login");
        } catch (error) {
          console.error("Logout failed:", error);
          clearAuth();
          navigate("/login");
        }
        break;
    }
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "\u4e2a\u4eba\u8d44\u6599",
    },
    { key: "settings", icon: <SettingOutlined />, label: "\u8bbe\u7f6e" },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "\u9000\u51fa\u767b\u5f55",
      danger: true,
    },
  ];

  const siderContent = (
    <Sider
      trigger={null}
      collapsible
      collapsed={sidebar.collapsed}
      width={256}
      style={{
        background: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
      }}
      className={sidebar.mobile ? "fixed left-0 top-0 bottom-0 z-50" : ""}
    >
      <div className="h-16 flex items-center justify-center gap-2 border-b border-gray-200 px-3">
        {/* 企业 Logo 占位：可配置 VITE_APP_LOGO 替换为实际 logo 路径 */}
        <Avatar
          size={sidebar.collapsed ? 32 : 40}
          src={import.meta.env.VITE_APP_LOGO}
          icon={<BankOutlined />}
          style={{
            flexShrink: 0,
            background: token.colorPrimaryBg,
            color: token.colorPrimary,
          }}
        />
        {!sidebar.collapsed && (
          <span className="text-lg font-bold text-blue-600 truncate">
            UStarPay
          </span>
        )}
      </div>

      <Menu
        theme="light"
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={visibleMenuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );

  return (
    <Layout className="min-h-screen">
      {!sidebar.mobile && siderContent}

      {sidebar.mobile && (
        <Drawer
          title="\u5bfc\u822a\u83dc\u5355"
          placement="left"
          closable={false}
          open={!sidebar.collapsed}
          onClose={() => setSidebarCollapsed(true)}
          width={256}
          styles={{ body: { padding: 0 } }}
        >
          {siderContent}
        </Drawer>
      )}

      <Layout
        className={
          sidebar.mobile ? "" : `ml-${sidebar.collapsed ? "20" : "64"}`
        }
      >
        <Header
          style={{
            padding: "0 24px",
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <Button
              type="text"
              icon={
                sidebar.collapsed ? (
                  <MenuUnfoldOutlined />
                ) : (
                  <MenuFoldOutlined />
                )
              }
              onClick={() => setSidebarCollapsed(!sidebar.collapsed)}
              style={{ fontSize: "16px", width: 40, height: 40 }}
            />
          </div>

          <div className="flex items-center gap-4">
            {canViewNotificationTemplates ? (
              <Badge dot color={token.colorPrimary}>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  size="large"
                  onClick={() => navigate("/notifications/records")}
                />
              </Badge>
            ) : null}

            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <div className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md hover:bg-gray-50">
                <Avatar icon={<UserOutlined />} src={user?.avatar} />
                <div className="hidden sm:block">
                  <div className="text-sm font-medium">
                    {user?.name || "\u7528\u6237"}
                  </div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            padding: "24px",
            background: token.colorBgLayout,
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
