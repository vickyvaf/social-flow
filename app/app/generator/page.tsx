"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptInput } from "@/components/generator/PromptInput";
import { PlatformSelector } from "@/components/generator/PlatformSelector";

import { PreviewPanel } from "@/components/generator/PreviewPanel";

export default function GeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("linkedin");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  const account = useActiveAccount();

  const handleGenerate = async () => {
    if (!prompt) return;

    setIsLoading(true);
    setGeneratedContent("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data.result) {
        setGeneratedContent(data.result);
      } else {
        console.error("Failed to generate content");
      }
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Header />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Inputs */}
            <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Create Social Content
              </h1>

              <PromptInput value={prompt} onChange={setPrompt} />

              <PlatformSelector
                selected={selectedPlatform}
                onSelect={setSelectedPlatform}
              />

              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
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
                isLocked={!account}
                isConnected={!!account}
                content={generatedContent}
              />

              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/20">
                <div className="mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19 10.5a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0zM8.25 9.75A.75.75 0 019 9h.253a1.75 1.75 0 011.709 2.13l-.46 2.066a.25.25 0 00.245.304H11a.75.75 0 010 1.5h-.253a1.75 1.75 0 01-1.709-2.13l.46-2.066a.25.25 0 00-.245-.304H9a.75.75 0 01-.75-.75zM10 7a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
                  <span className="font-semibold">Gas Efficiency:</span> Our
                  contract is optimized for minimal gas fees on Layer 2
                  networks.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
