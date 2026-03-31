import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import { MemoryProvider } from "@/context/MemoryContext";
import { GuestBanner } from "@/features/auth/GuestBanner";
import { MemoryFlash } from "@/features/stories/MemoryFlash";
import MilestoneWrapper from "@/features/milestones/MilestoneWrapper";
import SplashScreen from "@/components/layout/SplashScreen";
import { FirebaseErrorGuard } from "@/components/layout/FirebaseErrorGuard";

export const metadata = {
  title: "VitaMyStory — Preserve Family Stories Forever",
  description: "A beautiful app to capture and preserve your family's stories, memories, and legacy — one guided question at a time.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VMS",
  },
  openGraph: {
    type: "website",
    url: "https://vms-memory.vercel.app",
    title: "VitaMyStory — Preserve Family Stories Forever",
    description: "A beautiful app to capture and preserve your family's stories, memories, and legacy — one guided question at a time.",
    siteName: "VitaMyStory",
    images: [
      {
        url: "https://vms-memory.vercel.app/assets/images/og-image.png",
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
    images: ["https://vms-memory.vercel.app/assets/images/og-image.png"],
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('vms_theme');if(s==='dark'){document.documentElement.classList.add('dark')}else if(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="pb-16 mobile-safe-area bg-[#F9F8F6] dark:bg-midnight-950">
        <MemoryProvider>
          <FirebaseErrorGuard />
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
