export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Spent Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
        <div className="mb-4 flex items-start justify-between">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total Spent
          </span>
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0zM1.75 14.5a.75.75 0 000 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 00-1.5 0v.784a.272.272 0 01-.35.25A90.043 90.043 0 001.75 14.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="mb-1 text-3xl font-bold text-zinc-900 dark:text-white">
          450.00 USDC
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="font-medium text-green-600 dark:text-green-400">
            ↑ 12.5%
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            from last month
          </span>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
        <div className="mb-4 flex items-start justify-between">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Recent Activity
          </span>
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h5.25a.75.75 0 00.75-.75v-5.25z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-10.5v4.5h4.5a.75.75 0 000-1.5h-3.75v-3a.75.75 0 00-1.5 0z"
                clipRule="evenodd" // Removed duplicate clipRule
              />
            </svg>
          </div>
        </div>
        <div className="mb-1 text-3xl font-bold text-zinc-900 dark:text-white">
          12 Posts
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="font-medium text-green-600 dark:text-green-400">
            ↑ 3%
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">last 30 days</span>
        </div>
      </div>

      {/* Current Balance Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
        <div className="mb-4 flex items-start justify-between">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Current Balance
          </span>
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="mb-1 text-3xl font-bold text-zinc-900 dark:text-white">
          1,240.50 USDC
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">
            Connected to Polygon Mainnet
          </span>
        </div>
      </div>
    </div>
  );
}
