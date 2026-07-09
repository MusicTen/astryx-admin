import useSWR from "swr";
import type { RecentEventsResult } from "./types";

export function useRecentEvents() {
  const { data, isLoading } = useSWR<RecentEventsResult>("dashboard/events");
  return { events: data?.items ?? [], isLoading };
}
