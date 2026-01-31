import { Toast } from "@/components/ui/Toast";
import { supabase } from "@/supabase/client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { PaymentModal } from "../PaymentModal";
import { User } from "@supabase/supabase-js";
import { useCanAffordGeneration } from "@/hooks/useIDRX";

interface PreviewPanelProps {
  user: User | null;
  content?: string;
  isLocked?: boolean;
  isConnected?: boolean;
  prompt?: string;
  platform?: string;
  address?: string;
  userId?: string;
  isLoading?: boolean;
  isPlatformConnected?: boolean;
  connectedPlatforms?: string[];
  onPostSuccess?: () => void;
  isEditing?: boolean;
  setIsEditing?: (isEditing: boolean) => void;
  onContentChange?: (content: string) => void;
  onBack?: () => void;
}

export function PreviewPanel({
  user,
  content,
  isLocked = true,
  isConnected = false,
  prompt,
  platform,
  isLoading = false,
  isPlatformConnected = false,
  connectedPlatforms = [],
  onPostSuccess,
  isEditing = false,
  setIsEditing,
  onContentChange,
  onBack,
  address,
  userId,
}: PreviewPanelProps) {
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [postingType, setPostingType] = useState<
    null | "immediate" | "scheduled"
  >(null);
  const [customSelectedPlatforms, setCustomSelectedPlatforms] = useState<
    string[]
  >([]);
  const isPosting = postingType !== null;

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const [selectedOption, setSelectedOption] = useState(0);
  const [parsedOptions, setParsedOptions] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { canAfford } = useCanAffordGeneration();

  useEffect(() => {
    if (!content) {
      setParsedOptions([]);
      return;
    }

    // Split patterns: "Tweet 1:", "Option 1:", "Variation 1:", "Tweet 1 (Thread starter):"
    const splitPattern =
      /(?:^|\n)(?=Tweet\s+\d+|Option\s+\d+|Variation\s+\d+)/i;
    const parts = content
      .split(splitPattern)
      .filter((p) => p.trim().length > 0);

    // Filter only those that actually look like options and clean them
    const potentialOptions = parts
      .filter((p) => /^(?:Tweet|Option|Variation)\s+\d+/i.test(p.trim()))
      .map((p) => {
        // Remove the header (e.g., "Tweet 1:" or "Tweet 1 (Thread starter):")
        // We look for the first colon and take everything after it
        const match = p.match(
          /^(?:Tweet|Option|Variation)\s+\d+.*?:([\s\S]*)/i,
        );
        return match ? match[1].trim() : p.trim();
      });

    if (potentialOptions.length > 1) {
      setParsedOptions(potentialOptions);
      setSelectedOption(0);
    } else {
      setParsedOptions([]);
    }
  }, [content]);

  const handlePost = async (scheduledForDate?: string) => {
    if (!platform || !content) return;

    // Use selected option if available, otherwise full content
    const contentToPost =
      parsedOptions.length > 0 && parsedOptions[selectedOption]
        ? parsedOptions[selectedOption]
        : content;

    // Check if platform is connected
    const isCustomPosting = customSelectedPlatforms.length > 0;
    if (!isCustomPosting && !isPlatformConnected) {
      setToast({
        show: true,
        message: `Redirecting to connect ${platform}...`,
        type: "success",
      });

      // Save state for auto-recovery
      localStorage.setItem(
        "pending_post",
        JSON.stringify({
          content,
          prompt,
          platform,
        }),
      );

      // Redirect to auth
      setTimeout(() => {
        window.location.href = `/api/auth/${platform}`;
      }, 1000);
      return;
    }

    // Determine platforms to post to
    const targetPlatforms = isCustomPosting
      ? customSelectedPlatforms
      : [platform!];

    if (targetPlatforms.length === 0) {
      setToast({
        show: true,
        message: "No platforms selected to post to",
        type: "error",
      });
      return;
    }

    // Check if user can afford and has approval - PAYMENT REQUIRED FOR POSTING
    if (!canAfford) {
      setToast({
        show: true,
        message:
          "Insufficient IDRX balance. Please top up your wallet to post.",
        type: "error",
      });
      return;
    }

    // Show payment modal - user needs to pay before posting
    setIsPaymentModalOpen(true);
    return;
  };

  const handlePaymentSuccess = async () => {
    // After payment successful, proceed with posting
    setIsPaymentModalOpen(false);
    await executePost();
  };

  const executePost = async (scheduledForDate?: string) => {
    const isCustomPosting = customSelectedPlatforms.length > 0;
    const contentToPost =
      parsedOptions.length > 0 && parsedOptions[selectedOption]
        ? parsedOptions[selectedOption]
        : content;

    const targetPlatforms = isCustomPosting
      ? customSelectedPlatforms
      : [platform!];

    // 1. Execute Post (API)
    setPostingType(scheduledForDate ? "scheduled" : "immediate");
    try {
      // Get the current Supabase session to pass the access token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // Send all platforms in a single request
      const response = await fetch("/api/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(address ? { "X-User-Id": address } : {}), // Add custom user ID header for wallet users
        },
        body: JSON.stringify({
          platforms: targetPlatforms,
          content: contentToPost,
          scheduledFor: scheduledForDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to post");
      }

      setToast({
        show: true,
        message: scheduledForDate
          ? "Posts scheduled successfully!"
          : isCustomPosting
            ? `Posted to ${targetPlatforms.length} platforms successfully!`
            : "Posted successfully!",
        type: "success",
      });

      setPostingType(null);
      setIsScheduling(false);
      setScheduleTime("");

      if (onPostSuccess) {
        setTimeout(() => {
          onPostSuccess();
        }, 1500); // Delay to show toast
      }
    } catch (error: unknown) {
      console.error(
        "Post error:",
        error instanceof Error ? error.message : error,
      );
      setToast({
        show: true,
        message: error instanceof Error ? error.message : "Failed to post",
        type: "error",
      });
      setPostingType(null);
    }
  };

  useEffect(() => {
    // Disabled for now as per previous logic, or kept minimal
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
    // Debugger and shortcut logic - disabled for now to keep it clean or enable if needed
    // Keeping empty for now as requested by user context potentially
    return;
  }, []);

  return (
    <div className="overflow-y-auto flex flex-col relative h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isConnected && !isLocked && setIsEditing && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-1.5 rounded-md transition-colors ${
                isEditing
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
              title={isEditing ? "View Preview" : "Edit Content"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
              </svg>
            </button>
          )}
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
        ) : !content && !isEditing ? (
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
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Describe your topic, choose a platform, and generate engaging
              content in seconds.{" "}
            </p>
            {isConnected && setIsEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:hover:bg-zinc-700"
              >
                Write manually
              </button>
            )}
          </div>
        ) : isEditing ? (
          <textarea
            value={content}
            onChange={(e) => onContentChange?.(e.target.value)}
            placeholder="Write your creative content here..."
            className="h-full w-full resize-none bg-transparent p-0 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
            autoFocus
          />
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

      <div className="border-t border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          onClick={() => handlePost()}
          disabled={!content || isPosting || isScheduling}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {postingType === "immediate" ? (
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
              Processing...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
              {!isPlatformConnected ? "Connect & Post" : "Post Now"}
            </>
          )}
        </button>

        {isPlatformConnected && (
          <div className="mb-1">
            {isScheduling ? (
              <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Select Date & Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      value={
                        scheduleTime && scheduleTime.includes("T")
                          ? scheduleTime.split("T")[0]
                          : scheduleTime || ""
                      }
                      onChange={(e) => {
                        const newDate = e.target.value;
                        const currentParts = scheduleTime
                          ? scheduleTime.split("T")
                          : [];
                        const existingTime =
                          currentParts.length > 1 && currentParts[1]
                            ? currentParts[1]
                            : "12:00";
                        setScheduleTime(`${newDate}T${existingTime}`);
                      }}
                      className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={
                        scheduleTime && scheduleTime.includes("T")
                          ? scheduleTime.split("T")[1]?.slice(0, 5)
                          : ""
                      }
                      onChange={(e) => {
                        const newTime = e.target.value;
                        const currentParts = scheduleTime
                          ? scheduleTime.split("T")
                          : [];
                        const existingDate =
                          currentParts.length > 0 && currentParts[0]
                            ? currentParts[0]
                            : new Date().toISOString().split("T")[0];
                        setScheduleTime(`${existingDate}T${newTime}`);
                      }}
                      className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-600 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsScheduling(false);
                      setScheduleTime("");
                    }}
                    className="flex-1 rounded-lg border border-zinc-200 py-2 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      try {
                        if (!scheduleTime) return;
                        const date = new Date(scheduleTime);
                        const now = new Date();

                        if (isNaN(date.getTime())) {
                          setToast({
                            show: true,
                            message: "Please select a valid date and time",
                            type: "error",
                          });
                          return;
                        }

                        if (date <= now) {
                          setToast({
                            show: true,
                            message: "Schedule time must be in the future",
                            type: "error",
                          });
                          return;
                        }

                        handlePost(date.toISOString());
                      } catch (e) {
                        console.error("Invalid date:", e);
                        setToast({
                          show: true,
                          message: "Invalid date selection",
                          type: "error",
                        });
                      }
                    }}
                    disabled={
                      !scheduleTime || !scheduleTime.includes("T") || isPosting
                    }
                    className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {postingType === "scheduled" ? (
                      <>
                        <svg
                          className="h-3 w-3 animate-spin text-white"
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
                        Scheduling...
                      </>
                    ) : (
                      "Confirm Schedule"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsScheduling(true)}
                disabled={!content || isPosting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-3.5 text-sm font-semibold text-blue-700 shadow-sm transition-all hover:bg-blue-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-blue-500"
                >
                  <path d="M5.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V12zM6 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H6zM7.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H8a.75.75 0 01-.75-.75V12zM8 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H8zM9.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V10zM10 11.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V12a.75.75 0 00-.75-.75H10zM9.25 14a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V14zM12 9.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V10a.75.75 0 00-.75-.75H12zM11.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H12a.75.75 0 01-.75-.75V12zM12 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H12zM13.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H14a.75.75 0 01-.75-.75V10zM14 11.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V12a.75.75 0 00-.75-.75H14z" />
                  <path
                    fillRule="evenodd"
                    d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
                    clipRule="evenodd"
                  />
                </svg>
                Schedule Post
              </button>
            )}

            {!isLocked && (
              <div className="mt-4 space-y-3 rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Post to platform
                  </h4>
                </div>

                <div className="space-y-2">
                  <div
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors cursor-pointer ${
                      customSelectedPlatforms.length === 0
                        ? "border-blue-500 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20"
                        : "border-zinc-100 dark:border-zinc-800"
                    }`}
                    onClick={() => setCustomSelectedPlatforms([])}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Default ({platform})
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="post-choice-inline"
                      checked={customSelectedPlatforms.length === 0}
                      readOnly
                      className="h-3.5 w-3.5 border-zinc-300 text-blue-600 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>

                  <div
                    className={`grid grid-cols-${connectedPlatforms?.length} gap-2`}
                  >
                    {connectedPlatforms.map((p) => (
                      <div
                        key={p}
                        className={`flex items-center justify-between rounded-lg border p-3 transition-colors cursor-pointer ${
                          customSelectedPlatforms.includes(p)
                            ? "border-blue-500 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20"
                            : "border-zinc-100 dark:border-zinc-800"
                        }`}
                        onClick={() => {
                          if (customSelectedPlatforms.includes(p)) {
                            setCustomSelectedPlatforms(
                              customSelectedPlatforms.filter(
                                (item) => item !== p,
                              ),
                            );
                          } else {
                            setCustomSelectedPlatforms([
                              ...customSelectedPlatforms,
                              p,
                            ]);
                          }
                        }}
                      >
                        <span className="text-xs font-semibold capitalize text-zinc-900 dark:text-zinc-100">
                          {p}
                        </span>
                        <input
                          type="checkbox"
                          checked={customSelectedPlatforms.includes(p)}
                          readOnly
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        userId={userId || user?.id}
        onSuccess={handlePaymentSuccess}
        description="Post Social Media Content"
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
