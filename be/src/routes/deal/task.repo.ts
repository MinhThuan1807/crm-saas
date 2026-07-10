import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import { CreateTaskBodyType, UpdateTaskBodyType } from './task.model'

@Injectable()
export class TaskRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dealId: string, tenantId: string, data: CreateTaskBodyType) {
    return this.prismaService.task.create({
      data: {
        dealId,
        tenantId,
        title: data.title,
        dueDate: data.dueDate ?? null,
      },
    })
  }

  async createMany(dealId: string, tenantId: string, tasks: CreateTaskBodyType[]) {
    const data = tasks.map((t) => ({
      dealId,
      tenantId,
      title: t.title,
      dueDate: t.dueDate ?? null,
    }))
    return this.prismaService.task.createMany({
      data,
    })
  }

  async update(dealId: string, taskId: string, data: UpdateTaskBodyType) {
    const updateData: Partial<{
      title: string;
      done: boolean;
      dueDate: Date | null;
    }> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.done !== undefined) updateData.done = data.done
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate

    return this.prismaService.task.update({
      where: { id: taskId, dealId },
      data: updateData,
    })
  }

  async delete(dealId: string, taskId: string) {
    return this.prismaService.task.delete({
      where: { id: taskId, dealId },
    })
  }
}


