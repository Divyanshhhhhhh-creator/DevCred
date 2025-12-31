import type { Metadata } from "next";
import "./globals.css";
import { GitHubAuthProvider } from "@/lib/GitHubAuthContext";

export const metadata: Metadata = {
  title: "TrustMyGit - Developer Reputation & Token Platform",
  description: "Maintain per-ecosystem loyalty scores and trade developer reputation tokens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-text dark:bg-background-dark dark:text-text-dark antialiased">
        <GitHubAuthProvider>
          {children}
        </GitHubAuthProvider>
      </body>
    </html>
  );
}
