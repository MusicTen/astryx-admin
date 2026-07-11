import useSWR from "swr";
import type { PageResult } from "../../lib/api";
import { tasksKey } from "./api";
import type { Task } from "./types";

export function useTasks() {
  const { data, isLoading, mutate } = useSWR<PageResult<Task>>(tasksKey);
  return {
    tasks: data?.items ?? [],
    isLoading,
    refresh: mutate,
  };
}
