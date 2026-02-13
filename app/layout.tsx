import "./globals.css";
import BottomNav from "./components/BottomNav";
import { MemoryProvider } from "./context/MemoryContext";

export const metadata = {
  title: "VitaMyStory",
  description: "Preserve your family stories forever.",
  manifest: "/manifest.json",
  themeColor: "#F9F8F6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VitaMyStory",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zoom on mobile for native app feel
  },
  icons: {
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="pb-16 mobile-safe-area">
        <MemoryProvider>
          {children}
          <BottomNav />
        </MemoryProvider>
      </body>
    </html>
  );
}
