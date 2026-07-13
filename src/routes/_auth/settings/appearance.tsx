import { createFileRoute } from "@tanstack/react-router";
import { AppearanceForm } from "../../../features/settings/AppearanceForm";

export const Route = createFileRoute("/_auth/settings/appearance")({
  component: AppearanceForm,
});
