"use client";
import {
  CreateContactBodyType,
  GetContactsQueryType,
  UpdateContactBodyType,
} from "@/lib/validations/contacts.scheme";
import { contactsService } from "@/services/contacts.service";
import { ApiError } from "@/types/error.type";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

// ─────────────────────────────────────────
// QUERY KEYS — source of truth cho cache
// ─────────────────────────────────────────
export const contactKeys = {
  all:    ["contacts"] as const,
  lists:  () => [...contactKeys.all, "list"] as const,
  list:   (params: GetContactsQueryType) => [...contactKeys.lists(), params] as const,
  detail: (id: string) => [...contactKeys.all, "detail", id] as const,
}

// export const contactQueries = {
//   getContacts: (params: GetContactsQueryType) => ({
//     queryKey: contactKeys.list(params),
//     queryFn: ({ pageParam }) => contactsService.getAll({
//       ...params,
//       cursor: pageParam as string | undefined,
//     }),
//     staleTime: 30_000,
//     initialPageParam: undefined as string | undefined,
//     getNextPageParam: (lastPage) =>
//       lastPage.pagination.hasNextPage
//         ? lastPage.pagination.nextCursor ?? undefined
//         : undefined,
//   }),
//   getContact: (id: string) => ({
//     queryKey: contactKeys.detail(id),
//     queryFn: () => contactsService.getById(id),
//   }),

// }

// ─────────────────────────────────────────
// GET ALL — dùng ở trang danh sách
// ─────────────────────────────────────────
export const useGetContacts = (params: GetContactsQueryType) => {
  return useInfiniteQuery({
    queryKey: contactKeys.list(params), // search thay đổi → refetch tự động
    queryFn: ({ pageParam }) =>
      contactsService.getAll({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    staleTime: 30_000,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.nextCursor ?? undefined
        : undefined,
  })
}

// ─────────────────────────────────────────
// GET ONE — dùng ở trang detail
// ─────────────────────────────────────────
export const useGetContact = (id: string) => {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn:  () => contactsService.getById(id),
    enabled:  !!id, // chỉ fetch khi có id
  })
}


// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────
export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactBodyType) => contactsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
      toast.success("Tạo liên hệ thành công")
    },
    onError: (error: ApiError) => {
      const message = error.response?.data.message || "Tạo liên hệ thất bại"
      toast.error(message)
    },
  })
}

// ─────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────
export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactBodyType }) => contactsService.update(id, data),
    onSuccess: (_, { id }) => {
      // invalidate cả list lẫn detail
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
      toast.success("Cập nhật thành công")
    },
    onError: (error: ApiError) => {
      const message = error.response?.data.message || "Cập nhật thất bại"
      toast.error(message)
    },
  })
}

// ─────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────
export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
      toast.success("Xóa liên hệ thành công")
    },
    onError: (error: ApiError) => {
      const message = error.response?.data.message || "Xóa thất bại"
      toast.error(message)
    },
  })
}