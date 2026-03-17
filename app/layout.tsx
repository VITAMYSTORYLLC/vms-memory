import "./globals.css";
import BottomNav from "./components/BottomNav";
import { MemoryProvider } from "./context/MemoryContext";
import { GuestBanner } from "./components/GuestBanner";
import { MemoryFlash } from "./components/MemoryFlash";
import MilestoneWrapper from "./components/MilestoneWrapper";
import SplashScreen from "./components/SplashScreen";

export const metadata = {
  title: "VitaMyStory — Preserve Family Stories Forever",
  description: "A beautiful app to capture and preserve your family's stories, memories, and legacy — one guided question at a time.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VitaMyStory",
  },
  icons: {
    apple: "/icon-192x192.png",
  },
  openGraph: {
    type: "website",
    url: "https://vms-memory.vercel.app",
    title: "VitaMyStory — Preserve Family Stories Forever",
    description: "A beautiful app to capture and preserve your family's stories, memories, and legacy — one guided question at a time.",
    siteName: "VitaMyStory",
    images: [
      {
        url: "https://vms-memory.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "VitaMyStory — Where family stories live forever",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VitaMyStory — Preserve Family Stories Forever",
    description: "A beautiful app to capture and preserve your family's stories, memories, and legacy.",
    images: ["https://vms-memory.vercel.app/og-image.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F9F8F6",
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
          <SplashScreen />
          <GuestBanner />
          <MemoryFlash />
          {children}
          <BottomNav />
          <MilestoneWrapper />
        </MemoryProvider>
      </body>
    </html>
  );
}
