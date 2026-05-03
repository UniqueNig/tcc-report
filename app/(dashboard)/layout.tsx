import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChurchReport — Reporting System",
  description: "A modern reporting system for church leadership",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div>{children}</div>;
}
