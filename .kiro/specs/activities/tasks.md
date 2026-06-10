# Implementation Plan: Activities

## Overview

Mở rộng module Activities từ stub hiện tại (chỉ có create/get for contact) thành CRUD đầy đủ: backend với 3 controllers, service, repo, DTOs, và module hoàn chỉnh; frontend với Activities page, form tạo/sửa, components cập nhật, service layer, React Query hooks, và tích hợp vào Contact Detail Page.

## Tasks

- [ ] 1. Refactor backend data model và DTOs
  - [ ] 1.1 Rewrite `activities.model.ts` với đầy đủ Zod schemas theo design
    - Thêm `ActivityTypeEnum` dùng `z.nativeEnum(ActivityType)` import từ `generated/prisma-client`
    - Định nghĩa `ActivityBaseSchema` với nested `user`, `contact`, `deal` relations
    - Thêm `CreateActivityForContactBodySchema`, `CreateActivityForDealBodySchema`
    - Thêm `UpdateActivityBodySchema` với `.refine()` check ít nhất 1 field
    - Thêm `GetActivitiesQuerySchema` với pagination, type, search, contactId, dealId
    - Export tất cả response schemas: `ActivityResSchema`, `GetActivitiesResSchema`, `GetActivitiesPaginatedResSchema`
    - Export các TypeScript types từ schemas
    - _Requirements: 1.1, 2.1, 5.2, 5.3, 6.1, 6.4, 8.4_

  - [ ] 1.2 Rewrite `activities.dto.ts` với đầy đủ DTO classes
    - `CreateActivityForContactBodyDto`, `CreateActivityForDealBodyDto`
    - `UpdateActivityBodyDto`, `GetActivitiesQueryDto`
    - `ActivityResDto`, `GetActivitiesResDto`, `GetActivitiesPaginatedResDto`
    - Xóa các DTO cũ không còn dùng (`CreateActivityBodyDto`, `CreateActivityResDto`)
    - _Requirements: 1.1, 2.1, 5.4, 6.1, 8.4_

