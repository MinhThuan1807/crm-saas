// be/prisma/seed.ts
import * as bcrypt from 'bcrypt'
import { PrismaClient } from '../generated/prisma-client/client'
import { DealStage, ActivityType, AiSuggestionType } from '../generated/prisma-client/enums'
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('amazonaws.com')
    ? { rejectUnauthorized: false }
    : undefined
})

const prisma = new PrismaClient({ adapter })

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

// Helper to generate weighted month: mostly concentrated in May, June, July and less in Jan - Apr
function getRandomWeightedMonth(): number {
  const months = [
    1, 1,             // January (weight 2)
    2, 2,             // February (weight 2)
    3, 3, 3,          // March (weight 3)
    4, 4, 4,          // April (weight 3)
    5, 5, 5, 5, 5,    // May (weight 5)
    6, 6, 6, 6, 6, 6, // June (weight 6)
    7, 7, 7, 7, 7, 7, 7, 7 // July - Current month (weight 8)
  ]
  return getRandomElement(months)
}

async function main() {
  console.log('🌱 Bắt đầu dọn dẹp dữ liệu cũ...')
  await prisma.aiSuggestion.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.activity.deleteMany({})
  await prisma.deal.deleteMany({})
  await prisma.contact.deleteMany({})
  await prisma.kpiTarget.deleteMany({})
  await prisma.refreshToken.deleteMany({})
  await prisma.invitation.deleteMany({})
  await prisma.rolePermission.deleteMany({})
  await prisma.permission.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.role.deleteMany({})
  await prisma.tenant.deleteMany({})

  console.log('🌱 Bắt đầu khởi tạo dữ liệu mẫu...')

  // 1. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Công ty ABC',
      slug: 'cong-ty-abc',
      plan: 'pro',
    },
  })

  // 2. Create system Permissions list
  const permissionsList = [
    { action: 'manage', subject: 'all', description: 'Quản trị hệ thống toàn quyền' },
    
    { action: 'create', subject: 'Contact', description: 'Tạo liên hệ mới' },
    { action: 'read', subject: 'Contact', description: 'Xem thông tin liên hệ' },
    { action: 'update', subject: 'Contact', description: 'Sửa thông tin liên hệ' },
    { action: 'delete', subject: 'Contact', description: 'Xóa liên hệ' },

    { action: 'create', subject: 'Deal', description: 'Tạo Deal mới' },
    { action: 'read', subject: 'Deal', description: 'Xem Deal' },
    { action: 'update', subject: 'Deal', description: 'Cập nhật Deal' },
    { action: 'delete', subject: 'Deal', description: 'Xóa Deal' },

    { action: 'create', subject: 'Task', description: 'Tạo Task mới' },
    { action: 'read', subject: 'Task', description: 'Xem Task' },
    { action: 'update', subject: 'Task', description: 'Cập nhật Task' },
    { action: 'delete', subject: 'Task', description: 'Xóa Task' },

    { action: 'create', subject: 'Activity', description: 'Tạo Hoạt động mới' },
    { action: 'read', subject: 'Activity', description: 'Xem Hoạt động' },
    { action: 'update', subject: 'Activity', description: 'Sửa Hoạt động' },
    { action: 'delete', subject: 'Activity', description: 'Xóa Hoạt động' },

    { action: 'read', subject: 'Report', description: 'Xem phân tích & báo cáo chuyên sâu' },
    { action: 'read', subject: 'KpiTarget', description: 'Xem chỉ tiêu doanh số' },
    { action: 'update', subject: 'KpiTarget', description: 'Cập nhật chỉ tiêu doanh số' },
  ]

  for (const perm of permissionsList) {
    await prisma.permission.upsert({
      where: { action_subject: { action: perm.action, subject: perm.subject } },
      update: {},
      create: perm,
    })
  }

  // 3. Create default Roles for the Tenant
  const adminRole = await prisma.role.create({
    data: { tenantId: tenant.id, name: 'ADMIN', description: 'Quản trị viên' }
  })
  const managerRole = await prisma.role.create({
    data: { tenantId: tenant.id, name: 'MANAGER', description: 'Quản lý bán hàng' }
  })
  const salesRepRole = await prisma.role.create({
    data: { tenantId: tenant.id, name: 'SALES_REP', description: 'Nhân viên bán hàng' }
  })

  // 4. Associate permissions for ADMIN (manage:all)
  const dbManageAll = await prisma.permission.findUnique({
    where: { action_subject: { action: 'manage', subject: 'all' } }
  })
  if (dbManageAll) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: dbManageAll.id }
    })
  }

  // 5. Associate permissions for MANAGER (read/write all Contacts, Deals, Tasks, Activities)
  const allDomainPerms = await prisma.permission.findMany({
    where: { subject: { in: ['Contact', 'Deal', 'Task', 'Activity'] } }
  })
  for (const perm of allDomainPerms) {
    await prisma.rolePermission.create({
      data: { roleId: managerRole.id, permissionId: perm.id }
    })
  }

  // Grant additional Report & KpiTarget permissions to MANAGER
  const managerExtraPerms = await prisma.permission.findMany({
    where: {
      OR: [
        { action: 'read', subject: 'Report' },
        { action: 'read', subject: 'KpiTarget' },
        { action: 'update', subject: 'KpiTarget' },
      ]
    }
  })
  for (const perm of managerExtraPerms) {
    await prisma.rolePermission.create({
      data: { roleId: managerRole.id, permissionId: perm.id }
    })
  }

  // 6. Set up ABAC permissions for SALES_REP (Only view/edit owned entities)
  for (const perm of allDomainPerms) {
    const isSubjectRestricted = ['Contact', 'Deal', 'Activity'].includes(perm.subject)
    await prisma.rolePermission.create({
      data: {
        roleId: salesRepRole.id,
        permissionId: perm.id,
        conditions: isSubjectRestricted 
          ? (perm.subject === 'Activity' ? { userId: '${user.id}' } : { ownerId: '${user.id}' })
          : undefined
      }
    })
  }

  // Grant limited Report & KpiTarget viewing permissions to SALES_REP
  const readReportPerm = await prisma.permission.findUnique({
    where: { action_subject: { action: 'read', subject: 'Report' } }
  })
  if (readReportPerm) {
    await prisma.rolePermission.create({
      data: {
        roleId: salesRepRole.id,
        permissionId: readReportPerm.id,
        conditions: { view: { $in: ['team', 'activity'] } }
      }
    })
  }

  const readKpiTargetPerm = await prisma.permission.findUnique({
    where: { action_subject: { action: 'read', subject: 'KpiTarget' } }
  })
  if (readKpiTargetPerm) {
    await prisma.rolePermission.create({
      data: {
        roleId: salesRepRole.id,
        permissionId: readKpiTargetPerm.id,
        conditions: { userId: '${user.id}' }
      }
    })
  }

  // 7. Create mock Users (using dynamic roleId)
  const hashedPassword = await bcrypt.hash('Password123!', 10)

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@abc.com',
      password: hashedPassword,
      name: 'Nguyễn Admin',
      roleId: adminRole.id,
    },
  })

  const manager = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'manager@abc.com',
      password: hashedPassword,
      name: 'Trần Manager',
      roleId: managerRole.id,
    },
  })

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
    const r = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: rep.email,
        password: hashedPassword,
        name: rep.name,
        roleId: salesRepRole.id,
      },
    })
    salesReps.push(r)
  }

  const allTeamUsers = [manager, ...salesReps]

  // 8. Create Contacts (30 Contacts) with tag data
  const companyNames = [
    'Vingroup', 'Viettel', 'FPT Software', 'Masan Group', 'Techcombank',
    'Vietcombank', 'Vinamilk', 'Thế Giới Di Động', 'VNG Corporation', 'Tập đoàn Hòa Phát'
  ]
  const contactFirstNames = ['Nam', 'Lan', 'Hương', 'Quang', 'Minh', 'Thu', 'Tuấn', 'Hùng']
  const contactLastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Vũ']
  const positions = ['CEO', 'CTO', 'Giám đốc IT', 'Trưởng phòng Mua hàng']
  const contactTagsList = ['Enterprise', 'Vip', 'Tiềm năng']

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

    // Select 1-3 random tags
    const tagsCount = getRandomInt(1, 3)
    const selectedTags: string[] = []
    while (selectedTags.length < tagsCount) {
      const tag = getRandomElement(contactTagsList)
      if (!selectedTags.includes(tag)) selectedTags.push(tag)
    }
    
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
        tags: selectedTags, // Add tags to database
      },
    })
    contacts.push(contact)
  }

  // 9. Create Deals (45 Deals) with weighted monthly distribution (mostly May-Jul 2026)
  const dealStages = [
    DealStage.PROSPECT, DealStage.QUALIFIED, DealStage.PROPOSAL, DealStage.CLOSED_WON, DealStage.CLOSED_LOST
  ]
  const dealTitles = ['Triển khai ERP', 'Tích hợp thanh toán API', 'Nâng cấp Cloud Server', 'Hợp đồng bảo trì', 'Phát triển Mobile App']
  const deals: any[] = []
  const currentYear = 2026

  for (let i = 1; i <= 45; i++) {
    const contact = getRandomElement(contacts)
    const ownerId = contact.ownerId
    const title = `${getRandomElement(dealTitles)} - ${contact.company}`
    const value = getRandomInt(15, 85) * 10_000_000
    
    let stage: DealStage
    let createdAt: Date
    
    if (i <= 15) {
      // 15 Deals in current month (7/1 -> 7/8/2026) to avoid future dates (>7/9)
      // Each stage has exactly 3 deals
      const stageIndex = Math.floor((i - 1) / 3)
      stage = dealStages[stageIndex]
      
      const day = getRandomInt(1, 8)
      createdAt = new Date(currentYear, 6, day) // July (index 6)
    } else if (i <= 30) {
      // 15 Deals in previous month (June 2026)
      const stageIndex = Math.floor((i - 16) / 3)
      stage = dealStages[stageIndex]
      
      const day = getRandomInt(1, 28)
      createdAt = new Date(currentYear, 5, day) // June (index 5)
    } else {
      // 15 Deals in earlier months (January -> May 2026)
      stage = getRandomElement(dealStages)
      const month = getRandomInt(1, 5) // Month 1 -> 5
      const day = getRandomInt(1, 28)
      createdAt = new Date(currentYear, month - 1, day)
    }

    let closeDate: Date | null = null
    if (stage === DealStage.CLOSED_WON || stage === DealStage.CLOSED_LOST) {
      // Ensure close date of July deals is before July 9
      const dealDay = createdAt.getDate()
      const closeDay = stage === DealStage.CLOSED_WON && createdAt.getMonth() === 6 
        ? getRandomInt(dealDay, 9) 
        : getRandomInt(dealDay, dealDay + 15)
      closeDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), closeDay)
    } else {
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

  // 10. Create Activities (60 Activities)
  const activityTypes = [ActivityType.CALL, ActivityType.EMAIL, ActivityType.MEETING, ActivityType.NOTE]
  const activityNotes = {
    [ActivityType.CALL]: ['Gọi điện giới thiệu dịch vụ và báo giá sơ bộ.', 'Gọi điện thảo luận chi tiết các yêu cầu tùy chỉnh.', 'Follow up sau khi gửi proposal.'],
    [ActivityType.EMAIL]: ['Gửi brochure sản phẩm và báo giá chi tiết.', 'Gửi email làm rõ một số điểm hợp đồng.', 'Gửi email tóm tắt cuộc họp.'],
    [ActivityType.MEETING]: ['Họp demo sản phẩm trực tuyến qua Zoom/Meet.', 'Gặp trực tiếp thương thảo điều khoản.', 'Họp khảo sát hiện trạng hạ tầng.'],
    [ActivityType.NOTE]: ['Khách hàng có vẻ ưu tiên giải pháp triển khai nhanh.', 'Đối thủ đang chào giá thấp hơn nhưng support kém.', 'Ghi chú kỹ thuật cần tích hợp thêm cổng thanh toán.']
  }

  for (let i = 1; i <= 60; i++) {
    const deal = getRandomElement(deals)
    const type = getRandomElement(activityTypes)
    const note = getRandomElement(activityNotes[type])
    
    const dealDate = new Date(deal.createdAt)
    let activityDate: Date
    
    if (dealDate.getMonth() === 6) {
      // If deal was created in July, limit activities to range dealDate -> July 9
      const dealDay = dealDate.getDate()
      activityDate = new Date(2026, 6, getRandomInt(dealDay, 9))
    } else {
      activityDate = new Date(dealDate.getTime() + getRandomInt(1, 10) * 24 * 60 * 60 * 1000)
    }

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

  // 11. Create Tasks (60 Tasks)
  const taskTitles = ['Gửi báo giá chính thức', 'Chuẩn bị slide demo', 'Gọi điện follow up', 'Trình duyệt hợp đồng', 'Setup môi trường test']

  for (let i = 1; i <= 60; i++) {
    const deal = getRandomElement(deals)
    const title = getRandomElement(taskTitles)
    const done = Math.random() > 0.4

    const dealDate = new Date(deal.createdAt)
    let dueDate: Date
    
    if (dealDate.getMonth() === 6) {
      // Some July tasks will have deadlines in the near future (e.g. July 10, 11, 12) to show "Upcoming activities"
      if (!done) {
        dueDate = new Date(2026, 6, getRandomInt(10, 12))
      } else {
        dueDate = new Date(2026, 6, getRandomInt(dealDate.getDate(), 9))
      }
    } else {
      dueDate = new Date(dealDate.getTime() + getRandomInt(5, 20) * 24 * 60 * 60 * 1000)
    }

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

  // 12. AI Suggestions (5 suggestions)
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

  // 13. KPI Targets (72 Target Records - 12 Months * 7 Users)
  for (const user of allTeamUsers) {
    for (let month = 1; month <= 12; month++) {
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

  // 14. Print beautiful sample data statistics
  const usersCount = await prisma.user.count()
  const rolesCount = await prisma.role.count()
  const permissionsCount = await prisma.permission.count()
  const contactsCount = await prisma.contact.count()
  const dealsCount = await prisma.deal.count()
  const activitiesCount = await prisma.activity.count()
  const tasksCount = await prisma.task.count()
  const aiSuggestionsCount = await prisma.aiSuggestion.count()
  const kpiTargetsCount = await prisma.kpiTarget.count()

  console.log(`
========================================================================
📊 BẢN TIN THỐNG KÊ DỮ LIỆU ĐƯỢC SEED (TENANT: ${tenant.name})
========================================================================
🏢 Tenant ID:        ${tenant.id}
💼 Plan:             ${tenant.plan.toUpperCase()}
🔑 Vai trò & Quyền Hạn:
   - Tổng số Roles:  ${rolesCount} (ADMIN, MANAGER, SALES_REP)
   - Tổng số Quyền:  ${permissionsCount} (Được map thông qua RolePermission)
👥 Danh sách tài khoản (Mật khẩu mặc định: Password123!):
   - [ADMIN] Nguyễn Admin      | Email: admin@abc.com   | Quyền: manage -> all
   - [MANAGER] Trần Manager    | Email: manager@abc.com | Quyền: CRUD toàn công ty
   - [SALES_REP] Lê Sales Rep  | Email: sales@abc.com   | Quyền ABAC (Chỉ xem dữ liệu sở hữu)
   - [SALES_REP] Trần T. Hương | Email: huong@abc.com   | Quyền ABAC (Chỉ xem dữ liệu sở hữu)
   - [SALES_REP] Nguyễn Quang  | Email: quang@abc.com   | Quyền ABAC (Chỉ xem dữ liệu sở hữu)
   - [SALES_REP] Phạm T. Lan   | Email: lan@abc.com     | Quyền ABAC (Chỉ xem dữ liệu sở hữu)
   - [SALES_REP] Vũ Đức Minh   | Email: minh@abc.com    | Quyền ABAC (Chỉ xem dữ liệu sở hữu)
   - [SALES_REP] Lê Thị Thu    | Email: thu@abc.com     | Quyền ABAC (Chỉ xem dữ liệu sở hữu)
📈 Thống kê thực thể nghiệp vụ đã tạo:
   - 📞 Contacts (Liên hệ):    ${contactsCount} liên hệ (Có gắn tags ngẫu nhiên)
   - 🤝 Deals (Cơ hội):        ${dealsCount} cơ hội (Trọng số phân bổ tháng 5, 6, 7/2026)
   - 📅 Activities (Hoạt động): ${activitiesCount} hoạt động
   - 📝 Tasks (Nhiệm vụ):      ${tasksCount} nhiệm vụ
   - 🧠 AI Suggestions:       ${aiSuggestionsCount} gợi ý từ AI
   - 🎯 KPI Target Records:    ${kpiTargetsCount} mục tiêu doanh số
========================================================================
  `);

  console.log('✅ Seed dữ liệu thành công!');
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
