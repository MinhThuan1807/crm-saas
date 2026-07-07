import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { ClsService } from 'nestjs-cls'
import envConfig from '../config'
import { PrismaClient } from '../../../generated/prisma-client/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly extendedClient: any

  constructor(private readonly cls?: ClsService) {
    const adapter = new PrismaPg({
      connectionString: envConfig.DATABASE_URL,
      ssl: envConfig.DATABASE_URL.includes('amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined,
    })
    
    // Gọi constructor của PrismaClient gốc
    super({ adapter })

    // 1. Tạo Prisma Client Extension
    this.extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // Danh sách các model cần tự động cô lập dữ liệu theo tenantId
            const tenantModels = [
              'User',
              'Contact',
              'Deal',
              'Activity',
              'Task',
              'AiSuggestion',
              'Invitation',
              'KpiTarget',
            ]

            if (tenantModels.includes(model)) {
              // Lấy tenantId từ CLS context nếu có ClsService
              const tenantId = cls ? cls.get<string>('tenantId') : undefined
              const bypass = cls ? cls.get<boolean>('bypassTenantIsolation') : undefined

              // Chỉ tiêm filter khi có tenantId và không có cờ bypass
              if (tenantId && !bypass) {
                const queryArgs = args as any

                // 1.1. Với các thao tác Đọc, Cập nhật, Xóa (cần lọc theo where)
                if (
                  [
                    'findFirst',
                    'findFirstOrThrow',
                    'findMany',
                    'update',
                    'updateMany',
                    'delete',
                    'deleteMany',
                    'count',
                    'aggregate',
                    'groupBy',
                  ].includes(operation)
                ) {
                  queryArgs.where = queryArgs.where || {}
                  queryArgs.where.tenantId = tenantId
                }

                // 1.2. Với các thao tác Tạo mới (cần gán dữ liệu tenantId)
                if (['create', 'createMany'].includes(operation)) {
                  if (queryArgs.data) {
                    if (Array.isArray(queryArgs.data)) {
                      queryArgs.data.forEach((item: any) => {
                        item.tenantId = tenantId
                      })
                    } else {
                      queryArgs.data.tenantId = tenantId
                    }
                  }
                }

                // 1.3. Với các thao tác Upsert (kết hợp gán cả where và data)
                if (operation === 'upsert') {
                  queryArgs.where = queryArgs.where || {}
                  queryArgs.where.tenantId = tenantId
                  
                  if (queryArgs.create) queryArgs.create.tenantId = tenantId
                  if (queryArgs.update) queryArgs.update.tenantId = tenantId
                }

                return query(queryArgs)
              }
            }

            return query(args)
          },
        },
      },
    })

    // 2. Sử dụng Proxy để chuyển tiếp toàn bộ các cuộc gọi của PrismaService sang client đã mở rộng
    return new Proxy(this, {
      get: (target, prop) => {
        const source = prop in target.extendedClient ? target.extendedClient : target
        const value = source[prop]
        if (typeof value === 'function') {
          return value.bind(source)
        }
        return value
      },
    })
  }

  async onModuleInit() {
    // Kết nối CSDL khi khởi tạo module
    await this.$connect()
  }
}

