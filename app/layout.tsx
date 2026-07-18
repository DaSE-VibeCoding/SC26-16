import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = { title: "搭个伴 CampusMate", description: "校园活动搭子匹配平台" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProvider><Navigation />{children}</AppProvider>
      </body>
    </html>
  );
}
