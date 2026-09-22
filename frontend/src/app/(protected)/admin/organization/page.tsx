"use client";

import { Tabs, Typography } from "antd";

import { CenterStructure } from "@/components/organization/center-structure";
import { DivisionsTable } from "@/components/organization/divisions-table";
import { GroupsTable } from "@/components/organization/groups-table";
import { PositionsTable } from "@/components/organization/positions-table";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasPermission } from "@/lib/permissions";
import type { OrganizationPermissions } from "@/components/organization/types";

export default function OrganizationPage() {
  const { data: currentUser } = useCurrentUser();

  const permissions: OrganizationPermissions = {
    canCreate:
      currentUser !== undefined &&
      hasPermission(
        currentUser.permissions,
        "organization.create",
      ),

    canUpdate:
      currentUser !== undefined &&
      hasPermission(
        currentUser.permissions,
        "organization.update",
      ),

    canDelete:
      currentUser !== undefined &&
      hasPermission(
        currentUser.permissions,
        "organization.delete",
      ),
  };

  return (
    <div>
      <Typography.Title
        level={2}
        style={{ marginBottom: 4 }}
      >
        Организация
      </Typography.Title>

      <Typography.Text type="secondary">
        Структура распределительных центров и
        глобальные организационные справочники
      </Typography.Text>

      <Tabs
        defaultActiveKey="structure"
        style={{ marginTop: 24 }}
        items={[
          {
            key: "structure",
            label: "Структура РЦ",
            children: (
              <CenterStructure
                permissions={permissions}
              />
            ),
          },
          {
            key: "dictionaries",
            label: "Глобальные справочники",
            children: (
              <Tabs
                defaultActiveKey="groups"
                items={[
                  {
                    key: "groups",
                    label: "Группы",
                    children: (
                      <GroupsTable
                        permissions={permissions}
                      />
                    ),
                  },
                  {
                    key: "divisions",
                    label: "Подразделения",
                    children: (
                      <DivisionsTable
                        permissions={permissions}
                      />
                    ),
                  },
                  {
                    key: "positions",
                    label: "Должности",
                    children: (
                      <PositionsTable
                        permissions={permissions}
                      />
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </div>
  );
}