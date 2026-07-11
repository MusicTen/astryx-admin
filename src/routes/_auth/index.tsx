import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Grid } from "@astryxdesign/core/Grid";
import { Stack } from "@astryxdesign/core/Stack";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { Text } from "@astryxdesign/core/Text";
import { RecentSalesList } from "../../features/dashboard/RecentSalesList";
import { StatCards } from "../../features/dashboard/StatCards";
import { TrendCharts } from "../../features/dashboard/TrendCharts";

const TABS = [
  { value: "overview", labelKey: "dashboard.tabs.overview" },
  { value: "analytics", labelKey: "dashboard.tabs.analytics" },
  { value: "reports", labelKey: "dashboard.tabs.reports" },
  { value: "notifications", labelKey: "dashboard.tabs.notifications" },
];

function DashboardPage() {
  const [tab, setTab] = useState("overview");
  const { t } = useTranslation();

  return (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">{t("dashboard.title")}</Text>
      <TabList value={tab} onChange={setTab}>
        {TABS.map((item) => (
          <Tab key={item.value} value={item.value} label={t(item.labelKey)} />
        ))}
      </TabList>
      {tab === "overview" ? (
        <Stack direction="vertical" gap={4}>
          <StatCards />
          <Grid columns={{ minWidth: 380, repeat: "fit" }} gap={4}>
            <TrendCharts />
            <RecentSalesList />
          </Grid>
        </Stack>
      ) : (
        <EmptyState title={t("dashboard.comingSoon.title")} description={t("dashboard.comingSoon.description")} />
      )}
    </Stack>
  );
}

export const Route = createFileRoute("/_auth/")({
  component: DashboardPage,
});
