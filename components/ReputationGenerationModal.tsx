"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle, ExternalLink, Loader2 } from "lucide-react";

interface AttestationProgress {
  orgName: string;
  status: 'pending' | 'generating' | 'attesting' | 'completed';
  attestationId?: string;
  prismUrl?: string;
  score?: number;
}

interface ReputationGenerationModalProps {
  open: boolean;
  organizations: string[];
  progress: AttestationProgress[];
  isGeneratingProof: boolean;
}

export function ReputationGenerationModal({
  open,
  organizations,
  progress,
  isGeneratingProof,
}: ReputationGenerationModalProps) {
  const getStatusIcon = (status: AttestationProgress['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
      case 'generating':
      case 'attesting':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getStatusText = (status: AttestationProgress['status']) => {
    switch (status) {
      case 'pending':
        return 'Waiting...';
      case 'generating':
        return 'Calculating reputation...';
      case 'attesting':
        return 'Creating attestation...';
      case 'completed':
        return 'Completed';
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Generating Reputation Scores
          </DialogTitle>
          <DialogDescription>
            Creating on-chain attestations for your organization contributions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          {/* zkTLS Proof Generation */}
          {isGeneratingProof && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-pulse">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-blue-900 dark:text-blue-200">
                    Generating zkTLS Proof
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Verifying your GitHub contributions...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Organization Progress */}
          {!isGeneratingProof && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Attesting reputation for {organizations.length} organization{organizations.length !== 1 ? 's' : ''}:
              </p>
              
              <div className="space-y-2">
                {progress.map((org) => (
                  <div
                    key={org.orgName}
                    className={`p-3 rounded-lg border transition-all ${
                      org.status === 'completed'
                        ? org.attestationId === 'failed'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : org.status === 'generating' || org.status === 'attesting'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(org.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm break-words">{org.orgName}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {org.attestationId === 'failed' ? 'Failed to create attestation' : getStatusText(org.status)}
                          </p>
                        </div>
                      </div>
                      
                      {org.status === 'completed' && org.score !== undefined && org.attestationId !== 'failed' && (
                        <Badge variant="secondary" className="font-semibold flex-shrink-0">
                          {Math.round(org.score * 100)}%
                        </Badge>
                      )}
                    </div>
                    
                    {org.status === 'completed' && org.prismUrl && org.attestationId !== 'failed' && (
                      <a
                        href={org.prismUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline break-all"
                      >
                        <Award className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">View Attestation</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {!isGeneratingProof && progress.length > 0 && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Progress:</span>
                <span className="font-medium">
                  {progress.filter(p => p.status === 'completed').length} / {progress.length} completed
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
