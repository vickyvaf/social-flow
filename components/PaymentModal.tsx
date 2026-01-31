"use client";

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { supabase } from "@/supabase/client";
import { Toast } from "@/components/ui/Toast";
import { useIDRXBalance, useIDRXAllowance } from "@/hooks/useIDRX";
import { IDRX_CONTRACT, ERC20_ABI, PRICING } from "@/lib/contracts/idrx";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onSuccess?: () => void;
  amount?: string; // Amount in IDRX (with decimals)
  description?: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
  amount = PRICING.PER_GENERATION,
  description = "Generate Social Media Content",
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "approve" | "transfer" | "done"
  >("approve");

  const { address } = useAccount();
  const {
    balance,
    balanceFormatted,
    refetch: refetchBalance,
  } = useIDRXBalance();
  const { allowance, refetch: refetchAllowance } = useIDRXAllowance();

  const { writeContractAsync } = useWriteContract();

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const amountBigInt = BigInt(amount);
  const needsApproval = allowance < amountBigInt;

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!address) {
      setToast({
        show: true,
        message: "Please connect your wallet to continue.",
        type: "error",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const hash = await writeContractAsync({
        address: IDRX_CONTRACT.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PRICING.SERVER_WALLET, amountBigInt],
      });

      // Wait for confirmation
      setToast({
        show: true,
        message: "Approval transaction submitted. Waiting for confirmation...",
        type: "success",
      });

      // Refetch allowance after a delay to confirm
      setTimeout(async () => {
        await refetchAllowance();
        setCurrentStep("transfer");
        setIsProcessing(false);
        setToast({
          show: true,
          message: "Approval confirmed! Now proceeding to payment...",
          type: "success",
        });
      }, 3000);
    } catch (err: any) {
      console.error("Approval failed:", err);
      setToast({
        show: true,
        message: err?.message || "Approval failed. Please try again.",
        type: "error",
      });
      setIsProcessing(false);
    }
  };

  const handleTransfer = async () => {
    if (!address || !userId) {
      setToast({
        show: true,
        message: "Missing wallet address or user session.",
        type: "error",
      });
      return;
    }

    // Validation removed for demo purposes
    /* 
    if (balance < amountBigInt) {
      setToast({
        show: true,
        message: "Insufficient IDRX balance.",
        type: "error",
      });
      return;
    }
    */

    setIsProcessing(true);

    try {
      const hash = await writeContractAsync({
        address: IDRX_CONTRACT.address,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [PRICING.SERVER_WALLET, amountBigInt],
      });

      // Record transaction in database
      try {
        const { error: txError } = await supabase.from("transactions").insert({
          user_id: userId,
          wallet_address: address,
          chain: "base-sepolia",
          tx_hash: hash,
          token_symbol: IDRX_CONTRACT.symbol,
          token_decimals: IDRX_CONTRACT.decimals,
          amount:
            parseFloat(parseUnits(amount, 0).toString()) /
            Math.pow(10, IDRX_CONTRACT.decimals),
          status: "success",
          description: description,
        });

        if (txError) {
          console.error("Error recording transaction:", txError);
        }

        setIsSuccess(true);
        setCurrentStep("done");

        // Refetch balance
        await refetchBalance();

        if (onSuccess) onSuccess();

        // Auto close after success
        setTimeout(() => {
          onClose();
          setIsProcessing(false);
          setIsSuccess(false);
          setCurrentStep("approve");
        }, 3000);
      } catch (error) {
        console.error("Error recording transaction:", error);
        setToast({
          show: true,
          message:
            "Payment successful but failed to record. Please contact support.",
          type: "error",
        });
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error("Transfer failed:", err);
      setToast({
        show: true,
        message: err?.message || "Payment failed. Please try again.",
        type: "error",
      });
      setIsProcessing(false);
    }
  };

  const handlePay = async () => {
    if (needsApproval) {
      await handleApprove();
    } else {
      await handleTransfer();
    }
  };

  const amountFormatted = parseFloat(
    parseUnits(amount, -IDRX_CONTRACT.decimals).toString(),
  ).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[calc(100vh-160px)]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800 shrink-0">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {isSuccess ? "Payment Successful" : "Payment Required"}
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

        <div className="p-6 pb-3 overflow-y-auto flex-1">
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
                Payment Successful!
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 px-4">
                Your payment of{" "}
                <span className="font-bold text-zinc-900 dark:text-white">
                  {amountFormatted} IDRX
                </span>{" "}
                has been processed successfully.
              </p>
            </div>
          ) : !userId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                Loading your session...
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      Amount Due
                    </span>
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {amountFormatted} IDRX
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500">
                    {description}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      Your Balance
                    </span>
                    <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {balanceFormatted} IDRX
                    </span>
                  </div>
                </div>

                {/* Insufficient balance warning removed for demo */}
                {/* 
                {balance < amountBigInt && (
                  <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      ⚠️ Insufficient balance. Please add IDRX to your wallet.
                    </p>
                  </div>
                )}
                */}

                {needsApproval && balance >= amountBigInt && (
                  <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      ℹ️ You need to approve IDRX spending first.
                    </p>
                  </div>
                )}
              </div>

              {!address && (
                <p className="mt-4 text-center text-xs text-red-500">
                  Please connect your wallet to continue.
                </p>
              )}
            </>
          )}
        </div>

        {!isSuccess && (
          <div className="flex flex-col gap-3 p-6">
            <button
              onClick={handlePay}
              disabled={isProcessing || !address || !userId}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {currentStep === "approve"
                    ? "Approving..."
                    : "Processing Payment..."}
                </>
              ) : needsApproval ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Approve IDRX
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Pay {amountFormatted} IDRX
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
}
