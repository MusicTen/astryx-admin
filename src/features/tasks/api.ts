import type { PageResult } from "../../lib/api";
import { http } from "../../lib/http";
import type { Task, TaskInput, TaskListParams } from "./types";

const TASKS_ENDPOINT = "tasks";

export function tasksKey(params: TaskListParams): string {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    keyword: params.keyword,
  });
  for (const status of params.statuses ?? []) {
    search.append("status", status);
  }
  for (const priority of params.priorities ?? []) {
    search.append("priority", priority);
  }
  return `${TASKS_ENDPOINT}?${search.toString()}`;
}

export function fetchTasks(params: TaskListParams): Promise<PageResult<Task>> {
  return http.get(tasksKey(params)).json<PageResult<Task>>();
}

export function createTask(input: TaskInput): Promise<Task> {
  return http.post(TASKS_ENDPOINT, { json: input }).json<Task>();
}

export function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  return http.put(`${TASKS_ENDPOINT}/${id}`, { json: input }).json<Task>();
}

export async function deleteTask(id: string): Promise<void> {
  await http.delete(`${TASKS_ENDPOINT}/${id}`).json();
}
