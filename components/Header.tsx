"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Moon, Sun, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGitHubAuth } from "@/lib/GitHubAuthContext";

interface HeaderProps {
  user?: {
    displayName: string;
    avatarUrl: string;
  };
  onLoginClick?: () => void;
}

export function Header({ onLoginClick }: HeaderProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = React.useState(false);
  const { user, isAuthenticated, signIn } = useGitHubAuth();

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/80 backdrop-blur-md dark:bg-background-dark/80 dark:border-border-dark">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">TrustMyGit</span>
            </Link>
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href="/developer/dashboard"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/developer/dashboard"
                      ? "text-primary"
                      : "text-text-secondary dark:text-text-dark-secondary"
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  href="/ecosystems"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname.startsWith("/ecosystem")
                      ? "text-primary"
                      : "text-text-secondary dark:text-text-dark-secondary"
                  )}
                >
                  Ecosystems
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
              className="rounded-full"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <Link href="/ecosystem/1/project/1/staking">
                  <Button variant="outline" className="gap-2">
                    <FileCode className="h-4 w-4" />
                    <span className="hidden md:inline">Pick up an Issue</span>
                  </Button>
                </Link>
                <Button className="hidden md:inline-flex">Post</Button>
                <Link href={`/dev/${user.user.login}`}>
                  <Image
                    src={user.user.avatar_url}
                    alt={user.user.name || user.user.login}
                    width={32}
                    height={32}
                    className="rounded-full border border-border dark:border-border-dark"
                  />
                </Link>
              </div>
            ) : (
              <Button onClick={onLoginClick || signIn}>Login</Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
