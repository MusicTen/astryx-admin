import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack } from "@astryxdesign/core/Stack";
import { Table } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { useRecentEvents } from "./useRecentEvents";
import type { RecentEvent } from "./types";

type EventRow = RecentEvent & Record<string, unknown>;

export function RecentActivityTable() {
  const { events, isLoading } = useRecentEvents();

  return (
    <Card padding={4}>
      <Stack direction="vertical" gap={3}>
        <Text type="large">最近活动</Text>
        {isLoading ? (
          <Stack direction="vertical" gap={2}>
            <Skeleton height={32} />
            <Skeleton height={32} />
            <Skeleton height={32} />
          </Stack>
        ) : events.length === 0 ? (
          <EmptyState title="暂无活动记录" description="团队成员操作后会显示在这里" />
        ) : (
          <Table<EventRow>
            data={events as EventRow[]}
            idKey="id"
            columns={[
              { key: "actor", header: "操作人" },
              { key: "action", header: "动作" },
              { key: "target", header: "对象" },
              {
                key: "createdAt",
                header: "时间",
                renderCell: (event) => <Timestamp value={event.createdAt} format="relative" />,
              },
            ]}
          />
        )}
      </Stack>
    </Card>
  );
}
