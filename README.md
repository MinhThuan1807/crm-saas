# CRM SaaS - Intelligent Customer Management System for SMEs

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

A multi-tenant Customer Relationship Management (CRM) SaaS platform, designed to optimize the sales process through a Sales Pipeline (Kanban Board), task management, and deep Generative AI integration (via OpenAI & Groq Cloud) to automate everyday customer-care tasks for small and medium-sized enterprises (SMEs).

**Demo Video:** [https://youtu.be/JAUMLhuh9cM](https://youtu.be/JAUMLhuh9cM)
<br>
👥 **Test accounts:**
*   **Tenant 1:** `admin@abc.com` / Password: `Password123!`
*   **Sales rep, tenant 1:** `sales@abc.com` / Password: `Password123!`
*   **Tenant 2:** `admin1@abc.com` / Password: `Password123!`

---

## 📌 Project Overview & Goals

### 1. Target Users
*   **Small and Medium Enterprises (SMEs):** Looking for a digital transformation solution for their business processes with optimized cost and easy deployment.
*   **Sales & Customer Care Teams:** Need an intuitive tool to manage leads, track deals, and handle daily tasks.
*   **Managers & Executives:** Need real-time revenue reports, staff performance metrics, and sales-funnel analytics to support business decisions.

### 2. Project Goals
*   **Increase conversion rate:** Help sales reps avoid missing opportunities through a visual drag-and-drop pipeline and a smart reminder system.
*   **Automate with AI:** Reduce manual note-taking time. AI automatically analyzes meeting notes to extract action items, draft follow-up emails, and summarize key information using OpenAI or Llama 3 (via Groq).
*   **Build a standard SaaS architecture:** Design a secure, high-performance multi-tenant system with complete data isolation between organizations.

---

## 📸 Screenshots & Interface

*Below are some representative screens of the system:*

| **Analytics Dashboard** | **Reports & Statistics** |
| --- | --- |
| ![Dashboard](assets/dashboard.jpg) | ![Reports](assets/reports.jpg) |
| *Revenue charts and a business activity overview.* | *Detailed sales-funnel analysis and performance reports.* |

| **Kanban Board for Deal Pipeline** | **AI Meeting Brief & Action Items** |
| --- | --- |
| ![Kanban Board](assets/pipeline.jpg) | ![AI Integration](assets/AI-intergation.jpg) |
| *Smooth drag-and-drop to update deal stages.* | *AI automatically analyzes meeting notes and suggests action items.* |

| **Permissions & Multi-Tenant Configuration** |
| --- |
| ![Tenant Settings](assets/tenant%20isolation.jpg) |
| *Strict permission management between independent organizations.* |

---

## 🛠️ Application Data Flow Architecture

The project is built on a modern client-server model, using an asynchronous job queue for heavy AI-related tasks:

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

## ☁️ Production Deployment Architecture

The system is designed and deployed in production using a combination of **AWS (Amazon Web Services)**, the **Vercel** platform, and **Upstash**'s serverless Redis database, achieving high performance, cost efficiency, and stable operation:

```mermaid
graph TD
    User[User / Browser] -->|1. Access Custom Domain| DNS[DNS - Tenten]
    
    %% Frontend routing
    DNS -->|2. Route Frontend| Vercel[Vercel CDN / Edge Network]
    Vercel -->|3. Serve UI| FE_App[Next.js Frontend on Vercel]
    
    %% Backend routing
    DNS -->|2. Route Backend API| ALB[Application Load Balancer + ACM SSL]
    
    subgraph AWS_Cloud [AWS Cloud VPC]
        subgraph Public_Subnet [Public Subnet]
            ALB
            NAT[NAT Gateway]
        end

        subgraph Private_Subnet [Private Subnet - Fully Isolated]
            subgraph ECS_Cluster [ECS Container Service]
                BE_Tasks[NestJS API Tasks]
                Worker_Tasks[NestJS Worker Tasks]
            end

            RDS[(Amazon RDS - PostgreSQL)]
        end
    end

    %% Relationship with Docker images
    ECR[Amazon ECR - Registry] -.->|Pull Images| ECS_Cluster

    %% API and worker flow
    ALB -->|3. Route API & SSE| BE_Tasks
    BE_Tasks -->|4. Read/Write Data| RDS
    Worker_Tasks -->|4. Read/Write Data| RDS

    %% Upstash serverless Redis connection
    BE_Tasks -->|5. Push Task to Queue| Upstash[(Upstash Serverless Redis)]
    Worker_Tasks -->|6. Pull Task for Processing| Upstash

    %% External API connections
    Worker_Tasks -->|7. Call LLM APIs via NAT| NAT
    NAT -->|HTTPS Outbound| Groq[Groq API Cloud]
    NAT -->|HTTPS Outbound| OpenAI[OpenAI API Cloud]
```

### Infrastructure Components in Detail

*   **Domain & SSL Certificate (Tenten DNS & AWS ACM):** The primary domain is managed by **Tenten**, with A/CNAME records pointing to Vercel (for the frontend) and the ALB (for the backend). SSL/TLS certificates are configured and auto-renewed through **AWS Certificate Manager (ACM)**, attached to the Application Load Balancer to ensure every API connection goes through secure HTTPS.
*   **Frontend (Vercel):** The Next.js frontend is deployed directly on **Vercel** to leverage its powerful global CDN/Edge Network, optimizing time-to-first-byte (TTFB) and global page-load speed.
*   **Container Registry (Amazon ECR):** Stores Docker image versions for the backend (`be`) and the background worker, built by the CI/CD pipeline.
*   **Backend & Workers (Amazon ECS):**
    *   Uses **Amazon ECS** to manage containers running the NestJS API and background worker processes that handle AI tasks.
    *   Infrastructure is isolated in a **Private Subnet** to enhance security and block direct internet access.
*   **Database (Amazon RDS PostgreSQL):** Stores the relational PostgreSQL database for the multi-tenant SaaS system, ensuring strong read/write performance and data safety.
*   **Queue & Caching (Upstash Serverless Redis):** Instead of running a self-managed, always-on ElastiCache cluster, the project optimizes cost by using **Upstash Redis (Serverless)** outside the VPC. This enables flexible BullMQ message-queue management on a pay-as-you-go serverless model while maintaining very low latency.
*   **NAT Gateway:** Provides one-way outbound internet access for ECS tasks in the Private Subnet to reach external services such as the Groq API, OpenAI API, or Upstash Redis, while blocking all inbound traffic from the internet directly into the containers.

---

## 🛠️ Detailed Tech Stack

The project is clearly split into two subsystems: Frontend and Backend.

### 1. Frontend ([/fe])
*   **Core Framework:** React 19 & Next.js 16 (App Router) - optimized for SEO, SSR/SSG, and a very fast page-load experience.
*   **Styling & UI:** Tailwind CSS v4 & Tailwind Animate CSS for a modern interface with smooth animations.
*   **UI Components:** Shadcn UI & Radix UI for consistency and a premium design standard.
*   **State Management:** Zustand - lightweight, performant client-side state management.
*   **Data Fetching & Caching:** React Query (TanStack Query v5) for syncing data from the server, with automatic re-fetching and smart caching.
*   **Visualizations & Drag & Drop:**
    *   Recharts: renders revenue, team-performance, and sales-funnel charts.
    *   `@dnd-kit`: handles smooth drag-and-drop interactions on the deal-pipeline Kanban board.
*   **Validation:** Zod combined with React Hook Form.

### 2. Backend ([/be])
*   **Core Framework:** NestJS 11 (an object-oriented Node.js framework using TypeScript), providing a clear code structure, high modularity, and easy maintenance.
*   **Database & ORM:** PostgreSQL combined with Prisma ORM v7 (using `@prisma/adapter-pg`).
*   **Authentication & Security:** Passport JWT for secure authentication and isolated permission handling between tenants.
*   **Background Jobs & Queues:** BullMQ & Bull (running on Redis) for asynchronously processing heavy tasks (calling the OpenAI API), freeing up resources on the main processing thread.
*   **Real-time Communication:** Server-Sent Events (SSE) to stream AI processing status from the worker to the frontend in real time.
*   **AI Integration:** Supports flexible multi-provider switching via the OpenAI SDK:
    *   **OpenAI Cloud:** Uses the `gpt-4o-mini` model for tasks requiring deeper logical analysis.
    *   **Groq Cloud:** Integrates the **Groq** API using the ultra-fast open-source model `llama-3.3-70b-versatile`, multiplying analysis speed while keeping costs optimized.

---

## 🧠 Key Technical Challenges & Solutions

### 1. Data Isolation in the Multi-Tenant Model
*   **Challenge:** In a shared-schema SaaS model, data leakage between Tenant A and Tenant B is a critical bug.
*   **Solution:** Every database query passes through an intermediate layer (Tenant Context Interceptor/Guard). When a client sends a request with a JWT token, the system extracts the `tenantId` and attaches this condition to every Prisma ORM query. This ensures each tenant can only operate on data belonging to its own organization.

### 2. Asynchronous AI Job Processing Without Blocking the System
*   **Challenge:** Analyzing meeting notes via the OpenAI/Groq API can take anywhere from a few seconds to half a minute. Calling it synchronously would block the server's processing thread, and the browser could time out.
*   **Solution:** The system uses **BullMQ + Redis** to turn AI tasks into background jobs. Upon receiving a request, the API immediately returns an HTTP `202 Accepted` to free up the client. A background worker then picks up the job and processes it independently. Once finished, the worker saves the result and triggers a **Server-Sent Events (SSE)** notification to update the UI in real time.
*   **Groq API Integration:** By setting `AI_PROVIDER=groq`, the system routes API calls to the Groq Cloud API endpoint (`https://api.groq.com/openai/v1`). With the ultra-fast Llama-3.3-70b model, the user experience for AI tasks feels nearly instant compared to traditional models.

---

## 📁 Project Structure

```text
crm-sass/
├── fe/                  # Frontend subsystem (Next.js & React 19)
│   ├── src/
│   │   ├── app/         # App Router (Dashboard, Pipeline, Reports, etc.)
│   │   ├── components/  # Reusable UI components (Shadcn UI)
│   │   ├── hooks/       # Custom React Hooks (useAuth, data-fetching...)
│   │   ├── lib/         # Shared utilities & Zod schemas
│   │   └── store/       # Zustand store for client-side state
├── be/                  # Backend subsystem (NestJS 11)
│   ├── src/
│   │   ├── routes/      # API modules (Deals, Tasks, AI, Tenants...)
│   │   ├── common/      # Shared guards, interceptors, decorators
│   │   └── main.ts      # NestJS application bootstrap
```

---

## 🚀 Setup Guide

### 📋 System Requirements
*   **Node.js** v20.19.0 or higher
*   **Docker** (to quickly spin up PostgreSQL & Redis) or install them directly on your machine.

### Step 1: Start PostgreSQL & Redis with Docker
To set up the database and queue quickly, run the following commands:
```bash
# Start the PostgreSQL container
docker run --name crm-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

# Start the Redis container (used for the BullMQ queue)
docker run --name crm-redis -p 6379:6379 -d redis
```

### Step 2: Backend Setup ([/be])
1. Move into the backend directory and install dependencies:
   ```bash
   cd be
   npm install
   ```
2. Create the `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
   *Update the variables in the `.env` file:*
   ```ini
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crm_saas?schema=public"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   
   # AI provider configuration (openai or groq)
   AI_PROVIDER="groq" # or "openai"
   
   # If using OpenAI
   OPENAI_API_KEY="your-openai-api-key"
   OPENAI_MODEL="gpt-4o-mini"
   
   # If using Groq
   GROQ_API_KEY="your-groq-api-key"
   GROQ_MODEL="llama-3.3-70b-versatile"
   ```
3. Run the database schema sync and seed sample data:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Run the backend in development mode:
   ```bash
   npm run start:dev
   ```
   *The backend will start on port [http://localhost:3001](http://localhost:3001) (or your configured port).*

### Step 3: Frontend Setup ([/fe])
1. Move into the frontend directory and install dependencies:
   ```bash
   cd ../fe
   npm install
   ```
2. Create the `.env.local` configuration file:
   ```bash
   cp .env.example .env.local
   ```
   *Set `NEXT_PUBLIC_API_URL` to point to your backend API (e.g. http://localhost:3001).*
3. Run the frontend application:
   ```bash
   npm run dev
   ```
   *Open your browser at [http://localhost:3000](http://localhost:3000) to use the app.*


---

## 📖 API Documentation (Swagger)

The system provides interactive and visual API documentation via **Swagger (OpenAPI)** to support development and integration workflows.

*   **Access URL:** `https://codelaicuocdoi.io.vn/api-docs` (or the corresponding port configured for your backend).
*   **Key Highlights:**
    *   **Auto-generated Schemas:** Data schemas are automatically generated from Zod DTOs via the `nestjs-zod` plugin.
    *   **Authentication Support:** Supports storing and submitting tokens directly via Cookie (`accessToken`) and Header (`Bearer Auth`). Sessions persist across page reloads thanks to the `persistAuthorization` setting.
    *   **Well-organized API Groups:** Resources are systematically grouped into *Auth, Contacts, Deals, Activities, Users, Invitations, Dashboard, Reports*.

---

## 📝 License
This project is distributed under the **MIT License**. Feel free to clone and extend it.
*For support or feedback, contact: `nguyenthuan05.work@gmail.com`*
