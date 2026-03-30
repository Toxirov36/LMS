import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { UpdateMentorProfileDto, UpdateRoleDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(role?: UserRole) {
        return this.prisma.user.findMany({
            where: role ? { role } : {},
            select: {
                id: true, phone: true, fullName: true, role: true, image: true, createdAt: true,
                mentorProfile: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true, phone: true, fullName: true, role: true, image: true, createdAt: true,
                mentorProfile: true,
                purchasedCourses: { include: { course: true } },
            },
        });
        if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
        return user;
    }

    async updateProfile(userId: number, dto: UpdateUserDto) {
        return this.prisma.user.update({
            where: { id: userId },
            data: dto,
            select: { id: true, phone: true, fullName: true, role: true, image: true },
        });
    }

    async updateMentorProfile(userId: number, dto: UpdateMentorProfileDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || (user.role !== UserRole.MENTOR && user.role !== UserRole.ADMIN)) {
            throw new ForbiddenException('Faqat mentorlar profilni yangilay oladi');
        }
        return this.prisma.mentorProfile.upsert({
            where: { userId },
            update: dto,
            create: { ...dto, userId, experience: dto.experience || 0 },
        });
    }

    async updateRole(adminId: number, targetId: number, dto: UpdateRoleDto) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('Admin topilmadi');

        if (admin.role !== UserRole.ADMIN) throw new ForbiddenException('Faqat adminlar rol ozgartira oladi');
        return this.prisma.user.update({
            where: { id: targetId },
            data: { role: dto.role },
            select: { id: true, phone: true, fullName: true, role: true },
        });
    }

    async deleteUser(adminId: number, targetId: number) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('Admin topilmadi');

        if (admin.role !== UserRole.ADMIN) throw new ForbiddenException('Faqat adminlar foydalanuvchini ochira oladi');
        await this.prisma.user.delete({ where: { id: targetId } });
        return { message: 'Foydalanuvchi ochirildi' };
    }

    async updateLastActivity(userId: number, data: {
        courseId?: number; sectionId?: number; lessonId?: string; url?: string;
    }) {
        return this.prisma.lastActivity.upsert({
            where: { userId },
            update: data,
            create: { userId, ...data },
        });
    }

    async getLastActivity(userId: number) {
        return await this.prisma.lastActivity.findUnique({
            where: { userId },
            include: { course: true, section: true, lesson: true },
        });
    }
}
