import "./globals.css";
import React from "react";

export const metadata = {
  title: "VMS Mini App",
  description: "Stories & memories mini demo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

