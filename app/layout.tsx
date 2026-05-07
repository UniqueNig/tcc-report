import type { Metadata } from "next";
import { cookies } from "next/headers";
import AppProviders from "@/src/components/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "TCC Reports",
  title: {
    default: "The Communion Centre Reports",
    template: "%s | TCC Reports",
  },
  description: "Reporting system for The Communion Centre unit leadership",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TCC Reports",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const storedTheme = cookieStore.get("theme")?.value;
  const htmlClassName =
    storedTheme === "dark" ? "h-full antialiased dark" : "h-full antialiased";

  return (
    <html lang="en" className={htmlClassName} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
