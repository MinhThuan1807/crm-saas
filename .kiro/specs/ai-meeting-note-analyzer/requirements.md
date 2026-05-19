# Requirements Document

## Introduction

Tính năng **AI Meeting Note Analyzer** cho phép sales rep paste nội dung ghi chú cuộc họp vào một Deal, hệ thống sẽ tự động phân tích bằng AI (OpenAI gpt-4o-mini) và sinh ra danh sách task, email draft, và tóm tắt. Kết quả được stream realtime về frontend qua SSE (Server-Sent Events) trong vòng 5 giây. Tính năng tích hợp BullMQ queue để xử lý bất đồng bộ, đảm bảo API phản hồi ngay lập tức (202 Accepted) trong khi AI xử lý nền.

Tính năng thuộc dự án CRM SaaS multi-tenant — mọi dữ liệu đều được phân tách theo `tenantId`.

---

## Glossary

- **AI_Analyzer**: Hệ thống backend NestJS xử lý toàn bộ luồng phân tích AI.
- **Queue_Processor**: BullMQ worker nhận job từ queue và gọi OpenAI API.
- **SSE_Controller**: NestJS controller cung cấp endpoint SSE để push event realtime về frontend.
- **AI_Panel**: Component React hiển thị kết quả phân tích AI trên Deal detail page.
- **Meeting_Note**: Nội dung văn bản ghi chú cuộc họp do user nhập vào.
- **AiSuggestion**: Bản ghi DB lưu kết quả phân tích AI, gồm các type: `TASK_LIST`, `EMAIL_DRAFT`, `SUMMARY`.
- **Task**: Bản ghi DB đại diện cho một công việc cần làm, liên kết với Deal.
- **Deal**: Bản ghi DB đại diện cho một cơ hội bán hàng, thuộc về một Tenant.
- **Tenant**: Đơn vị tổ chức trong hệ thống multi-tenant; mọi dữ liệu đều thuộc về một Tenant.
- **Rate_Limiter**: Cơ chế giới hạn số lượng request phân tích AI mỗi user trong một khoảng thời gian.
- **Job_ID**: Định danh duy nhất của một BullMQ job, dùng để theo dõi trạng thái xử lý.

---

## Requirements

### Requirement 1: Gửi Meeting Note để Phân tích AI

**User Story:** As a sales rep, I want to submit a meeting note for AI analysis on a Deal, so that I can quickly get actionable tasks and a follow-up email draft without manual effort.

#### Acceptance Criteria

1. WHEN a user submits a POST request to `/deals/:id/analyze` with a valid `meetingNote` string, THE AI_Analyzer SHALL enqueue a BullMQ job and return HTTP 202 Accepted cùng một string identifier `jobId` trong vòng 500ms.
2. WHEN a user submits a POST request to `/deals/:id/analyze`, THE AI_Analyzer SHALL validate rằng `meetingNote` có độ dài từ 10 đến 10000 ký tự.
3. IF `meetingNote` rỗng, dưới 10 ký tự, hoặc vượt quá 10000 ký tự, THEN THE AI_Analyzer SHALL trả về HTTP 422 với thông báo lỗi mô tả rõ ràng trường vi phạm và giới hạn bị vi phạm.
4. IF Deal với `:id` không tồn tại hoặc không thuộc `tenantId` của user hiện tại, THEN THE AI_Analyzer SHALL trả về HTTP 404.
5. IF request đến `/deals/:id/analyze` không có JWT hợp lệ, THEN THE AI_Analyzer SHALL trả về HTTP 401.
6. IF BullMQ không thể enqueue job (ví dụ Redis không khả dụng), THEN THE AI_Analyzer SHALL trả về HTTP 503 với thông báo lỗi rõ ràng.

---

### Requirement 2: Xử lý AI bằng BullMQ Queue

**User Story:** As a sales rep, I want the AI analysis to run in the background, so that the UI remains responsive while waiting for results.

#### Acceptance Criteria

