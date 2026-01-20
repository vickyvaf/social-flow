import { Toast } from "@/components/ui/Toast";
import { supabase } from "@/supabase/client";
import { client } from "@/app/client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { prepareTransaction, toWei } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { defineChain } from "thirdweb/chains";

interface PreviewPanelProps {
  content?: string;
  isLocked?: boolean;
  isConnected?: boolean;
  prompt?: string;
  platform?: string;
  address?: string;
}

export function PreviewPanel({
  content,
  isLocked = true,
  isConnected = false,
  prompt,
  platform,
  address,
  isLoading = false,
}: PreviewPanelProps & { isLoading?: boolean }) {
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // Reset isSaved when content changes
  useEffect(() => {
    setIsSaved(false);
  }, [content]);

  const handleSave = async () => {
    if (!isConnected) {
      setToast({
        show: true,
        message: "Please connect your wallet to save content",
        type: "error",
      });
      return null;
    }

    if (!content || isSaved) return null;

    // Save to database
    if (prompt && platform && address) {
      setIsSaving(true);
      try {
        const { data, error } = await supabase
          .from("saved_content")
          .insert([{ wallet_address: address, content, prompt, platform }])
          .select()
          .single();

        if (error) {
          console.error("Error saving to database:", error);
          setToast({
            show: true,
            message: "Failed to save: " + error.message,
            type: "error",
          });
          return null;
        } else {
          setIsSaved(true);
          setToast({
            show: true,
            message: "Content saved successfully!",
            type: "success",
          });
          return data;
        }
      } catch (err) {
        console.error("Unexpected error saving to database:", err);
        setToast({
          show: true,
          message: "An unexpected error occurred.",
          type: "error",
        });
        return null;
      } finally {
        setIsSaving(false);
      }
    }
    return null;
  };

  // Transaction hook
  const { mutate: sendTransaction, isPending: isPaying } = useSendTransaction();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    if (!isConnected) {
      setToast({
        show: true,
        message: "Please connect your wallet to copy content",
        type: "error",
      });
      return;
    }

    if (!content) return;

    // 1. Create a transaction (mock payment of 0.0001 ETH/IDRX equivalent)
    // Sending to self to be safe and simple for demo
    const transaction = prepareTransaction({
      to: address || "0x0000000000000000000000000000000000000000",
      chain: defineChain(8453), // Base Mainnet
      client: client,
      value: toWei("0.000003"), // Approx 0.01 USD
    });

    try {
      setToast({
        show: true,
        message: "Please confirm the transaction to copy...",
        type: "success",
      });

      sendTransaction(transaction, {
        onSuccess: async (tx) => {
          // 3. On success, copy to clipboard
          try {
            await navigator.clipboard.writeText(content);
            setCopySuccess(true);

            // Auto-save the content
            const savedItem = await handleSave();

            // Record transaction in DB
            if (savedItem && address) {
              try {
                // Get user ID
                const {
                  data: { user },
                } = await supabase.auth.getUser();

                if (user) {
                  await supabase.from("transactions").insert({
                    user_id: user.id,
                    saved_content_id: savedItem.id,
                    tx_hash: tx.transactionHash,
                    chain_id: 8453,
                    token_symbol: "ETH",
                    amount: 0.000003,
                    status: "success",
                    token_address: null,
                  });
                } else {
                  console.warn(
                    "User not authenticated, skipping transaction record creation (RLS might prevent anon insert)",
                  );
                }
              } catch (txErr) {
                console.error("Failed to record transaction:", txErr);
              }
            }

            setToast({
              show: true,
              message: "Payment confirmed! Copied & Saved!",
              type: "success",
            });
            setTimeout(() => setCopySuccess(false), 2000);
          } catch (err) {
            console.error("Failed to copy:", err);
            // Even if copy fails, we still try to save context
            handleSave();

            setToast({
              show: true,
              message: "Payment successful (Saved), but copy failed",
              type: "error",
            });
          }
        },
        onError: (error: any) => {
          console.error("Transaction failed:", error);
          setToast({
            show: true,
            message: "Transaction failed/rejected. Copy cancelled.",
            type: "error",
          });
        },
      });
    } catch (error) {
      console.error("Error initiating transaction:", error);
    }
  };

  useEffect(() => {
    return;
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    return;
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "I" || e.key === "J" || e.key === "C")
      ) {
        e.preventDefault();
      }
      // Ctrl+U
      if ((e.ctrlKey || e.metaKey) && e.key === "U") {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    // Debugger trap
    const interval = setInterval(() => {
      (function () {
        debugger;
      })();
    }, 100);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex h-full min-h-[500px] flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black overflow-hidden relative">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Preview Area
          </span>
        </div>
        {isLocked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 text-zinc-400"
          >
            <path
              fillRule="evenodd"
              d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-8 relative">
        {!isWindowFocused && content && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-md">
            <span className="text-lg font-bold text-zinc-800 dark:text-white drop-shadow-md">
              Content Hidden
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="flex w-full flex-col items-center justify-center gap-4 px-4 text-zinc-500 dark:text-zinc-400">
            <CyclingText />
          </div>
        ) : !content ? (
          <div className="flex max-w-xs flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-8 w-8 text-zinc-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {isConnected ? "Ready to create magic!" : "Ready to generate?"}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isConnected
                ? "Describe your topic, choose a platform, and generate engaging content in seconds."
                : "Connect your wallet and pay with crypto to unlock AI-powered content generation."}
            </p>
          </div>
        ) : (
          <div
            className={`h-full w-full overflow-y-auto text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 select-none transition-all duration-300 ${
              !isWindowFocused ? "blur-sm opacity-50" : ""
            }`}
            onContextMenu={(e) => e.preventDefault()}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0">{children}</p>
                ),
                h1: ({ children }) => (
                  <h1 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 mt-6 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-4 text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 list-disc pl-4 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 list-decimal pl-4 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="pl-1">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {children}
                  </strong>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <button
          onClick={handleCopy}
          disabled={!content || isPaying}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:disabled:hover:bg-zinc-800"
        >
          {isPaying ? (
            <>
              <svg
                className="h-4 w-4 animate-spin text-zinc-500"
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
              Processing...
            </>
          ) : copySuccess ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-green-500"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a.5.5 0 01.146-.354l.854-.853A.5.5 0 0114.499 10h-2.378A1.5 1.5 0 0010.5 11.5v2.379a.5.5 0 01-1.002 0V9.879a.5.5 0 01.146-.353l.854-.854a.5.5 0 01.354-.146H4.5z" />
              </svg>
              Pay & Copy
            </>
          )}
        </button>
        <button
          onClick={handleSave}
          disabled={!content || isSaving || isSaved}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isSaved
              ? "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
          }`}
        >
          {isSaving ? (
            <>
              <svg
                className="h-4 w-4 animate-spin text-white"
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
              Saving...
            </>
          ) : isSaved ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              Saved
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.965 3.129V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              Save Content
            </>
          )}
        </button>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}

function CyclingText() {
  const messages = [
    "Analyzing your request and identifying key market trends",
    "Drafting optimized content tailored for your audience",
    "Refining tone and ensuring maximum engagement potential",
    "Finalizing hashtags and formatting for the selected platform",
  ];
  const [index, setIndex] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [messages.length]);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  return (
    <div className="flex items-center justify-center animate-pulse">
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 text-center transition-all duration-300">
        {messages[index]}
        <span className="inline-block w-[12px] text-left">{dots}</span>
      </span>
    </div>
  );
}