- [x] 2. Implement ActivitiesRepository đầy đủ
  - [x] 2.1 Rewrite `activities.repo.ts` với tất cả query methods
    - `create(tenantId, userId, data, context)` — include user/contact/deal relations
    - `findAllByContact(tenantId, contactId)` — orderBy date desc, include relations
    - `findAllByDeal(tenantId, dealId)` — orderBy `[date desc, id desc]`, include relations
    - `findAll(tenantId, query)` — pagination + type/search/contactId/dealId filters, `$transaction([findMany, count])`
    - `findOne(activityId, tenantId)` — trả về null nếu không tìm thấy
    - `update(activityId, tenantId, data)` — partial update, include relations
    - `hardDelete(activityId, tenantId)` — `prisma.activity.delete()`, không soft delete
    - Mọi query phải có `where.tenantId`
    - _Requirements: 1.5, 2.3, 2.5, 3.1, 3.2, 3.3, 4.2, 5.1, 5.5, 5.7, 5.11, 6.3, 7.1, 7.5, 8.1, 8.2, 8.3, 14.2_

  - [ ]\* 2.2 Write property test cho ActivitiesRepository — Property 1
    - **Property 1: Tạo activity — dữ liệu được persist đầy đủ và đúng**
    - Dùng fast-check: với bất kỳ body hợp lệ, activity tạo ra phải khớp chính xác với input
    - Tag: `// Feature: activities, Property 1: Create activity persists correct data`
    - **Validates: Requirements 1.5, 2.5, 14.4**

  - [ ]\* 2.3 Write property test cho ActivitiesRepository — Property 2
    - **Property 2: Date mặc định về now() khi không được cung cấp**
    - Dùng fast-check: với bất kỳ body không có `date`, activity.date phải nằm trong `[requestTime - 5s, requestTime + 5s]`
    - Tag: `// Feature: activities, Property 2: Date defaults to now()`
    - **Validates: Requirements 1.3**

  - [ ]\* 2.4 Write property test cho ActivitiesRepository — Property 4
    - **Property 4: Activities trả về luôn được sắp xếp date giảm dần**
    - Dùng fast-check: với bất kỳ tập activities, mọi GET endpoint đều trả về list có `a[i].date >= a[i+1].date`; tiebreaker `id` descending khi cùng date
    - Tag: `// Feature: activities, Property 4: Activities ordered date desc`
    - **Validates: Requirements 3.2, 4.2, 5.11**

  - [ ]\* 2.5 Write property test cho ActivitiesRepository — Property 5
    - **Property 5: Response enrichment — relations luôn được include đúng**
    - Dùng fast-check: `user` luôn non-null; `contact` null ↔ `contactId` null; `deal` null ↔ `dealId` null
    - Tag: `// Feature: activities, Property 5: Relations enriched correctly`
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [ ] 3. Implement ActivitiesService đầy đủ
  - [ ] 3.1 Rewrite `activities.service.ts` với tất cả service methods
    - `createForContact(tenantId, contactId, userId, body)` — validate contact thuộc tenant qua `ContactsRepository`
    - `createForDeal(tenantId, dealId, userId, body)` — validate deal thuộc tenant qua `DealRepository`; nếu body có `contactId`, cũng validate contact
    - `getByContact(tenantId, contactId)` — validate contact, trả về `{ data: [] }`
    - `getByDeal(tenantId, dealId)` — validate deal, throw `NotFoundException` khi deal không tồn tại (không trả về `{ data: [] }` khi deal không tồn tại)
    - `getAll(tenantId, query)` — trả về `{ data, total, page, limit }`
    - `updateActivity(activityId, tenantId, body)` — findOne trước, throw 404 nếu không có
    - `deleteActivity(activityId, tenantId)` — catch Prisma P2025 error → throw NotFoundException
    - `tenantId` và `userId` luôn từ JWT, không từ body
    - _Requirements: 1.2, 1.3, 2.2, 2.4, 3.5, 4.4, 4.5, 5.1, 5.8, 5.9, 6.2, 7.2, 7.3, 14.3, 14.4_

  - [ ]\* 3.2 Write property test cho ActivitiesService — Property 3
    - **Property 3: Tenant isolation — cross-tenant request luôn nhận 404**
    - Dùng fast-check: với bất kỳ `contactId`, `dealId`, hoặc `activityId` thuộc tenant B, user tenant A nhận 404 (không phải 403 hay 200)
    - Tag: `// Feature: activities, Property 3: Tenant isolation returns 404`
    - **Validates: Requirements 1.2, 2.2, 3.5, 4.4, 6.2, 7.3, 14.3**

  - [ ]\* 3.3 Write property test cho ActivitiesService — Property 9
    - **Property 9: Partial update — chỉ cập nhật đúng fields được cung cấp**
    - Dùng fast-check: với bất kỳ subset không rỗng của `{type, title, note, date}`, chỉ subset đó thay đổi; các fields còn lại giữ nguyên; `tenantId/userId/contactId/dealId` không đổi
    - Tag: `// Feature: activities, Property 9: Partial update only changes provided fields`
    - **Validates: Requirements 6.1, 6.3**

  - [ ]\* 3.4 Write property test cho ActivitiesService — Property 10
    - **Property 10: Hard delete round-trip**
    - Dùng fast-check: sau khi DELETE thành công, GET cùng `id` trả về null/404; activity không còn trong `getAll` list
    - Tag: `// Feature: activities, Property 10: Hard delete round-trip`
    - **Validates: Requirements 7.1, 7.5**