1. WHEN a BullMQ job được dequeue, THE Queue_Processor SHALL gọi OpenAI API với model `gpt-4o-mini` và prompt chuẩn hóa từ `meetingNote`.
2. WHEN OpenAI API trả về kết quả thành công, THE Queue_Processor SHALL parse JSON response theo cấu trúc `{ tasks: [{ title: string, dueDate: string (ISO 8601) }], emailDraft: string, summary: string }`.
3. WHEN JSON response được parse thành công, THE Queue_Processor SHALL lưu 3 bản ghi `AiSuggestion` vào DB với các type `TASK_LIST`, `EMAIL_DRAFT`, `SUMMARY` tương ứng, gắn với `dealId` đúng.
4. WHEN `AiSuggestion` được lưu thành công, THE Queue_Processor SHALL tạo các bản ghi `Task` trong DB từ mảng `tasks`, mỗi task gắn với `dealId`; nếu `dueDate` không phải ISO 8601 hợp lệ thì bỏ qua trường đó thay vì fail.
5. IF OpenAI API không phản hồi trong vòng 30 giây, THEN THE Queue_Processor SHALL đánh dấu job là failed, lưu error reason và `jobId` vào DB để SSE_Controller có thể push event lỗi về frontend.
6. IF OpenAI API trả về JSON không đúng cấu trúc mong đợi, THEN THE Queue_Processor SHALL thử parse lại tối đa 1 lần với cùng input và prompt trước khi đánh dấu job là failed.
7. THE Queue_Processor SHALL lưu `sourceNote` (meeting note gốc) vào bản ghi `AiSuggestion` để phục vụ audit.
8. IF việc ghi `AiSuggestion` hoặc `Task` vào DB thất bại, THEN THE Queue_Processor SHALL rollback toàn bộ các bản ghi đã tạo trong job đó (atomic) và đánh dấu job là failed.

---

### Requirement 3: Stream Kết quả Realtime qua SSE

**User Story:** As a sales rep, I want to see AI analysis results appear in real-time on the Deal page, so that I don't have to manually refresh or wait for a full page reload.

#### Acceptance Criteria

1. WHEN a user kết nối đến `GET /deals/:id/ai-stream`, THE SSE_Controller SHALL thiết lập kết nối SSE với header `Content-Type: text/event-stream`.
2. WHEN BullMQ job hoàn tất thành công, THE SSE_Controller SHALL push event `ai-complete` chứa payload `{ tasks, emailDraft, summary }` đến tất cả client đang subscribe deal đó.
3. IF BullMQ job thất bại, THEN THE SSE_Controller SHALL push event `ai-error` chứa thông báo lỗi thân thiện đến client.
4. IF request đến `GET /deals/:id/ai-stream` không có JWT hợp lệ hoặc Deal không thuộc `tenantId` của user, THEN THE SSE_Controller SHALL từ chối kết nối với HTTP 401 hoặc 404 tương ứng trước khi thiết lập SSE stream.
5. WHEN kết nối SSE được thiết lập thành công, THE SSE_Controller SHALL push event `ai-connected` ngay lập tức để xác nhận kết nối.
6. WHILE kết nối SSE đang mở, THE SSE_Controller SHALL gửi heartbeat event mỗi 15 giây để duy trì kết nối.
7. WHEN SSE_Controller đã push event `ai-complete` hoặc `ai-error`, THE SSE_Controller SHALL đóng kết nối SSE ngay sau đó.

---

### Requirement 4: Hiển thị Kết quả AI trên Frontend

**User Story:** As a sales rep, I want to see the AI-generated tasks and email draft displayed progressively on the Deal detail page, so that I can review and act on them immediately.

#### Acceptance Criteria

1. THE AI_Panel SHALL hiển thị textarea cho phép user nhập `meetingNote` (tối thiểu 10, tối đa 10000 ký tự) và một button "Phân tích bằng AI" trên Deal detail page.
2. WHEN user click button "Phân tích bằng AI", THE AI_Panel SHALL disable button và hiển thị loading animation trong khi chờ kết quả; button SHALL không thể click lại cho đến khi nhận được `ai-complete` hoặc `ai-error`.
3. WHEN SSE event `ai-complete` được nhận, THE AI_Panel SHALL hiển thị danh sách tasks với title và dueDate, và email draft trong các section riêng biệt mà không reload trang.
4. WHEN SSE event `ai-error` được nhận, THE AI_Panel SHALL hiển thị thông báo lỗi thân thiện và re-enable button "Phân tích bằng AI".
5. WHILE đang chờ kết quả AI (sau khi POST /analyze trả về 202 và trước khi nhận SSE event), THE AI_Panel SHALL hiển thị skeleton loading animation cho khu vực tasks và email draft.
6. WHEN SSE event `ai-complete` hoặc `ai-error` được nhận, THE AI_Panel SHALL đóng `EventSource` connection ngay lập tức; IF `EventSource` gặp lỗi kết nối, THE AI_Panel SHALL hiển thị thông báo lỗi và re-enable button.
7. WHEN kết quả AI được hiển thị, THE AI_Panel SHALL cho phép user copy email draft bằng một button "Copy"; WHEN copy thành công, THE AI_Panel SHALL hiển thị feedback tạm thời (ví dụ: "Đã copy!") trong 2 giây.
8. IF user đã submit một phân tích đang chờ kết quả, THEN THE AI_Panel SHALL ngăn user submit thêm một phân tích mới cho đến khi phân tích hiện tại hoàn tất hoặc thất bại.

