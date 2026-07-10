import { Injectable, ForbiddenException } from '@nestjs/common'
import { AccessTokenPayload } from 'src/common/types/jwt.type'
import { ActivityType } from '../../../../generated/prisma-client/enums'
import { ReportsRepository } from '../reports.repo'
import { parseDates } from './report-helpers'
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory'
import { subject } from '@casl/ability'

@Injectable()
export class ActivityReportService {
  constructor(
    private readonly reportsRepo: ReportsRepository,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async getActivitiesReport(
    startDateStr: string | undefined,
    endDateStr: string | undefined,
    user: AccessTokenPayload,
  ) {
    const ability = await this.caslAbilityFactory.createForUser(user)
    if (ability.cannot('read', subject('Report', { view: 'activity' } as any))) {
      throw new ForbiddenException('Bạn không có quyền xem báo cáo hoạt động')
    }

    const userFilter = ability.cannot('read', subject('Activity', { userId: 'other' } as any))
      ? { userId: user.userId }
      : {}

    const { start, end } = parseDates(startDateStr, endDateStr)

    const activities = await this.reportsRepo.findActivities(start, end, userFilter)

    const monthsList: { label: string; year: number; month: number }[] = []
    const temp = new Date(start)
    while (temp <= end) {
      const label = `T${temp.getMonth() + 1}`
      if (!monthsList.find((m) => m.label === label && m.year === temp.getFullYear())) {
        monthsList.push({ label, year: temp.getFullYear(), month: temp.getMonth() + 1 })
      }
      temp.setMonth(temp.getMonth() + 1)
    }

    // If cannot view others' Tasks, only get tasks belonging to deals owned by oneself
    const isSalesRep = ability.cannot('read', subject('Task', { deal: { ownerId: 'other' } } as any))
    const tasks = await this.reportsRepo.findTasks(start, end, isSalesRep, user.userId)

    const trend = monthsList.map((m) => {
      const monthActivities = activities.filter((a) => {
        return a.date.getMonth() + 1 === m.month && a.date.getFullYear() === m.year
      })
      const Calls = monthActivities.filter((a) => a.type === ActivityType.CALL).length
      const Emails = monthActivities.filter((a) => a.type === ActivityType.EMAIL).length
      const Meetings = monthActivities.filter((a) => a.type === ActivityType.MEETING).length

      const monthTasks = tasks.filter((t) => {
        return t.done && t.createdAt.getMonth() + 1 === m.month && t.createdAt.getFullYear() === m.year
      }).length

      return {
        name: m.label,
        Calls,
        Emails,
        Meetings,
        Tasks: monthTasks,
      }
    })

    const now = new Date()
    const doneTasksCount = tasks.filter((t) => t.done).length
    const overdueTasksCount = tasks.filter((t) => !t.done && t.dueDate && new Date(t.dueDate) < now).length
    const pendingTasksCount = tasks.filter((t) => !t.done && (!t.dueDate || new Date(t.dueDate) >= now)).length

    const totalTasks = doneTasksCount + overdueTasksCount + pendingTasksCount
    const statusDistribution = [
      { name: 'Đã xong', value: totalTasks > 0 ? Math.round((doneTasksCount / totalTasks) * 100) : 0 },
      { name: 'Quá hạn', value: totalTasks > 0 ? Math.round((overdueTasksCount / totalTasks) * 100) : 0 },
      { name: 'Đang chờ', value: totalTasks > 0 ? Math.round((pendingTasksCount / totalTasks) * 100) : 0 },
    ]

    return {
      trend,
      statusDistribution,
    }
  }
}
