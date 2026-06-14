# CRM SaaS - Hệ thống Quản lý Khách hàng Thông minh cho SMEs

Hệ thống quản lý quan hệ khách hàng (CRM) dạng phần mềm dịch vụ (SaaS) được thiết kế chuyên biệt cho các doanh nghiệp vừa và nhỏ (SMEs) tại Việt Nam. Dự án tập trung tối ưu quy trình bán hàng qua sales pipeline, phân công công việc và tích hợp sâu AI (Generative AI) để tự động hóa các tác vụ chăm sóc khách hàng hàng ngày.

---

## 📌 Tổng Quan Dự Án & Mục Tiêu

### 1. Đối tượng sử dụng
*   **Các doanh nghiệp vừa và nhỏ (SMEs):** Đang tìm kiếm giải pháp chuyển đổi số quy trình kinh doanh với chi phí hợp lý và dễ dàng triển khai.
*   **Đội ngũ Sales & Chăm sóc khách hàng:** Cần công cụ trực quan để quản lý khách hàng tiềm năng, theo dõi các thương vụ (Deals) và quản lý công việc hàng ngày.
*   **Nhà quản lý & Ban giám đốc:** Cần số liệu báo cáo doanh thu, hiệu suất làm việc của nhân viên và phân tích phễu bán hàng theo thời gian thực để đưa ra quyết định kinh doanh.

### 2. Mục tiêu dự án
*   **Tăng tỷ lệ chuyển đổi:** Giúp sales không bỏ sót cơ hội thông qua phễu bán hàng (pipeline) kéo thả trực quan và hệ thống nhắc nhở thông minh.
*   **Tự động hóa bằng AI:** Giảm bớt thời gian ghi chép thủ công. AI sẽ tự động phân tích biên bản họp để trích xuất công việc cần làm, viết email follow-up và tóm tắt thông tin quan trọng.
*   **Xây dựng kiến trúc SaaS chuẩn mực:** Thiết kế hệ thống đa doanh nghiệp (Multi-Tenant) an toàn, hiệu năng cao và có khả năng mở rộng tốt.

---

## 🛠️ Tech Stack Chi Tiết

Dự án được phân tách rõ ràng thành hai phân hệ Frontend và Backend:

### 1. Frontend (`/fe`)
*   **Core Framework:** React 19 & Next.js 16 (App Router) - Tối ưu hóa SEO, SSR/SSG và trải nghiệm tải trang.
*   **Styling & UI:** Tailwind CSS v4 & Tailwind Animate CSS cho giao diện hiện đại và các hiệu ứng chuyển động mượt mà.
*   **UI Components:** Shadcn UI & Radix UI đảm bảo tính đồng bộ và thẩm mỹ cao theo chuẩn thiết kế premium.
*   **State Management:** Zustand - Quản lý trạng thái client gọn nhẹ và tối ưu hiệu năng.
*   **Data Fetching & Caching:** React Query (TanStack Query v5) giúp đồng bộ hóa dữ liệu từ server, tự động re-fetch và cache thông minh.
*   **Visualizations & Drag & Drop:**
    *   Recharts: Vẽ các biểu đồ thống kê doanh thu, hiệu suất nhóm và phễu bán hàng.
    *   `@dnd-kit`: Xử lý tương tác kéo thả mượt mà trên Kanban Board quản lý thương vụ (Deal Pipeline).
*   **Validation:** Zod kết hợp với React Hook Form.

### 2. Backend (`/be`)
*   **Core Framework:** NestJS 11 (Node.js framework hướng đối tượng sử dụng TypeScript) giúp cấu trúc code rõ ràng và dễ bảo trì.
*   **Database & ORM:** PostgreSQL kết hợp Prisma ORM v7 (sử dụng `@prisma/adapter-pg`).
*   **Authentication & Security:** Passport JWT cho cơ chế xác thực an toàn và phân quyền cô lập dữ liệu giữa các Tenant.
*   **Background Jobs & Queues:** BullMQ & Bull (chạy trên nền Redis) dùng để xử lý bất đồng bộ các tác vụ nặng (gọi OpenAI API) nhằm giải phóng tài nguyên cho luồng xử lý chính.
*   **Real-time Communication:** Server-Sent Events (SSE) để truyền phát trạng thái xử lý của AI từ worker tới frontend theo thời gian thực.
*   **AI Integration:** OpenAI API SDK (`gpt-4o-mini` hoặc cấu hình tương đương) để phân tích ngôn ngữ tự nhiên và trích xuất thông tin.

---

## 💡 Những Vấn Đề Kỹ Thuật Đã Giải Quyết

Trong quá trình phát triển dự án thực tế, hệ thống đã giải quyết thành công các bài toán cốt lõi sau:

1.  **Thiết kế Multi-Tenant tách biệt dữ liệu:**
    *   Hệ thống cho phép nhiều doanh nghiệp cùng chạy chung một cơ sở hạ tầng nhưng dữ liệu hoàn toàn độc lập. Cơ chế phân quyền xác thực qua JWT giúp bảo mật tuyệt đối dữ liệu giữa các doanh nghiệp.
2.  **Xử lý bất đồng bộ tránh nghẽn luồng (AI Background Processing):**
    *   Việc gọi OpenAI API có thể mất từ 5-15 giây và dễ gặp lỗi mạng/hết hạn quota. Hệ thống đã giải quyết triệt để bằng cách đưa các yêu cầu phân tích vào hàng đợi BullMQ.
    *   Các worker chạy ngầm sẽ lấy job ra xử lý và có sẵn cấu hình tự động retry, cơ chế catch-timeout (hết hạn 30s) và phân loại lỗi thông minh (Unauthorized, Rate Limit, Server Error).
3.  **Đồng bộ giao diện thời gian thực với SSE:**
    *   Khi người dùng gửi ghi chú cuộc họp để AI phân tích, frontend không cần phải chờ đợi phản hồi đồng bộ hay thực hiện polling liên tục. Hệ thống thiết lập kết nối Server-Sent Events (SSE) để truyền phát trạng thái `ai-connected` -> `heartbeat` -> `ai-complete` / `ai-error` giúp giao diện tự động cập nhật ngay khi worker hoàn thành tác vụ.
