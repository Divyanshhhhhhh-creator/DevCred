import useSWR from "swr";
import { api } from "./api";
import type { User, Ecosystem, EcosystemDetails, Developer, StakeIssue } from "./api";

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<User>("/api/me", () => api.getMe());
  return {
    user: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useEcosystems() {
  const { data, error, isLoading } = useSWR<Ecosystem[]>("/api/ecosystems", () =>
    api.getEcosystems()
  );
  return {
    ecosystems: data,
    isLoading,
    isError: error,
  };
}

export function useEcosystem(ecosystemId: string | null) {
  const { data, error, isLoading } = useSWR<EcosystemDetails | null>(
    ecosystemId ? `/api/ecosystems/${ecosystemId}` : null,
    () => (ecosystemId ? api.getEcosystem(ecosystemId) : null)
  );
  return {
    ecosystem: data,
    isLoading,
    isError: error,
  };
}

export function useDeveloper(devId: string | null) {
  const { data, error, isLoading } = useSWR<Developer | null>(
    devId ? `/api/developers/${devId}` : null,
    () => (devId ? api.getDeveloper(devId) : null)
  );
  return {
    developer: data,
    isLoading,
    isError: error,
  };
}

export function useStakeIssues(projectId: string | null) {
  const { data, error, isLoading } = useSWR<StakeIssue[]>(
    projectId ? `/api/stake-issues?projectId=${projectId}` : null,
    () => (projectId ? api.getStakeIssues(projectId) : [])
  );
  return {
    issues: data,
    isLoading,
    isError: error,
  };
}
