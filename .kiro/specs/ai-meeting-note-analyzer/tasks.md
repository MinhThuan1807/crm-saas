# Implementation Plan

- [X] 1. Chuẩn bị model dữ liệu và cấu hình nền tảng
  - Thêm schema/entity cho `AiSuggestion` với các type `TASK_LIST`, `EMAIL_DRAFT`, `SUMMARY`, liên kết `dealId`, `tenantId`, `sourceNote`, `jobId`, nội dung kết quả và trạng thái lỗi nếu cần
  - Bổ sung hoặc cập nhật schema/entity `Task` để hỗ trợ task sinh từ AI, liên kết đúng `dealId` và `tenantId`
  - Thêm migration cho các bảng/cột mới và index theo `tenantId`, `dealId`, `jobId`
  - Cập nhật config module đọc `OPENAI_API_KEY`, `OPENAI_MODEL`, `REDIS_HOST`, `REDIS_PORT`
  - Validate env bằng Zod, đặt mặc định `OPENAI_MODEL=gpt-4o-mini`, fail fast khi thiếu biến bắt buộc
  - _Requirements: 2.3, 2.4, 2.7, 2.8, 7.1, 7.2, 7.3_

- [X] 2. Tích hợp Redis và BullMQ cho AI analysis
  - Cấu hình `BullModule` kết nối Redis qua `REDIS_HOST` và `REDIS_PORT`
  - Tạo queue riêng cho AI meeting note analysis
  - Định nghĩa payload job gồm `jobId`, `dealId`, `tenantId`, `userId`, `meetingNote`
  - Cấu hình retry tối đa 2 lần, delay 5 giây, timeout xử lý OpenAI 30 giây
  - Xử lý lỗi Redis khi enqueue để API trả HTTP 503 thay vì làm crash server
  - _Requirements: 1.1, 1.6, 2.5, 6.3, 6.4, 7.4_

- [X] 3. Xây dựng endpoint submit meeting note
  - Thêm `POST /deals/:id/analyze` yêu cầu JWT hợp lệ
  - Validate `meetingNote` là string dài từ 10 đến 10000 ký tự
  - Trả HTTP 422 với thông báo rõ ràng khi note rỗng, quá ngắn hoặc quá dài
  - Kiểm tra Deal tồn tại và thuộc `tenantId` của user hiện tại; trả 404 nếu không hợp lệ
  - Enqueue BullMQ job và trả HTTP 202 trong vòng 500ms kèm `jobId`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [X] 4. Thêm rate limiting theo user cho endpoint analyze
  - Tạo service/guard rate limit dùng Redis counter theo `userId`
  - Giới hạn 10 request phân tích AI trong 60 giây
  - Trả HTTP 429 khi vượt giới hạn với đúng thông báo yêu cầu
  - Gắn header `Retry-After` bằng số giây còn lại đến khi reset window
  - Đảm bảo key rate limit không dựa theo IP và hoạt động khi backend scale nhiều instance
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [X] 5. Tạo OpenAI analysis processor
  - Tạo BullMQ processor nhận job từ queue AI analysis
  - Gọi OpenAI API với model từ config, mặc định `gpt-4o-mini`
  - Chuẩn hóa prompt để yêu cầu JSON dạng `{ tasks, emailDraft, summary }`
  - Parse và validate response theo cấu trúc `tasks: [{ title, dueDate }], emailDraft, summary`
  - Nếu JSON sai cấu trúc, thử gọi/parse lại tối đa 1 lần trước khi fail job
  - Timeout OpenAI sau 30 giây và đánh dấu job failed với reason phù hợp
  - Log lỗi OpenAI ở mức `error` kèm status code, message và `dealId`
  - _Requirements: 2.1, 2.2, 2.5, 2.6, 6.1, 6.2, 6.5_

