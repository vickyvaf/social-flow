"use client";

import { PlatformSelector } from "@/components/generator/PlatformSelector";
import { PreviewPanel } from "@/components/generator/PreviewPanel";
import { PromptInput } from "@/components/generator/PromptInput";
import { Header } from "@/components/layout/Header";
import { Toast } from "@/components/ui/Toast";
import { PaymentModal } from "@/components/PaymentModal";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useCanAffordGeneration } from "@/hooks/useIDRX";
import { sdk } from "@farcaster/miniapp-sdk";
import { User } from "@supabase/supabase-js";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAccount } from "wagmi";

function GeneratorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive platform from URL or default to twitter
  const platformParam = searchParams.get("platform");
  const selectedPlatform = platformParam || "twitter";

  const handlePlatformSelect = (platform: string) => {
    // Update URL without reloading
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("platform", platform);
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });
  const [systemInstructions, setSystemInstructions] = useState<
    Record<string, string>
  >({
    linkedin: `You are a professional LinkedIn content creator. Create detailed, insightful posts that focus on industry trends, professional development, and business value. Use a professional yet engaging tone. Include relevant hashtags and structure the post for maximum readability.`,
    instagram: `You are an Instagram content expert. Create visually descriptive and engaging captions. Use emojis, a casual and fun tone, and include a mix of popular and niche hashtags. Focus on storytelling and encouraging audience interaction.`,
    threads: `You are a Threads enthusiast. Create short, conversational, and punchy posts that spark discussion. Keep it concise, authentic, and slightly informal. Encourage replies and engagement.`,
    twitter: `You are a Twitter power user. Create a single, punchy tweet. Do NOT use threads. Focus on viral potential.`,
  });

  const { address } = useAccount();

  // Dark mode effect from original page.tsx
  useEffect(() => {
    try {
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch (e) { }
  }, []);

  // Farcaster SDK effect from original page.tsx
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  // Load system instructions from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("promptdesk_system_instructions");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSystemInstructions((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
    } catch (error) {
      console.error(
        "Error loading system instructions from localStorage:",
        error,
      );
    }
  }, []);

  const handleSaveInstruction = (platform: string, instruction: string) => {
    try {
      const newInstructions = {
        ...systemInstructions,
        [platform]: instruction,
      };

      setSystemInstructions(newInstructions);
      localStorage.setItem(
        "promptdesk_system_instructions",
        JSON.stringify(newInstructions),
      );
    } catch (error: unknown) {
      console.error("Error saving to localStorage:", error);
      setToast({
        show: true,
        message: "Failed to save instruction locally",
        type: "error",
      });
    }
  };

  const [user, setUser] = useState<User | null>(null);

  // Use our custom hook for auth
  const { user: walletUser, loading: authLoading } = useWalletAuth();
  const { canAfford, needsApproval } = useCanAffordGeneration();

  useEffect(() => {
    if (walletUser) {
      setUser(walletUser);
    } else if (!authLoading && !walletUser) {
      setUser(null);
    }
  }, [walletUser, authLoading]);

  /* 
  // Commenting out conflicting direct Supabase usage to avoid double-fetching or conflicts
  // We will rely on useWalletAuth which internally does the profile lookup
  /*
  useEffect(() => {
    // Check Supabase session
    async function getSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchCredits(user.id);
      }
    }
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchCredits(currentUser.id);
      } else {
        setCredits(null);
        // Removed router.push("/") because we are already at the root
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  */

  const isConnected = !!user || !!address;

  const handleGenerate = async () => {
    if (!isConnected) {
      setToast({
        show: true,
        message: "Please connect your wallet to generate content",
        type: "error",
      });
      return;
    }

    if (!prompt) return;

    // Check if user can afford and has approval
    if (!canAfford) {
      setToast({
        show: true,
        message: "Insufficient IDRX balance. Please top up your wallet.",
        type: "error",
      });
      return;
    }

    if (needsApproval) {
      // Show payment modal for approval + payment
      setIsPaymentModalOpen(true);
      return;
    }

    // If already approved, show payment modal for transfer
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    // After payment successful, proceed with generation
    setIsLoading(true);
    setIsEditing(false);
    setShowPreview(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          platform: selectedPlatform,
          systemInstruction: systemInstructions[selectedPlatform],
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.result) {
        setGeneratedContent(data.result);
      } else {
        console.error("Failed to generate content");
        setToast({
          show: true,
          message:
            data.message || "Failed to generate content. Please try again.",
          type: "error",
        });
        setShowPreview(false);
      }
    } catch (error: unknown) {
      console.error("Error generating content:", error);
      setToast({
        show: true,
        message: "Error generating content. Please try again.",
        type: "error",
      });
      setShowPreview(false);
    } finally {
      setIsLoading(false);
    }
  };

  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [connectedUsernames, setConnectedUsernames] = useState<
    Record<string, string>
  >({});

  // Fetch connected platforms
  useEffect(() => {
    const fetchConnections = async () => {
      const cookies = document.cookie.split("; ");
      const isTwitterConnected = cookies.find((row) =>
        row.startsWith("twitter_is_connected="),
      );
      const twitterUsernameCookie = cookies.find((row) =>
        row.startsWith("twitter_username="),
      );

      const platforms: string[] = [];
      const usernames: Record<string, string> = {};

      if (isTwitterConnected) {
        platforms.push("twitter");
        if (twitterUsernameCookie) {
          usernames["twitter"] = decodeURIComponent(
            twitterUsernameCookie.split("=")[1],
          );
        }
      }

      const isThreadsConnected = cookies.find((row) =>
        row.startsWith("threads_is_connected="),
      );
      const threadsUsernameCookie = cookies.find((row) =>
        row.startsWith("threads_username="),
      );

      if (isThreadsConnected) {
        platforms.push("threads");
        if (threadsUsernameCookie) {
          usernames["threads"] = decodeURIComponent(
            threadsUsernameCookie.split("=")[1],
          );
        }
      }

      const isLinkedinConnected = cookies.find((row) =>
        row.startsWith("linkedin_is_connected="),
      );
      const linkedinUsernameCookie = cookies.find((row) =>
        row.startsWith("linkedin_username="),
      );

      if (isLinkedinConnected) {
        platforms.push("linkedin");
        if (linkedinUsernameCookie) {
          usernames["linkedin"] = decodeURIComponent(
            linkedinUsernameCookie.split("=")[1],
          );
        }
      }

      setConnectedPlatforms(platforms);
      setConnectedUsernames(usernames);

      const urlPlatform = searchParams.get("platform");
      const isConnectedParam = searchParams.get("connected") === "true";

      if (isConnectedParam && urlPlatform && platforms.includes(urlPlatform)) {
        const pendingPost = localStorage.getItem("pending_post");
        if (pendingPost) {
          try {
            const parsed = JSON.parse(pendingPost);
            if (parsed.platform === urlPlatform && parsed.content) {
              setGeneratedContent(parsed.content);
              setPrompt(parsed.prompt || "Auto-restored draft");
              localStorage.removeItem("pending_post");
            }
          } catch (e) {
            console.error("Failed to parse pending post", e);
          }
        }
      }
    };

    fetchConnections();
  }, [address, searchParams]);

  const handleDisconnect = async (platform: string) => {
    try {
      await fetch("/api/auth/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform }),
      });

      setConnectedPlatforms((prev) => prev.filter((p) => p !== platform));
      setConnectedUsernames((prev) => {
        const newUsernames = { ...prev };
        delete newUsernames[platform];
        return newUsernames;
      });

      setToast({
        show: true,
        message: `Disconnected from ${platform}`,
        type: "success",
      });
    } catch (error) {
      console.error("Error disconnecting:", error);
      setToast({
        show: true,
        message: "Failed to disconnect",
        type: "error",
      });
    }
  };

  const handleConnect = (platform: string) => {
    window.location.href = `/api/auth/${platform}`;
  };

  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-black">
      <Header />

      <main className="flex-1 p-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mx-auto w-full max-w-3xl">
            {!showPreview && (
              <div className="h-[calc(100vh-160px)] overflow-y-auto flex flex-col gap-3 rounded-2xl bg-white px-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                <PromptInput
                  value={prompt}
                  onChange={setPrompt}
                  isConnected={isConnected}
                  hasContent={!!generatedContent}
                  onNext={() => setShowPreview(true)}
                />

                <PlatformSelector
                  selected={selectedPlatform}
                  onSelect={handlePlatformSelect}
                  systemInstructions={systemInstructions}
                  setSystemInstructions={setSystemInstructions}
                  isSettingsOpen={isSettingsOpen}
                  setIsSettingsOpen={setIsSettingsOpen}
                  selectedPlatform={selectedPlatform}
                  // @ts-ignore
                  onSaveInstruction={handleSaveInstruction}
                  // @ts-ignore
                  connectedPlatforms={connectedPlatforms}
                  connectedUsernames={connectedUsernames}
                  onDisconnect={handleDisconnect}
                  onConnect={handleConnect}
                  isConnected={isConnected}
                />

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Generating..." : "Generate"}
                </button>

                <button
                  onClick={() => {
                    setGeneratedContent(prompt || "");
                    setIsEditing(true);
                    setShowPreview(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-base font-semibold text-zinc-900 transition-all hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Write manually
                </button>
              </div>
            )}

            {showPreview && (
              <div className="flex flex-col gap-4">
                <PreviewPanel
                  isLocked={!isConnected}
                  isConnected={isConnected}
                  content={generatedContent}
                  prompt={prompt}
                  platform={selectedPlatform}
                  address={user?.id}
                  isLoading={isLoading}
                  // @ts-ignore
                  isPlatformConnected={connectedPlatforms.includes(
                    selectedPlatform,
                  )}
                  connectedPlatforms={connectedPlatforms}
                  onPostSuccess={() => {
                    setGeneratedContent("");
                    setPrompt("");
                    setShowPreview(false);
                    router.push("/posts");
                  }}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  onContentChange={setGeneratedContent}
                  onBack={() => {
                    setShowPreview(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        userId={user?.id}
        onSuccess={handlePaymentSuccess}
        description="Generate Social Media Content"
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <Image
          src="/logo-social-flow.png"
          alt="Logo"
          width={100}
          height={100}
          className="mx-auto mt-40"
        />
      }
    >
      <GeneratorContent />
    </Suspense>
  );
}
