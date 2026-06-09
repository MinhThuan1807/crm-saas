# Requirements Document

## Introduction

Feature **Activities** mở rộng khả năng quản lý hoạt động bán hàng trong CRM SaaS multi-tenant. Hiện tại hệ thống chỉ hỗ trợ tạo và xem activity gắn với contact qua 2 endpoint. Feature này mở rộng toàn diện: thêm CRUD đầy đủ, gắn activity với deal, xem tổng hợp cross-tenant, lọc/phân trang, thống kê, và kết nối giao diện frontend từ mock data sang API thực.

Các loại activity: `CALL` (cuộc gọi), `EMAIL`, `MEETING` (gặp mặt), `NOTE` (ghi chú).

## Glossary

- **Activity_Service**: NestJS service xử lý business logic cho Activities (`activities.service.ts`)
- **Activity_Repo**: NestJS repository tương tác Prisma cho Activities (`activities.repo.ts`)
- **Activity_Controller**: NestJS controller định nghĩa HTTP routes cho Activities (`activities.controller.ts`)
- **Activities_Page**: Trang `/activities` trên frontend hiển thị tất cả activities của tenant
- **Contact_Detail_Page**: Trang `/contacts/:id` trên frontend, hiển thị chi tiết contact kèm tab activities
- **Deal_Detail_Page**: Trang `/deals/:id` (hoặc tương đương) hiển thị chi tiết deal kèm tab activities
- **ActivityType**: Enum với 4 giá trị — `CALL`, `EMAIL`, `MEETING`, `NOTE`
- **Tenant**: Tổ chức/công ty dùng CRM; mọi dữ liệu được phân tách theo `tenantId`
- **CurrentUser**: Thông tin user đăng nhập lấy từ JWT qua decorator `@CurrentUser()`
- **ActivityCard**: Component frontend hiển thị thông tin một activity
- **SummaryPanel**: Component frontend hiển thị thống kê activities (count theo type, top users)
- **ActivityTimeline**: Component frontend hiển thị danh sách activities nhóm theo ngày
- **Cursor**: Con trỏ phân trang dùng `id` của activity cuối trong page hiện tại (cursor-based pagination)
- **AiSuggestion**: Model chứa gợi ý AI liên quan đến deal, có thể hiển thị badge trên ActivityCard

---

## Requirements

### Requirement 1: Tạo Activity Gắn Với Contact

**User Story:** As a sales rep, I want to log an activity for a contact, so that I can track all interactions with that contact.

#### Acceptance Criteria

1. WHEN a POST request is sent to `/contacts/:contactId/activities` with valid body (`type`, `note` required; `title`, `date` optional), THE Activity_Controller SHALL create and return the new activity with HTTP 201.
2. WHEN the `contactId` in the URL does not belong to the current user's tenant, THEN THE Activity_Service SHALL throw a 404 NotFoundException.
3. IF the `date` field is omitted, THEN THE Activity_Service SHALL default the activity date to the current timestamp.
4. THE Activity_Controller SHALL require a valid JWT; requests without a valid token SHALL receive HTTP 401.
5. WHEN an activity is created, THE Activity_Repo SHALL persist `tenantId`, `contactId`, `userId` (from CurrentUser), `type`, `note`, `title`, and `date` to the database.

---

### Requirement 2: Tạo Activity Gắn Với Deal

**User Story:** As a sales rep, I want to log an activity directly on a deal, so that I can track deal-level interactions separately from contact-level ones.

#### Acceptance Criteria

1. WHEN a POST request is sent to `/deals/:dealId/activities` with valid body (`type`, `note` required; `title`, `date`, `contactId` optional), THE Activity_Controller SHALL create and return the new activity with HTTP 201.
2. IF the `dealId` in the URL does not exist within the current user's tenant or has been deleted, THEN THE Activity_Service SHALL throw a 404 NotFoundException.
3. WHEN an activity is created for a deal without specifying `contactId`, THE Activity_Repo SHALL persist the activity with `contactId = null` and `dealId` set.
4. WHEN an activity is created for a deal and a `contactId` is also provided in the body, THE Activity_Repo SHALL persist both `contactId` and `dealId`; IF the `contactId` does not belong to the current tenant, THE Activity_Service SHALL throw a 404 NotFoundException before persisting.
5. WHEN an activity is created for a deal, THE Activity_Repo SHALL persist `tenantId` (from CurrentUser) and `userId` (from CurrentUser) along with all provided fields.

