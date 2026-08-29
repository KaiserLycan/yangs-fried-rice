import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yang's Fried Rice",
  description: "Order online for pickup or delivery from Yang's Fried Rice.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
