"use client";

import { supabase } from "@/supabase/client";

import { PlatformSelector } from "@/components/generator/PlatformSelector";
import { PromptInput } from "@/components/generator/PromptInput";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { PreviewPanel } from "@/components/generator/PreviewPanel";
import { Toast } from "@/components/ui/Toast";

function GeneratorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive platform from URL or default to linkedin
  const platformParam = searchParams.get("platform");
  const selectedPlatform = platformParam || "twitter";

  const handlePlatformSelect = (platform: string) => {
    // Update URL without reloading
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("platform", platform);
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const [prompt, setPrompt] = useState("");
  // Removed original selectedPlatform state definition since we moved it up

  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  const account = useActiveAccount();
  // Removed duplicate searchParams declaration since we moved it up

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
    } catch (error: any) {
      console.error("Error saving to localStorage:", error);
      setToast({
        show: true,
        message: "Failed to save instruction locally",
        type: "error",
      });
    }
  };

  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const fetchCredits = async (userId: string) => {
    try {
      const res = await fetch(`/api/user/profile?userId=${userId}`);
      const data = await res.json();
      if (data.credits !== undefined) {
        setCredits(data.credits);
      }
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    }
  };

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
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isConnected = !!user;

  const handleGenerate = async () => {
    if (!isConnected) {
      setToast({
        show: true,
        message: "Please sign in with Google to generate content",
        type: "error",
      });
      return;
    }

    if (!prompt) return;

    setIsLoading(true);
    setIsEditing(false);
    setGeneratedContent("");

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
          userId: user?.id, // Pass userId for credit tracking if needed
        }),
      });

      const data = await response.json();

      if (data.result) {
        setGeneratedContent(data.result);
        // Refresh credits after successful generation
        if (user) fetchCredits(user.id);

        // Dispatch a custom event to notify other components (like Header/Profile) to refresh
        window.dispatchEvent(new Event("creditsUpdated"));
      } else {
        console.error("Failed to generate content");
        setToast({
          show: true,
          message:
            data.message || "Failed to generate content. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error generating content:", error);
      setToast({
        show: true,
        message: "Error generating content. Please try again.",
        type: "error",
      });
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
      // 1. Check Cookies for Twitter (OAuth)
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

      // Check Threads Cookies
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

      // 2. Check Supabase (DB) - REMOVED as per request
      // if (account?.address) {
      //   const { data, error } = await supabase
      //     .from("user_connections")
      //     .select("platform")
      //     .eq("wallet_address", account.address);
      //   if (!error && data) {
      //     data.forEach((c) => {
      //       if (!platforms.includes(c.platform)) {
      //         platforms.push(c.platform);
      //       }
      //     });
      //   }
      // }

      setConnectedPlatforms(platforms);
      setConnectedUsernames(usernames);

      // Restore pending post if exists and we are on the correct platform
      const urlPlatform = searchParams.get("platform");
      const isConnectedParam = searchParams.get("connected") === "true";

      if (isConnectedParam && urlPlatform && platforms.includes(urlPlatform)) {
        // Platform selection is handled by the useEffect above

        // Restore pending post if exists
        const pendingPost = localStorage.getItem("pending_post");
        if (pendingPost) {
          try {
            const parsed = JSON.parse(pendingPost);
            if (parsed.platform === urlPlatform && parsed.content) {
              setGeneratedContent(parsed.content);
              setPrompt(parsed.prompt || "Auto-restored draft");

              // Clear it so we don't restore it forever
              localStorage.removeItem("pending_post");
            }
          } catch (e) {
            console.error("Failed to parse pending post", e);
          }
        }
      }
    };

    fetchConnections();
  }, [account?.address, searchParams]);

  const handleDisconnect = async (platform: string) => {
    try {
      await fetch("/api/auth/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform }),
      });

      // Update local state
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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Header />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Inputs */}
            <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <div className="flex items-center justify-between">
                <h1 className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-white">
                  Automate your social media posts
                </h1>
              </div>

              <PromptInput
                value={prompt}
                onChange={setPrompt}
                isConnected={isConnected}
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Generating..." : "Generate"}
              </button>

              <div className="mt-2 flex items-center gap-3 rounded-lg border border-zinc-100 p-4 dark:border-zinc-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 text-green-600 dark:text-green-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.857 5.428a.75.75 0 00-1.214-.856L9.336 9.879 7.357 7.857a.75.75 0 00-1.072 1.05l2.536 2.536a.75.75 0 001.072 0l4.964-5.015z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Secure Transactions
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Payments are processed directly via smart contracts.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Preview */}
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
                  router.refresh();
                  if (user?.id) {
                    fetchCredits(user.id);
                  }
                }}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onContentChange={setGeneratedContent}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}

export default function GeneratorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GeneratorContent />
    </Suspense>
  );
}
