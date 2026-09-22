import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";

import { Providers } from "@/components/providers";
import { QueryProvider } from "@/components/query-provider";

export const metadata: Metadata = {
  title: "Logistic CRM",
  description: "Logistic CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <AntdRegistry>
          <Providers>
            <QueryProvider>{children}</QueryProvider>
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}