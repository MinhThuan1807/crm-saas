import * as bcrypt from 'bcrypt'
import { PrismaClient } from '../generated/prisma-client/client'
import { Role, DealStage, ActivityType, AiSuggestionType } from '../generated/prisma-client/enums'
import 'dotenv/config' // npm install dotenv nếu chưa có
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Bắt đầu seed data...')

  // ── 1. TENANT ────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'cong-ty-abc' },
    update: {},
    create: {
      name: 'Công ty ABC',
      slug: 'cong-ty-abc',
      plan: 'pro',
    },
  })
  console.log('✅ Tenant:', tenant.name)

  // ── 2. USERS ─────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Password123!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@abc.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@abc.com',
      password: hashedPassword,
      name: 'Nguyễn Admin',
      role: Role.ADMIN,
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@abc.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'manager@abc.com',
      password: hashedPassword,
      name: 'Trần Manager',
      role: Role.MANAGER,
    },
  })

  const salesRep = await prisma.user.upsert({
    where: { email: 'sales@abc.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'sales@abc.com',
      password: hashedPassword,
      name: 'Lê Sales Rep',
      role: Role.SALES_REP,
    },
  })

  console.log('✅ Users: admin / manager / sales@abc.com (Password: Password123!)')

  // ── 3. CONTACTS ───────────────────────────────────────
  const contact1 = await prisma.contact.upsert({
    where: { id: 'contact-seed-001' },
    update: {},
    create: {
      id: 'contact-seed-001',
      tenantId: tenant.id,
      name: 'Phạm Văn Khách',
      email: 'khach@gmail.com',
      phone: '0901234567',
      company: 'Công ty XYZ',
      position: 'Giám đốc',
    },
  })

  const contact2 = await prisma.contact.upsert({
    where: { id: 'contact-seed-002' },
    update: {},
    create: {
      id: 'contact-seed-002',
      tenantId: tenant.id,
      name: 'Hoàng Thị Liên',
      email: 'lien@startup.vn',
      phone: '0912345678',
      company: 'Startup DEF',
      position: 'CTO',
    },
  })

  const contact3 = await prisma.contact.upsert({
    where: { id: 'contact-seed-003' },
    update: {},
    create: {
      id: 'contact-seed-003',
      tenantId: tenant.id,
      name: 'Đặng Minh Tuấn',
      email: 'tuan@enterprise.com',
      phone: '0987654321',
      company: 'Enterprise Corp',
      position: 'Trưởng phòng IT',
    },
  })

  const contact4 = await prisma.contact.upsert({
    where: { id: 'contact-seed-004' },
    update: {},
    create: {
      id: 'contact-seed-004',
      tenantId: tenant.id,
      name: 'Nguyễn Thị Hoa',
      email: 'hoa@fintech.vn',
      phone: '0933445566',
      company: 'Fintech VN',
      position: 'CEO',
    },
  })

  const contact5 = await prisma.contact.upsert({
    where: { id: 'contact-seed-005' },
    update: {},
    create: {
      id: 'contact-seed-005',
      tenantId: tenant.id,
      name: 'Bùi Quốc Hùng',
      email: 'hung@logistics.com',
      phone: '0977889900',
      company: 'Logistics Pro',
      position: 'Giám đốc vận hành',
    },
  })

  const contact6 = await prisma.contact.upsert({
    where: { id: 'contact-seed-006' },
    update: {},
    create: {
      id: 'contact-seed-006',
      tenantId: tenant.id,
      name: 'Trịnh Văn Nam',
      email: 'nam@retailchain.vn',
      phone: '0911223344',
      company: 'Retail Chain VN',
      position: 'IT Manager',
    },
  })

  console.log('✅ Contacts: 6 liên hệ')

  // ── 4. DEALS ──────────────────────────────────────────
  // PROSPECT (2 deals)
  const deal0a = await prisma.deal.upsert({
    where: { id: 'deal-seed-000a' },
    update: {},
    create: {
      id: 'deal-seed-000a',
      tenantId: tenant.id,
      contactId: contact4.id,
      ownerId: salesRep.id,
      title: 'Giải pháp thanh toán Fintech VN',
      value: 80000000,
      stage: DealStage.PROSPECT,
      closeDate: new Date('2025-08-30'),
      note: 'Khách hàng mới, đang tìm hiểu giải pháp',
    },
  })

  const deal0b = await prisma.deal.upsert({
    where: { id: 'deal-seed-000b' },
    update: {},
    create: {
      id: 'deal-seed-000b',
      tenantId: tenant.id,
      contactId: contact5.id,
      ownerId: manager.id,
      title: 'Phần mềm quản lý kho Logistics Pro',
      value: 120000000,
      stage: DealStage.PROSPECT,
      closeDate: new Date('2025-09-15'),
      note: 'Referral từ Enterprise Corp',
    },
  })

  // QUALIFIED (2 deals)
  const deal1 = await prisma.deal.upsert({
    where: { id: 'deal-seed-001' },
    update: {},
    create: {
      id: 'deal-seed-001',
      tenantId: tenant.id,
      contactId: contact1.id,
      ownerId: salesRep.id,
      title: 'Triển khai CRM cho XYZ',
      value: 50000000,
      stage: DealStage.QUALIFIED,
      closeDate: new Date('2025-06-30'),
      note: 'Khách hàng quan tâm gói Pro',
    },
  })

  const deal1b = await prisma.deal.upsert({
    where: { id: 'deal-seed-001b' },
    update: {},
    create: {
      id: 'deal-seed-001b',
      tenantId: tenant.id,
      contactId: contact6.id,
      ownerId: salesRep.id,
      title: 'Hệ thống POS Retail Chain',
      value: 95000000,
      stage: DealStage.QUALIFIED,
      closeDate: new Date('2025-07-20'),
      note: 'Đã demo, khách đang so sánh với đối thủ',
    },
  })

  // PROPOSAL (2 deals)
  const deal2 = await prisma.deal.upsert({
    where: { id: 'deal-seed-002' },
    update: {},
    create: {
      id: 'deal-seed-002',
      tenantId: tenant.id,
      contactId: contact2.id,
      ownerId: salesRep.id,
      title: 'Tích hợp API cho Startup DEF',
      value: 20000000,
      stage: DealStage.PROPOSAL,
      closeDate: new Date('2025-05-15'),
      note: 'Đã gửi proposal, chờ phản hồi',
    },
  })

  const deal2b = await prisma.deal.upsert({
    where: { id: 'deal-seed-002b' },
    update: {},
    create: {
      id: 'deal-seed-002b',
      tenantId: tenant.id,
      contactId: contact4.id,
      ownerId: manager.id,
      title: 'Module báo cáo tài chính Fintech VN',
      value: 45000000,
      stage: DealStage.PROPOSAL,
      closeDate: new Date('2025-06-01'),
      note: 'Proposal đã gửi, đang chờ board duyệt',
    },
  })

  // CLOSED_WON (1 deal)
  const deal3 = await prisma.deal.upsert({
    where: { id: 'deal-seed-003' },
    update: {},
    create: {
      id: 'deal-seed-003',
      tenantId: tenant.id,
      contactId: contact3.id,
      ownerId: manager.id,
      title: 'Nâng cấp hệ thống Enterprise Corp',
      value: 150000000,
      stage: DealStage.CLOSED_WON,
      closeDate: new Date('2025-04-01'),
      note: 'Đã ký hợp đồng',
    },
  })

  // CLOSED_LOST (1 deal)
  const deal4 = await prisma.deal.upsert({
    where: { id: 'deal-seed-004' },
    update: {},
    create: {
      id: 'deal-seed-004',
      tenantId: tenant.id,
      contactId: contact5.id,
      ownerId: salesRep.id,
      title: 'Phần mềm HR Logistics Pro',
      value: 35000000,
      stage: DealStage.CLOSED_LOST,
      closeDate: new Date('2025-03-15'),
      note: 'Khách chọn giải pháp của đối thủ do giá thấp hơn',
    },
  })

  console.log('✅ Deals: 8 deals (PROSPECT×2 / QUALIFIED×2 / PROPOSAL×2 / CLOSED_WON×1 / CLOSED_LOST×1)')

  // ── 5. ACTIVITIES ─────────────────────────────────────
  await prisma.activity.createMany({
    data: [
      // deal1 — Triển khai CRM cho XYZ
      {
        tenantId: tenant.id,
        contactId: contact1.id,
        dealId: deal1.id,
        userId: salesRep.id,
        title: 'Tư vấn gói Pro',
        type: ActivityType.CALL,
        note: 'Gọi điện tư vấn gói Pro, khách hàng đồng ý demo',
        date: new Date('2025-04-01T09:00:00'),
      },
      {
        tenantId: tenant.id,
        contactId: contact1.id,
        dealId: deal1.id,
        userId: salesRep.id,
        title: 'Gửi báo giá',
        type: ActivityType.EMAIL,
        note: 'Gửi email báo giá và tài liệu sản phẩm',
        date: new Date('2025-04-02T10:30:00'),
      },
      {
        tenantId: tenant.id,
        contactId: contact1.id,
        userId: salesRep.id,
        title: 'Demo sản phẩm',
        type: ActivityType.MEETING,
        note: 'Demo sản phẩm tại văn phòng khách hàng, phản hồi tích cực',
        date: new Date('2025-04-05T14:00:00'),
      },
      // deal2 — Tích hợp API Startup DEF
      {
        tenantId: tenant.id,
        contactId: contact2.id,
        dealId: deal2.id,
        userId: salesRep.id,
        title: 'Ghi chú tích hợp Zalo OA',
        type: ActivityType.NOTE,
        note: 'Khách cần tích hợp Zalo OA, cần confirm thêm với team kỹ thuật',
        date: new Date('2025-04-03T11:00:00'),
      },
      {
        tenantId: tenant.id,
        contactId: contact2.id,
        dealId: deal2.id,
        userId: salesRep.id,
        title: 'Follow up proposal',
        type: ActivityType.CALL,
        note: 'Follow up sau khi gửi proposal, khách đang review nội bộ',
        date: new Date('2025-04-06T16:00:00'),
      },
      // deal3 — Enterprise Corp CLOSED_WON
      {
        tenantId: tenant.id,
        contactId: contact3.id,
        dealId: deal3.id,
        userId: manager.id,
        title: 'Họp ký hợp đồng',
        type: ActivityType.MEETING,
        note: 'Họp ký hợp đồng, bàn giao timeline dự án Q2/2025',
        date: new Date('2025-04-01T09:00:00'),
      },
      // deal0a — Fintech VN PROSPECT
      {
        tenantId: tenant.id,
        contactId: contact4.id,
        dealId: deal0a.id,
        userId: salesRep.id,
        title: 'Cuộc gọi khám phá nhu cầu',
        type: ActivityType.CALL,
        note: 'Khách đang tìm giải pháp thay thế hệ thống cũ, ngân sách ~80-100tr',
        date: new Date('2025-04-08T10:00:00'),
      },
      // deal4 — CLOSED_LOST
      {
        tenantId: tenant.id,
        contactId: contact5.id,
        dealId: deal4.id,
        userId: salesRep.id,
        title: 'Thông báo kết quả',
        type: ActivityType.EMAIL,
        note: 'Khách thông báo chọn giải pháp khác, giá thấp hơn 20%',
        date: new Date('2025-03-14T15:00:00'),
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Activities: 8 hoạt động')

  // ── 6. TASKS ──────────────────────────────────────────
  await prisma.task.createMany({
    data: [
      // deal1 — QUALIFIED
      {
        tenantId: tenant.id,
        dealId: deal1.id,
        title: 'Gửi proposal chính thức',
        done: false,
        dueDate: new Date('2025-04-10'),
      },
      {
        tenantId: tenant.id,
        dealId: deal1.id,
        title: 'Setup demo environment',
        done: true,
        dueDate: new Date('2025-04-05'),
      },
      {
        tenantId: tenant.id,
        dealId: deal1.id,
        title: 'Confirm yêu cầu tích hợp với team kỹ thuật',
        done: false,
        dueDate: new Date('2025-04-15'),
      },
      // deal2 — PROPOSAL
      {
        tenantId: tenant.id,
        dealId: deal2.id,
        title: 'Viết tài liệu kỹ thuật API',
        done: false,
        dueDate: new Date('2025-04-12'),
      },
      {
        tenantId: tenant.id,
        dealId: deal2.id,
        title: 'Follow up sau 3 ngày',
        done: false,
        dueDate: new Date('2025-04-09'),
      },
      // deal3 — CLOSED_WON
      {
        tenantId: tenant.id,
        dealId: deal3.id,
        title: 'Bàn giao tài liệu hợp đồng',
        done: true,
        dueDate: new Date('2025-04-02'),
      },
      {
        tenantId: tenant.id,
        dealId: deal3.id,
        title: 'Kick-off meeting với team triển khai',
        done: true,
        dueDate: new Date('2025-04-07'),
      },
      // deal0a — PROSPECT
      {
        tenantId: tenant.id,
        dealId: deal0a.id,
        title: 'Gửi brochure sản phẩm',
        done: false,
        dueDate: new Date('2025-04-11'),
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Tasks: 8 tasks')

  // ── 7. AI SUGGESTIONS ─────────────────────────────────
  await prisma.aiSuggestion.createMany({
    data: [
      {
        tenantId: tenant.id,
        jobId: 'job-seed-001',
        dealId: deal1.id,
        type: AiSuggestionType.EMAIL_DRAFT,
        content:
          'Kính gửi anh Khách, cảm ơn anh đã dành thời gian tham dự buổi demo. Chúng tôi xin gửi kèm báo giá chính thức...',
        sourceNote: 'Demo sản phẩm tại văn phòng khách hàng',
      },
      {
        tenantId: tenant.id,
        jobId: 'job-seed-002',
        dealId: deal1.id,
        type: AiSuggestionType.TASK_LIST,
        content: JSON.stringify(['Gửi email follow-up sau demo', 'Chuẩn bị báo giá chính thức', 'Lên lịch họp lần 2']),
        sourceNote: 'Demo sản phẩm tại văn phòng khách hàng',
      },
      {
        tenantId: tenant.id,
        jobId: 'job-seed-003',
        dealId: deal2.id,
        type: AiSuggestionType.SUMMARY,
        content:
          'Deal đang ở giai đoạn PROPOSAL. Khách cần tích hợp Zalo OA. Cần follow up tuần tới để đẩy nhanh quyết định.',
        sourceNote: 'Follow up sau khi gửi proposal',
      },
      {
        tenantId: tenant.id,
        jobId: 'job-seed-004',
        dealId: deal0a.id,
        type: AiSuggestionType.TASK_LIST,
        content: JSON.stringify([
          'Gửi brochure sản phẩm',
          'Lên lịch demo online',
          'Tìm hiểu thêm về hệ thống hiện tại của khách',
        ]),
        sourceNote: 'Cuộc gọi khám phá nhu cầu',
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ AI Suggestions: 4 gợi ý')

  // ── SUMMARY ───────────────────────────────────────────
  console.log('\n📋 THÔNG TIN ĐĂNG NHẬP TEST:')
  console.log('┌─────────────────────────────────────────────┐')
  console.log('│  Role     │ Email            │ Password     │')
  console.log('├─────────────────────────────────────────────┤')
  console.log('│  ADMIN    │ admin@abc.com    │ Password123! │')
  console.log('│  MANAGER  │ manager@abc.com  │ Password123! │')
  console.log('│  SALES    │ sales@abc.com    │ Password123! │')
  console.log('└─────────────────────────────────────────────┘')

  console.log('\n🔗 IDs để test API:')
  console.log('Tenant ID   :', tenant.id)
  console.log(
    'Contact IDs :',
    contact1.id,
    '|',
    contact2.id,
    '|',
    contact3.id,
    '|',
    contact4.id,
    '|',
    contact5.id,
    '|',
    contact6.id,
  )
  console.log('Deal IDs    :')
  console.log('  PROSPECT    :', deal0a.id, '|', deal0b.id)
  console.log('  QUALIFIED   :', deal1.id, '|', deal1b.id)
  console.log('  PROPOSAL    :', deal2.id, '|', deal2b.id)
  console.log('  CLOSED_WON  :', deal3.id)
  console.log('  CLOSED_LOST :', deal4.id)
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('✅ Seed hoàn tất!') // thêm dòng này
  })
