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
      role: u.role.name, // Trả về string tên role
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
      // Tìm Role động tương ứng trong tenant
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

  // Lấy toàn bộ danh sách vai trò kèm theo các permissions được gán của tenant
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

  // Lấy danh sách các quyền hạn hệ thống có sẵn
  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [
        { subject: 'asc' },
        { action: 'asc' },
      ],
    });
  }

  // Cập nhật liên kết quyền cho một vai trò
  async updateRolePermissions(tenantId: string, roleId: string, permissionIds: string[]) {
    // 1. Kiểm tra vai trò thuộc tenant
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò này');
    }

    // 2. Cập nhật các liên kết quyền hạn bằng transaction
    await this.prisma.$transaction(async (tx) => {
      // Xóa tất cả liên kết quyền cũ của vai trò này
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Tạo liên kết mới
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((pId) => ({
            roleId,
            permissionId: pId,
          })),
        });
      }
    });

    // 3. Xóa cache Redis của vai trò để cập nhật quyền ngay lập tức
    // 3. Xóa cache Redis của vai trò để cập nhật quyền ngay lập tức
    const cacheKey = `tenant:${tenantId}:role:${role.name}:permissions`;
    await this.redisService.delete(cacheKey);

    return { message: 'Cập nhật quyền hạn thành công' };
  }

  // Tạo vai trò mới cho tenant
  async createRole(tenantId: string, body: { name: string; description?: string }) {
    const formattedName = body.name.trim().toUpperCase();

    // Ràng buộc bảo mật: không được tạo vai trò trùng tên hệ thống
    const isSystemRole = ['ADMIN', 'MANAGER', 'SALES_REP'].includes(formattedName);
    if (isSystemRole) {
      throw new BadRequestException('Không được đặt tên trùng với các vai trò mặc định của hệ thống');
    }

    // Kiểm tra trùng lặp trong tenant
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

  // Cập nhật tên/mô tả vai trò tùy chỉnh
  async updateRole(tenantId: string, roleId: string, body: { name: string; description?: string }) {
    // 1. Kiểm tra vai trò thuộc tenant
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò này');
    }

    // Ràng buộc bảo mật: không được chỉnh sửa 3 vai trò mặc định
    const isSystemRole = ['ADMIN', 'MANAGER', 'SALES_REP'].includes(role.name);
    if (isSystemRole) {
      throw new BadRequestException('Không thể chỉnh sửa các vai trò mặc định của hệ thống');
    }

    const formattedName = body.name.trim().toUpperCase();
    const isNewSystemName = ['ADMIN', 'MANAGER', 'SALES_REP'].includes(formattedName);
    if (isNewSystemName) {
      throw new BadRequestException('Không được đổi tên trùng với các vai trò mặc định');
    }

    // Kiểm tra trùng lặp với vai trò khác cùng tenant
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

    // Invalidate Redis cache cho cả tên cũ và tên mới
    await this.redisService.delete(`tenant:${tenantId}:role:${oldName}:permissions`);
    await this.redisService.delete(`tenant:${tenantId}:role:${formattedName}:permissions`);

    return updatedRole;
  }

  // Xóa vai trò tùy chỉnh
  async deleteRole(tenantId: string, roleId: string) {
    // 1. Kiểm tra vai trò thuộc tenant
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò này');
    }

    // Ràng buộc bảo mật: không được xóa 3 vai trò mặc định
    const isSystemRole = ['ADMIN', 'MANAGER', 'SALES_REP'].includes(role.name);
    if (isSystemRole) {
      throw new BadRequestException('Không thể xóa các vai trò mặc định của hệ thống');
    }

    // Kiểm tra xem có thành viên nào đang sử dụng vai trò này không
    const usersCount = await this.prisma.user.count({
      where: { roleId },
    });
    if (usersCount > 0) {
      throw new BadRequestException(
        'Không thể xóa vai trò đang có thành viên sử dụng. Vui lòng chuyển vai trò của các thành viên trước.',
      );
    }

    // Kiểm tra xem có thư mời nào chưa kích hoạt sử dụng vai trò này không
    const invCount = await this.prisma.invitation.count({
      where: { roleId },
    });
    if (invCount > 0) {
      throw new BadRequestException(
        'Không thể xóa vai trò đang được gán cho thư mời chưa kích hoạt. Vui lòng cập nhật hoặc hủy thư mời trước.',
      );
    }

    // 2. Xóa các liên kết quyền hạn trước, sau đó xóa vai trò bằng transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });
      await tx.role.delete({
        where: { id: roleId },
      });
    });

    // 3. Xóa cache permissions của vai trò này trong Redis
    await this.redisService.delete(`tenant:${tenantId}:role:${role.name}:permissions`);

    return { message: 'Xóa vai trò thành công' };
  }
}
