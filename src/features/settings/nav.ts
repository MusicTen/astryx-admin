import { Bell, Monitor, Palette, UserCircle, Wrench, type LucideIcon } from "lucide-react";

export type SettingsNavKey = "profile" | "account" | "appearance" | "notifications" | "display";

export interface SettingsNavItem {
  key: SettingsNavKey;
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

const NAV_ICONS: Record<SettingsNavKey, LucideIcon> = {
  profile: UserCircle,
  account: Wrench,
  appearance: Palette,
  notifications: Bell,
  display: Monitor,
};

const NAV_KEYS: SettingsNavKey[] = ["profile", "account", "appearance", "notifications", "display"];

export const SETTINGS_NAV: SettingsNavItem[] = NAV_KEYS.map((key) => ({
  key,
  href: `/settings/${key}`,
  labelKey: `settings.nav.${key}`,
  icon: NAV_ICONS[key],
}));
