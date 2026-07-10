import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { RedisService } from 'src/common/services/redis.service';
import { UpdateUserType } from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getUsersByTenant(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      include: { role: true },
      orderBy: { name: 'asc' },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role.name, // Return role name string
    }));
  }

  async updateUser(
    id: string,
    body: UpdateUserType,
    tenantId: string,
    currentUserId: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      include: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy thành viên');
    }

    if (id === currentUserId && body.role && body.role !== user.role.name) {
      throw new BadRequestException('Bạn không thể tự thay đổi vai trò của chính mình');
    }

    let roleId = user.roleId;
    if (body.role) {
      // Find corresponding dynamic Role in tenant
      const dbRole = await this.prisma.role.findFirst({
        where: { tenantId, name: body.role },
      });
      if (!dbRole) {
        throw new BadRequestException('Vai trò không tồn tại trong hệ thống');
      }
      roleId = dbRole.id;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        roleId,
      },
      include: { role: true },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role.name,
    };
  }

  async deleteUser(id: string, tenantId: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('Bạn không thể tự xóa chính mình khỏi workspace');
    }

    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy thành viên');
    }

    const ownedDealsCount = await this.prisma.deal.count({
      where: { ownerId: id, deletedAt: null },
    });
    if (ownedDealsCount > 0) {
      throw new BadRequestException(
        'Không thể xóa thành viên đang sở hữu Deal. Vui lòng chuyển quyền sở hữu Deal trước.',
      );
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }

  // Get all roles along with assigned permissions of tenant
  async getRolesByTenant(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions.map((rp) => ({
        id: rp.permission.id,
        action: rp.permission.action,
        subject: rp.permission.subject,
        conditions: rp.conditions,
      })),
    }));
  }

  // Get list of available system permissions
  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [
        { subject: 'asc' },
        { action: 'asc' },
      ],
    });
  }

  // Update permission associations for a role
  async updateRolePermissions(tenantId: string, roleId: string, permissionIds: string[]) {
    // 1. Verify role belongs to tenant
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò này');
    }

    // 2. Update permission associations in transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete all old permission associations of this role
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Create new associations
      if (permissionIds.length > 0) {
        // Query detailed permissions to get the subject of each permission
        const permissions = await tx.permission.findMany({
          where: { id: { in: permissionIds } },
        });

        for (const perm of permissions) {
          let conditions: Record<string, any> | null = null;

          // Auto-assign default ABAC conditions for the SALES_REP role
          if (role.name === 'SALES_REP') {
            if (['Contact', 'Deal'].includes(perm.subject)) {
              conditions = { ownerId: '${user.id}' };
            } else if (perm.subject === 'Activity') {
              conditions = { userId: '${user.id}' };
            } else if (perm.subject === 'KpiTarget') {
              conditions = { userId: '${user.id}' };
            } else if (perm.subject === 'Report') {
              conditions = { view: { $in: ['team', 'activity'] } };
            }
          }

          await tx.rolePermission.create({
            data: {
              roleId,
              permissionId: perm.id,
              conditions: conditions as any,
            },
          });
        }
      }
    });

    // 3. Invalidate Redis cache of the role to update permissions immediately
    const cacheKey = `tenant:${tenantId}:role:${role.name}:permissions`;
    await this.redisService.delete(cacheKey);

    return { message: 'Cập nhật quyền hạn thành công' };
  }

  // Create new role for tenant
  async createRole(tenantId: string, body: { name: string; description?: string }) {
    const formattedName = body.name.trim().toUpperCase();

    // Security constraint: cannot create role matching system role names
    const isSystemRole = ['ADMIN', 'MANAGER', 'SALES_REP'].includes(formattedName);
    if (isSystemRole) {
      throw new BadRequestException('Không được đặt tên trùng với các vai trò mặc định của hệ thống');
    }

    // Check duplicate in tenant
    const existRole = await this.prisma.role.findFirst({
      where: { tenantId, name: formattedName },
    });
    if (existRole) {
      throw new BadRequestException('Tên vai trò đã tồn tại trong workspace');
    }

    return this.prisma.role.create({
      data: {
        tenantId,
        name: formattedName,
        description: body.description?.trim() || `Vai trò ${formattedName}`,
      },
    });
  }

  // Update custom role name/description
  async updateRole(tenantId: string, roleId: string, body: { name: string; description?: string }) {
    // 1. Verify role belongs to tenant
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò này');
    }

    // Security constraint: cannot edit the 3 default roles
    const isSystemRole = ['ADMIN', 'MANAGER', 'SALES_REP'].includes(role.name);
    if (isSystemRole) {
      throw new BadRequestException('Không thể chỉnh sửa các vai trò mặc định của hệ thống');
    }

    const formattedName = body.name.trim().toUpperCase();
    const isNewSystemName = ['ADMIN', 'MANAGER', 'SALES_REP'].includes(formattedName);
    if (isNewSystemName) {
      throw new BadRequestException('Không được đổi tên trùng với các vai trò mặc định');
    }

    // Check duplicate with another role in same tenant
    if (formattedName !== role.name) {
      const existOther = await this.prisma.role.findFirst({
        where: {
          tenantId,
          name: formattedName,
          id: { not: roleId },
        },
      });
      if (existOther) {
        throw new BadRequestException('Tên vai trò đã tồn tại trong workspace');
      }
    }

    const oldName = role.name;
    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: formattedName,
        description: body.description?.trim(),
      },
    });

    // Invalidate Redis cache for both old and new names
    await this.redisService.delete(`tenant:${tenantId}:role:${oldName}:permissions`);
    await this.redisService.delete(`tenant:${tenantId}:role:${formattedName}:permissions`);

    return updatedRole;
  }

  // Delete custom role
  async deleteRole(tenantId: string, roleId: string) {
    // 1. Verify role belongs to tenant
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò này');
    }

    // Security constraint: cannot delete the 3 default roles
    const isSystemRole = ['ADMIN', 'MANAGER', 'SALES_REP'].includes(role.name);
    if (isSystemRole) {
      throw new BadRequestException('Không thể xóa các vai trò mặc định của hệ thống');
    }

    // Check if any member is using this role
    const usersCount = await this.prisma.user.count({
      where: { roleId },
    });
    if (usersCount > 0) {
      throw new BadRequestException(
        'Không thể xóa vai trò đang có thành viên sử dụng. Vui lòng chuyển vai trò của các thành viên trước.',
      );
    }

    // Check if any pending invitation is using this role
    const invCount = await this.prisma.invitation.count({
      where: { roleId },
    });
    if (invCount > 0) {
      throw new BadRequestException(
        'Không thể xóa vai trò đang được gán cho thư mời chưa kích hoạt. Vui lòng cập nhật hoặc hủy thư mời trước.',
      );
    }

    // 2. Delete permission associations first, then delete role in transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });
      await tx.role.delete({
        where: { id: roleId },
      });
    });

    // 3. Invalidate permission cache of this role in Redis
    await this.redisService.delete(`tenant:${tenantId}:role:${role.name}:permissions`);

    return { message: 'Xóa vai trò thành công' };
  }
}