---

### Requirement 3: Xem Activities Theo Contact

**User Story:** As a sales rep, I want to view all activities for a specific contact in chronological order, so that I can review the full interaction history.

#### Acceptance Criteria

1. WHEN a GET request is sent to `/contacts/:contactId/activities`, THE Activity_Controller SHALL return a list of activities belonging to that contact, scoped to the current tenant.
2. THE Activity_Repo SHALL return activities ordered by `date` descending (newest first).
3. THE Activity_Repo SHALL include in each activity item the creator's `id`, `name` (from related `User`).
4. THE Activity_Repo SHALL include in each activity item the related `contact`'s `id`, `name`, `company` fields.
5. WHEN the `contactId` does not belong to the current tenant, THEN THE Activity_Service SHALL throw a 404 NotFoundException.

---

### Requirement 4: Xem Activities Theo Deal

**User Story:** As a sales rep, I want to view all activities linked to a specific deal, so that I can see everything that happened within a deal context.

#### Acceptance Criteria

1. WHEN a GET request is sent to `/deals/:dealId/activities`, THE Activity_Controller SHALL return a list of activities linked to that deal, scoped to the current tenant.
2. THE Activity_Repo SHALL return activities ordered by `date` descending, using `id` as a tiebreaker for deterministic ordering.
3. THE Activity_Repo SHALL include in each activity the creator's `id` and `name` (from related `User`), and the related `deal`'s `id` and `title`.
4. IF the `dealId` does not exist within the current tenant, THEN THE Activity_Service SHALL throw a 404 NotFoundException; THE Activity_Service SHALL NOT silently return an empty list when the deal does not exist.
5. WHEN the `dealId` exists within the current tenant but has no activities, THE Activity_Controller SHALL return HTTP 200 with an empty `data` array.

---

### Requirement 5: Xem Tất Cả Activities Của Tenant (Global List)

**User Story:** As a sales manager, I want to see all activities across all contacts and deals in one place, so that I can monitor team-wide activity.

#### Acceptance Criteria

1. WHEN a GET request is sent to `/activities`, THE Activity_Controller SHALL return a paginated list of all activities scoped to the current tenant.
2. THE Activity_Controller SHALL support offset-based pagination via `page` (integer ≥ 1, default: 1) and `limit` (integer ≥ 1, default: 20) query parameters.
3. IF `limit` exceeds 100 or `page` is less than 1, THEN THE Activity_Controller SHALL reject the request with HTTP 400.
4. THE Activity_Controller SHALL return a response containing `data` (array of activities), `total` (total matching count), `page`, and `limit`.
5. WHEN the `type` query parameter is provided with a valid `ActivityType` value (CALL, EMAIL, MEETING, or NOTE), THE Activity_Repo SHALL filter activities to only those matching the specified type.
6. IF the `type` query parameter contains an invalid value, THEN THE Activity_Controller SHALL return HTTP 400.
7. WHEN the `search` query parameter is provided, THE Activity_Repo SHALL filter activities whose `title` or `note` contains the search string (case-insensitive substring match); IF no activity matches, THE Activity_Repo SHALL return an empty `data` array with `total = 0`.
8. WHEN the `contactId` query parameter is provided, THE Activity_Repo SHALL filter activities scoped to that contact within the current tenant; IF the `contactId` does not exist within the current tenant, THE Activity_Service SHALL return HTTP 404.
9. WHEN the `dealId` query parameter is provided, THE Activity_Repo SHALL filter activities scoped to that deal within the current tenant; IF the `dealId` does not exist within the current tenant, THE Activity_Service SHALL return HTTP 404.
10. THE Activity_Repo SHALL include in each activity: creator `user { id, name }`, contact `{ id, name, company }` or `null` if no contact, deal `{ id, title }` or `null` if no deal.
11. THE Activity_Repo SHALL order results by `date` descending, using `id` as a tiebreaker for deterministic ordering.

---

### Requirement 6: Cập Nhật Activity

**User Story:** As a sales rep, I want to edit an activity I logged, so that I can correct or update the information.

