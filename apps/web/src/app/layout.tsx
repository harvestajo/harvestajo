import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { ToastProvider } from "@/components/providers/ToastProvider";

export const metadata: Metadata = {
  title: "HarvestAjo — Plant together. Harvest together.",
  description:
    "Trustless rotating savings circles on Stellar. Save in dollars, contribute via Naira.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-harvest-50 text-soil-800 antialiased">
        <ToastProvider>
          <Header />
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
          <footer className="border-t border-harvest-200 mt-16">
            <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-soil-500">
                <span>{"\u{1F33E}"}</span>
                <span className="font-medium">HarvestAjo</span>
                <span className="text-soil-300">|</span>
                <span>Trustless rotating savings on Stellar</span>
              </div>
              <span className="text-xs text-soil-400">MIT License</span>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
