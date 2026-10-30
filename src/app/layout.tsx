import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "OnePageLaunch – Launch Stunning Sites, Brick by Brick",
  description: "Build stunning, block-style one-page websites for your side projects in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        {/* Offset keeps toasts below the editor toolbar */}
        <Toaster position="top-right" richColors offset={{ top: 64 }} />
      </body>
    </html>
  );
}
