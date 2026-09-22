"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Alert,
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Switch,
} from "antd";

import { getDistributionCenters } from "@/lib/api/organization";
import {
  createNotification,
  type NotificationCreate,
} from "@/lib/api/notifications";
import { getUsers } from "@/lib/api/users";

type NotificationCreateFormValues = {
  title: string;
  message: string;
  send_to_all: boolean;
  user_ids: number[];
  distribution_center_ids: number[];
  expires_at?: {
    toISOString: () => string;
  } | null;
};

type NotificationCreateFormProps = {
  onCreated?: () => void;
};

export function NotificationCreateForm({
  onCreated,
}: NotificationCreateFormProps) {
  const [form] =
    Form.useForm<NotificationCreateFormValues>();

  const sendToAll = Form.useWatch(
    "send_to_all",
    form,
  );

  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: [
      "users",
      "notification-recipients",
    ],
    queryFn: () => getUsers(1, 100),
  });

  const centersQuery = useQuery({
    queryKey: [
      "organization",
      "distribution-centers",
    ],
    queryFn: getDistributionCenters,
  });

  const createMutation = useMutation({
    mutationFn: createNotification,

    onSuccess: async (result) => {
      message.success(
        `Уведомление отправлено. Получателей: ${result.recipient_count}`,
      );

      form.resetFields();

      await queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });

      onCreated?.();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const error =
    usersQuery.error || centersQuery.error;

  if (error) {
    return (
      <Alert
        type="error"
        title="Не удалось загрузить получателей"
        description={error.message}
        showIcon
      />
    );
  }

  return (
    <Card title="Новое уведомление">
      <Form<NotificationCreateFormValues>
        form={form}
        layout="vertical"
        initialValues={{
          send_to_all: false,
          user_ids: [],
          distribution_center_ids: [],
        }}
        onFinish={(values) => {
          const hasAudience =
            values.send_to_all ||
            values.user_ids.length > 0 ||
            values.distribution_center_ids.length >
              0;

          if (!hasAudience) {
            message.error(
              "Выберите хотя бы одного получателя, РЦ или отправку всем",
            );
            return;
          }

          const request: NotificationCreate = {
            title: values.title,
            message: values.message,
            send_to_all: values.send_to_all,
            user_ids: values.send_to_all
              ? []
              : values.user_ids,
            distribution_center_ids:
              values.send_to_all
                ? []
                : values.distribution_center_ids,
            payload: null,
            expires_at:
              values.expires_at?.toISOString() ??
              null,
          };

          createMutation.mutate(request);
        }}
      >
        <Form.Item
          label="Заголовок"
          name="title"
          rules={[
            {
              required: true,
              message: "Введите заголовок",
            },
          ]}
        >
          <Input
            placeholder="Технические работы"
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="Сообщение"
          name="message"
          rules={[
            {
              required: true,
              message: "Введите сообщение",
            },
          ]}
        >
          <Input.TextArea
            placeholder="Введите текст уведомления"
            rows={5}
            maxLength={2000}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="Срок отображения"
          name="expires_at"
          extra="После этой даты уведомление может быть скрыто backend"
        >
          <DatePicker
            showTime
            format="DD.MM.YYYY HH:mm"
            placeholder="Без ограничения"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Отправить всем активным пользователям"
          name="send_to_all"
          valuePropName="checked"
        >
          <Switch
            onChange={(checked) => {
              if (checked) {
                form.setFieldsValue({
                  user_ids: [],
                  distribution_center_ids: [],
                });
              }
            }}
          />
        </Form.Item>

        <Form.Item
          label="Конкретные пользователи"
          name="user_ids"
        >
          <Select
            mode="multiple"
            allowClear
            showSearch
            optionFilterProp="label"
            disabled={sendToAll}
            loading={usersQuery.isLoading}
            placeholder="Выберите пользователей"
            options={(
              usersQuery.data?.items ?? []
            ).map((user) => ({
              value: user.id,
              label: `${user.email} · ${user.role.name}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Пользователи распределительных центров"
          name="distribution_center_ids"
        >
          <Select
            mode="multiple"
            allowClear
            showSearch
            optionFilterProp="label"
            disabled={sendToAll}
            loading={centersQuery.isLoading}
            placeholder="Выберите РЦ"
            options={(
              centersQuery.data ?? []
            ).map((center) => ({
              value: center.id,
              label: `${center.code} — ${center.name}, ${center.city}`,
            }))}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={createMutation.isPending}
        >
          Отправить уведомление
        </Button>
      </Form>
    </Card>
  );
}