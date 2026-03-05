import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "iBlog",
  description: "A micro-blog platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        <Providers>
          <Header />
          <main className="container mx-auto px-4 py-8 max-w-3xl">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