#### Acceptance Criteria

1. WHEN a PATCH request is sent to `/activities/:id` with a valid partial body (`type`, `title`, `note`, `date` — all optional), THE Activity_Controller SHALL update and return the modified activity.
2. WHEN the activity `id` does not exist or does not belong to the current tenant, THEN THE Activity_Service SHALL throw a 404 NotFoundException.
3. THE Activity_Service SHALL only update fields that are explicitly provided in the request body (partial update).
4. WHEN the PATCH body contains no recognizable fields, THEN THE Activity_Controller SHALL return HTTP 400.

---

### Requirement 7: Xóa Activity

**User Story:** As a sales rep, I want to delete an activity, so that I can remove incorrectly logged entries.

#### Acceptance Criteria

1. WHEN a DELETE request is sent to `/activities/:id` with a valid JWT and the activity belongs to the current tenant, THE Activity_Controller SHALL permanently delete the activity and return HTTP 200 with a confirmation message.
2. IF the `id` does not correspond to any activity, THEN THE Activity_Service SHALL throw a 404 NotFoundException.
3. IF the activity exists but belongs to a different tenant, THEN THE Activity_Service SHALL throw a 404 NotFoundException (not 403, to avoid tenant leakage).
4. IF the database deletion operation fails, THEN THE Activity_Controller SHALL return HTTP 500.
5. WHEN the deletion succeeds, THE Activity_Repo SHALL perform a hard delete; a subsequent GET request for the same `id` SHALL return 404.
6. THE Activity_Controller SHALL require a valid JWT; requests without a valid token SHALL receive HTTP 401.

---

### Requirement 8: Response Shape — Enriched Activity Object

**User Story:** As a frontend developer, I want activity API responses to include related entity names, so that I can display them without additional API calls.

#### Acceptance Criteria

1. THE Activity_Repo SHALL include `user { id, name }` in every activity response.
2. WHERE a `contactId` is present on an activity, THE Activity_Repo SHALL include `contact { id, name, company }` in the response; otherwise the field SHALL be `null`.
3. WHERE a `dealId` is present on an activity, THE Activity_Repo SHALL include `deal { id, title }` in the response; otherwise the field SHALL be `null`.
4. THE Activity_Controller SHALL define a Zod response schema (`ActivityBaseSchema`) that validates all fields including the nested `user`, `contact`, and `deal` objects.

---

### Requirement 9: Trang Activities Toàn Cục (Frontend)

**User Story:** As a sales rep, I want to view all my team's activities on a dedicated page with filters and pagination, so that I can stay on top of team activity.

#### Acceptance Criteria

1. WHEN the Activities_Page loads, THE Activities_Page SHALL fetch activities from `GET /activities` via React Query and replace mock data with real API data.
2. WHEN the user selects a type filter (CALL / EMAIL / MEETING / NOTE / All), THE Activities_Page SHALL re-fetch activities with the `type` query parameter and update the displayed list.
3. THE Activities_Page SHALL group activities by calendar date and display them in reverse chronological order using the ActivityTimeline component.
4. WHEN activities are loading, THE Activities_Page SHALL display a skeleton loading state.
5. WHEN the API returns an empty list, THE Activities_Page SHALL display the EmptyState component.
6. THE Activities_Page SHALL support loading more results via a "Load more" button or infinite scroll (calling `GET /activities` with incremented `page`).
7. WHEN the user submits the create-activity dialog/sheet form with valid data, THE Activities_Page SHALL call `POST /activities` (or the relevant scoped endpoint) and optimistically or reactively update the list via React Query invalidation.

---

### Requirement 10: SummaryPanel Thống Kê Thực

**User Story:** As a sales manager, I want the summary panel to show real statistics, so that I can assess team performance at a glance.

#### Acceptance Criteria