- [x] 4. Implement ba controller classes và cập nhật module
  - [x] 4.1 Rewrite `activities.controller.ts` với 3 controller classes
    - `ContactActivitiesController` — `@Controller('contacts/:contactId/activities')`: `POST` (201 + `ActivityResDto`), `GET` (`GetActivitiesResDto`)
    - `DealActivitiesController` — `@Controller('deals/:dealId/activities')`: `POST` (201 + `ActivityResDto`), `GET` (`GetActivitiesResDto`)
    - `ActivitiesController` — `@Controller('activities')`: `GET` với `@Query GetActivitiesQueryDto` (`GetActivitiesPaginatedResDto`), `PATCH :id` (`ActivityResDto`), `DELETE :id` (`MessageDto`)
    - Tất cả endpoints dùng `@UseGuards(JwtAuthGuard)` và `@ZodSerializerDto`
    - `@CurrentUser()` dùng để lấy `tenantId` và `userId`
    - Đảm bảo thứ tự route `GET /activities` trước `PATCH/DELETE :id`
    - _Requirements: 1.1, 1.4, 2.1, 3.1, 4.1, 5.1, 5.2, 5.3, 5.6, 6.1, 6.4, 7.1, 7.6, 14.1_

  - [x] 4.2 Update `activities.module.ts` để đăng ký đầy đủ
    - Thêm `ContactActivitiesController`, `DealActivitiesController`, `ActivitiesController` vào `controllers`
    - Thêm `DealRepository` vào `providers`
    - Giữ `ActivitiesService`, `ActivitiesRepository`, `PrismaService`, `ContactsRepository`
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 5. Checkpoint — Backend
  - Đảm bảo tất cả tests pass. Hỏi user nếu có thắc mắc.

- [x] 6. Implement frontend type definitions và API service
  - [x] 6.1 Tạo `fe/src/types/activity.type.ts` với TypeScript types mapping API response
    - `ActivityItem` interface với tất cả fields từ `ActivityBaseType`
    - `GetActivitiesPaginatedRes`, `GetActivitiesListRes` interfaces
    - `CreateActivityForContactBody`, `CreateActivityForDealBody`, `UpdateActivityBody` interfaces
    - `GetActivitiesParams` interface với pagination + filter params
    - _Requirements: 9.1, 11.1_

  - [x] 6.2 Tạo `fe/src/services/activities.service.ts`
    - Import `axiosInstance` từ `@/lib/api`
    - `activitiesService.getAll(params)`, `getByContact(contactId)`, `getByDeal(dealId)`
    - `createForContact(contactId, body)`, `createForDeal(dealId, body)`
    - `update(activityId, body)`, `delete(activityId)`
    - _Requirements: 9.1, 9.7, 11.1, 11.3, 11.5_

- [ ] 7. Implement React Query hooks (`useActivities.ts`)
  - [x] 7.1 Tạo `fe/src/hooks/useActivities.ts` với query keys và hooks
    - `activityKeys` — source of truth cho cache keys
    - `useActivities(params)` — `useQuery` cho `/activities` paginated
    - `useActivitiesInfinite(params)` — `useInfiniteQuery` với `getNextPageParam`
    - `useContactActivities(contactId)` — `useQuery`, enabled khi `!!contactId`
    - `useDealActivities(dealId)` — `useQuery`, enabled khi `!!dealId`
    - `useCreateContactActivity(contactId)` — `useMutation`, invalidate `["activities", "contact", contactId]` + `["activities"]`
    - `useCreateDealActivity(dealId)` — `useMutation`, invalidate tương tự
    - `useUpdateActivity()` — `useMutation`, invalidate `["activities"]`
    - `useDeleteActivity()` — `useMutation`, invalidate `["activities"]`
    - Toast success/error theo pattern của `useDeals.ts` và `useContacts.ts`
    - _Requirements: 9.1, 9.2, 9.6, 9.7, 11.1, 11.3, 11.5_

  - [ ]\* 7.2 Write property test cho React Query hooks — Property 6
    - **Property 6: Pagination — response luôn có đủ 4 fields với giá trị nhất quán**
    - Dùng fast-check: với bất kỳ `page ∈ [1,∞)` và `limit ∈ [1,100]`, response có `data`, `total`, `page`, `limit` và `len(data) ≤ limit`
    - Tag: `// Feature: activities, Property 6: Pagination response shape consistent`
    - **Validates: Requirements 5.2, 5.4**

  - [ ]\* 7.3 Write property test cho React Query hooks — Property 7
    - **Property 7: Type filter — kết quả luôn khớp với filter**
    - Dùng fast-check: với bất kỳ `ActivityType` value, mọi item trong `data` phải có đúng type đó
    - Tag: `// Feature: activities, Property 7: Type filter returns correct type`
    - **Validates: Requirements 5.5**

  - [ ]\* 7.4 Write property test cho React Query hooks — Property 8
    - **Property 8: Search filter — kết quả luôn match search string**
    - Dùng fast-check: với bất kỳ `search` string không rỗng, mọi activity trong `data` phải có `title` hoặc `note` chứa `search` (case-insensitive)
    - Tag: `// Feature: activities, Property 8: Search filter matches term`
    - **Validates: Requirements 5.7**

