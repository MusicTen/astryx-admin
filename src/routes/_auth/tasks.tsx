import { createFileRoute } from "@tanstack/react-router";
import { TaskTable } from "../../features/tasks/TaskTable";

export const Route = createFileRoute("/_auth/tasks")({
  component: () => <TaskTable />,
});
