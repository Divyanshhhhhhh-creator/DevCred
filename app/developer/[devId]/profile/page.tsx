"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContributionCard } from "@/components/ContributionCard";
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
import { Github, Coins, Trophy, UserPlus, Heart, TrendingUp } from "lucide-react";

export default function DeveloperProfilePage() {
  const params = useParams();
  const router = useRouter();
  const devId = params.devId as string;
  const { developer, isLoading } = useDeveloper(devId);
  const { user } = useUser();
  const [tipModalOpen, setTipModalOpen] = React.useState(false);
  const [tipAmount, setTipAmount] = React.useState("");
  const [isFollowing, setIsFollowing] = React.useState(false);

  const handleTip = () => {
    console.log("Tipping:", tipAmount);
    setTipModalOpen(false);
    setTipAmount("");
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleViewToken = () => {
    router.push(`/developer/${devId}/token`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary dark:text-text-dark-secondary">Loading profile...</p>
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
        {/* Profile Header */}
        <div className="bg-white dark:bg-surface-dark rounded-lg border border-border dark:border-border-dark p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Image
                src={developer.avatarUrl}
                alt={developer.displayName}
                width={80}
                height={80}
                className="rounded-full border-2 border-border dark:border-border-dark"
              />
              <div>
                <h1 className="text-2xl font-bold mb-1">{developer.displayName}</h1>
                <div className="flex items-center gap-2 text-text-secondary dark:text-text-dark-secondary mb-3">
                  <Github className="h-4 w-4" />
                  <span>@{developer.githubHandle}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{developer.totalRepScore.toLocaleString()}</span>
                    <span className="text-sm text-text-secondary dark:text-text-dark-secondary">Rep Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{developer.tokensMinted.toLocaleString()}</span>
                    <span className="text-sm text-text-secondary dark:text-text-dark-secondary">Tokens</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={handleFollow}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTipModalOpen(true)}>
                <Heart className="h-4 w-4 mr-2" />
                Tip
              </Button>
              <Button variant="outline" size="sm" onClick={handleViewToken}>
                <TrendingUp className="h-4 w-4 mr-2" />
                View Token
              </Button>
            </div>
          </div>
        </div>

        {/* Contributions Feed */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Contributions</h2>
          <div className="space-y-4">
            {developer.contributions.map((contribution, index) => (
              <ContributionCard key={index} contribution={contribution} />
            ))}
          </div>
        </div>

        {/* Tip Modal */}
        <Dialog open={tipModalOpen} onOpenChange={setTipModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tip {developer.displayName}</DialogTitle>
              <DialogDescription>
                Send tokens to show your appreciation for their contributions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="tip-amount" className="text-sm font-medium">
                  Amount
                </label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary dark:text-text-dark-secondary" />
                  <Input
                    id="tip-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTipModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTip} disabled={!tipAmount}>
                Send Tip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
