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
  title: string;
  icon: typeof Users;
  trend: string;
}[] = [
  { key: "userTotal", title: "用户总数", icon: Users, trend: "较上月 +12.4%" },
  { key: "orderTotal", title: "订单总数", icon: CreditCard, trend: "较上月 +19%" },
  { key: "activeToday", title: "今日活跃", icon: Activity, trend: "较昨日 +8.2%" },
  { key: "errorCount", title: "今日告警", icon: TriangleAlert, trend: "较昨日 -2 起" },
];

export function StatCards() {
  const { stats, isLoading } = useDashboardStats();
  return (
    <Grid columns={{ minWidth: 200, max: 4 }} gap={4}>
      {CARDS.map((card) => (
        <Card key={card.key} padding={4}>
          <Stack direction="vertical" gap={2}>
            <Toolbar
              label={card.title}
              startContent={
                <Text type="supporting" color="secondary">
                  {card.title}
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
              {card.trend}
            </Text>
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}
