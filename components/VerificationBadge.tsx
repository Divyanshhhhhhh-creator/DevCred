"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Clock, AlertCircle } from "lucide-react";

export type VerificationStatus =
  | "verified"
  | "pending"
  | "unverified"
  | "failed";

interface VerificationBadgeProps {
  status: VerificationStatus;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function VerificationBadge({
  status,
  showText = true,
  size = "md",
}: VerificationBadgeProps) {
  const iconSize =
    size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const textSize =
    size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs";

  const config = {
    verified: {
      icon: <CheckCircle2 className={`${iconSize} text-green-500`} />,
      text: "Verified",
      variant: "default" as const,
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    pending: {
      icon: <Clock className={`${iconSize} text-amber-500`} />,
      text: "Pending",
      variant: "outline" as const,
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
    unverified: {
      icon: <Shield className={`${iconSize} text-gray-500`} />,
      text: "Unverified",
      variant: "outline" as const,
      className:
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
    failed: {
      icon: <AlertCircle className={`${iconSize} text-red-500`} />,
      text: "Failed",
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const { icon, text, className } = config[status];

  return (
    <Badge className={`${className} ${textSize} gap-1`}>
      {icon}
      {showText && <span>{text}</span>}
    </Badge>
  );
}
