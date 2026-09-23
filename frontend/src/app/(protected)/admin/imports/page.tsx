"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload,
} from "antd";
import {
  FileExcelOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import type {
  ColumnsType,
  TablePaginationConfig,
} from "antd/es/table";

import { useCurrentUser } from "@/hooks/use-current-user";
import {
  createOnboardingImportPreview,
  executeOnboardingImport,
  getImportJob,
  getImportJobRows,
  type ImportJobRow,
  type ImportRowStatus,
} from "@/lib/api/data-imports";
import { hasPermission } from "@/lib/permissions";

const importRowStatusLabels:
  Record<ImportRowStatus, string> = {
    valid: "Готова",
    warning: "Предупреждение",
    error: "Ошибка",
    imported: "Импортирована",
    skipped: "Пропущена",
  };


const importRowStatusColors:
  Record<ImportRowStatus, string> = {
    valid: "success",
    warning: "warning",
    error: "error",
    imported: "blue",
    skipped: "default",
  };


function displayValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}


export default function DataImportsPage() {
  const [messageApi, contextHolder] =
    message.useMessage();

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [importJobId, setImportJobId] =
    useState<number>();

  const [rowStatus, setRowStatus] =
    useState<ImportRowStatus>();

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] =
    useState(50);

  const { data: currentUser } =
    useCurrentUser();

  const canRead =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "imports.read",
    );

  const canCreate =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "imports.create",
    );

    const canExecute =
      currentUser !== undefined &&
      hasPermission(
        currentUser.permissions,
        "imports.execute",
      );

  const previewMutation = useMutation({
    mutationFn:
      createOnboardingImportPreview,

    onSuccess: (importJob) => {
      setImportJobId(importJob.id);
      setRowStatus(undefined);
      setPage(1);

      messageApi.success(
        "Файл проверен",
      );
    },

    onError: (error) => {
      messageApi.error(
        error instanceof Error
          ? error.message
          : "Не удалось проверить файл",
      );
    },
  });

  const importJobQuery = useQuery({
    queryKey: [
      "import-job",
      importJobId,
    ],

    queryFn: () =>
      getImportJob(importJobId!),

    enabled:
      canRead &&
      importJobId !== undefined,
  })

  const rowsQuery = useQuery({
    queryKey: [
      "import-job-rows",
      importJobId,
      page,
      pageSize,
      rowStatus,
    ],

    queryFn: () =>
      getImportJobRows({
        importJobId: importJobId!,
        page,
        pageSize,
        status: rowStatus,
      }),

    enabled:
      canRead &&
      importJobId !== undefined,
  });

    const executeMutation = useMutation({
      mutationFn: executeOnboardingImport,

      onSuccess: async () => {
        messageApi.success(
          "Данные успешно импортированы",
        );

        setRowStatus(undefined);
        setPage(1);

        await Promise.all([
          importJobQuery.refetch(),
          rowsQuery.refetch(),
        ]);
      },

      onError: async (error) => {
        await importJobQuery.refetch();

        messageApi.error(
          error instanceof Error
            ? error.message
            : "Не удалось выполнить импорт",
        );
      },
    });

    const importJob =
      importJobQuery.data ??
      executeMutation.data ??
      previewMutation.data;

  const columns:
    ColumnsType<ImportJobRow> = [
      {
        title: "Строка Excel",
        dataIndex: "excel_row_number",
        width: 120,
        fixed: "left",
      },
      {
        title: "ID",
        dataIndex: "source_row_id",
        width: 100,
        render: displayValue,
      },
      {
        title: "Статус",
        dataIndex: "status",
        width: 160,
        render: (
          value: ImportRowStatus,
        ) => (
          <Tag
            color={
              importRowStatusColors[value]
            }
          >
            {
              importRowStatusLabels[value]
            }
          </Tag>
        ),
      },
      {
        title: "РЦ",
        width: 180,
        render: (_, row) =>
          displayValue(
            row.normalized_data
              ?.distribution_center,
          ),
      },
      {
        title: "Подразделение",
        width: 300,
        render: (_, row) =>
          displayValue(
            row.normalized_data
              ?.distribution_center_division,
          ),
      },
      {
        title: "Табельный номер",
        width: 170,
        render: (_, row) =>
          displayValue(
            row.normalized_data
              ?.personnel_number,
          ),
      },
      {
        title: "Сотрудник",
        width: 260,
        render: (_, row) =>
          displayValue(
            row.normalized_data
              ?.employee_name,
          ),
      },
      {
        title: "Должность",
        width: 230,
        render: (_, row) =>
          displayValue(
            row.normalized_data
              ?.position_name,
          ),
      },
      {
        title: "Дата ТУ",
        width: 130,
        render: (_, row) =>
          displayValue(
            row.normalized_data
              ?.hire_date,
          ),
      },
      {
        title: "Ошибки",
        width: 340,
        render: (_, row) =>
          row.errors.length > 0
            ? row.errors.join("; ")
            : "—",
      },
      {
        title: "Предупреждения",
        width: 380,
        render: (_, row) =>
          row.warnings.length > 0
            ? row.warnings.join("; ")
            : "—",
      },
    ];

  const handlePreview = () => {
    if (!selectedFile) {
      messageApi.warning(
        "Выберите Excel-файл",
      );

      return;
    }

    previewMutation.mutate(
      selectedFile,
    );
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
  ) => {
    setPage(
      pagination.current ?? 1,
    );

    setPageSize(
      pagination.pageSize ?? 50,
    );
  };

  if (
    currentUser !== undefined &&
    !canRead
  ) {
    return (
      <Alert
        type="error"
        title="Недостаточно прав"
        description={
          "Нет разрешения imports.read"
        }
        showIcon
      />
    );
  }

  return (
    <Space
      orientation="vertical"
      size="large"
      style={{ width: "100%" }}
    >
      {contextHolder}

      <div>
        <Typography.Title
          level={2}
          style={{ marginBottom: 4 }}
        >
          Импорт данных
        </Typography.Title>

        <Typography.Text type="secondary">
          Проверка и загрузка исторических
          данных вводного обучения и адаптации
        </Typography.Text>
      </div>

      <Card title="Загрузка файла ВА">
        <Space
          orientation="vertical"
          size="middle"
          style={{ width: "100%" }}
        >
          <Upload.Dragger
            accept=".xlsx,.xlsm"
            multiple={false}
            maxCount={1}
            showUploadList={false}
            disabled={
              !canCreate ||
              previewMutation.isPending
            }
            beforeUpload={(file) => {
              setSelectedFile(file);
              setImportJobId(undefined);

              previewMutation.reset();

              return false;
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>

            <p className="ant-upload-text">
              Выберите или перетащите
              Excel-файл
            </p>

            <p className="ant-upload-hint">
              Поддерживаются .xlsx и .xlsm.
              Будет прочитан лист ВА,
              столбцы A–CD.
            </p>
          </Upload.Dragger>

          {selectedFile && (
            <Alert
              type="info"
              showIcon
              icon={<FileExcelOutlined />}
              title={selectedFile.name}
              description={
                `${(
                  selectedFile.size /
                  1024 /
                  1024
                ).toFixed(2)} МБ`
              }
            />
          )}

          <Button
            type="primary"
            onClick={handlePreview}
            loading={
              previewMutation.isPending
            }
            disabled={
              !selectedFile ||
              !canCreate
            }
          >
            Проверить файл
          </Button>
        </Space>
      </Card>

      {importJob && (
        <>
          <Alert
            type={
              importJob.error_rows > 0
                ? "error"
                : importJob.warning_rows > 0
                  ? "warning"
                  : "success"
            }
            showIcon
            title={
              importJob.error_rows > 0
                ? (
                    "Файл содержит строки, " +
                    "которые нельзя импортировать"
                  )
                : (
                    "Предварительная проверка " +
                    "завершена"
                  )
            }
            description={
              "Основные данные CRM пока " +
              "не изменены."
            }
          />

          <Card>
              <Descriptions
                size="small"
                column={{
                  xs: 1,
                  sm: 2,
                  lg: 3,
                }}
                items={[
                  {
                    key: "job",
                    label: "Задание",
                    children: importJob.id,
                  },
                  {
                    key: "filename",
                    label: "Файл",
                    children: importJob.filename,
                  },
                  {
                    key: "sheet",
                    label: "Лист",
                    children: importJob.sheet_name,
                  },
                ]}
              />

              <Row
                gutter={[16, 16]}
                style={{ marginTop: 24 }}
              >
                <Col xs={12} md={6}>
                  <Statistic
                    title="Всего строк"
                    value={importJob.total_rows}
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Statistic
                    title="Готовы"
                    value={importJob.valid_rows}
                    styles={{
                      content: {
                        color: "#389e0d",
                      },
                    }}
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Statistic
                    title="Предупреждения"
                    value={importJob.warning_rows}
                    styles={{
                      content: {
                        color: "#faad14",
                      },
                    }}
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Statistic
                    title="Ошибки"
                    value={importJob.error_rows}
                    styles={{
                      content: {
                        color: "#ff4d4f",
                      },
                    }}
                  />
                </Col>
              </Row>

              {/* ВСТАВИТЬ КНОПКУ ИМЕННО СЮДА */}

              {importJob.status === "ready" && (
                <div style={{ marginTop: 24 }}>
                  <Popconfirm
                    title="Импортировать данные?"
                    description={
                      <>
                        Будут импортированы{" "}
                        {importJob.valid_rows +
                          importJob.warning_rows}{" "}
                        строк. Строки с ошибками:{" "}
                        {importJob.error_rows} — будут
                        пропущены.
                      </>
                    }
                    okText="Импортировать"
                    cancelText="Отмена"
                    onConfirm={() => {
                      executeMutation.mutate(
                        importJob.id,
                      );
                    }}
                  >
                    <Button
                      type="primary"
                      disabled={!canExecute}
                      loading={
                        executeMutation.isPending
                      }
                    >
                      Импортировать корректные строки
                    </Button>
                  </Popconfirm>
                </div>
              )}

              {importJob.status === "completed" && (
                <Alert
                  type="success"
                  showIcon
                  style={{ marginTop: 24 }}
                  title="Импорт завершён"
                  description={
                    `Импортировано строк: ${
                      importJob.imported_rows
                    }. Ошибочные строки пропущены: ${
                      importJob.error_rows
                    }.`
                  }
                />
              )}

              {importJob.status === "failed" && (
                <Alert
                  type="error"
                  showIcon
                  style={{ marginTop: 24 }}
                  title="Импорт не выполнен"
                  description={
                    importJob.error_message ??
                    "Произошла неизвестная ошибка"
                  }
                />
              )}
            </Card>

          <Card
            title="Строки файла"
            extra={
              <Select
                allowClear
                value={rowStatus}
                placeholder="Все статусы"
                style={{ width: 210 }}
                options={[
                  {
                    value: "valid",
                    label: "Готовые",
                  },
                  {
                    value: "warning",
                    label:
                      "С предупреждениями",
                  },
                  {
                    value: "error",
                    label: "С ошибками",
                  },
                ]}
                onChange={(value) => {
                  setRowStatus(value);
                  setPage(1);
                }}
              />
            }
          >
            {rowsQuery.error && (
              <Alert
                type="error"
                title={
                  "Не удалось загрузить строки"
                }
                description={
                  rowsQuery.error.message
                }
                showIcon
                style={{
                  marginBottom: 16,
                }}
              />
            )}

            <Table<ImportJobRow>
              rowKey="id"
              bordered
              size="small"
              columns={columns}
              dataSource={
                rowsQuery.data?.items ?? []
              }
              loading={
                rowsQuery.isLoading
              }
              scroll={{
                x: "max-content",
                y: "calc(100vh - 520px)",
              }}
              pagination={{
                current:
                  rowsQuery.data?.page ??
                  page,
                pageSize:
                  rowsQuery.data
                    ?.page_size ??
                  pageSize,
                total:
                  rowsQuery.data?.total ??
                  0,
                showSizeChanger: true,
                pageSizeOptions: [
                  20,
                  50,
                  100,
                  200,
                ],
                showTotal: (total) =>
                  `Всего: ${total}`,
              }}
              locale={{
                emptyText:
                  "Строки не найдены",
              }}
              onChange={
                handleTableChange
              }
            />
          </Card>
        </>
      )}
    </Space>
  );
}