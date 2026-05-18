"use client";

import { useQuery } from "@tanstack/react-query";

import { usersService } from "@/services/users.service";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
};

export const useGetUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: usersService.getAll,
    staleTime: 30_000,
  });
};
