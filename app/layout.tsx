import { WalletWatcher } from "@/components/wallet-watcher";
import { BottomNav } from "@/components/layout/BottomNav";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OnchainProviders } from "@/components/OnchainProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  return {
    title: "Social Flow - Create Your Content",
    description:
      "Social Flow is an AI-powered platform designed to streamline social media content generation and automated posting. It integrates on-chain payment mechanisms for premium features and content management.",
    icons: {
      icon: "/logo-social-flow.png",
      apple: "/logo-social-flow.png",
    },
    other: {
      "base:app_id": "6975dc273a92926b661fd495",
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: `${URL}/logo-social-flow.png`,
        button: {
          title: `Launch Your Social Flow`,
          action: {
            type: "launch_miniapp",
            name: "Social Flow",
            url: URL,
            splashImageUrl: `${URL}/logo-social-flow.png`,
            splashBackgroundColor: "#000000",
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-100 flex justify-center min-h-screen`}
      >
        <OnchainProviders>
          {/* Mobile View Container */}
          <div className="w-full max-w-md h-[100dvh] bg-background relative flex flex-col shadow-2xl overflow-hidden [transform:translateZ(0)]">
            <style>{`
              @media (min-width: 768px) {
                .md\\:hidden {
                  display: block !important;
                }
              }
            `}</style>

            <WalletWatcher />

            <main className="flex-1 overflow-y-auto scrollbar-hide pb-14">
              {children}
            </main>

            <BottomNav />
          </div>
        </OnchainProviders>
      </body>
    </html>
  );
}
