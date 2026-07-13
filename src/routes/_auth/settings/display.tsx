import { createFileRoute } from "@tanstack/react-router";
import { DisplayForm } from "../../../features/settings/DisplayForm";

export const Route = createFileRoute("/_auth/settings/display")({
  component: DisplayForm,
});
