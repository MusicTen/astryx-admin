import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

export const appTheme = defineTheme({
  name: "astryx-admin",
  extends: neutralTheme,
  tokens: {
    "--color-background-body": ["#f0f8ff", "#1b1b1b"],
  },
});
