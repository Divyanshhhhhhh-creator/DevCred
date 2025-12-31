"use client";

import React from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TokenGraph } from "@/components/TokenGraph";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDeveloper, useUser } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Coins } from "lucide-react";

export default function DeveloperTokenPage() {
  const params = useParams();
  const devId = params.devId as string;
  const { developer, isLoading } = useDeveloper(devId);
  const { user } = useUser();
  const [mintModalOpen, setMintModalOpen] = React.useState(false);
  const [mintAmount, setMintAmount] = React.useState("");
  const [isMinting, setIsMinting] = React.useState(false);
  const [selectedRange, setSelectedRange] = React.useState<"1W" | "1M" | "1Y">("1M");

  const isOwner = user?.id === devId;

  const handleMint = async () => {
    if (!mintAmount) return;

    setIsMinting(true);
    try {
      const result = await api.mintToken({
        developerId: devId,
        amount: parseInt(mintAmount),
      });

      if (result.success) {
        console.log("Minted successfully:", result.txHash);
        setMintModalOpen(false);
        setMintAmount("");
      }
    } catch (error) {
      console.error("Minting failed:", error);
    } finally {
      setIsMinting(false);
    }
  };

  const getFilteredData = () => {
    if (!developer?.tokenHistory) return [];
    
    const now = new Date();
    const data = [...developer.tokenHistory];
    
    switch (selectedRange) {
      case "1W":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return data.filter(d => new Date(d.date) >= weekAgo);
      case "1M":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return data.filter(d => new Date(d.date) >= monthAgo);
      case "1Y":
      default:
        return data;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary dark:text-text-dark-secondary">Loading token data...</p>
        </div>
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-text-secondary dark:text-text-dark-secondary">Developer not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{developer.displayName} Token</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">Total Minted</p>
              <p className="text-2xl font-bold text-primary">{developer.tokensMinted.toLocaleString()}</p>
            </div>
            <Image
              src={developer.avatarUrl}
              alt={developer.displayName}
              width={48}
              height={48}
              className="rounded-full border border-border dark:border-border-dark"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg border border-border dark:border-border-dark p-6 mb-6">
          <TokenGraph
            data={getFilteredData()}
            onRangeChange={setSelectedRange}
          />
        </div>

        {isOwner && (
          <div className="flex justify-center">
            <Button onClick={() => setMintModalOpen(true)}>
              <Coins className="mr-2 h-4 w-4" />
              Mint Tokens
            </Button>
          </div>
        )}

        <Dialog open={mintModalOpen} onOpenChange={setMintModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mint Developer Tokens</DialogTitle>
              <DialogDescription>
                Convert your reputation score into tradeable developer tokens
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-2">
                  Available reputation: {user?.overallRepScore || 0}
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Mint Amount
                </label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary dark:text-text-dark-secondary" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMintModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMint} disabled={!mintAmount || isMinting}>
                {isMinting ? "Minting..." : "Mint Tokens"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