---

### Requirement 5: Rate Limiting cho AI Analysis

**User Story:** As a system administrator, I want to limit the number of AI analysis requests per user, so that the system prevents abuse and controls OpenAI API costs.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL giới hạn mỗi user tối đa 10 request phân tích AI trong vòng 60 giây, tính theo `userId`.
2. IF user vượt quá giới hạn 10 request/phút, THEN THE Rate_Limiter SHALL trả về HTTP 429 với thông báo `"Bạn đã vượt quá giới hạn 10 lần phân tích/phút. Vui lòng thử lại sau."` và header `Retry-After` chỉ định số giây còn lại đến khi window reset.
3. THE Rate_Limiter SHALL theo dõi số lượng request theo `userId` (không phải IP) để đảm bảo giới hạn áp dụng đúng per-user trong môi trường multi-tenant.
4. THE Rate_Limiter SHALL sử dụng Redis để lưu trữ bộ đếm request với TTL 60 giây, đảm bảo hoạt động đúng khi scale nhiều instance backend.

---

### Requirement 6: Error Handling và Resilience

**User Story:** As a sales rep, I want to receive clear error messages when AI analysis fails, so that I understand what went wrong and can retry appropriately.

#### Acceptance Criteria

1. IF OpenAI API không phản hồi trong vòng 30 giây, THEN THE Queue_Processor SHALL push SSE event `ai-error` với thông báo `"Phân tích AI mất quá nhiều thời gian. Vui lòng thử lại."` về frontend.
2. IF OpenAI API trả về lỗi quota exceeded (HTTP 429) hoặc authentication error (HTTP 401/403), THEN THE Queue_Processor SHALL log lỗi chi tiết ở server (bao gồm status code, message, dealId) và push SSE event `ai-error` với thông báo `"Dịch vụ AI tạm thời không khả dụng. Vui lòng liên hệ admin."` về frontend.
3. IF kết nối Redis bị gián đoạn khi xử lý request, THEN THE AI_Analyzer SHALL trả về HTTP 503 với thông báo lỗi rõ ràng thay vì crash server.
4. WHEN một BullMQ job thất bại, THE Queue_Processor SHALL retry tối đa 2 lần với delay 5 giây giữa các lần trước khi đánh dấu job là permanently failed.
5. THE AI_Analyzer SHALL log toàn bộ lỗi OpenAI API (bao gồm status code, message, và `dealId`) ở mức `error` để phục vụ debugging.

---

### Requirement 7: Cấu hình Môi trường và Infrastructure

**User Story:** As a developer, I want all AI and queue infrastructure to be configurable via environment variables, so that the system can be deployed across different environments without code changes.

#### Acceptance Criteria

1. THE AI_Analyzer SHALL đọc `OPENAI_API_KEY`, `OPENAI_MODEL`, `REDIS_HOST`, và `REDIS_PORT` từ environment variables thông qua config module được validate bằng Zod schema khi khởi động.
2. IF bất kỳ biến môi trường bắt buộc nào (`OPENAI_API_KEY`, `REDIS_HOST`, `REDIS_PORT`) bị thiếu khi khởi động, THEN THE AI_Analyzer SHALL log lỗi rõ ràng chỉ định biến nào bị thiếu và dừng quá trình khởi động (process exit với code khác 0).
3. THE AI_Analyzer SHALL sử dụng giá trị mặc định `gpt-4o-mini` cho `OPENAI_MODEL` nếu biến môi trường không được cung cấp.
4. THE AI_Analyzer SHALL kết nối BullMQ với Redis sử dụng `REDIS_HOST` và `REDIS_PORT` từ environment variables thông qua `BullModule` trong `AppModule`.
