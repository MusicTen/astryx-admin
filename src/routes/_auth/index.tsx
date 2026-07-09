import { useState } from "react";
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
  { value: "overview", label: "概览" },
  { value: "analytics", label: "分析" },
  { value: "reports", label: "报表" },
  { value: "notifications", label: "通知" },
];

function DashboardPage() {
  const [tab, setTab] = useState("overview");

  return (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">仪表盘</Text>
      <TabList value={tab} onChange={setTab}>
        {TABS.map((item) => (
          <Tab key={item.value} value={item.value} label={item.label} />
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
        <EmptyState title="暂未开放" description="该页签的内容尚未实现" />
      )}
    </Stack>
  );
}

export const Route = createFileRoute("/_auth/")({
  component: DashboardPage,
});
