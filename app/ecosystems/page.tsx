"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Plus,
  Search,
  Loader2,
  ExternalLink,
  Users,
  GitPullRequest,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  EcosystemInfo,
  fetchEcosystemsFromFactory,
  cacheEcosystems,
  getCachedEcosystems,
} from "@/lib/contracts/config";
import { useGitHubAuth } from "@/lib/GitHubAuthContext";

export default function EcosystemsList() {
  const router = useRouter();
  const { signIn } = useGitHubAuth();
  const [ecosystems, setEcosystems] = React.useState<EcosystemInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    loadEcosystems();
  }, []);

  const loadEcosystems = async () => {
    setLoading(true);
    try {
      // First try to get from cache for instant display
      const cached = getCachedEcosystems();
      if (cached.length > 0) {
        setEcosystems(cached);
      }

      // Then fetch fresh data from contract
      const fresh = await fetchEcosystemsFromFactory();
      if (fresh.length > 0) {
        setEcosystems(fresh);
        cacheEcosystems(fresh);
      } else if (cached.length === 0) {
        // If no ecosystems from contract and no cache, show empty state
        setEcosystems([]);
      }
    } catch (error) {
      console.error("Error loading ecosystems:", error);
      // Fall back to cache on error
      const cached = getCachedEcosystems();
      setEcosystems(cached);
    } finally {
      setLoading(false);
    }
  };

  const filteredEcosystems = ecosystems.filter((eco) =>
    eco.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={signIn} />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Ecosystems
            </h1>
            <p className="text-text-secondary dark:text-text-dark-secondary mt-1">
              Browse and discover open source ecosystems
            </p>
          </div>
          <Button onClick={() => router.push("/ecosystem/onboard")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Ecosystem
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              placeholder="Search ecosystems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredEcosystems.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Building2 className="h-16 w-16 mx-auto text-text-secondary mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery ? "No Ecosystems Found" : "No Ecosystems Yet"}
              </h2>
              <p className="text-text-secondary dark:text-text-dark-secondary mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `No ecosystems match "${searchQuery}". Try a different search term.`
                  : "Be the first to create an ecosystem for your organization and start rewarding contributors."}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push("/ecosystem/onboard")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Ecosystem
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEcosystems.map((ecosystem) => (
              <EcosystemCard
                key={ecosystem.staking}
                ecosystem={ecosystem}
                onClick={() =>
                  router.push(`/ecosystem/${ecosystem.name}/dashboard`)
                }
              />
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="py-6">
              <div className="p-3 bg-blue-500/10 rounded-lg w-fit mb-4">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Create Your Ecosystem</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                Deploy reputation tokens and issue staking contracts for your
                organization.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="py-6">
              <div className="p-3 bg-purple-500/10 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Attract Contributors</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                Developers stake reputation to work on issues, ensuring quality
                contributions.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="py-6">
              <div className="p-3 bg-green-500/10 rounded-lg w-fit mb-4">
                <GitPullRequest className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Reward Quality Work</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                Verified contributions earn reputation tokens, building a
                trusted contributor network.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function EcosystemCard({
  ecosystem,
  onClick,
}: {
  ecosystem: EcosystemInfo;
  onClick: () => void;
}) {
  const deployedDate = new Date(ecosystem.deployedAt * 1000);

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-14 w-14">
            <AvatarImage
              src={`https://github.com/${ecosystem.name}.png`}
              alt={ecosystem.name}
            />
            <AvatarFallback className="text-lg">
              {ecosystem.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
              {ecosystem.name}
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
              {ecosystem.deployer.slice(0, 6)}...{ecosystem.deployer.slice(-4)}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-text-dark-secondary">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {deployedDate.toLocaleDateString()}
          </span>
          <Badge variant="secondary" className="text-xs">
            Active
          </Badge>
        </div>

        <div className="mt-4 pt-4 border-t border-border dark:border-border-dark">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary dark:text-text-dark-secondary">
              View Dashboard
            </span>
            <ExternalLink className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
