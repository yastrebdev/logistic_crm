"use client";

import { Button, Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card style={{ width: 500 }}>
        <Title level={2}>Logistic CRM</Title>

        <Paragraph>
          Система управления логистикой и задачами.
        </Paragraph>

        <Button
          type="primary"
          href="/login"
        >
          Войти
        </Button>
      </Card>
    </main>
  );
}