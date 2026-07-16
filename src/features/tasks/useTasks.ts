import useSWR from "swr";
import type { PageResult } from "../../lib/api";
import { tasksKey } from "./api";
import type { Task, TaskListParams } from "./types";

export function useTasks(params: TaskListParams) {
  const { data, isLoading, mutate } = useSWR<PageResult<Task>>(tasksKey(params));
  return {
    tasks: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    refresh: mutate,
  };
}
