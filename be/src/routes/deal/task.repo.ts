import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import { CreateTaskBodyType, UpdateTaskBodyType } from './task.model'

@Injectable()
export class TaskRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dealId: string, tenantId: string, data: CreateTaskBodyType) {
    return this.prismaService.task.create({
      data: {
        tenantId,
        dealId,
        title: data.title,
        dueDate: data.dueDate ?? null,
      },
    })
  }

  async createMany(dealId: string, tenantId: string, tasks: CreateTaskBodyType[]) {
    const data = tasks.map((t) => ({
      tenantId,
      dealId,
      title: t.title,
      dueDate: t.dueDate ?? null,
    }))
    return this.prismaService.task.createMany({
      data,
    })
  }

  async update(dealId: string, tenantId: string, taskId: string, data: UpdateTaskBodyType) {
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.done !== undefined) updateData.done = data.done
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate

    return this.prismaService.task.update({
      where: { id: taskId, dealId, tenantId },
      data: updateData,
    })
  }

  async delete(dealId: string, tenantId: string, taskId: string) {
    return this.prismaService.task.delete({
      where: { id: taskId, dealId, tenantId },
    })
  }
}
