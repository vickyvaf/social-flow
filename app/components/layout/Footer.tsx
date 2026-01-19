import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
        <p>© 2024 DPrompt. Non-custodial & Decentralized.</p>
        <div className="flex gap-6">
          <Link
            href="#"
            className="hover:text-zinc-900 dark:hover:text-zinc-300"
          >
            Smart Contract
          </Link>
          <Link
            href="#"
            className="hover:text-zinc-900 dark:hover:text-zinc-300"
          >
            Security Audit
          </Link>
          <Link
            href="#"
            className="hover:text-zinc-900 dark:hover:text-zinc-300"
          >
            Whitepaper
          </Link>
        </div>
      </div>
    </footer>
  );
}
