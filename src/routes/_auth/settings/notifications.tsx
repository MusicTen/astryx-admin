import { createFileRoute } from "@tanstack/react-router";
import { NotificationsForm } from "../../../features/settings/NotificationsForm";

export const Route = createFileRoute("/_auth/settings/notifications")({
  component: NotificationsForm,
});
