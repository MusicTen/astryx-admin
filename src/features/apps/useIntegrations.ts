import useSWR from "swr";
import type { PageResult } from "../../lib/api";
import { appsKey } from "./api";
import type { Integration } from "./types";

export function useIntegrations() {
  const { data, isLoading, mutate } = useSWR<PageResult<Integration>>(appsKey);
  return {
    apps: data?.items ?? [],
    isLoading,
    refresh: mutate,
  };
}
