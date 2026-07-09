import useSWR from "swr";
import { tasksKey } from "./api";
import type { TaskListResult } from "./types";

export function useTasks() {
  const { data, isLoading, mutate } = useSWR<TaskListResult>(tasksKey);
  return {
    tasks: data?.items ?? [],
    isLoading,
    refresh: mutate,
  };
}
