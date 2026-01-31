"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Send, FileText, ArrowRightLeft } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    {
      href: "/posts",
      label: "Posts",
      icon: <FileText className="h-6 w-6" />,
    },
    {
      href: "/",
      label: "Generator",
      icon: <Send className="h-6 w-6 text-white" />,
    },
    {
      href: "/transactions",
      label: "Transactions",
      icon: <ArrowRightLeft className="h-6 w-6" />,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 block border-t border-zinc-200 bg-white/80 pb-safe backdrop-blur-lg dark:border-zinc-800 dark:bg-black/80">
      <nav className="grid grid-cols-3 h-16 items-center px-2">
        {navLinks.map((link) => {
          const isGenerator = link.label === "Generator";

          if (isGenerator) {
            return (
              <div key={link.href} className="flex justify-center">
                <Link
                  href={link.href}
                  className="relative -top-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg ring-4 ring-white transition-transform active:scale-95 dark:bg-blue-500 dark:ring-black"
                  aria-label="Generator"
                >
                  {link.icon}
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium transition-colors ${
                isActive(link.href)
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
