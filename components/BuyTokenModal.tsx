"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coffee, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import {
  buyTokens,
  getBuyQuote,
  formatTokenAmount,
  formatEthPrice,
} from "@/lib/contracts/interactions";
import {
  getUserToken,
  savePurchase,
  TokenPurchase,
} from "@/lib/contracts/tokenStorage";
import { BASE_SEPOLIA_EXPLORER } from "@/lib/contracts/config";

interface BuyTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  author: {
    login: string;
    name: string;
    avatar_url: string;
  };
  walletAddress: string;
}

const ETH_AMOUNTS = ["0.001", "0.005", "0.01", "0.05"];

export function BuyTokenModal({
  isOpen,
  onClose,
  author,
  walletAddress,
}: BuyTokenModalProps) {
  const [selectedAmount, setSelectedAmount] = useState("0.001");
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [quote, setQuote] = useState<{
    tokensOut: string;
    pricePerToken: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    txHash: string;
    tokensReceived: string;
  } | null>(null);

  const userToken = getUserToken(author.login);
  const ethAmount = customAmount || selectedAmount;

  // Fetch quote when amount changes
  useEffect(() => {
    if (!isOpen || !userToken?.bondingCurveAddress) return;

    const fetchQuote = async () => {
      setIsLoading(true);
      setError(null);
      console.log("[BuyModal] Fetching quote for:", ethAmount, "ETH");

      const result = await getBuyQuote(
        userToken.bondingCurveAddress,
        ethAmount
      );

      if (result.success) {
        setQuote({
          tokensOut: result.tokensOut,
          pricePerToken: result.pricePerToken,
        });
        console.log("[BuyModal] Quote received:", result);
      } else {
        console.error("[BuyModal] Quote error:", result.error);
        setError(result.error || "Failed to get quote");
      }
      setIsLoading(false);
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [ethAmount, isOpen, userToken?.bondingCurveAddress]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAmount("0.001");
      setCustomAmount("");
      setQuote(null);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handlePurchase = async () => {
    if (!userToken?.bondingCurveAddress) {
      setError("This developer hasn't created their token yet");
      return;
    }

    setIsPurchasing(true);
    setError(null);
    console.log("[BuyModal] Initiating purchase:", ethAmount, "ETH");
    console.log(
      "[BuyModal] Bonding curve address:",
      userToken.bondingCurveAddress
    );
    console.log("[BuyModal] Token address:", userToken.tokenAddress);

    const result = await buyTokens(userToken.bondingCurveAddress, ethAmount);

    if (result.success && result.txHash) {
      console.log("[BuyModal] Purchase successful:", result);

      // Save purchase to localStorage
      const purchase: TokenPurchase = {
        id: Date.now().toString(),
        buyerWallet: walletAddress,
        sellerGithubLogin: author.login,
        tokenAddress: userToken.tokenAddress,
        bondingCurveAddress: userToken.bondingCurveAddress,
        ethAmount: ethAmount,
        tokensReceived: result.tokensReceived || "0",
        txHash: result.txHash,
        timestamp: new Date().toISOString(),
      };
      savePurchase(purchase);

      setSuccess({
        txHash: result.txHash,
        tokensReceived: result.tokensReceived || "0",
      });
    } else {
      console.error("[BuyModal] Purchase failed:", result.error);
      setError(result.error || "Transaction failed");
    }

    setIsPurchasing(false);
  };

  if (!userToken) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Token Not Available</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <p className="text-text-secondary dark:text-text-dark-secondary">
              {author.name || author.login} hasn&apos;t created their developer
              token yet.
            </p>
          </div>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Support {author.name || author.login}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          // Success state
          <div className="text-center py-6">
            <div className="h-16 w-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🎉</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Purchase Successful!</h3>
            <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
              You received {formatTokenAmount(success.tokensReceived)}{" "}
              {userToken.tokenSymbol} tokens
            </p>
            <a
              href={`${BASE_SEPOLIA_EXPLORER}/tx/${success.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
            >
              View transaction <ExternalLink className="h-4 w-4" />
            </a>
            <Button onClick={onClose} className="w-full mt-6">
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* Developer info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={author.avatar_url} alt={author.login} />
                <AvatarFallback>{author.login.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{author.name || author.login}</p>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  {userToken.tokenSymbol} Token
                </p>
              </div>
            </div>

            {/* Amount selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Amount (ETH)</label>
              <div className="grid grid-cols-4 gap-2">
                {ETH_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant={
                      selectedAmount === amount && !customAmount
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  step="0.001"
                  min="0.0001"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-dark-secondary">
                  ETH
                </span>
              </div>
            </div>

            {/* Quote */}
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-text-secondary">
                  Getting quote...
                </span>
              </div>
            ) : quote ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary dark:text-text-dark-secondary">
                    You&apos;ll receive:
                  </span>
                  <span className="font-medium">
                    {formatTokenAmount(quote.tokensOut)} {userToken.tokenSymbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary dark:text-text-dark-secondary">
                    Price per token:
                  </span>
                  <span className="font-medium">
                    {formatEthPrice(quote.pricePerToken)} ETH
                  </span>
                </div>
              </div>
            ) : null}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={isPurchasing || isLoading || !quote}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buying...
                  </>
                ) : (
                  <>
                    <Coffee className="h-4 w-4 mr-2" />
                    Buy Tokens
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
