"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { auditLogsService, GetAuditLogsParams } from "@/services/audit-logs.service";

export const auditLogKeys = {
  all: ["audit-logs"] as const,
  lists: () => [...auditLogKeys.all, "list"] as const,
  list: (params: GetAuditLogsParams) => [...auditLogKeys.lists(), params] as const,
};

export const useGetAuditLogs = (params: GetAuditLogsParams) => {
  return useInfiniteQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: ({ pageParam }) =>
      auditLogsService.getAll({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    staleTime: 10_000,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.nextCursor ?? undefined
        : undefined,
  });
};
