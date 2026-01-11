import "./globals.css";
import BottomNav from "./components/BottomNav";

import { MemoryProvider } from "./context/MemoryContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="pb-16 mobile-safe-area"><MemoryProvider>{children}<BottomNav /></MemoryProvider></body>
    </html>
  );
}
