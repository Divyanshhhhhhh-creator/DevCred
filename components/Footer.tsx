import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface dark:bg-surface-dark dark:border-border-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">TrustMyGit</h3>
            <p className="text-text-secondary dark:text-text-dark-secondary">
              Developer Reputation & Token Platform
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/docs"
                  className="text-sm text-text-secondary hover:text-primary dark:text-text-dark-secondary"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/api"
                  className="text-sm text-text-secondary hover:text-primary dark:text-text-dark-secondary"
                >
                  API Reference
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="text-sm text-text-secondary hover:text-primary dark:text-text-dark-secondary"
                >
                  Guides
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-text-secondary hover:text-primary dark:text-text-dark-secondary"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-text-secondary hover:text-primary dark:text-text-dark-secondary"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Contact</h4>
            <ul className="space-y-2">
              <li className="text-sm text-text-secondary dark:text-text-dark-secondary">
                support@trustmygit.io
              </li>
              <li className="text-sm text-text-secondary dark:text-text-dark-secondary">
                123 Blockchain St, Web3 City
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border dark:border-border-dark">
          <p className="text-center text-sm text-text-secondary dark:text-text-dark-secondary">
            © 2024 TrustMyGit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
