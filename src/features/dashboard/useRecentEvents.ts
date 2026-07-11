import useSWR from "swr";
import type { PageResult } from "../../lib/api";
import type { RecentEvent } from "./types";

export function useRecentEvents() {
  const { data, isLoading } = useSWR<PageResult<RecentEvent>>("dashboard/events");
  return { events: data?.items ?? [], isLoading };
}
