import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}
  async getMyQuestions(userId: number) {
    return this.prisma.question.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, name: true } },
        answers: {
          include: {
            user: { select: { id: true, fullName: true, role: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCourse(courseId: number, userId: number, role: UserRole) {
    return this.prisma.question.findMany({
      where: { courseId },
      include: {
        user: { select: { id: true, fullName: true, image: true } },
        answers: {
          include: {
            user: { select: { id: true, fullName: true, role: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const q = await this.prisma.question.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, image: true } },
        course: { select: { id: true, name: true } },
        answers: {
          include: {
            user: { select: { id: true, fullName: true, role: true, image: true } },
          },
        },
      },
    });
    if (!q) throw new NotFoundException('Savol topilmadi');
    return q;
  }

  async markRead(id: number, userId: number, role: UserRole) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Savol topilmadi');
    return this.prisma.question.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }

  async create(dto: { courseId: number; text: string; file?: string }, userId: number) {
    return this.prisma.question.create({
      data: { ...dto, userId },
      include: {
        course: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: number, dto: { text?: string; file?: string }, userId: number, role: UserRole) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Savol topilmadi');
    if (q.userId !== userId) throw new ForbiddenException('Faqat o\'z savolingizni tahrirlay olasiz');
    return this.prisma.question.update({ where: { id }, data: dto });
  }

  async answer(questionId: number, dto: { text: string; file?: string }, userId: number, role: UserRole) {
    const q = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Savol topilmadi');
    return this.prisma.questionAnswer.upsert({
      where: { questionId },
      update: { ...dto, userId },
      create: { questionId, userId, ...dto },
    });
  }

  async updateAnswer(answerId: number, dto: { text?: string; file?: string }, userId: number, role: UserRole) {
    const a = await this.prisma.questionAnswer.findUnique({ where: { id: answerId } });
    if (!a) throw new NotFoundException('Javob topilmadi');
    if (role !== UserRole.ADMIN && a.userId !== userId) {
      throw new ForbiddenException('Ruxsat yo\'q');
    }
    return this.prisma.questionAnswer.update({ where: { id: answerId }, data: dto });
  }

  async removeAnswer(answerId: number, userId: number, role: UserRole) {
    const a = await this.prisma.questionAnswer.findUnique({ where: { id: answerId } });
    if (!a) throw new NotFoundException('Javob topilmadi');
    if (role !== UserRole.ADMIN && a.userId !== userId) {
      throw new ForbiddenException('Ruxsat yo\'q');
    }
    await this.prisma.questionAnswer.delete({ where: { id: answerId } });
    return { message: 'Javob o\'chirildi' };
  }

  async remove(id: number, userId: number, role: UserRole) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Savol topilmadi');
    if (role !== UserRole.ADMIN && q.userId !== userId) {
      throw new ForbiddenException('Faqat o\'z savolingizni o\'chira olasiz');
    }
    await this.prisma.question.delete({ where: { id } });
    return { message: 'Savol o\'chirildi' };
  }
}