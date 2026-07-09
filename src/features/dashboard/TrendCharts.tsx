import { Card } from "@astryxdesign/core/Card";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDashboardTrend } from "./useDashboardTrend";

export function TrendCharts() {
  const { trend, isLoading } = useDashboardTrend();

  if (isLoading || !trend) {
    return (
      <Card padding={4}>
        <Skeleton height={300} />
      </Card>
    );
  }

  return (
    <Card padding={4}>
      <Text type="large">概览</Text>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={trend.revenue} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={56}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `¥${Math.round(value / 1000)}k`}
          />
          <Tooltip />
          <Bar dataKey="revenue" name="营收" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