- [ ] 8. Cập nhật frontend type definitions và ActivityCard component
  - [x] 8.1 Update `fe/src/app/(dashboard)/activities/_components/types.ts`
    - Thêm/cập nhật `ActivityItem` type mapping với API `ActivityItem` từ `activity.type.ts`
    - Cập nhật `ActivityGroup` type để dùng `ActivityItem` từ API
    - Cập nhật `TYPE_META` để map `CALL | EMAIL | MEETING | NOTE` (uppercase, từ API)
    - Xóa `TOP_STAFF` mock constant — sẽ được tính toán dynamic trong `SummaryPanel`
    - _Requirements: 9.1, 13.1_

  - [x] 8.2 Update `ActivityCard.tsx` để dùng API data
    - Nhận `activity: ActivityItem` (API type) thay vì mock type
    - Đổi icon mapping key sang uppercase `CALL | EMAIL | MEETING | NOTE`
    - Cập nhật `NOTE_MAX_LEN` từ 140 → **120** characters (theo requirement 13.1)
    - Hiển thị `activity.user.name` thay vì `activity.owner.name`
    - Thêm Edit/Delete action buttons trong dropdown menu `MoreHorizontal` (gọi `onEdit` / `onDelete` props)
    - Hiển thị AI badge khi `activity.deal` có giá trị (dealId không null) theo requirement 13.4
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ]\* 8.3 Write property test cho ActivityCard — Property 13
    - **Property 13: ActivityCard expand/collapse round-trip**
    - Dùng fast-check: với bất kỳ `note.length > 120`, card hiển thị truncated + "Xem thêm"; sau click hiển thị full note + "Thu gọn"; sau click lại quay về truncated — round-trip hoàn chỉnh
    - Tag: `// Feature: activities, Property 13: Note expand/collapse round-trip`
    - **Validates: Requirements 13.1, 13.2, 13.3**

- [ ] 9. Implement ActivityForm component
  - [x] 9.1 Tạo `fe/src/app/(dashboard)/activities/_components/ActivityForm.tsx`
    - Render trong `Dialog` hoặc `Sheet` của shadcn/ui
    - Fields: `type` (Select, required), `title` (Input, optional), `note` (Textarea, required), `date` (datetime picker, optional, default `new Date()`)
    - Dùng React Hook Form + Zod client-side validation
    - Validation error "Nội dung không được để trống" khi `note` rỗng/whitespace
    - Props: `open`, `onOpenChange`, `activity?` (edit mode), `context` (`{ type: 'contact', contactId }` | `{ type: 'deal', dealId }` | `{ type: 'global' }`)
    - Edit mode: pre-populate tất cả fields từ `activity` prop
    - Submit thành công → form đóng (gọi `onOpenChange(false)`)
    - Submit thất bại (API error) → form **không đóng**, hiển thị error message via toast
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]\* 9.2 Write property test cho ActivityForm — Property 14
    - **Property 14: ActivityForm reject whitespace note**
    - Dùng fast-check: với bất kỳ string chỉ gồm whitespace (`fc.string().filter(s => s.trim() === '')`), form hiển thị lỗi "Nội dung không được để trống" và không gọi API
    - Tag: `// Feature: activities, Property 14: ActivityForm rejects whitespace note`
    - **Validates: Requirements 12.2**

