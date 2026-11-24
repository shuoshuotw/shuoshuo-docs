import { i18nProvider } from "fumadocs-ui/i18n";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Motion } from "@/components/motion";
import { Providers } from "@/components/providers";
import { translations } from "@/lib/translations";
import "./global.css";

export const metadata: Metadata = {
  title: { default: "說說 API 文件", template: "%s · 說說 API 文件" },
  description: "說說的 API 文件：取一句繁體中文的短句，只要一行指令。",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    // Smooth jumps within a page (the contents' links), and Next turns it off while it changes page (version 16)
    <html lang="zh-Hant-TW" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link href="https://font.emtech.cc/css/NotoSansTC/400" rel="stylesheet" />
        <link href="https://font.emtech.cc/css/NotoSansTC/700" rel="stylesheet" />
        <link href="https://font.emtech.cc/css/ChenYuLuoYan/100" rel="stylesheet" />
      </head>
      <body>
        <Providers i18n={i18nProvider(translations)}>
          {children}
          <Motion />
        </Providers>
      </body>
    </html>
  );
}
