import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StatsCards } from "@/components/transactions/StatsCards";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { PromoBanner } from "@/components/transactions/PromoBanner";

export default function TransactionsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Header />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Transaction History
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Audit and track your crypto-powered content generations across all
              platforms.
            </p>
          </div>

          <div className="space-y-8">
            <StatsCards />
            <TransactionTable />
            <PromoBanner />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
