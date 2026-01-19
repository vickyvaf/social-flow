"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ButtonConnectWallet } from "@/components/button-connect-wallet";

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-zinc-900 dark:text-white">
            DPrompt
          </span>
        </div>

        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/generator"
              className={`text-sm font-medium transition-colors ${
                isActive("/generator")
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Generator
            </Link>
            <Link
              href="/transactions"
              className={`text-sm font-medium transition-colors ${
                isActive("/transactions")
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Transactions
            </Link>
          </nav>

          <ButtonConnectWallet />
        </div>
      </div>
    </header>
  );
}
