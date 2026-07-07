import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import { CreateTaskBodyType, UpdateTaskBodyType } from './task.model'

@Injectable()
export class TaskRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dealId: string, data: CreateTaskBodyType) {
    return this.prismaService.task.create({
      data: {
        dealId,
        title: data.title,
        dueDate: data.dueDate ?? null,
      } as any,
    })
  }

  async createMany(dealId: string, tasks: CreateTaskBodyType[]) {
    const data = tasks.map((t) => ({
      dealId,
      title: t.title,
      dueDate: t.dueDate ?? null,
    }))
    return this.prismaService.task.createMany({
      data: data as any,
    })
  }

  async update(dealId: string, taskId: string, data: UpdateTaskBodyType) {
    const updateData: any = {}
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


