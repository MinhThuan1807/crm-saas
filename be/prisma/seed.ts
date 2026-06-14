import * as bcrypt from 'bcrypt'
import { PrismaClient } from '../generated/prisma-client/client'
import { Role, DealStage, ActivityType, AiSuggestionType } from '../generated/prisma-client/enums'
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

// Helper functions for random data generation
function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomPhone(): string {
  const prefixes = ['090', '091', '098', '093', '097', '086', '038']
  const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString()
  return getRandomElement(prefixes) + randomDigits
}

function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

async function main() {
  console.log('🌱 Bắt đầu dọn dẹp dữ liệu cũ...')
  // Clear existing records safely in order of dependency
  await prisma.aiSuggestion.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.activity.deleteMany({})
  await prisma.deal.deleteMany({})
  await prisma.contact.deleteMany({})
  await prisma.kpiTarget.deleteMany({})
  await prisma.refreshToken.deleteMany({})
  await prisma.invitation.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.tenant.deleteMany({})

  console.log('🌱 Bắt đầu khởi tạo dữ liệu mẫu lớn...')

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

  // ── 2. USERS (8 Users) ─────────────────────────────────
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

  // 5 Sales Reps (Matching standard frontend report performance mock names)
  const salesRepsData = [
    { email: 'sales@abc.com', name: 'Lê Sales Rep' },
    { email: 'huong@abc.com', name: 'Trần Thị Hương' },
    { email: 'quang@abc.com', name: 'Nguyễn Quang' },
    { email: 'lan@abc.com', name: 'Phạm Thị Lan' },
    { email: 'minh@abc.com', name: 'Vũ Đức Minh' },
    { email: 'thu@abc.com', name: 'Lê Thị Thu' },
  ]

  const salesReps: any[] = []
  for (const rep of salesRepsData) {
    const r = await prisma.user.upsert({
      where: { email: rep.email },
      update: {},
      create: {
        tenantId: tenant.id,
        email: rep.email,
        password: hashedPassword,
        name: rep.name,
        role: Role.SALES_REP,
      },
    })
    salesReps.push(r)
  }

  const allTeamUsers = [manager, ...salesReps]

  console.log('✅ Users: admin / manager / 6 sales reps seeded.')

  // ── 3. CONTACTS (30 Contacts) ──────────────────────────
  const companyNames = [
    'Vingroup', 'Viettel', 'FPT Software', 'Masan Group', 'Techcombank',
    'Vietcombank', 'Vinamilk', 'Thế Giới Di Động', 'VNG Corporation', 'Tập đoàn Hòa Phát',
    'Bamboo Airways', 'Kido Group', 'SMC Corporation', 'Delta Group', 'Sun Group',
    'Nova Land', 'Coteccons', 'Bình Minh Plastics', 'Rang Dong Group', 'Thiên Long'
  ]
  const contactFirstNames = ['Nam', 'Lan', 'Hương', 'Quang', 'Minh', 'Thu', 'Tuấn', 'Hùng', 'Hoa', 'Liên', 'Trang', 'Sơn', 'Dũng', 'Thủy', 'Anh', 'Phương', 'Linh', 'Khánh', 'Cường', 'Hải']
  const contactLastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Vũ', 'Hoàng', 'Đặng', 'Bùi', 'Trịnh', 'Lý']
  const positions = ['CEO', 'CTO', 'Giám đốc IT', 'Trưởng phòng Mua hàng', 'Giám đốc Vận hành', 'Trưởng phòng Kinh doanh', 'Phó giám đốc']

  const contacts: any[] = []
  for (let i = 1; i <= 30; i++) {
    const owner = getRandomElement(salesReps)
    const company = getRandomElement(companyNames)
    const firstName = getRandomElement(contactFirstNames)
    const lastName = getRandomElement(contactLastNames)
    const fullName = `${lastName} ${firstName}`
    
    const cleanFirstName = removeDiacritics(firstName).toLowerCase().replace(/\s+/g, '')
    const cleanCompany = removeDiacritics(company).toLowerCase().replace(/[^a-z0-9]/g, '')
    const email = `${cleanFirstName}.${getRandomInt(10, 99)}@${cleanCompany}.com`
    
    const contact = await prisma.contact.create({
      data: {
        id: `contact-seed-${String(i).padStart(3, '0')}`,
        tenantId: tenant.id,
        ownerId: owner.id,
        name: fullName,
        email,
        phone: getRandomPhone(),
        company,
        position: getRandomElement(positions),
      },
    })
    contacts.push(contact)
  }

  console.log('✅ Contacts: 30 contacts generated.')

  // ── 4. DEALS (45 Deals) ────────────────────────────────
  const dealStages = [
    DealStage.PROSPECT, DealStage.PROSPECT,
    DealStage.QUALIFIED, DealStage.QUALIFIED,
    DealStage.PROPOSAL, DealStage.PROPOSAL,
    DealStage.CLOSED_WON, DealStage.CLOSED_WON, DealStage.CLOSED_WON, DealStage.CLOSED_WON, // Heavy won weight
    DealStage.CLOSED_LOST,
  ]

  const dealTitles = [
    'Triển khai ERP', 'Tích hợp thanh toán API', 'Nâng cấp Cloud Server', 'Hệ thống POS bán hàng',
    'Hợp đồng bảo trì hệ thống', 'Dịch vụ Cyber Security', 'Data Analytics Dashboard',
    'Cung cấp bản quyền Office 365', 'Phát triển ứng dụng Mobile', 'Hạ tầng mạng văn phòng mới'
  ]

  const deals: any[] = []
  const currentYear = 2026

  for (let i = 1; i <= 45; i++) {
    const contact = getRandomElement(contacts)
    // Make sure deal owner is the same as contact owner for clean data
    const ownerId = contact.ownerId
    const title = `${getRandomElement(dealTitles)} - ${contact.company}`
    const value = getRandomInt(15, 85) * 10_000_000 // 150M to 850M
    const stage = getRandomElement(dealStages)

    // Spread deals across the months of 2026
    const month = getRandomInt(1, 12)
    const startDay = getRandomInt(1, 15)
    const createdAt = new Date(currentYear, month - 1, startDay)

    let closeDate: Date | null = null
    if (stage === DealStage.CLOSED_WON || stage === DealStage.CLOSED_LOST) {
      // Close date is 10 to 28 days after creation
      closeDate = new Date(createdAt.getTime() + getRandomInt(10, 28) * 24 * 60 * 60 * 1000)
    } else {
      // Future close date
      closeDate = new Date(createdAt.getTime() + getRandomInt(30, 60) * 24 * 60 * 60 * 1000)
    }

    const deal = await prisma.deal.create({
      data: {
        id: `deal-seed-${String(i).padStart(3, '0')}`,
        tenantId: tenant.id,
        contactId: contact.id,
        ownerId,
        title,
        value,
        stage,
        closeDate,
        createdAt,
        note: `Cơ hội kinh doanh tiềm năng với ${contact.name}`,
      },
    })
    deals.push(deal)
  }

  console.log('✅ Deals: 45 deals generated.')

  // ── 5. ACTIVITIES (60 Activities) ──────────────────────
  const activityTypes = [ActivityType.CALL, ActivityType.EMAIL, ActivityType.MEETING, ActivityType.NOTE]
  const activityNotes = {
    [ActivityType.CALL]: [
      'Gọi điện giới thiệu dịch vụ và báo giá sơ bộ.',
      'Gọi điện thảo luận chi tiết các yêu cầu tùy chỉnh.',
      'Follow up sau khi gửi proposal, khách hàng hứa sẽ phản hồi sớm.',
      'Liên hệ hỗ trợ kỹ thuật về môi trường demo.'
    ],
    [ActivityType.EMAIL]: [
      'Gửi brochure sản phẩm và báo giá chi tiết qua email.',
      'Gửi email làm rõ một số điểm trong bản thảo hợp đồng.',
      'Gửi email xác nhận lịch hẹn gặp trực tiếp tuần tới.',
      'Gửi email cảm ơn và tóm tắt cuộc họp.'
    ],
    [ActivityType.MEETING]: [
      'Họp demo sản phẩm trực tuyến qua Zoom/Meet.',
      'Gặp trực tiếp thương thảo điều khoản hợp đồng.',
      'Họp kick-off dự án và phân chia nhân lực.',
      'Họp khảo sát hiện trạng hạ tầng của khách hàng.'
    ],
    [ActivityType.NOTE]: [
      'Khách hàng có vẻ ưu tiên giải pháp triển khai nhanh hơn là giá thấp.',
      'Thông tin thêm: Đối thủ đang chào giá thấp hơn 10% nhưng dịch vụ hỗ trợ kém.',
      'Ghi chú kỹ thuật: Cần tích hợp thêm Zalo OA và cổng thanh toán VNPay.',
      'Ghi chú: Khách hàng dự kiến ký hợp đồng vào cuối tháng này.'
    ]
  }

  for (let i = 1; i <= 60; i++) {
    const deal = getRandomElement(deals)
    const type = getRandomElement(activityTypes)
    const noteList = activityNotes[type]
    const note = getRandomElement(noteList)
    
    // Activity date is around the deal creation date
    const dealDate = new Date(deal.createdAt)
    const activityDate = new Date(dealDate.getTime() + getRandomInt(1, 10) * 24 * 60 * 60 * 1000)

    await prisma.activity.create({
      data: {
        id: `activity-seed-${String(i).padStart(3, '0')}`,
        tenantId: tenant.id,
        contactId: deal.contactId,
        dealId: deal.id,
        userId: deal.ownerId,
        title: type === ActivityType.CALL ? 'Cuộc gọi trao đổi' : type === ActivityType.EMAIL ? 'Gửi email' : type === ActivityType.MEETING ? 'Họp mặt' : 'Ghi chú deal',
        type,
        note,
        date: activityDate,
      },
    })
  }

  console.log('✅ Activities: 60 activities logged.')

  // ── 6. TASKS (60 Tasks) ────────────────────────────────
  const taskTitles = [
    'Gửi báo giá chính thức', 'Chuẩn bị slide demo', 'Gọi điện follow up tiến độ',
    'Trình duyệt bản thảo hợp đồng', 'Setup môi trường kiểm thử', 'Gửi email tóm tắt cuộc họp',
    'Khảo sát chi tiết nhu cầu', 'Xác nhận thông tin thanh toán'
  ]

  for (let i = 1; i <= 60; i++) {
    const deal = getRandomElement(deals)
    const title = getRandomElement(taskTitles)
    const done = Math.random() > 0.4 // 60% task done

    const dealDate = new Date(deal.createdAt)
    // Due date around deal creation/close date
    const dueDate = new Date(dealDate.getTime() + getRandomInt(5, 20) * 24 * 60 * 60 * 1000)

    await prisma.task.create({
      data: {
        id: `task-seed-${String(i).padStart(3, '0')}`,
        tenantId: tenant.id,
        dealId: deal.id,
        title,
        done,
        dueDate,
        createdAt: dealDate,
      },
    })
  }

  console.log('✅ Tasks: 60 tasks populated.')

  // ── 7. AI SUGGESTIONS ──────────────────────────────────
  // Add some sample suggestions on top deals
  const topDealsForAi = deals.slice(0, 5)
  for (const deal of topDealsForAi) {
    await prisma.aiSuggestion.create({
      data: {
        tenantId: tenant.id,
        jobId: `job-ai-${deal.id}`,
        dealId: deal.id,
        type: AiSuggestionType.EMAIL_DRAFT,
        content: `Kính gửi đối tác, cảm ơn quý khách hàng đã thảo luận với chúng tôi về cơ hội "${deal.title}". Dưới đây là dự thảo đề xuất giải pháp...`,
        sourceNote: 'Khách hàng có phản hồi tích cực sau demo.',
      },
    })
  }
  console.log('✅ AI Suggestions: 5 suggestions generated.')

  // ── 8. KPI TARGETS (72 Target Records - 12 Months * 6 Users) ─────────
  // Populate monthly target KPIs for all sales reps and manager for entire 2026
  for (const user of allTeamUsers) {
    for (let month = 1; month <= 12; month++) {
      // Set target targets around 150M to 500M VND
      const target = getRandomInt(15, 50) * 10_000_000

      await prisma.kpiTarget.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          month,
          year: currentYear,
          target,
        },
      })
    }
  }

  console.log('✅ KPI Targets: 72 monthly targets generated for 2026.')

  // ── SUMMARY ───────────────────────────────────────────
  console.log('\n📋 THÔNG TIN ĐĂNG NHẬP TEST:')
  console.log('┌──────────────────────────────────────────────┐')
  console.log('│  Role     │ Email            │ Password      │')
  console.log('├──────────────────────────────────────────────┤')
  console.log('│  ADMIN    │ admin@abc.com    │ Password123!  │')
  console.log('│  MANAGER  │ manager@abc.com  │ Password123!  │')
  console.log('│  SALES 1  │ sales@abc.com    │ Password123!  │')
  console.log('│  SALES 2  │ huong@abc.com    │ Password123!  │')
  console.log('│  SALES 3  │ quang@abc.com    │ Password123!  │')
  console.log('│  SALES 4  │ lan@abc.com      │ Password123!  │')
  console.log('│  SALES 5  │ minh@abc.com     │ Password123!  │')
  console.log('│  SALES 6  │ thu@abc.com      │ Password123!  │')
  console.log('└──────────────────────────────────────────────┘')
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('✅ Seed hoàn tất!')
  })
