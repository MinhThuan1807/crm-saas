import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { UpdateUserType } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getUsersByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async updateUser(
    id: string,
    body: UpdateUserType,
    tenantId: string,
    currentUserId: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy thành viên');
    }

    if (id === currentUserId && body.role && body.role !== user.role) {
      throw new BadRequestException('Bạn không thể tự thay đổi vai trò của chính mình');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
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

    // Check if user owns any active deals
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
}
