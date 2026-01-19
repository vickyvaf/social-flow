interface PreviewPanelProps {
  content?: string;
  isLocked?: boolean;
  isConnected?: boolean;
}

export function PreviewPanel({
  content,
  isLocked = true,
  isConnected = false,
}: PreviewPanelProps) {
  return (
    <div className="flex h-full min-h-[500px] flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
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

      <div className="flex flex-1 flex-col items-center justify-center p-8">
        {!content ? (
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
          <div className="h-full w-full overflow-y-auto text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {content}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <button
          disabled={!content}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:disabled:hover:bg-zinc-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a.5.5 0 01.146-.354l.854-.853A.5.5 0 0114.499 10h-2.378A1.5 1.5 0 0010.5 11.5v2.379a.5.5 0 01-1.002 0V9.879a.5.5 0 01.146-.353l.854-.854a.5.5 0 01.354-.146H4.5z" />
          </svg>
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
}
