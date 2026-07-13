import { createFileRoute } from "@tanstack/react-router";
import { AccountForm } from "../../../features/settings/AccountForm";

export const Route = createFileRoute("/_auth/settings/account")({
  component: AccountForm,
});
