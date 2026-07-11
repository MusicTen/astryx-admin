import { useTranslation } from "react-i18next";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack, StackItem } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useUsers } from "../users";

const SALE_AMOUNTS = [1999, 39, 299, 99, 39];

export function RecentSalesList() {
  const { users, total, isLoading } = useUsers({ page: 1, pageSize: 5, keyword: "" });
  const { t } = useTranslation();

  return (
    <Card padding={4}>
      <Stack direction="vertical" gap={4}>
        <Stack direction="vertical" gap={1}>
          <Text type="large">{t("dashboard.recentSales.title")}</Text>
          <Text type="supporting" color="secondary">
            {t("dashboard.recentSales.summary", { count: total })}
          </Text>
        </Stack>
        {isLoading ? (
          <Stack direction="vertical" gap={3}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Stack>
        ) : users.length === 0 ? (
          <EmptyState title={t("dashboard.recentSales.emptyTitle")} description={t("dashboard.recentSales.emptyDescription")} />
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
