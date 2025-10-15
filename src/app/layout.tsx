import React from "react";
import "antd/dist/reset.css";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import StoreProvider from "./StoreProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Thabicare - Trị liệu đông y, khỏe bên trong, đẹp bên ngoài</title>
        <meta
          name="description"
          content="Thabicare - Trị liệu đông y, khỏe bên trong, đẹp bên ngoài"
        />
        <link rel="icon" href="/logo.png" />
      </head>
      <body>
        <StoreProvider>
          <AntdRegistry>{children}</AntdRegistry>
        </StoreProvider>
      </body>
    </html>
  );
}
