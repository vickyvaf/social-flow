"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAccount, useWriteContract } from "wagmi";
import { useReadContract } from "wagmi";
import { Coins } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { useIDRXBalance } from "@/hooks/useIDRX";
import { IDRX_CONTRACT, ERC20_ABI } from "@/lib/contracts/idrx";

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Faucet amount: Check from contract CLAIM_AMOUNT
// Contract has 2 decimals, not 18
const FAUCET_AMOUNT_DISPLAY = "100000"; // Display value

export function FaucetModal({ isOpen, onClose }: FaucetModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string>("");

  const { address } = useAccount();
  const { balanceFormatted, refetch: refetchBalance } = useIDRXBalance();

  const { writeContractAsync } = useWriteContract();

  // Read last claim time from contract
  const { data: lastClaimTime } = useReadContract({
    address: IDRX_CONTRACT.address,
    abi: ERC20_ABI,
    functionName: "lastClaimAt",
    args: address ? [address] : undefined,
  });

  // Read claim interval from contract
  const { data: claimInterval } = useReadContract({
    address: IDRX_CONTRACT.address,
    abi: ERC20_ABI,
    functionName: "CLAIM_INTERVAL",
  });

  // Calculate next allowed claim time
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!lastClaimTime || !claimInterval) return;

    const interval = setInterval(() => {
      const lastClaim = Number(lastClaimTime);
      const intervalSeconds = Number(claimInterval);
      const nextClaimTime = lastClaim + intervalSeconds;
      const now = Math.floor(Date.now() / 1000);

      if (now >= nextClaimTime) {
        setTimeRemaining("");
      } else {
        const remaining = nextClaimTime - now;
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        setTimeRemaining(`${hours}h ${minutes}m`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastClaimTime, claimInterval]);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;

  const handleClaim = async () => {
    if (!address) {
      setToast({
        show: true,
        message: "Please connect your wallet first.",
        type: "error",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Method 1: If IDRX contract has a faucet/mint function
      // Uncomment this if the contract has a public mint/claim function:

      const hash = await writeContractAsync({
        address: IDRX_CONTRACT.address,
        abi: ERC20_ABI,
        args: [address],
        functionName: "claim",
      });

      setTxHash(hash);
      setIsSuccess(true);

      // Refetch balance after a delay
      setTimeout(async () => {
        await refetchBalance();
      }, 3000);

      // Auto close after success
      setTimeout(() => {
        onClose();
        setIsProcessing(false);
        setIsSuccess(false);
        setTxHash("");
      }, 5000);
    } catch (err: any) {
      console.error("Faucet claim failed:", err);

      let errorMessage = "Failed to claim IDRX. Please try again later.";

      // Check for specific errors
      if (
        err?.message?.includes("FaucetCooldown") ||
        err?.message?.includes("cooldown")
      ) {
        errorMessage =
          "You've already claimed recently. Please wait 24 hours before claiming again.";
      } else if (
        err?.message?.includes("user rejected") ||
        err?.message?.includes("User rejected")
      ) {
        errorMessage = "Transaction cancelled.";
      } else if (err?.message?.includes("insufficient")) {
        errorMessage =
          "Faucet contract has insufficient balance. Please try again later.";
      }

      setToast({
        show: true,
        message: errorMessage,
        type: "error",
      });
      setIsProcessing(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {isSuccess ? "Claim Successful!" : "IDRX Faucet"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-500">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                {FAUCET_AMOUNT_DISPLAY} IDRX Claimed!
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 px-4 mb-4">
                Your tokens will arrive shortly. You can now use them to
                generate content.
              </p>
              {txHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View on Explorer →
                </a>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <div className="rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white">
                        Claim Free IDRX
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Get 100 IDRX for testing
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      Your Current Balance
                    </span>
                    <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {balanceFormatted} IDRX
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      After Claim
                    </span>
                    <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {(
                        parseFloat(balanceFormatted) +
                        parseFloat(FAUCET_AMOUNT_DISPLAY)
                      ).toFixed(2)}{" "}
                      IDRX
                    </span>
                  </div>
                </div>
                {timeRemaining && (
                  <div className="rounded-2xl bg-orange-50 dark:bg-orange-900/20 p-4 border border-orange-200 dark:border-orange-800">
                    <div className="flex gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-sm text-orange-800 dark:text-orange-200 font-medium mb-1">
                          Cooldown Active
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">
                          You can claim again in {timeRemaining}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">
                        Testnet Only
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        This faucet only works on Base Sepolia testnet. IDRX
                        tokens have no real value.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {!address && (
                <p className="text-center text-sm text-red-500 mb-4">
                  Please connect your wallet to claim IDRX tokens.
                </p>
              )}
            </>
          )}
        </div>

        {!isSuccess && (
          <div className="flex flex-col gap-3 p-6 pt-0">
            <button
              onClick={handleClaim}
              disabled={isProcessing || !address || !!timeRemaining}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Claiming...
                </>
              ) : (
                <>
                  <Coins className="h-5 w-5" />
                  Claim {FAUCET_AMOUNT_DISPLAY} IDRX
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );

  if (mounted) {
    return createPortal(modalContent, document.body);
  }

  return null;
}
