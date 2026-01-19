export function PromoBanner() {
  return (
    <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-blue-50/50 p-6 ring-1 ring-blue-100 dark:bg-blue-900/10 dark:ring-blue-900/30 md:flex-row md:gap-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path
              fillRule="evenodd"
              d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436h.001c-3 2.335-5.32 5.038-7.73 7.56a.75.75 0 01-1.083.001L4.35 18.99a.75.75 0 01.001-1.083c2.523-2.41 5.225-4.73 7.56-7.731.433.567.893 1.107 1.378 1.619a23.908 23.908 0 015.114 8.653.75.75 0 01-1.127.848 22.408 22.408 0 00-4.007-4.148 22.408 22.408 0 00-4.147-4.007.75.75 0 01.848-1.127 23.921 23.921 0 018.653 5.114c.512.485 1.052.945 1.62 1.378.567.433 1.106.892 1.618 1.378z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M2.625 6.75a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM5.25 10.5a.75.75 0 00.75.75h2.25a.75.75 0 000-1.5H6a.75.75 0 00-.75.75z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Automate your content pipeline
          </h3>
          <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Save up to 20% on fees by subscribing to a monthly generator plan.
            Pay once in USDC and generate all month long.
          </p>
        </div>
      </div>
      <button className="whitespace-nowrap rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
        View Plans
      </button>
    </div>
  );
}
