import { i18nProvider } from "fumadocs-ui/i18n";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { translations } from "@/lib/translations";
import "./global.css";

export const metadata: Metadata = {
  title: { default: "說說 API 文件", template: "%s · 說說 API 文件" },
  description: "說說的 API 文件：取一句繁體中文的短句，只要一行指令。",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant-TW" suppressHydrationWarning>
      <head>
        <link href="https://font.emtech.cc/css/NotoSansTC/400" rel="stylesheet" />
        <link href="https://font.emtech.cc/css/NotoSansTC/700" rel="stylesheet" />
      </head>
      <body>
        <RootProvider i18n={i18nProvider(translations)} search={{ options: { type: "static" } }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
