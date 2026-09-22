"use client";

import { useState } from "react";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleSubmit = async (
    values: LoginForm,
  ) => {
    setIsSubmitting(true);

    try {
      const tokens = await login(values);

      localStorage.setItem(
        "access_token",
        tokens.access_token,
      );

      router.replace("/admin");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось выполнить вход";

      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card style={{ width: 400 }}>
        <Typography.Title level={2}>
          Вход
        </Typography.Title>

        <Form<LoginForm>
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                type: "email",
                message: "Введите корректный email",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[
              {
                required: true,
                message: "Введите пароль",
              },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            block
          >
            Войти
          </Button>
        </Form>
      </Card>
    </main>
  );
}