import { useMemo, useState } from "react";
import { Badge } from "@astryxdesign/core/Badge";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Grid } from "@astryxdesign/core/Grid";
import { Icon } from "@astryxdesign/core/Icon";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useToast } from "@astryxdesign/core/Toast";
import {
  BarChart3,
  Code2,
  CreditCard,
  GitBranch,
  ListChecks,
  MessageSquare,
  MessagesSquare,
  PenTool,
  PieChart,
  Wallet,
  Workflow,
} from "lucide-react";
import { ApiError } from "../../lib/http";
import { connectIntegration, disconnectIntegration } from "./api";
import { useIntegrations } from "./useIntegrations";
import type { AppCategory } from "./types";

// lucide-react 1.23.0 removed brand/logo icons (Github, Figma, Slack, ...);
// these keys still match the mock data's icon field (see src/mocks/data/apps.ts)
// but resolve to generic equivalents instead of the removed brand marks.
const ICONS: Record<string, typeof MessageSquare> = {
  MessageSquare,
  MessagesSquare,
  Github: Code2,
  ListChecks,
  Figma: PenTool,
  CreditCard,
  Wallet,
  Workflow,
  GitBranch,
  BarChart3,
  PieChart,
};

const CATEGORIES: (AppCategory | "全部")[] = ["全部", "沟通协作", "开发工具", "支付", "自动化", "数据分析"];

export function AppsGrid() {
  const { apps, isLoading, refresh } = useIntegrations();
  const [category, setCategory] = useState<AppCategory | "全部">("全部");
  const toast = useToast();

  const filtered = useMemo(
    () => (category === "全部" ? apps : apps.filter((app) => app.category === category)),
    [apps, category],
  );

  const handleToggle = async (id: string, isConnected: boolean) => {
    try {
      if (isConnected) {
        await disconnectIntegration(id);
        toast({ body: "已断开连接" });
      } else {
        await connectIntegration(id);
        toast({ body: "已连接" });
      }
      await refresh();
    } catch (error) {
      toast({
        body: error instanceof ApiError ? error.message : "操作失败，请稍后重试",
        type: "error",
      });
    }
  };

  return (
    <Stack direction="vertical" gap={4}>
      <SegmentedControl
        label="按分类筛选"
        value={category}
        onChange={(value) => setCategory(value as AppCategory | "全部")}
      >
        {CATEGORIES.map((item) => (
          <SegmentedControlItem key={item} value={item} label={item} />
        ))}
      </SegmentedControl>

      {isLoading ? (
        <Grid columns={{ minWidth: 240, max: 4 }} gap={4}>
          <Skeleton height={140} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </Grid>
      ) : filtered.length === 0 ? (
        <EmptyState title="没有匹配的应用" description="切换分类查看其他应用" />
      ) : (
        <Grid columns={{ minWidth: 240, max: 4 }} gap={4}>
          {filtered.map((app) => (
            <SelectableCard
              key={app.id}
              label={app.name}
              isSelected={app.isConnected}
              onChange={() => handleToggle(app.id, app.isConnected)}
            >
              <Stack direction="vertical" gap={2}>
                <Icon icon={ICONS[app.icon]} size="lg" />
                <Text type="large">{app.name}</Text>
                <Text type="supporting" color="secondary">
                  {app.description}
                </Text>
                <Badge label={app.category} variant="neutral" />
              </Stack>
            </SelectableCard>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
