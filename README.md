# CRM SaaS - Hệ thống Quản lý Khách hàng Thông minh cho SMEs

<!-- Badges section -->
<div align="center">

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1--Custom-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs)](https://nestjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7.5-2D3748?logo=prisma)](https://prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-Active-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Active-336791?logo=postgresql)](https://www.postgresql.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai)](https://openai.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama--3.3-orange?logo=google-cloud&logoColor=white)](https://groq.com/)

</div>

---

Hệ thống quản lý quan hệ khách hàng (CRM) dưới dạng phần mềm dịch vụ (SaaS) đa doanh nghiệp (Multi-tenant), được thiết kế tối ưu hóa quy trình bán hàng qua Sales Pipeline (Kanban Board), quản lý công việc và tích hợp sâu trí tuệ nhân tạo (Generative AI) linh hoạt qua OpenAI & Groq Cloud nhằm tự động hóa các tác vụ chăm sóc khách hàng hàng ngày cho doanh nghiệp vừa và nhỏ (SMEs).

🚀 **Link Live Demo:** [https://codelaicuocdoi.io.vn](https://codelaicuocdoi.io.vn)
👥 **Tài khoản chạy thử nghiệm:**
*   **Tenant 1 (Công ty Công nghệ):** `admin@abc.com` / Mật khẩu: `Password123!`
*   **Tenant 2 (Công ty Bán lẻ):** `admin1@abc.com` / Mật khẩu: `Password123!`

---

## 📌 Tổng Quan Dự Án & Mục Tiêu

### 1. Đối tượng sử dụng
*   **Các doanh nghiệp vừa và nhỏ (SMEs):** Đang tìm kiếm giải pháp chuyển đổi số quy trình kinh doanh với chi phí tối ưu và dễ dàng triển khai.
*   **Đội ngũ Sales & Chăm sóc khách hàng:** Cần công cụ trực quan để quản lý khách hàng tiềm năng, theo dõi các thương vụ (Deals) và quản lý công việc hàng ngày.
*   **Nhà quản lý & Ban giám đốc:** Cần số liệu báo cáo doanh thu, hiệu suất làm việc của nhân viên và phân tích phễu bán hàng theo thời gian thực để đưa ra quyết định kinh doanh.

### 2. Mục tiêu dự án
*   **Tăng tỷ lệ chuyển đổi:** Giúp sales không bỏ sót cơ hội thông qua phễu bán hàng (pipeline) kéo thả trực quan và hệ thống nhắc nhở thông minh.
*   **Tự động hóa bằng AI:** Giảm bớt thời gian ghi chép thủ công. AI sẽ tự động phân tích biên bản họp để trích xuất công việc cần làm, viết email follow-up và tóm tắt thông tin quan trọng bằng mô hình OpenAI hoặc Llama 3 (qua Groq).
*   **Xây dựng kiến trúc SaaS chuẩn mực:** Thiết kế hệ thống đa doanh nghiệp (Multi-Tenant) an toàn, hiệu năng cao và có khả năng cô lập dữ liệu tuyệt đối giữa các tổ chức.

---

## 📸 Hình Ảnh & Giao Diện Dự Án

*Dưới đây là một số giao diện tiêu biểu của hệ thống:*

| **Dashboard Phân Tích & Báo Cáo** | **Kanban Board quản lý Deal Pipeline** |
| --- | --- |
| ![Dashboard](assets/dashboard.jpg) | ![Kanban Board](assets/pipeline.jpg) |
| *Biểu đồ thống kê doanh thu, tỷ lệ chuyển đổi và hiệu suất sales.* | *Kéo thả mượt mà để cập nhật trạng thái các cơ hội bán hàng.* |

| **AI Meeting Brief & Action Items** | **Cấu hình Phân quyền & Multi-Tenant** |
| --- | --- |
| ![AI Integration](assets/AI-intergation.jpg) | ![Tenant Settings](assets/tenant%20isolation.jpg) |
| *AI tự động phân tích ghi chú cuộc họp và đề xuất danh sách công việc.* | *Quản lý phân quyền chặt chẽ giữa các doanh nghiệp độc lập.* |

---

## 🛠️ Kiến Trúc Luồng Dữ Liệu (Application Data Flow)

Dự án được triển khai theo mô hình Client-Server hiện đại, sử dụng cơ chế hàng đợi xử lý bất đồng bộ (Queue) cho các tác vụ nặng liên quan đến Trí tuệ nhân tạo (AI):

```mermaid
graph TD
    Client[Next.js 16 Client] -->|1. HTTP Request| Gateway[NestJS Gateway / API Server]
    Gateway -->|2. Check Auth & Tenant| Guard[Passport JWT & Tenant Guard]
    Guard -->|3. Identify Tenant Context| DB[(PostgreSQL Database)]
    
    Gateway -->|4. Push Heavy AI Job| Queue[Redis / BullMQ Queue]
    Queue -->|5. Pickup Job| Worker[Background Worker Process]
    Worker -->|6. Run AI Analysis| AI_Selector{AI Provider Selector}
    AI_Selector -->|Option: openai| OpenAI[OpenAI API GPT-4o-mini]
    AI_Selector -->|Option: groq| Groq[Groq API Llama 3.3]
    Worker -->|7. Save Result| DB
    Worker -->|8. Push Completed Event| SSE[Server-Sent Events]
    SSE -->|9. Real-time Notification| Client
```

---

## ☁️ Kiến Trúc Triển Khai Hệ Thống (Production Deployment Architecture)

Hệ thống được thiết kế và triển khai trên môi trường Production với sự kết hợp tối ưu giữa đám mây **AWS (Amazon Web Services)**, nền tảng **Vercel** và cơ sở dữ liệu Redis Serverless của **Upstash**, giúp hệ thống đạt hiệu suất cao, tiết kiệm chi phí và vận hành ổn định:

```mermaid
graph TD
    User[Người dùng / Trình duyệt] -->|1. Truy cập Tên miền Custom| DNS[DNS Tenten]
    
    %% Phân luồng Frontend
    DNS -->|2. Route Frontend| Vercel[Vercel CDN / Edge Network]
    Vercel -->|3. Serve UI| FE_App[Next.js Frontend on Vercel]
    
    %% Phân luồng Backend
    DNS -->|2. Route Backend API| ALB[Application Load Balancer + ACM SSL]
    
    subgraph AWS_Cloud [AWS Cloud VPC]
        subgraph Public_Subnet [Public Subnet]
            ALB
            NAT[NAT Gateway]
        end

        subgraph Private_Subnet [Private Subnet - Cô lập hoàn toàn]
            subgraph ECS_Cluster [ECS Container Service]
                BE_Tasks[NestJS API Tasks]
                Worker_Tasks[NestJS Worker Tasks]
            end

            RDS[(Amazon RDS - PostgreSQL)]
        end
    end

    %% Mối quan hệ với Docker Image
    ECR[Amazon ECR - Registry] -.->|Pull Images| ECS_Cluster

    %% Luồng API và Workers
    ALB -->|3. Route API & SSE| BE_Tasks
    BE_Tasks -->|4. Lưu/Đọc dữ liệu| RDS
    Worker_Tasks -->|4. Lưu/Đọc dữ liệu| RDS

    %% Kết nối Redis Serverless Upstash
    BE_Tasks -->|5. Đẩy Task vào Queue| Upstash[(Upstash Serverless Redis)]
    Worker_Tasks -->|6. Lấy Task ra xử lý| Upstash

    %% Kết nối API bên ngoài
    Worker_Tasks -->|7. Gọi LLM APIs qua NAT| NAT
    NAT -->|HTTPS Outside| Groq[Groq API Cloud]
    NAT -->|HTTPS Outside| OpenAI[OpenAI API Cloud]
```

### Chi tiết các thành phần hạ tầng:

*   **Tên miền & Chứng chỉ bảo mật (Tenten DNS & AWS ACM):** Tên miền chính được quản lý bởi nhà cung cấp **Tenten**, cấu hình trỏ bản ghi A/CNAME về Vercel (cho Frontend) và ALB (cho Backend). Chứng chỉ SSL/TLS được cấu hình và tự động gia hạn thông qua **AWS Certificate Manager (ACM)** đính kèm vào Application Load Balancer để đảm bảo mọi kết nối API đều qua giao thức HTTPS bảo mật.
*   **Frontend (Vercel):** Phân hệ Frontend Next.js được triển khai trực tiếp trên **Vercel** để tận dụng hệ thống Global CDN/Edge Network cực kỳ mạnh mẽ, giúp tối ưu hóa thời gian phản hồi (TTFB) và tốc độ tải trang toàn cầu.
*   **Container Registry (Amazon ECR):** Lưu trữ các phiên bản Docker Image của Backend (`be`) và Background Worker được build từ CI/CD pipeline.
*   **Backend & Workers (Amazon ECS):** 
    *   Sử dụng **Amazon ECS** để quản lý các container chạy ứng dụng NestJS API và các tiến trình worker xử lý tác vụ AI ngầm.
    *   Hạ tầng được cô lập trong **Private Subnet** để tăng cường tính bảo mật, ngăn chặn mọi xâm nhập trực tiếp từ internet.
*   **Cơ sở dữ liệu (Amazon RDS PostgreSQL):** Lưu trữ cơ sở dữ liệu quan hệ PostgreSQL của hệ thống SaaS đa doanh nghiệp, đảm bảo hiệu năng đọc/ghi mạnh mẽ và an toàn dữ liệu.
*   **Hàng đợi & Caching (Upstash Serverless Redis):** Thay vì tự vận hành cụm ElastiCache tốn kém tài nguyên chạy liên tục, dự án tối ưu chi phí bằng cách sử dụng **Upstash Redis (Serverless)** bên ngoài VPC. Điều này giúp hệ thống quản lý Message Queue (BullMQ) linh hoạt theo cơ chế Serverless (Pay-as-you-go) mà vẫn đảm bảo tốc độ phản hồi cực nhanh (low-latency).
*   **NAT Gateway:** Cung cấp kết nối internet một chiều đi ra ngoài cho các ECS tasks trong Private Subnet gọi đến các dịch vụ bên ngoài như Groq API, OpenAI API hay Upstash Redis, trong khi chặn đứng mọi chiều truy cập từ ngoài internet đi thẳng vào container.

---

## 🛠️ Tech Stack Chi Tiết

Dự án được phân tách rõ ràng thành hai phân hệ Frontend và Backend:

### 1. Frontend ([/fe])
*   **Core Framework:** React 19 & Next.js 16 (App Router) - Tối ưu hóa SEO, SSR/SSG và trải nghiệm tải trang cực nhanh.
*   **Styling & UI:** Tailwind CSS v4 & Tailwind Animate CSS cho giao diện hiện đại và các hiệu ứng chuyển động mượt mà.
*   **UI Components:** Shadcn UI & Radix UI đảm bảo tính đồng bộ và thẩm mỹ cao theo chuẩn thiết kế premium.
*   **State Management:** Zustand - Quản lý trạng thái client gọn nhẹ và tối ưu hiệu năng.
*   **Data Fetching & Caching:** React Query (TanStack Query v5) giúp đồng bộ hóa dữ liệu từ server, tự động re-fetch và cache thông minh.
*   **Visualizations & Drag & Drop:**
    *   Recharts: Vẽ các biểu đồ thống kê doanh thu, hiệu suất nhóm và phễu bán hàng.
    *   `@dnd-kit`: Xử lý tương tác kéo thả mượt mà trên Kanban Board quản lý thương vụ (Deal Pipeline).
*   **Validation:** Zod kết hợp với React Hook Form.

### 2. Backend ([/be])
*   **Core Framework:** NestJS 11 (Node.js framework hướng đối tượng sử dụng TypeScript) giúp cấu trúc code rõ ràng, tính module hóa cao và dễ bảo trì.
*   **Database & ORM:** PostgreSQL kết hợp Prisma ORM v7 (sử dụng `@prisma/adapter-pg`).
*   **Authentication & Security:** Passport JWT cho cơ chế xác thực an toàn và phân quyền cô lập dữ liệu giữa các Tenant.
*   **Background Jobs & Queues:** BullMQ & Bull (chạy trên nền Redis) dùng để xử lý bất đồng bộ các tác vụ nặng (gọi OpenAI API) nhằm giải phóng tài nguyên cho luồng xử lý chính.
*   **Real-time Communication:** Server-Sent Events (SSE) để truyền phát trạng thái xử lý của AI từ worker tới frontend theo thời gian thực.
*   **AI Integration:** Hỗ trợ cơ chế chuyển đổi linh hoạt linh hoạt (Multi-provider) thông qua OpenAI SDK:
    *   **OpenAI Cloud:** Sử dụng mô hình `gpt-4o-mini` cho các tác vụ cần phân tích logic sâu sắc.
    *   **Groq Cloud:** Tích hợp API của **Groq** sử dụng mô hình mã nguồn mở siêu tốc `llama-3.3-70b-versatile` để tăng tốc độ phân tích lên gấp nhiều lần với chi phí tối ưu.

---

## 🧠 Giải Pháp Cho Các Bài Toán Kỹ Thuật (Key Challenges & Solutions)

### 1. Cô Lập Dữ Liệu Trong Mô Hình Đa Doanh Nghiệp (Multi-Tenant Data Isolation)
*   **Thách thức:** Trong mô hình SaaS dùng chung một Database (Shared Schema), việc rò rỉ dữ liệu giữa Tenant A và Tenant B là lỗi nghiêm trọng.
*   **Giải pháp:** Mọi truy vấn cơ sở dữ liệu đều được lọc qua một lớp trung gian (Tenant Context Interceptor/Guard). Khi client gửi request kèm JWT token, hệ thống phân tích `tenantId` và đính kèm điều kiện này vào mọi câu lệnh truy vấn Prisma ORM. Điều này đảm bảo mỗi Tenant chỉ có thể thao tác với dữ liệu thuộc về tổ chức của mình.

### 2. Xử Lý Tác Vụ AI Không Làm Nghẽn Hệ Thống (Asynchronous Job Processing)
*   **Thách thức:** Việc phân tích biên bản cuộc họp bằng OpenAI/Groq API có thể tốn từ vài giây tới nửa phút. Nếu gọi trực tiếp đồng bộ, Server sẽ bị treo luồng xử lý (blocking) và trình duyệt có thể bị quá thời gian chờ (timeout).
*   **Giải pháp:** Hệ thống sử dụng **BullMQ + Redis** để chuyển tác vụ AI thành các Job chạy ngầm (Background Job). Khi nhận yêu cầu, API trả về HTTP `202 Accepted` ngay lập tức để giải phóng client. Background Worker sẽ lấy job ra xử lý độc lập. Khi hoàn thành, worker lưu dữ liệu và kích hoạt cơ chế thông báo **Server-Sent Events (SSE)** để cập nhật giao diện người dùng theo thời gian thực.
*   **Tích hợp Groq API:** Bằng cách thiết lập `AI_PROVIDER=groq`, hệ thống chuyển luồng gọi API sang cổng Groq Cloud API endpoint (`https://api.groq.com/openai/v1`). Với mô hình Llama-3.3-70b có tốc độ phản hồi cực nhanh, trải nghiệm người dùng đối với các tác vụ AI gần như tức thời so với các mô hình truyền thống.

---

## 📁 Cấu Trúc Dự Án

```text
crm-sass/
├── fe/                  # Phân hệ Frontend (Next.js & React 19)
│   ├── src/
│   │   ├── app/         # App Router (Dashboard, Pipeline, Reports, v.v.)
│   │   ├── components/  # Các UI Component tái sử dụng (Shadcn UI)
│   │   ├── hooks/       # Custom React Hooks (useAuth, data-fetching...)
│   │   ├── lib/         # Tiện ích dùng chung & Zod Schemas
│   │   └── store/       # Zustand Store quản lý Client-side State
├── be/                  # Phân hệ Backend (NestJS 11)
│   ├── src/
│   │   ├── routes/      # Các module API (Deals, Tasks, AI, Tenants...)
│   │   ├── common/      # Guards, Interceptors, Decorators dùng chung
│   │   └── main.ts      # Khởi động ứng dụng NestJS
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử (Setup Guide)

### 📋 Yêu cầu hệ thống
*   **Node.js** v20.19.0 trở lên
*   **Docker** (để khởi chạy PostgreSQL & Redis nhanh chóng) hoặc cài đặt trực tiếp trên máy.

### Bước 1: Khởi chạy PostgreSQL & Redis bằng Docker
Để thiết lập cơ sở dữ liệu và hàng đợi nhanh nhất, hãy chạy các lệnh sau:
```bash
# Khởi chạy PostgreSQL Container
docker run --name crm-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

# Khởi chạy Redis Container (Dùng cho BullMQ Queue)
docker run --name crm-redis -p 6379:6379 -d redis
```

### Bước 2: Thiết lập Backend ([/be])
1. Di chuyển vào thư mục backend và cài đặt thư viện:
   ```bash
   cd be
   npm install
   ```
2. Tạo file cấu hình môi trường `.env`:
   ```bash
   cp .env.example .env
   ```
   *Cập nhật các biến số trong file `.env`:*
   ```ini
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crm_saas?schema=public"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   
   # Cấu hình AI Provider (openai hoặc groq)
   AI_PROVIDER="groq" # hoặc "openai"
   
   # Nếu dùng OpenAI
   OPENAI_API_KEY="your-openai-api-key"
   OPENAI_MODEL="gpt-4o-mini"
   
   # Nếu dùng Groq
   GROQ_API_KEY="your-groq-api-key"
   GROQ_MODEL="llama-3.3-70b-versatile"
   ```
3. Thực hiện đồng bộ Database Schema và tạo dữ liệu mẫu (Seed Data):
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Chạy Backend ở chế độ Development:
   ```bash
   npm run start:dev
   ```
   *Backend sẽ khởi chạy tại cổng [http://localhost:3001](http://localhost:3001) (hoặc cổng được cấu hình).*

### Bước 3: Thiết lập Frontend ([/fe])
1. Di chuyển vào thư mục frontend và cài đặt thư viện:
   ```bash
   cd ../fe
   npm install
   ```
2. Tạo file cấu hình môi trường `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *Cấu hình `NEXT_PUBLIC_API_URL` trỏ về API Backend của bạn (ví dụ: http://localhost:3001).*
3. Chạy ứng dụng Frontend:
   ```bash
   npm run dev
   ```
   *Mở trình duyệt truy cập [http://localhost:3000](http://localhost:3000) để trải nghiệm ứng dụng.*

---

## 📝 Bản Quyền & Giấy Phép
Dự án được phân phối dưới giấy phép **MIT License**. Bạn có thể tự do clone và phát triển thêm.  
*Liên hệ hỗ trợ hoặc đóng góp ý kiến qua email: `nguyenthuan05.word@gmail.com`*

