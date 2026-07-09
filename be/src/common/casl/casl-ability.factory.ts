import { AbilityBuilder, Ability, subject } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { RedisService } from '../services/redis.service';

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

// Hàm helper để parse nội suy chuỗi placeholder ${user.id} -> userId thực tế
function interpolateConditions(conditions: any, user: { userId: string }) {
  if (!conditions) return undefined;
  const serialized = JSON.stringify(conditions);
  const interpolated = serialized.replace(/\${user\.id}/g, user.userId);
  return JSON.parse(interpolated);
}

@Injectable()
export class CaslAbilityFactory {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createForUser(user: { userId: string; role: string; tenantId: string }) {
    const { can, build } = new AbilityBuilder<Ability>(Ability as any);

    // 1. Tạo khóa cache theo tenant và vai trò
    const cacheKey = `tenant:${user.tenantId}:role:${user.role}:permissions`;
    let rawRules = await this.redis.get(cacheKey);

    if (!rawRules) {
      // 2. Cache miss -> Lấy quyền từ database
      const dbRolePermissions = await this.prisma.rolePermission.findMany({
        where: {
          role: {
            tenantId: user.tenantId,
            name: user.role,
          },
        },
        include: {
          permission: true,
        },
      });

      rawRules = dbRolePermissions.map((rp) => ({
        action: rp.permission.action,
        subject: rp.permission.subject,
        conditions: rp.conditions,
      }));

      // 3. Cache hit -> Set vào Redis (TTL: 1 giờ)
      await this.redis.set(cacheKey, rawRules, 3600);
    }

    // 4. Định nghĩa các quy tắc (rules)
    rawRules.forEach((rule: any) => {
      const parsedConditions = interpolateConditions(rule.conditions, user);
      can(rule.action, rule.subject, parsedConditions);
    });

    return build({
      detectSubjectType: (item) => {
        // Tự động nhận diện Subject Type từ helper subject('SubjectName', data)
        return (item as any)?.__type;
      }
    });
  }

  // Xóa cache khi Admin thay đổi quyền hạn của một Role
  async invalidateRoleCache(tenantId: string, roleName: string) {
    const cacheKey = `tenant:${tenantId}:role:${roleName}:permissions`;
    await this.redis.delete(cacheKey);
  }
}
