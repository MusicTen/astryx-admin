import { useTranslation } from "react-i18next";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Icon } from "@astryxdesign/core/Icon";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { Activity, CreditCard, TriangleAlert, Users } from "lucide-react";
import { useDashboardStats, type DashboardStats } from "./useDashboardStats";

const CARDS: {
  key: keyof DashboardStats;
  titleKey: string;
  icon: typeof Users;
  trendKey: string;
}[] = [
  { key: "userTotal", titleKey: "dashboard.stats.userTotal", icon: Users, trendKey: "dashboard.stats.userTotalTrend" },
  { key: "orderTotal", titleKey: "dashboard.stats.orderTotal", icon: CreditCard, trendKey: "dashboard.stats.orderTotalTrend" },
  { key: "activeToday", titleKey: "dashboard.stats.activeToday", icon: Activity, trendKey: "dashboard.stats.activeTodayTrend" },
  { key: "errorCount", titleKey: "dashboard.stats.errorCount", icon: TriangleAlert, trendKey: "dashboard.stats.errorCountTrend" },
];

export function StatCards() {
  const { stats, isLoading } = useDashboardStats();
  const { t } = useTranslation();
  return (
    <Grid columns={{ minWidth: 200, max: 4 }} gap={4}>
      {CARDS.map((card) => (
        <Card key={card.key} padding={4}>
          <Stack direction="vertical" gap={2}>
            <Toolbar
              label={t(card.titleKey)}
              startContent={
                <Text type="supporting" color="secondary">
                  {t(card.titleKey)}
                </Text>
              }
              endContent={<Icon icon={card.icon} size="sm" color="secondary" />}
            />
            {isLoading || !stats ? (
              <Skeleton height={40} width={96} />
            ) : (
              <Text type="display-2" hasTabularNumbers>
                {stats[card.key]}
              </Text>
            )}
            <Text type="supporting" color="secondary">
              {t(card.trendKey)}
            </Text>
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}
