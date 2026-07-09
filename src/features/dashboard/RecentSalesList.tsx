import { Avatar } from "@astryxdesign/core/Avatar";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack, StackItem } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useUsers } from "../users/useUsers";

const SALE_AMOUNTS = [1999, 39, 299, 99, 39];

export function RecentSalesList() {
  const { users, total, isLoading } = useUsers({ page: 1, pageSize: 5, keyword: "" });

  return (
    <Card padding={4}>
      <Stack direction="vertical" gap={4}>
        <Stack direction="vertical" gap={1}>
          <Text type="large">最近销售</Text>
          <Text type="supporting" color="secondary">
            本月共成交 {total} 笔
          </Text>
        </Stack>
        {isLoading ? (
          <Stack direction="vertical" gap={3}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Stack>
        ) : users.length === 0 ? (
          <EmptyState title="暂无销售记录" description="产生新订单后会显示在这里" />
        ) : (
          <Stack direction="vertical" gap={4}>
            {users.map((user, index) => (
              <Stack key={user.id} direction="horizontal" gap={3}>
                <Avatar name={user.name} size="small" />
                <StackItem size="fill">
                  <Stack direction="vertical" gap={0}>
                    <Text type="body">{user.name}</Text>
                    <Text type="supporting" color="secondary">
                      {user.email}
                    </Text>
                  </Stack>
                </StackItem>
                <Text type="body" hasTabularNumbers>
                  +¥{SALE_AMOUNTS[index % SALE_AMOUNTS.length]}
                </Text>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
