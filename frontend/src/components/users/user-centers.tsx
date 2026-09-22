"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { DeleteOutlined } from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  List,
  Select,
  Space,
  Typography,
} from "antd";

import { getDistributionCenters } from "@/lib/api/organization";
import {
  assignUserDistributionCenter,
  getUserDistributionCenters,
  removeUserDistributionCenter,
  type UserDistributionCenter,
} from "@/lib/api/users";

type UserCentersProps = {
  userId: number;
  canUpdate: boolean;
};

export function UserCenters({
  userId,
  canUpdate,
}: UserCentersProps) {
  const [selectedCenterId, setSelectedCenterId] =
    useState<number>();

  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: [
      "users",
      userId,
      "distribution-centers",
    ],
    queryFn: () =>
      getUserDistributionCenters(userId),
  });

  const centersQuery = useQuery({
    queryKey: [
      "organization",
      "distribution-centers",
    ],
    queryFn: getDistributionCenters,
  });

  const availableCenters = useMemo(() => {
    const assignedIds = new Set(
      (assignmentsQuery.data ?? []).map(
        (assignment) =>
          assignment.distribution_center_id,
      ),
    );

    return (centersQuery.data ?? []).filter(
      (center) => !assignedIds.has(center.id),
    );
  }, [
    assignmentsQuery.data,
    centersQuery.data,
  ]);

  const invalidateAssignments = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "users",
          userId,
          "distribution-centers",
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: ["current-user"],
      }),
    ]);
  };

  const assignMutation = useMutation({
    mutationFn: (centerId: number) =>
      assignUserDistributionCenter(
        userId,
        centerId,
      ),

    onSuccess: async () => {
      message.success("РЦ назначен пользователю");
      setSelectedCenterId(undefined);

      await invalidateAssignments();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (centerId: number) =>
      removeUserDistributionCenter(
        userId,
        centerId,
      ),

    onSuccess: async () => {
      message.success(
        "Назначение РЦ удалено",
      );

      await invalidateAssignments();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const confirmRemove = (
    assignment: UserDistributionCenter,
  ) => {
    modal.confirm({
      title: "Удалить назначение РЦ?",
      content: (
        <>
          Пользователь больше не будет связан с{" "}
          <Typography.Text strong>
            {assignment.distribution_center.code}
            {" — "}
            {assignment.distribution_center.name}
          </Typography.Text>
          .
        </>
      ),
      okText: "Удалить",
      cancelText: "Отмена",
      okType: "danger",
      onOk: () =>
        removeMutation.mutateAsync(
          assignment.distribution_center_id,
        ),
    });
  };

  const error =
    assignmentsQuery.error || centersQuery.error;

  if (error) {
    return (
        <Alert
          type="error"
          title="Не удалось загрузить назначения РЦ"
          description={error.message}
          showIcon
        />
    );
  }

  return (
    <Card
      title="Распределительные центры"
      loading={
        assignmentsQuery.isLoading ||
        centersQuery.isLoading
      }
    >
      <Space
        orientation="vertical"
        size="middle"
        style={{ width: "100%" }}
      >
        {canUpdate && (
          <Space.Compact
            style={{ width: "100%" }}
          >
            <Select
              value={selectedCenterId}
              placeholder="Выберите РЦ"
              showSearch
              optionFilterProp="label"
              style={{ flex: 1 }}
              onChange={setSelectedCenterId}
              options={availableCenters.map(
                (center) => ({
                  value: center.id,
                  label: `${center.code} — ${center.name}, ${center.city}`,
                }),
              )}
              notFoundContent="Все доступные РЦ уже назначены"
            />

            <Button
              type="primary"
              loading={assignMutation.isPending}
              disabled={
                selectedCenterId === undefined
              }
              onClick={() => {
                if (
                  selectedCenterId !== undefined
                ) {
                  assignMutation.mutate(
                    selectedCenterId,
                  );
                }
              }}
            >
              Назначить
            </Button>
          </Space.Compact>
        )}

        {(assignmentsQuery.data?.length ?? 0) ===
        0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Распределительные центры не назначены"
          />
        ) : (
          <List
            dataSource={assignmentsQuery.data}
            renderItem={(assignment) => (
              <List.Item
                actions={
                  canUpdate
                    ? [
                        <Button
                          key="remove"
                          danger
                          icon={<DeleteOutlined />}
                          loading={
                            removeMutation.isPending &&
                            removeMutation.variables ===
                              assignment
                                .distribution_center_id
                          }
                          onClick={() =>
                            confirmRemove(
                              assignment,
                            )
                          }
                        >
                          Удалить
                        </Button>,
                      ]
                    : undefined
                }
              >
                <List.Item.Meta
                  title={`${assignment.distribution_center.code} — ${assignment.distribution_center.name}`}
                  description={
                    assignment.distribution_center.city
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Space>
    </Card>
  );
}