- [ ] 10. Cập nhật SummaryPanel để dùng real data
  - [x] 10.1 Update `SummaryPanel.tsx` để nhận props thay vì dùng hardcoded data
    - Thêm props: `activities: ActivityItem[]`, `isLoading: boolean`
    - Tính `counts` per type bằng `useMemo` từ toàn bộ `activities` (unfiltered)
    - Tính `topUsers` (top 3) bằng `useMemo` — sort by count desc, tiebreaker name asc
    - Hiển thị skeleton loading khi `isLoading = true`
    - Khi không có activities: hiển thị 3 placeholder slots "Chưa có dữ liệu"
    - `SummaryPanel` không nhận `activeFilter` — luôn dùng unfiltered data (req 10.4)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]\* 10.2 Write property test cho SummaryPanel — Property 11
    - **Property 11: SummaryPanel counts chính xác và không bị ảnh hưởng bởi filter**
    - Dùng fast-check: với bất kỳ tập activities, count mỗi type = đúng số items có type đó; thay đổi `activeFilter` không thay đổi counts
    - Tag: `// Feature: activities, Property 11: SummaryPanel counts accurate and filter-independent`
    - **Validates: Requirements 10.1, 10.4**

  - [ ]\* 10.3 Write property test cho SummaryPanel — Property 12
    - **Property 12: Top users ranking deterministic với tiebreaker**
    - Dùng fast-check: với bất kỳ tập activities, top users được sắp xếp count desc, khi cùng count → name asc (alphabetical); kết quả deterministic với cùng input
    - Tag: `// Feature: activities, Property 12: Top users ranking deterministic`
    - **Validates: Requirements 10.2, 10.3**

- [x] 11. Cập nhật Activities Page (`page.tsx`) để dùng real API data
  - [x] 11.1 Rewrite `page.tsx` — thay `ACTIVITY_GROUPS` mock bằng `useActivitiesInfinite`
    - Import `useActivitiesInfinite` từ `@/hooks/useActivities`
    - Thêm state `activeFilter` → truyền vào hook như `type` param
    - Implement `groupActivitiesByDate(activities)` để group theo calendar day
    - Truyền grouped data xuống `ActivitiesTimeline`
    - Truyền **unfiltered** flat activities xuống `SummaryPanel` (để counts chính xác)
    - "Load more" button — gọi `fetchNextPage()` từ `useActivitiesInfinite`
    - Skeleton loading khi `isLoading = true`
    - `EmptyState` khi `data.pages[0].data.length === 0`
    - Thêm "New Activity" button → mở `ActivityForm` với `context: { type: 'global' }`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 12. Tích hợp Activities vào Contact Detail Page
  - [x] 12.1 Update `fe/src/app/(dashboard)/contacts/[id]/page.tsx` để tích hợp activities
    - Import `useContactActivities`, `useCreateContactActivity`, `useUpdateActivity`, `useDeleteActivity`
    - Fetch activities với `useContactActivities(contactId)`
    - Render `ActivitiesTimeline` với data từ hook
    - Thêm "Add Activity" button → mở `ActivityForm` với `context: { type: 'contact', contactId }`
    - Khi tạo thành công: React Query invalidation tự động refresh list
    - Edit action trên `ActivityCard` → mở `ActivityForm` pre-filled với activity data
    - Delete action trên `ActivityCard` → gọi `useDeleteActivity`, xóa khỏi list
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 13. Final Checkpoint — Toàn bộ feature
  - Đảm bảo tất cả tests pass. Hỏi user nếu có thắc mắc.

## Notes

- Tasks đánh dấu `*` là optional và có thể bỏ qua để phát triển MVP nhanh hơn
- Mỗi task đều tham chiếu requirements cụ thể để traceability
- Checkpoint tại task 5 (sau backend) và task 13 (cuối cùng) để validate incremental progress
- Property tests dùng **fast-check** với tối thiểu 100 iterations mỗi test (`numRuns: 100`)
- Mỗi property test PHẢI có comment tag `// Feature: activities, Property {N}: {text}`
- Prisma client luôn import từ `generated/prisma-client`, không từ `@prisma/client`
- Hard delete cho activities — Activity không có `deletedAt` field
- `tenantId` và `userId` luôn từ `@CurrentUser()`, không từ request body

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "4.1"] },
    { "id": 4, "tasks": ["4.2"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2", "8.1"] },
    { "id": 7, "tasks": ["7.1", "8.2"] },
    { "id": 8, "tasks": ["7.2", "7.3", "7.4", "8.3", "9.1", "10.1"] },
    { "id": 9, "tasks": ["9.2", "10.2", "10.3", "11.1"] },
    { "id": 10, "tasks": ["12.1"] }
  ]
}
```
