import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useDashboardStats, type DashboardStats } from "./useDashboardStats";

const CARDS: {
  key: keyof DashboardStats;
  title: string;
  variant: "blue" | "green" | "purple" | "red";
}[] = [
  { key: "userTotal", title: "用户总数", variant: "blue" },
  { key: "activeToday", title: "今日活跃", variant: "green" },
  { key: "orderTotal", title: "订单总数", variant: "purple" },
  { key: "errorCount", title: "今日告警", variant: "red" },
];

export function StatCards() {
  const { stats, isLoading } = useDashboardStats();
  return (
    <Grid columns={{ minWidth: 200, max: 4 }} gap={4}>
      {CARDS.map((card) => (
        <Card key={card.key} padding={4} variant={card.variant}>
          <Stack direction="vertical" gap={2}>
            <Text type="supporting" color="secondary">
              {card.title}
            </Text>
            {isLoading || !stats ? (
              <Skeleton height={40} width={96} />
            ) : (
              <Text type="display-2" hasTabularNumbers>
                {stats[card.key]}
              </Text>
            )}
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}
