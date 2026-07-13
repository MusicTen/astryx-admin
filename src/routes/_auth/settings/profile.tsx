import { createFileRoute } from "@tanstack/react-router";
import { ProfileForm } from "../../../features/settings/ProfileForm";

export const Route = createFileRoute("/_auth/settings/profile")({
  component: ProfileForm,
});
