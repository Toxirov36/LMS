import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserRole } from '@prisma/client';
import { ReviewSubmissionDto, SubmitHomeworkDto } from './homework.sub.dto';

@Injectable()
export class HomeworkSubmissionService {
  constructor(private prisma: PrismaService) {}

  async submit(dto: SubmitHomeworkDto, file: string, userId: number) {
    const hw = await this.prisma.homework.findUnique({ where: { id: dto.homeworkId } });
    if (!hw) throw new NotFoundException('Uy vazifasi topilmadi');

    return this.prisma.homeworkSubmission.create({
      data: {
        text:       dto.text,
        file,
        homeworkId: dto.homeworkId,
        userId,
      },
      include: {
        homework: { select: { id: true, task: true } },
        user:     { select: { id: true, fullName: true } },
      },
    });
  }

  async mySubmissions(userId: number) {
    return this.prisma.homeworkSubmission.findMany({
      where: { userId },
      include: {
        homework: {
          include: {
            lesson: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async mySubmissionById(id: number, userId: number) {
    const sub = await this.prisma.homeworkSubmission.findUnique({
      where: { id },
      include: {
        homework: { include: { lesson: { select: { id: true, name: true } } } },
        user:     { select: { id: true, fullName: true, image: true } },
      },
    });
    if (!sub) throw new NotFoundException('Topshiriq topilmadi');
    if (sub.userId !== userId) throw new ForbiddenException('Ruxsat yo\'q');
    return sub;
  }

  async getByHomework(homeworkId: number, userId: number, role: UserRole) {
    const hw = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        lesson: {
          include: { section: { include: { course: { include: { mentor: true } } } } },
        },
      },
    });
    if (!hw) throw new NotFoundException('Uy vazifasi topilmadi');

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.ASSISTANT &&
      hw.lesson.section.course.mentor.userId !== userId
    ) {
      throw new ForbiddenException('Ruxsat yo\'q');
    }

    return this.prisma.homeworkSubmission.findMany({
      where: { homeworkId },
      include: {
        user: { select: { id: true, fullName: true, image: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number, role: UserRole) {
    const sub = await this.prisma.homeworkSubmission.findUnique({
      where: { id },
      include: {
        user:     { select: { id: true, fullName: true, image: true, phone: true } },
        homework: {
          include: {
            lesson: {
              include: { section: { include: { course: { include: { mentor: true } } } } },
            },
          },
        },
      },
    });
    if (!sub) throw new NotFoundException('Topshiriq topilmadi');

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.ASSISTANT &&
      sub.homework.lesson.section.course.mentor.userId !== userId
    ) {
      throw new ForbiddenException('Ruxsat yo\'q');
    }
    return sub;
  }

  async review(id: number, dto: ReviewSubmissionDto, userId: number, role: UserRole) {
    const sub = await this.prisma.homeworkSubmission.findUnique({
      where: { id },
      include: {
        homework: {
          include: {
            lesson: {
              include: { section: { include: { course: { include: { mentor: true } } } } },
            },
          },
        },
      },
    });
    if (!sub) throw new NotFoundException('Topshiriq topilmadi');

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.ASSISTANT &&
      sub.homework.lesson.section.course.mentor.userId !== userId
    ) {
      throw new ForbiddenException('Ruxsat yo\'q');
    }

    return this.prisma.homeworkSubmission.update({
      where: { id },
      data: { status: dto.status, reason: dto.reason },
      include: {
        user: { select: { id: true, fullName: true } },
      },
    });
  }

  async remove(id: number, userId: number) {
    const sub = await this.prisma.homeworkSubmission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Topshiriq topilmadi');
    if (sub.userId !== userId) throw new ForbiddenException('Faqat o\'z topshirig\'ingizni o\'chira olasiz');
    if (sub.status !== 'PENDING') {
      throw new ForbiddenException('Baholangan topshiriqni o\'chirib bo\'lmaydi');
    }
    await this.prisma.homeworkSubmission.delete({ where: { id } });
    return { message: 'Topshiriq o\'chirildi' };
  }
}