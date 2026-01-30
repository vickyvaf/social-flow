"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "wagmi";

interface Transaction {
  id: string;
  created_at: string;
  chain: string;
  token_symbol: string;
  amount: number;
  tx_hash: string;
  status: "confirmed" | "pending" | "failed";
  description?: string;
}

export function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Completed" | "Pending">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { address } = useAccount();

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      if (!address) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      // 1. Get user_id from profiles table using wallet address
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("wallet_address", address)
        .single();

      if (profileError || !profileData) {
        console.warn("Profile not found for address:", address);
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      const userId = profileData.id;

      // 2. Fetch transactions using the retrieved user_id
      let dbQuery = supabase
        .from("post_transactions")
        .select("*")
        .eq("user_id", userId);

      // Apply Status Filter
      if (filter === "Completed") {
        dbQuery = dbQuery.eq("status", "confirmed");
      } else if (filter === "Pending") {
        dbQuery = dbQuery.eq("status", "pending");
      }

      // Apply Search Filter (Tx Hash)
      if (debouncedSearch) {
        dbQuery = dbQuery.ilike("tx_hash", `%${debouncedSearch}%`);
      }

      dbQuery = dbQuery.order("created_at", { ascending: false });

      const { data, error } = await dbQuery;
      if (error) throw error;

      // Map database columns to Transaction interface
      const mappedTransactions: Transaction[] = (data || []).map((tx: any) => ({
        id: tx.id,
        created_at: tx.created_at,
        chain: tx.chain_id, // map chain_id to chain
        token_symbol: tx.currency, // map currency to token_symbol
        amount: tx.amount_eth, // map amount_eth to amount
        tx_hash: tx.tx_hash,
        status: tx.status,
        description: "", // Add if needed logic
      }));

      setTransactions(mappedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter, debouncedSearch, address]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex w-full gap-6 border-b border-zinc-200 dark:border-zinc-800 sm:w-auto">
          {(["All", "Completed", "Pending"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 border-b-2 pb-2 text-center text-sm font-medium transition-colors sm:flex-none sm:text-left ${
                filter === tab
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {tab === "All" ? "All" : tab}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                <th className="px-6 py-4">Chain</th>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Tx Hash</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr
                    key={`skeleton-${index}`}
                    className="border-b border-zinc-50 dark:border-zinc-800"
                  >
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="ml-auto h-6 w-20 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="capitalize text-zinc-900 dark:text-zinc-100">
                          {tx.chain || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                          $
                        </div>
                        <span className="text-zinc-900 dark:text-zinc-100">
                          {tx.token_symbol}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {typeof tx.amount === "number"
                        ? tx.amount.toFixed(4)
                        : tx.amount}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <span className="font-mono">
                          {tx.tx_hash
                            ? `${tx.tx_hash.slice(0, 6)}...${tx.tx_hash.slice(-4)}`
                            : "N/A"}
                        </span>
                        {tx.tx_hash && (
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(tx.tx_hash)
                            }
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                            title="Copy Hash"
                          >
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
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          tx.status === "confirmed"
                            ? "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400"
                            : tx.status === "pending"
                              ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-400"
                              : "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          {/* Pagination controls could simply be hidden or kept minimal if not implementing full server-side pagination yet */}
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing {transactions.length} results
          </span>
        </div>
      </div>
    </div>
  );
}
