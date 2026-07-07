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
    
    // Call the original PrismaClient constructor
    super({ adapter })

    // Create Prisma Client Extension
    this.extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // List of models that need to automatically isolate data by tenantId
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
              // Get tenantId from CLS context if ClsService is available
              const tenantId = cls ? cls.get<string>('tenantId') : undefined
              const bypass = cls ? cls.get<boolean>('bypassTenantIsolation') : undefined

              // Only inject filter when tenantId is available and bypass is not set
              if (tenantId && !bypass) {
                const queryArgs = args as any

                // Với các thao tác Đọc, Cập nhật, Xóa (cần lọc theo where)
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

                // For create operations (need to assign tenantId)
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

                // For upsert operations (combining both where and data)
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

    // Use Proxy to forward all calls from PrismaService to the extended client
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
    await this.$connect()
  }
}