1. WHEN the Activities_Page loads, THE SummaryPanel SHALL display the count of activities per `ActivityType` (CALL, EMAIL, MEETING, NOTE) derived from the currently fetched tenant activity dataset (no additional API call).
2. THE SummaryPanel SHALL display the top 3 users ranked by total activity count (unfiltered, for the entire tenant), showing user name and count; WHEN no activities exist, THE SummaryPanel SHALL display 3 placeholder slots (e.g., "1. Chưa có dữ liệu").
3. WHERE two users have the same activity count, THE SummaryPanel SHALL rank them in alphabetical order by name to ensure deterministic display.
4. THE SummaryPanel SHALL always show total (unfiltered) counts labeled clearly as "Tổng"; it SHALL NOT change its statistics when the type filter on the timeline changes.
5. WHEN activity data is loading, THE SummaryPanel SHALL display a skeleton loading state for each statistic slot.

---

### Requirement 11: Tích Hợp Activities Vào Contact Detail Page (Frontend)

**User Story:** As a sales rep, I want to see and manage activities directly from a contact's detail page, so that I don't have to navigate to a separate page.

#### Acceptance Criteria

1. WHEN the Contact_Detail_Page loads, THE Contact_Detail_Page SHALL fetch activities from `GET /contacts/:contactId/activities` and display them in the ActivityTimeline component.
2. WHEN the user clicks "Add Activity" on the Contact_Detail_Page, THE Contact_Detail_Page SHALL open a create-activity form pre-scoped to the current contact.
3. WHEN a new activity is submitted from the Contact_Detail_Page, THE Contact_Detail_Page SHALL call `POST /contacts/:contactId/activities` and refresh the activity list via React Query.
4. WHEN the user clicks the edit action on an ActivityCard, THE Contact_Detail_Page SHALL open a pre-filled edit form; WHEN the form is submitted, THE Contact_Detail_Page SHALL call `PATCH /activities/:id` — this API call is mandatory and the form SHALL NOT close if the call fails.
5. WHEN the user confirms deletion of an activity, THE Contact_Detail_Page SHALL call `DELETE /activities/:id` and remove the item from the list via React Query.

---

### Requirement 12: Create / Edit Activity Form

**User Story:** As a sales rep, I want a form to create and edit activities, so that I can log interactions quickly.

#### Acceptance Criteria

1. THE Activity_Form SHALL include fields: `type` (required select), `title` (optional text), `note` (required textarea), `date` (optional datetime picker, defaults to now).
2. WHEN the `note` field is empty and the form is submitted, THE Activity_Form SHALL display a validation error "Nội dung không được để trống".
3. WHEN the form is submitted successfully (API call returns success and list refresh succeeds), THE Activity_Form SHALL close; IF either the API call or list refresh fails, THE Activity_Form SHALL remain open and display an error message.
4. WHEN the form is in edit mode, THE Activity_Form SHALL pre-populate all fields from the existing activity data.
5. THE Activity_Form SHALL be rendered inside a Dialog or Sheet component (shadcn/ui).

---

### Requirement 13: ActivityCard UX — Expand/Collapse Note

**User Story:** As a sales rep, I want to expand or collapse long notes on an activity card, so that the timeline stays readable.

#### Acceptance Criteria

1. WHEN an ActivityCard note exceeds 120 characters, THE ActivityCard SHALL truncate the note and display an "Xem thêm" button.
2. WHEN the user clicks "Xem thêm", THE ActivityCard SHALL expand to show the full note and replace the button with "Thu gọn".
3. WHEN the user clicks "Thu gọn", THE ActivityCard SHALL collapse back to the truncated state.
4. WHERE an activity has linked AiSuggestion items (via `dealId`), THE ActivityCard SHALL display an AI badge indicating the number of AI-generated suggestions, regardless of user permissions or whether AI features are enabled.

---

### Requirement 14: Tenant Isolation & Authorization

**User Story:** As a system administrator, I want every activity operation to be strictly scoped to the authenticated user's tenant, so that tenant data is never exposed across boundaries.

#### Acceptance Criteria

1. THE Activity_Controller SHALL apply `JwtAuthGuard` to all endpoints; requests without a valid JWT SHALL receive HTTP 401.
2. WHEN any activity query or mutation is executed, THE Activity_Repo SHALL always include `tenantId` from CurrentUser in the `where` clause.
3. WHEN an activity from a different tenant is requested by ID, THEN THE Activity_Service SHALL throw a 404 NotFoundException (not 403, to avoid tenant existence leakage).
4. THE Activity_Service SHALL derive `tenantId` and `userId` exclusively from the JWT payload (CurrentUser), never from the request body.
