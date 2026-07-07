import useSWR from "swr";
import { usersKey } from "./api";
import type { UserListParams, UserListResult } from "./types";

export function useUsers(params: UserListParams) {
  const { data, isLoading, mutate } = useSWR<UserListResult>(usersKey(params));
  return {
    users: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    refresh: mutate,
  };
}
