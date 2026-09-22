"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Card,
  Descriptions,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";

import { AdaptationStages } from "./adaptation-stages";
import {
  getAdaptationDetails,
  getAdaptations,
} from "@/lib/api/adaptations";
import type { IntroductoryProcessDetails } from "@/lib/api/introductory-processes";
import {
  adaptationProcessStatusColors,
  adaptationProcessStatusLabels,
  positionCategoryLabels,
} from "@/lib/adaptation-labels";

type AdaptationSectionProps = {
  process: IntroductoryProcessDetails;
  canUpdate: boolean;
};

function formatDate(
  value: string | null,
): string {
  return value
    ? dayjs(value).format("DD.MM.YYYY")
    : "—";
}

function formatDateTime(
  value: string | null,
): string {
  return value
    ? dayjs(value).format(
        "DD.MM.YYYY HH:mm",
      )
    : "—";
}

export function AdaptationSection({
  process,
  canUpdate,
}: AdaptationSectionProps) {
  const adaptationByProcessQuery =
    useQuery({
      queryKey: [
        "adaptation-by-introductory-process",
        process.id,
      ],
      queryFn: () =>
        getAdaptations({
          introductoryProcessId:
            process.id,
        }),
      enabled: process.end_date !== null,
    });

  const adaptation =
    adaptationByProcessQuery.data?.[0];

  const adaptationDetailsQuery =
    useQuery({
      queryKey: [
        "adaptation",
        adaptation?.id ?? null,
      ],
      queryFn: () =>
        getAdaptationDetails(
          adaptation!.id,
        ),
      enabled: adaptation !== undefined,
    });

  if (process.end_date === null) {
    return (
      <Card title="Адаптация">
        <Typography.Text type="secondary">
          Адаптация будет создана после
          завершения вводного обучения
        </Typography.Text>
      </Card>
    );
  }

  if (
    adaptationByProcessQuery.isLoading
  ) {
    return (
      <Card title="Адаптация">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Spin />
        </div>
      </Card>
    );
  }

  if (adaptationByProcessQuery.error) {
    return (
      <Card title="Адаптация">
        <Alert
          type="error"
          title="Не удалось загрузить адаптацию"
          description={
            adaptationByProcessQuery.error
              .message
          }
          showIcon
        />
      </Card>
    );
  }

  if (!adaptation) {
    return (
      <Card title="Адаптация">
        <Alert
          type="warning"
          title="Адаптация не была создана"
          description="Проверьте дату приёма сотрудника, его должность и наличие действующего правила адаптации."
          showIcon
        />
      </Card>
    );
  }

  if (adaptationDetailsQuery.isLoading) {
    return (
      <Card title="Адаптация">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Spin />
        </div>
      </Card>
    );
  }

  if (adaptationDetailsQuery.error) {
    return (
      <Card title="Адаптация">
        <Alert
          type="error"
          title="Не удалось загрузить детали адаптации"
          description={
            adaptationDetailsQuery.error
              .message
          }
          showIcon
        />
      </Card>
    );
  }

  const details =
    adaptationDetailsQuery.data;

  if (!details) {
    return null;
  }

  return (
    <Card title="Адаптация">
      <Space
        direction="vertical"
        size="large"
        style={{ width: "100%" }}
      >
        <Descriptions
          bordered
          size="small"
          column={2}
          items={[
            {
              key: "status",
              label: "Статус",
              children: (
                <Tag
                  color={
                    adaptationProcessStatusColors[
                      details.status
                    ]
                  }
                >
                  {
                    adaptationProcessStatusLabels[
                      details.status
                    ]
                  }
                </Tag>
              ),
            },
            {
              key: "deadline",
              label: "Общий дедлайн",
              children: formatDate(
                details.deadline_date,
              ),
            },
            {
              key: "category",
              label:
                "Категория должности",
              children:
                positionCategoryLabels[
                  details.policy
                    .position_category
                ],
            },
            {
              key: "policy",
              label: "Правило",
              children: `№${details.policy.id}`,
            },
            {
              key: "created-at",
              label: "Создана",
              children: formatDateTime(
                details.created_at,
              ),
            },
            {
              key: "completed-at",
              label: "Завершена",
              children: formatDateTime(
                details.completed_at,
              ),
            },
          ]}
        />

        <AdaptationStages
          adaptation={details}
          canUpdate={canUpdate}
        />
      </Space>
    </Card>
  );
}