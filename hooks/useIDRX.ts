import { useAccount } from "wagmi";
import { readContract } from "wagmi/actions";
import { useConfig } from "wagmi";
import { IDRX_CONTRACT, ERC20_ABI, PRICING } from "@/lib/contracts/idrx";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";

// Global mock state for demo purposes
const DEMO_STORAGE_KEY = "social_flow_demo_balance_v1";
let MOCK_BALANCE = BigInt(20000000); // Default: 200,000.00

// Initialize from storage if available (Client-side only)
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      MOCK_BALANCE = BigInt(stored);
    } else {
      // First time init
      localStorage.setItem(DEMO_STORAGE_KEY, MOCK_BALANCE.toString());
    }
  } catch (e) {
    console.error("Failed to load demo balance", e);
  }
}

export function deductMockBalance(amount: bigint) {
  if (MOCK_BALANCE >= amount) {
    MOCK_BALANCE -= amount;
    if (typeof window !== "undefined") {
      localStorage.setItem(DEMO_STORAGE_KEY, MOCK_BALANCE.toString());
    }
    return true;
  }
  return false;
}

/**
 * Hook untuk membaca balance IDRX user
 * Menggunakan tanstack-query untuk caching
 */
export function useIDRXBalance() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["idrx-balance", address, 84532],
    queryFn: async () => {
      // Sync from storage on fetch (handles multiple tabs)
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(DEMO_STORAGE_KEY);
        if (stored) {
          MOCK_BALANCE = BigInt(stored);
        }
      }
      return MOCK_BALANCE;
    },
    enabled: true, // Always enabled for demo
    refetchInterval: 2000, // Poll more frequently for demo
    staleTime: 0, // Always fetch fresh data
  });

  return {
    balance: data ?? BigInt(0),
    balanceFormatted: data ? formatUnits(data, IDRX_CONTRACT.decimals) : "0",
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook untuk membaca allowance IDRX yang sudah di-approve ke server wallet
 */
export function useIDRXAllowance() {
  const { address } = useAccount();

  // DEMO MODE: Always return infinite allowance
  return {
    allowance: BigInt(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    ),
    allowanceFormatted: "Infinite",
    isLoading: false,
    error: null,
    refetch: async () => {
      return {
        data: BigInt(
          "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        ),
      };
    },
  };
}

/**
 * Hook untuk cek apakah user memiliki cukup balance dan allowance untuk generate
 */
export function useCanAffordGeneration() {
  const { balance, isLoading: balanceLoading } = useIDRXBalance();
  const { allowance, isLoading: allowanceLoading } = useIDRXAllowance();

  const pricePerGen = BigInt(PRICING.PER_GENERATION);

  // DEMO MODE: Always allow generation
  return {
    canAfford: true,
    hasAllowance: true,
    needsApproval: false,
    balance,
    allowance,
    pricePerGen,
    isLoading: false,
  };
}
