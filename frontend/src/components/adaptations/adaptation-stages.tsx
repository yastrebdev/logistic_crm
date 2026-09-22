"use client";

import { useState } from "react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { EditOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  message,
  Space,
  Tag,
  Timeline,
  Typography,
} from "antd";
import dayjs from "dayjs";

import { AdaptationStageFormModal } from "./adaptation-stage-form-modal";
import {
  updateAdaptationStage,
  type AdaptationProcessDetails,
  type AdaptationStage,
  type AdaptationStageUpdate,
} from "@/lib/api/adaptations";
import {
  adaptationDelayReasonLabels,
  adaptationMethodLabels,
  adaptationParticipantsLabels,
  adaptationRiskReasonLabels,
  adaptationStageStatusColors,
  adaptationStageStatusLabels,
  riskZoneColors,
  riskZoneLabels,
} from "@/lib/adaptation-labels";

type AdaptationStagesProps = {
  adaptation: AdaptationProcessDetails;
  canUpdate: boolean;
};

type UpdateVariables = {
  stageId: number;
  data: AdaptationStageUpdate;
};

function formatDate(
  value: string | null,
): string {
  return value
    ? dayjs(value).format("DD.MM.YYYY")
    : "—";
}

export function AdaptationStages({
  adaptation,
  canUpdate,
}: AdaptationStagesProps) {
  const queryClient = useQueryClient();

  const [messageApi, messageContext] =
    message.useMessage();

  const [editingStage, setEditingStage] =
    useState<AdaptationStage | null>(null);

  const updateMutation = useMutation({
    mutationFn: ({
      stageId,
      data,
    }: UpdateVariables) =>
      updateAdaptationStage(stageId, data),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "adaptation",
            adaptation.id,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ["adaptations"],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "adaptation-by-introductory-process",
            adaptation.introductory_process_id,
          ],
        }),
      ]);

      setEditingStage(null);

      messageApi.success(
        "Этап адаптации обновлён",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

  const handleSubmit = (
    data: AdaptationStageUpdate,
  ) => {
    if (!editingStage) {
      return;
    }

    if (Object.keys(data).length === 0) {
      setEditingStage(null);
      return;
    }

    updateMutation.mutate({
      stageId: editingStage.id,
      data,
    });
  };

  const renderStage = (
    stageNumber: 1 | 2 | 3,
  ) => {
    const stage = adaptation.stages.find(
      (item) =>
        item.stage_number === stageNumber,
    );

    if (!stage) {
      return (
        <Card size="small">
          <Typography.Title level={5}>
            Этап {stageNumber}
          </Typography.Title>

          <Typography.Text type="secondary">
            Будет рассчитан после завершения
            предыдущего этапа
          </Typography.Text>
        </Card>
      );
    }

    return (
      <Card
        size="small"
        title={`Этап ${stage.stage_number}`}
        extra={
          canUpdate ? (
            <Button
              icon={<EditOutlined />}
              onClick={() =>
                setEditingStage(stage)
              }
            >
              Изменить
            </Button>
          ) : null
        }
      >
        <Descriptions
          bordered
          size="small"
          column={1}
          items={[
            {
              key: "status",
              label: "Статус",
              children: (
                <Tag
                  color={
                    adaptationStageStatusColors[
                      stage.stage_status
                    ]
                  }
                >
                  {
                    adaptationStageStatusLabels[
                      stage.stage_status
                    ]
                  }
                </Tag>
              ),
            },
            {
              key: "planned-period",
              label: "Плановый период",
              children: `${formatDate(
                stage.planned_start_date,
              )} — ${formatDate(
                stage.planned_end_date,
              )}`,
            },
            {
              key: "actual-date",
              label: "Фактическая дата",
              children: formatDate(
                stage.actual_date,
              ),
            },
            {
              key: "method",
              label: "Способ проведения",
              children: stage.method
                ? adaptationMethodLabels[
                    stage.method
                  ]
                : "—",
            },
            {
              key: "participants",
              label: "Участники",
              children: stage.participants
                ? adaptationParticipantsLabels[
                    stage.participants
                  ]
                : "—",
            },
            {
              key: "risk-zone",
              label: "Зона риска",
              children: stage.risk_zone ? (
                <Tag
                  color={
                    riskZoneColors[
                      stage.risk_zone
                    ]
                  }
                >
                  {
                    riskZoneLabels[
                      stage.risk_zone
                    ]
                  }
                </Tag>
              ) : (
                "—"
              ),
            },
            {
              key: "risk-reason",
              label: "Причина риска",
              children: stage.risk_reason
                ? adaptationRiskReasonLabels[
                    stage.risk_reason
                  ]
                : "—",
            },
            {
              key: "delay-reason",
              label: "Причина задержки",
              children: stage.delay_reason
                ? adaptationDelayReasonLabels[
                    stage.delay_reason
                  ]
                : "—",
            },
            {
              key: "delay-days",
              label: "Просрочка",
              children:
                stage.delay_days > 0
                  ? `${stage.delay_days} дн.`
                  : "Нет",
            },
            {
              key: "comment",
              label: "Комментарий",
              children:
                stage.comment ?? "—",
            },
          ]}
        />
      </Card>
    );
  };

  const timelineItems = (
    [1, 2, 3] as const
  ).map((stageNumber) => {
    const stage = adaptation.stages.find(
      (item) =>
        item.stage_number === stageNumber,
    );

    return {
      color:
        stage?.stage_status === "completed"
          ? "green"
          : stage?.stage_status === "overdue"
            ? "red"
            : stage?.stage_status === "due"
              ? "blue"
              : "gray",
      children: renderStage(stageNumber),
    };
  });

  const hasNextStage =
    editingStage !== null &&
    adaptation.stages.some(
      (stage) =>
        stage.stage_number >
        editingStage.stage_number,
    );

  return (
    <>
      {messageContext}

      <Space
        direction="vertical"
        size="middle"
        style={{ width: "100%" }}
      >
        <Typography.Title
          level={4}
          style={{ marginBottom: 0 }}
        >
          Этапы адаптации
        </Typography.Title>

        <Timeline items={timelineItems} />
      </Space>

      {editingStage && (
        <AdaptationStageFormModal
          open
          stage={editingStage}
          hasNextStage={hasNextStage}
          loading={updateMutation.isPending}
          onCancel={() =>
            setEditingStage(null)
          }
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}