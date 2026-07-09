import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboardTrend } from "./useDashboardTrend";

export function TrendCharts() {
  const { trend, isLoading } = useDashboardTrend();

  if (isLoading || !trend) {
    return (
      <Grid columns={{ minWidth: 320, repeat: "fit" }} gap={4}>
        <Skeleton height={280} />
        <Skeleton height={280} />
      </Grid>
    );
  }

  return (
    <Grid columns={{ minWidth: 320, repeat: "fit" }} gap={4}>
      <Card padding={4}>
        <Text type="large">营收趋势（近 12 个月）</Text>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trend.revenue} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={60} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" name="营收" stroke="#0171E3" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card padding={4}>
        <Text type="large">活跃用户（近 30 天）</Text>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={trend.activeUsers} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 12 }} width={50} />
            <Tooltip />
            <Bar dataKey="count" name="活跃用户数" fill="#6B1EFD" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Grid>
  );
}
