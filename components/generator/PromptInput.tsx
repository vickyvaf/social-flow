import { Toast } from "@/components/ui/Toast";
import { useState } from "react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  isConnected: boolean;
  hasContent?: boolean;
  onNext?: () => void;
}

export function PromptInput({
  value,
  onChange,
  isConnected,
  hasContent,
  onNext,
}: PromptInputProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const handleGenerate = async () => {
    if (!isConnected) {
      setToast({
        show: true,
        message: "Please connect your Coinbase Wallet to use AI enhancement",
        type: "error",
      });
      return;
    }

    if (!value.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: value,
          platform: "Prompt Engineering",
          systemInstruction:
            "You are an expert prompt engineer. Your goal is to rewrite the given prompt to be more clear, detailed, and effective for an AI generator. Keep the intent but maximize the potential output quality. IMPORTANT: Do not change the language, adjust to user input language. Return ONLY the enhanced prompt, no explanations.",
        }),
      });

      const data = await response.json();

      if (data.result) {
        onChange(data.result);
      }
    } catch (error) {
      console.error("Failed to generate prompt:", error);
      setToast({
        show: true,
        message: "Failed to enhance prompt",
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const heightTextArea = hasContent
    ? "h-[calc(100vh-555px)]"
    : "h-[calc(100vh-500px)]";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        {/* <button
          onClick={handleGenerate}
          disabled={isGenerating || !value.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200 disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
        >
          {isGenerating ? (
            <>
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z"
                  clipRule="evenodd"
                />
              </svg>
              Enhance with AI
            </>
          )}
        </button> */}

        {hasContent && onNext && (
          <button
            onClick={onNext}
            className="ml-auto flex mt-5 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors dark:text-zinc-300"
          >
            Next
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
      <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        Prompt
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the content you want to create..."
        className={`${heightTextArea} mt-1 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500`}
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
