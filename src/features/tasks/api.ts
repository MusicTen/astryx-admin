import type { PageResult } from "../../lib/api";
import { http } from "../../lib/http";
import type { Task, TaskInput } from "./types";

export const tasksKey = "tasks";

export function fetchTasks(): Promise<PageResult<Task>> {
  return http.get(tasksKey).json<PageResult<Task>>();
}

export function createTask(input: TaskInput): Promise<Task> {
  return http.post(tasksKey, { json: input }).json<Task>();
}

export function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  return http.put(`${tasksKey}/${id}`, { json: input }).json<Task>();
}

export async function deleteTask(id: string): Promise<void> {
  await http.delete(`${tasksKey}/${id}`).json();
}
