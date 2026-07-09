import { expect, test } from "vitest";
import { groupTasksByStatus } from "./groupTasksByStatus";
import type { Task } from "./types";

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "1",
    title: "t",
    status: "backlog",
    priority: "medium",
    assigneeId: "1",
    labels: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test("按状态分组任务", () => {
  const tasks = [
    makeTask({ id: "1", status: "backlog" }),
    makeTask({ id: "2", status: "done" }),
    makeTask({ id: "3", status: "backlog" }),
  ];
  const groups = groupTasksByStatus(tasks);
  expect(groups.backlog.map((t) => t.id)).toEqual(["1", "3"]);
  expect(groups.done.map((t) => t.id)).toEqual(["2"]);
  expect(groups["in-progress"]).toEqual([]);
});
