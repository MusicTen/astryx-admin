import useSWR from "swr";
import type { PageResult } from "../../lib/api";
import { usersKey } from "./api";
import type { User, UserListParams } from "./types";

export function useUsers(params: UserListParams) {
  const { data, isLoading, mutate } = useSWR<PageResult<User>>(usersKey(params));
  return {
    users: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    refresh: mutate,
  };
}
