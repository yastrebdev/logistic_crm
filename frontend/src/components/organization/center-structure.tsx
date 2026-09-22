"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";

import type { OrganizationPermissions } from "@/components/organization/types";
import {
  createDistributionCenter,
  createDistributionCenterDivision,
  deleteDistributionCenter,
  deleteDistributionCenterDivision,
  getDistributionCenterStructure,
  getDistributionCenters,
  getDivisions,
  updateDistributionCenter,
  type CreateDistributionCenterDivisionRequest,
  type CreateDistributionCenterRequest,
  type DistributionCenter,
  type DistributionCenterStructureDivision,
  type PositionCategory,
} from "@/lib/api/organization";

type CenterStructureProps = {
  permissions: OrganizationPermissions;
};

const positionCategoryLabels: Record<
  PositionCategory,
  string
> = {
  line_staff: "Линейный персонал",
  specialist: "Специалист",
  manager: "Руководитель",
  head: "Директор",
};

export function CenterStructure({
  permissions,
}: CenterStructureProps) {
  const [selectedCenterId, setSelectedCenterId] =
    useState<number>();

  const [isCreateCenterOpen, setIsCreateCenterOpen] =
    useState(false);

  const [editingCenter, setEditingCenter] =
    useState<DistributionCenter | null>(null);

  const [isAttachDivisionOpen, setIsAttachDivisionOpen] =
    useState(false);

  const [createCenterForm] =
    Form.useForm<CreateDistributionCenterRequest>();

  const [editCenterForm] =
    Form.useForm<CreateDistributionCenterRequest>();

  const [attachDivisionForm] =
    Form.useForm<CreateDistributionCenterDivisionRequest>();

  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const centersQuery = useQuery({
    queryKey: [
      "organization",
      "distribution-centers",
    ],
    queryFn: getDistributionCenters,
  });

  const divisionsQuery = useQuery({
    queryKey: ["organization", "divisions", "all"],
    queryFn: () => getDivisions(),
  });

  const structureQuery = useQuery({
    queryKey: [
      "organization",
      "distribution-center-structure",
      selectedCenterId,
    ],
    queryFn: () =>
      getDistributionCenterStructure(
        selectedCenterId as number,
      ),
    enabled: selectedCenterId !== undefined,
  });

  const selectedCenter = useMemo(
    () =>
      centersQuery.data?.find(
        (center) => center.id === selectedCenterId,
      ),
    [centersQuery.data, selectedCenterId],
  );

  const divisionById = useMemo(
    () =>
      new Map(
        (divisionsQuery.data ?? []).map((division) => [
          division.id,
          division,
        ]),
      ),
    [divisionsQuery.data],
  );

  const invalidateOrganization = () =>
    queryClient.invalidateQueries({
      queryKey: ["organization"],
    });

  const createCenterMutation = useMutation({
    mutationFn: createDistributionCenter,

    onSuccess: async (center) => {
      message.success(
        "Распределительный центр создан",
      );

      setIsCreateCenterOpen(false);
      createCenterForm.resetFields();
      setSelectedCenterId(center.id);

      await invalidateOrganization();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const updateCenterMutation = useMutation({
    mutationFn: ({
      centerId,
      data,
    }: {
      centerId: number;
      data: CreateDistributionCenterRequest;
    }) => updateDistributionCenter(centerId, data),

    onSuccess: async () => {
      message.success(
        "Распределительный центр обновлён",
      );

      setEditingCenter(null);
      editCenterForm.resetFields();

      await invalidateOrganization();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const deleteCenterMutation = useMutation({
    mutationFn: deleteDistributionCenter,

    onSuccess: async () => {
      message.success(
        "Распределительный центр удалён",
      );

      setSelectedCenterId(undefined);
      await invalidateOrganization();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const attachDivisionMutation = useMutation({
    mutationFn: ({
      centerId,
      data,
    }: {
      centerId: number;
      data: CreateDistributionCenterDivisionRequest;
    }) =>
      createDistributionCenterDivision(
        centerId,
        data,
      ),

    onSuccess: async () => {
      message.success(
        "Подразделение подключено к РЦ",
      );

      setIsAttachDivisionOpen(false);
      attachDivisionForm.resetFields();

      await invalidateOrganization();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const detachDivisionMutation = useMutation({
    mutationFn: ({
      centerId,
      centerDivisionId,
    }: {
      centerId: number;
      centerDivisionId: number;
    }) =>
      deleteDistributionCenterDivision(
        centerId,
        centerDivisionId,
      ),

    onSuccess: async () => {
      message.success(
        "Подразделение отключено от РЦ",
      );

      await invalidateOrganization();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const openEditCenter = (
    center: DistributionCenter,
  ) => {
    setEditingCenter(center);

    editCenterForm.setFieldsValue({
      code: center.code,
      name: center.name,
      city: center.city,
    });
  };

  const confirmDeleteCenter = (
    center: DistributionCenter,
  ) => {
    modal.confirm({
      title: "Удалить распределительный центр?",
      content: (
        <>
          РЦ{" "}
          <Typography.Text strong>
            {center.code} — {center.name}
          </Typography.Text>{" "}
          будет удалён.
        </>
      ),
      okText: "Удалить",
      cancelText: "Отмена",
      okType: "danger",
      onOk: () =>
        deleteCenterMutation.mutateAsync(center.id),
    });
  };

  const confirmDetachDivision = (
    centerDivision: DistributionCenterStructureDivision,
  ) => {
    if (selectedCenterId === undefined) {
      return;
    }

    modal.confirm({
      title: "Отключить подразделение от РЦ?",
      content: (
        <>
          Подразделение{" "}
          <Typography.Text strong>
            {centerDivision.name}
          </Typography.Text>{" "}
          будет исключено из структуры этого РЦ.
          Глобальный справочник удалён не будет.
        </>
      ),
      okText: "Отключить",
      cancelText: "Отмена",
      okType: "danger",
      onOk: () =>
        detachDivisionMutation.mutateAsync({
          centerId: selectedCenterId,
          centerDivisionId: centerDivision.id,
        }),
    });
  };

  const queryError =
    centersQuery.error || divisionsQuery.error;

  if (queryError) {
    return (
      <Alert
        type="error"
        message="Не удалось загрузить данные организации"
        description={queryError.message}
        showIcon
      />
    );
  }

  return (
    <>
      <Space
        orientation="vertical"
        size="large"
        style={{ width: "100%" }}
      >
        <Card
          title="Распределительный центр"
          extra={
            permissions.canCreate ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  setIsCreateCenterOpen(true)
                }
              >
                Добавить РЦ
              </Button>
            ) : null
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Select
                value={selectedCenterId}
                loading={centersQuery.isLoading}
                placeholder="Выберите РЦ"
                style={{ width: "100%" }}
                showSearch
                optionFilterProp="label"
                onChange={(centerId) =>
                  setSelectedCenterId(centerId)
                }
                options={centersQuery.data?.map(
                  (center) => ({
                    value: center.id,
                    label: `${center.code} — ${center.name}, ${center.city}`,
                  }),
                )}
              />
            </Col>

            <Col xs={24} lg={10}>
              {selectedCenter && (
                <Space wrap>
                  {permissions.canUpdate && (
                    <Button
                      icon={<EditOutlined />}
                      onClick={() =>
                        openEditCenter(selectedCenter)
                      }
                    >
                      Изменить РЦ
                    </Button>
                  )}

                  {permissions.canDelete && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        confirmDeleteCenter(
                          selectedCenter,
                        )
                      }
                    >
                      Удалить РЦ
                    </Button>
                  )}
                </Space>
              )}
            </Col>
          </Row>
        </Card>

        {!selectedCenterId &&
          !centersQuery.isLoading && (
            <Empty description="Добавьте или выберите распределительный центр" />
          )}

        {selectedCenterId &&
          structureQuery.isLoading && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: 40,
              }}
            >
              <Spin size="large" />
            </div>
          )}

        {structureQuery.error && (
          <Alert
            type="error"
            message="Не удалось загрузить структуру РЦ"
            description={structureQuery.error.message}
            showIcon
          />
        )}

        {structureQuery.data && (
          <>
            <Card
              title={`${structureQuery.data.code} — ${structureQuery.data.name}`}
              extra={
                permissions.canUpdate ? (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      setIsAttachDivisionOpen(true)
                    }
                  >
                    Подключить подразделение
                  </Button>
                ) : null
              }
            >
              <Typography.Text type="secondary">
                {structureQuery.data.city}
              </Typography.Text>
            </Card>

            {structureQuery.data.groups.length ===
            0 ? (
              <Empty description="К этому РЦ пока не подключены подразделения" />
            ) : (
              structureQuery.data.groups.map(
                (group) => (
                  <Card
                    key={group.id}
                    title={`${group.abbreviation} — ${group.name}`}
                  >
                    <Table<DistributionCenterStructureDivision>
                      rowKey="id"
                      dataSource={group.divisions}
                      pagination={false}
                      columns={[
                        {
                          title:
                            "Подразделение РЦ",
                          dataIndex: "name",
                        },
                        {
                          title:
                            "Глобальное подразделение",
                          dataIndex:
                            "division_id",
                          render: (
                            divisionId: number,
                          ) =>
                            divisionById.get(
                              divisionId,
                            )?.name ??
                            `ID ${divisionId}`,
                        },
                        {
                          title: "Должности",
                          dataIndex: "positions",
                          render: (
                            positions:
                              DistributionCenterStructureDivision["positions"],
                          ) =>
                            positions.length > 0 ? (
                              <Space wrap>
                                {positions.map(
                                  (position) => (
                                    <Tag
                                      key={position.id}
                                    >
                                      {position.name}
                                      {" · "}
                                      {
                                        positionCategoryLabels[
                                          position
                                            .category
                                        ]
                                      }
                                    </Tag>
                                  ),
                                )}
                              </Space>
                            ) : (
                              <Typography.Text type="secondary">
                                Нет должностей
                              </Typography.Text>
                            ),
                        },
                        {
                          title: "Действия",
                          key: "actions",
                          width: 120,
                          render: (
                            _,
                            centerDivision,
                          ) =>
                            permissions.canUpdate ? (
                              <Button
                                danger
                                icon={
                                  <DeleteOutlined />
                                }
                                loading={
                                  detachDivisionMutation.isPending &&
                                  detachDivisionMutation
                                    .variables
                                    ?.centerDivisionId ===
                                    centerDivision.id
                                }
                                onClick={() =>
                                  confirmDetachDivision(
                                    centerDivision,
                                  )
                                }
                              >
                                Отключить
                              </Button>
                            ) : null,
                        },
                      ]}
                    />
                  </Card>
                ),
              )
            )}
          </>
        )}
      </Space>

      <Modal
        title="Новый распределительный центр"
        open={isCreateCenterOpen}
        forceRender
        okText="Создать"
        cancelText="Отмена"
        confirmLoading={
          createCenterMutation.isPending
        }
        onOk={() => createCenterForm.submit()}
        onCancel={() => {
          setIsCreateCenterOpen(false);
          createCenterForm.resetFields();
        }}
      >
        <CenterForm
          form={createCenterForm}
          onFinish={(values) =>
            createCenterMutation.mutate(values)
          }
        />
      </Modal>

      <Modal
        title="Редактирование РЦ"
        open={editingCenter !== null}
        forceRender
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={
          updateCenterMutation.isPending
        }
        onOk={() => editCenterForm.submit()}
        onCancel={() => {
          setEditingCenter(null);
          editCenterForm.resetFields();
        }}
      >
        <CenterForm
          form={editCenterForm}
          onFinish={(values) => {
            if (!editingCenter) {
              return;
            }

            updateCenterMutation.mutate({
              centerId: editingCenter.id,
              data: values,
            });
          }}
        />
      </Modal>

      <Modal
        title="Подключение подразделения к РЦ"
        open={isAttachDivisionOpen}
        forceRender
        okText="Подключить"
        cancelText="Отмена"
        confirmLoading={
          attachDivisionMutation.isPending
        }
        onOk={() => attachDivisionForm.submit()}
        onCancel={() => {
          setIsAttachDivisionOpen(false);
          attachDivisionForm.resetFields();
        }}
      >
        <Form<CreateDistributionCenterDivisionRequest>
          form={attachDivisionForm}
          layout="vertical"
          onFinish={(values) => {
            if (selectedCenterId === undefined) {
              return;
            }

            attachDivisionMutation.mutate({
              centerId: selectedCenterId,
              data: values,
            });
          }}
        >
          <Form.Item
            label="Глобальное подразделение"
            name="division_id"
            rules={[
              {
                required: true,
                message:
                  "Выберите подразделение",
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Выберите подразделение"
              loading={divisionsQuery.isLoading}
              options={divisionsQuery.data?.map(
                (division) => ({
                  value: division.id,
                  label: division.name,
                }),
              )}
              onChange={(divisionId) => {
                const division =
                  divisionById.get(divisionId);

                const currentName =
                  attachDivisionForm.getFieldValue(
                    "name",
                  );

                if (division && !currentName) {
                  attachDivisionForm.setFieldValue(
                    "name",
                    division.name,
                  );
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label="Название в структуре РЦ"
            name="name"
            rules={[
              {
                required: true,
                message: "Введите название",
              },
              {
                max: 128,
                message: "Максимум 128 символов",
              },
            ]}
          >
            <Input placeholder="Отдел комплектации и отгрузки товара (1 смена)" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

type CenterFormProps = {
  form: ReturnType<
    typeof Form.useForm<CreateDistributionCenterRequest>
  >[0];
  onFinish: (
    values: CreateDistributionCenterRequest,
  ) => void;
};

function CenterForm({
  form,
  onFinish,
}: CenterFormProps) {
  return (
    <Form<CreateDistributionCenterRequest>
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        label="Код"
        name="code"
        normalize={(value: string) =>
          value?.toUpperCase()
        }
        rules={[
          {
            required: true,
            message: "Введите код РЦ",
          },
          {
            len: 3,
            message:
              "Код должен состоять из 3 символов",
          },
        ]}
      >
        <Input
          placeholder="NSK"
          maxLength={3}
        />
      </Form.Item>

      <Form.Item
        label="Название"
        name="name"
        rules={[
          {
            required: true,
            message: "Введите название РЦ",
          },
          {
            max: 32,
            message: "Максимум 32 символа",
          },
        ]}
      >
        <Input placeholder="Новосибирский РЦ" />
      </Form.Item>

      <Form.Item
        label="Город"
        name="city"
        rules={[
          {
            required: true,
            message: "Введите город",
          },
          {
            max: 32,
            message: "Максимум 32 символа",
          },
        ]}
      >
        <Input placeholder="Новосибирск" />
      </Form.Item>
    </Form>
  );
}