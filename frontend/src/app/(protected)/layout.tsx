"use client";

import type { ReactNode } from "react";
import {
  ApartmentOutlined,
  AuditOutlined,
  BarChartOutlined,
  DashboardOutlined,
  ReadOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Layout,
  Menu,
  Space,
  Typography,
} from "antd";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import { AuthGuard } from "@/components/auth-guard";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { useCurrentUser } from "@/hooks/use-current-user";
import { logout } from "@/lib/api/auth";
import { hasPermission } from "@/lib/permissions";

const { Header, Sider, Content } = Layout;

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const { data: currentUser } = useCurrentUser();

  const canReadNotifications =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "notifications.read",
    );

  const canCreateNotifications =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "notifications.create",
    );

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem("access_token");
      queryClient.clear();
      router.replace("/login");
    }
  };

  const menuItems = [
      {
        key: "/admin",
        icon: <DashboardOutlined />,
        label: "Главная",
      },

        ...(currentUser &&
        (hasPermission(
          currentUser.permissions,
          "organization.read",
        ) ||
          hasPermission(
            currentUser.permissions,
            "users.read",
          ) ||
          hasPermission(
            currentUser.permissions,
            "roles.read",
          ) ||
          hasPermission(
            currentUser.permissions,
            "onboarding.read",
          ))
        ? [
            {
              type: "group" as const,
              label: "Администрирование",
              children: [
                ...(hasPermission(
                  currentUser.permissions,
                  "organization.read",
                )
                  ? [
                      {
                        key: "/admin/organization",
                        icon: (
                          <ApartmentOutlined />
                        ),
                        label: "Организация",
                      },
                    ]
                  : []),

                ...(hasPermission(
                  currentUser.permissions,
                  "users.read",
                )
                  ? [
                      {
                        key: "/admin/users",
                        icon: <UserOutlined />,
                        label: "Пользователи",
                      },
                    ]
                  : []),

                ...(hasPermission(
                  currentUser.permissions,
                  "roles.read",
                )
                  ? [
                      {
                        key: "/admin/roles",
                        icon: <TeamOutlined />,
                        label: "Роли",
                      },
                    ]
                  : []),

                  ...(hasPermission(
                      currentUser.permissions,
                      "onboarding.read",
                    )
                      ? [
                          {
                            key: "/admin/adaptation-policies",
                            icon: <SettingOutlined />,
                            label: "Правила адаптации",
                          },
                          {
                              key: "/admin/internship-policies",
                              icon: <SettingOutlined />,
                              label: "Нормативы стажировок",
                            },
                        ]
                      : []),

                  ...(hasPermission(
                      currentUser.permissions,
                      "imports.read",
                    )
                      ? [
                          {
                            key: "/admin/imports",
                            icon: <FileExcelOutlined />,
                            label: "Импорт данных",
                          },
                        ]
                      : []),
              ],
            },
          ]
        : []),

      ...(currentUser &&
      hasPermission(
        currentUser.permissions,
        "employees.read",
      )
        ? [
            {
              type: "group" as const,
              label: "Управление персоналом",
              children: [
                {
                  key: "/employees",
                  icon: <SolutionOutlined />,
                  label: "Сотрудники",
                },
              ],
            },
          ]
        : []),

      ...(currentUser &&
      hasPermission(
        currentUser.permissions,
        "onboarding.read",
      )
        ? [
          {
              type: "group" as const,
              label: "Процессы обучения",
              children: [
                {
                  key: "/introductory-processes",
                  icon: <ReadOutlined />,
                  label: "Вводные процессы",
                },
                {
                  key: "/adaptations",
                  icon: <AuditOutlined />,
                  label: "Адаптации",
                },
              ],
            },
          ]
        : []),
      ...(currentUser &&
        hasPermission(
          currentUser.permissions,
          "organization.read",
        )
          ? [
              {
                type: "group" as const,
                label: "Аналитика",
                children: [
                  {
                    key: "/analytics/onboarding",
                    icon: <BarChartOutlined />,
                    label: "Вводное и адаптация",
                  },
                ],
              },
            ]
          : []),
    ];

  return (
    <AuthGuard>
      <Layout style={{ minHeight: "100vh" }}>
        <Sider>
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              padding: "0 24px",
            }}
          >
            <Typography.Text
              strong
              style={{
                color: "white",
                fontSize: 18,
              }}
            >
              Logistic CRM
            </Typography.Text>
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) =>
              router.push(key)
            }
          />
        </Sider>

        <Layout>
          <Header
            style={{
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingInline: 24,
            }}
          >
            <div>
              <Typography.Text strong>
                {currentUser?.email}
              </Typography.Text>

              <Typography.Text
                type="secondary"
                style={{ marginLeft: 12 }}
              >
                {currentUser?.role.name}
              </Typography.Text>
            </div>

            <Space size="middle">
              <NotificationCenter
                canRead={canReadNotifications}
                canCreate={
                  canCreateNotifications
                }
              />

              <Button onClick={handleLogout}>
                Выйти
              </Button>
            </Space>
          </Header>

          <Content
            style={{
              margin: 24,
              padding: 24,
              background: "white",
              borderRadius: 8,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </AuthGuard>
  );
}