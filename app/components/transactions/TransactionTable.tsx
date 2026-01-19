"use client";

import { useState } from "react";

interface Transaction {
  id: string;
  date: string;
  platform: string;
  asset: string;
  amount: string;
  hash: string;
  status: "Completed" | "Pending";
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    date: "Oct 24, 2023",
    platform: "LinkedIn",
    asset: "USDC",
    amount: "15.00",
    hash: "0x7a...3f92",
    status: "Completed",
  },
  {
    id: "2",
    date: "Oct 23, 2023",
    platform: "X (Twitter)",
    asset: "USDC",
    amount: "12.50",
    hash: "0x9c...a12e",
    status: "Pending",
  },
  {
    id: "3",
    date: "Oct 21, 2023",
    platform: "LinkedIn",
    asset: "USDC",
    amount: "25.00",
    hash: "0x2d...ff11",
    status: "Completed",
  },
];

export function TransactionTable() {
  const [filter, setFilter] = useState<"All" | "Completed" | "Pending">("All");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-6 border-b border-zinc-200 dark:border-zinc-800">
          {(["All", "Completed", "Pending"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                filter === tab
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {tab === "All" ? "All Transactions" : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 text-zinc-400"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by Transaction Hash..."
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-black">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/50 text-xs font-medium uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Tx Hash</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {MOCK_TRANSACTIONS.filter(
                (t) => filter === "All" || t.status === filter,
              ).map((tx) => (
                <tr
                  key={tx.id}
                  className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                    {tx.date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Platform Icon Placeholders - ideally replace with proper SVGs based on platform name */}
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {tx.platform}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                        $
                      </div>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {tx.asset}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {tx.amount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <span className="font-mono">{tx.hash}</span>
                      <button className="opacity-0 transition-opacity group-hover:opacity-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3.5 w-3.5"
                        >
                          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a.5.5 0 01.146-.354l.854-.853A.5.5 0 0114.499 10h-2.378A1.5 1.5 0 0010.5 11.5v2.379a.5.5 0 01-1.002 0V9.879a.5.5 0 01.146-.353l.854-.854a.5.5 0 01.354-.146H4.5z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        tx.status === "Completed"
                          ? "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400"
                          : "bg-yellow-50 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-400"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing{" "}
            <span className="font-medium text-zinc-900 dark:text-white">
              1-10
            </span>{" "}
            of{" "}
            <span className="font-medium text-zinc-900 dark:text-white">
              124
            </span>{" "}
            results
          </span>
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-zinc-500"
              >
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-medium text-white">
              1
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900">
              2
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900">
              3
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-zinc-500"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
