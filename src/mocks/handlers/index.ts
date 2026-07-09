import { appHandlers } from "./apps";
import { authHandlers } from "./auth";
import { dashboardHandlers } from "./dashboard";
import { taskHandlers } from "./tasks";
import { userHandlers } from "./users";

export const handlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...userHandlers,
  ...taskHandlers,
  ...appHandlers,
];
