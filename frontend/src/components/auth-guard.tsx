"use client";

import { Spin } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/hooks/use-current-user";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({
  children,
}: AuthGuardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
  } = useCurrentUser();

  useEffect(() => {
    if (!isError) {
      return;
    }

    localStorage.removeItem("access_token");
    queryClient.clear();
    router.replace("/login");
  }, [isError, queryClient, router]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}