- [X] 6. Lưu kết quả AI và tạo task một cách atomic
  - Trong một DB transaction, lưu 3 bản ghi `AiSuggestion` cho `TASK_LIST`, `EMAIL_DRAFT`, `SUMMARY`
  - Lưu `sourceNote` gốc vào các bản ghi hoặc cấu trúc audit liên quan
  - Tạo các bản ghi `Task` từ mảng `tasks`, gắn đúng `dealId` và `tenantId`
  - Bỏ qua riêng field `dueDate` nếu không phải ISO 8601 hợp lệ, không làm fail toàn bộ job
  - Rollback toàn bộ `AiSuggestion` và `Task` nếu bất kỳ bước ghi DB nào thất bại
  - _Requirements: 2.3, 2.4, 2.7, 2.8_

- [ ] 7. Xây dựng SSE stream cho Deal AI analysis
  - Thêm `GET /deals/:id/ai-stream` yêu cầu JWT hợp lệ
  - Kiểm tra Deal thuộc `tenantId` của user trước khi mở stream; trả 401 hoặc 404 tương ứng
  - Thiết lập response `Content-Type: text/event-stream`
  - Push event `ai-connected` ngay khi stream mở thành công
  - Gửi heartbeat mỗi 15 giây trong khi stream còn mở
  - Quản lý danh sách subscriber theo `tenantId` và `dealId`
  - Đóng stream sau khi gửi `ai-complete` hoặc `ai-error`
  - _Requirements: 3.1, 3.4, 3.5, 3.6, 3.7_

- [ ] 8. Kết nối processor với SSE events
  - Khi job hoàn tất, publish event `ai-complete` đến tất cả client đang subscribe đúng Deal
  - Payload `ai-complete` gồm `{ tasks, emailDraft, summary }`
  - Khi job fail, publish event `ai-error` với thông báo thân thiện
  - Map timeout OpenAI sang thông báo: `Phân tích AI mất quá nhiều thời gian. Vui lòng thử lại.`
  - Map lỗi quota/auth OpenAI sang thông báo: `Dịch vụ AI tạm thời không khả dụng. Vui lòng liên hệ admin.`
  - Lưu hoặc truyền `jobId` và error reason để SSE controller có thể gửi lỗi đúng request
  - _Requirements: 3.2, 3.3, 6.1, 6.2_

- [ ] 12. Viết test backend cho API, queue và SSE
  - Test `POST /deals/:id/analyze` trả 202 và `jobId` khi hợp lệ
  - Test validation `meetingNote` trả 422 cho rỗng, dưới 10 ký tự và trên 10000 ký tự
  - Test 401 khi thiếu JWT và 404 khi Deal không thuộc tenant hiện tại
  - Test Redis/BullMQ enqueue failure trả 503
  - Test rate limit trả 429 và header `Retry-After`
  - Test processor parse OpenAI response, lưu `AiSuggestion`, tạo `Task`, bỏ qua invalid `dueDate`
  - Test processor rollback khi ghi DB thất bại
  - Test SSE gửi `ai-connected`, heartbeat, `ai-complete`, `ai-error` và đóng stream
  - _Requirements: 1.1-1.6, 2.1-2.8, 3.1-3.7, 5.1-5.4, 6.1-6.5_

- [ ] 13. Viết test frontend cho AI panel
  - Test textarea, validation và trạng thái disable button
  - Mock API 202 và SSE `ai-complete` để kiểm tra render tasks, email draft, summary
  - Mock SSE `ai-error` để kiểm tra thông báo lỗi và re-enable button
  - Test skeleton/loading trong thời gian chờ kết quả
  - Test không cho submit lần hai khi đang có phân tích pending
  - Test copy email draft và feedback `Đã copy!`
  - _Requirements: 4.1-4.8_

- [ ] 14. Cập nhật tài liệu vận hành và biến môi trường
  - Cập nhật `.env.example` với `OPENAI_API_KEY`, `OPENAI_MODEL`, `REDIS_HOST`, `REDIS_PORT`
  - Ghi chú yêu cầu Redis cho BullMQ và rate limiter
  - Tài liệu hóa endpoint `POST /deals/:id/analyze` và `GET /deals/:id/ai-stream`
  - Ghi chú các mã lỗi chính: 401, 404, 422, 429, 503 và lỗi SSE
  - _Requirements: 7.1, 7.2, 7.3, 7.4_
