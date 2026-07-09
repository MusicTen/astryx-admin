import { createFileRoute } from "@tanstack/react-router";
import { UserTable } from "../../features/users/UserTable";

export const Route = createFileRoute("/_auth/users")({
  component: () => <UserTable />,
});
