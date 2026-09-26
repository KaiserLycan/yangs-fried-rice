import type { Metadata } from "next";
import { Anton, DM_Sans } from "next/font/google";
import "./globals.css";

// Anton is display-only in the design (headings, the wordmark) and ships a
// single weight. DM Sans carries all body copy and is a variable font, so it
// needs no explicit weight list.
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yang's Fried Rice",
  description: "Order online for pickup or delivery from Yang's Fried Rice.",
};

import { ToastProvider } from "@/components/ui/toast";
import { ShortcutsHelp } from "@/components/ui/shortcuts-help";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${anton.variable} ${dmSans.variable}`}>
      <body>
        <ToastProvider>
          {children}
          <ShortcutsHelp />
        </ToastProvider>
      </body>
    </html>
  );
}
