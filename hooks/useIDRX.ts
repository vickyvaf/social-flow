import { useAccount } from "wagmi";
import { readContract } from "wagmi/actions";
import { useConfig } from "wagmi";
import { IDRX_CONTRACT, ERC20_ABI, PRICING } from "@/lib/contracts/idrx";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";

/**
 * Hook untuk membaca balance IDRX user
 * Menggunakan tanstack-query untuk caching
 */
export function useIDRXBalance() {
  const { address } = useAccount();
  const config = useConfig();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["idrx-balance", address],
    queryFn: async () => {
      if (!address) return BigInt(0);

      const balance = await readContract(config, {
        address: IDRX_CONTRACT.address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      });

      return balance as bigint;
    },
    enabled: !!address,
    refetchInterval: 10000, // Refetch setiap 10 detik
    staleTime: 5000, // Data dianggap fresh selama 5 detik
  });

  return {
    balance: data ?? BigInt(0),
    balanceFormatted: data
      ? formatUnits(data, IDRX_CONTRACT.decimals)
      : "0",
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
  const config = useConfig();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["idrx-allowance", address, PRICING.SERVER_WALLET],
    queryFn: async () => {
      if (!address || !PRICING.SERVER_WALLET) return BigInt(0);

      const allowance = await readContract(config, {
        address: IDRX_CONTRACT.address,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, PRICING.SERVER_WALLET],
      });

      return allowance as bigint;
    },
    enabled: !!address && !!PRICING.SERVER_WALLET,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  return {
    allowance: data ?? BigInt(0),
    allowanceFormatted: data
      ? formatUnits(data, IDRX_CONTRACT.decimals)
      : "0",
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook untuk cek apakah user memiliki cukup balance dan allowance untuk generate
 */
export function useCanAffordGeneration() {
  const { balance, isLoading: balanceLoading } = useIDRXBalance();
  const { allowance, isLoading: allowanceLoading } = useIDRXAllowance();

  const pricePerGen = BigInt(PRICING.PER_GENERATION);

  return {
    canAfford: balance >= pricePerGen,
    hasAllowance: allowance >= pricePerGen,
    needsApproval: allowance < pricePerGen,
    balance,
    allowance,
    pricePerGen,
    isLoading: balanceLoading || allowanceLoading,
  };
}
