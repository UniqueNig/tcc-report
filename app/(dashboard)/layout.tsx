import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "The Communion Centre reporting dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div>{children}</div>;
}
