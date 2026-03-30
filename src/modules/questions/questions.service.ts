import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { CreateQuestionDto, CreateAnswerDto, UpdateQuestionDto } from './question.dto';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuestionDto, userId: number) {
    return this.prisma.question.create({ data: { ...dto, userId } });
  }

  async findByCourse(courseId: number, userId: number, role: UserRole) {
    const where: any = { courseId };
    if (role === UserRole.STUDENT) where.userId = userId;
    return this.prisma.question.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, image: true } },
        answers: {
          include: { user: { select: { id: true, fullName: true, role: true, image: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUnread(userId: number, role: UserRole) {
    if (role === UserRole.STUDENT) throw new ForbiddenException('Ruxsat yoq');
    return this.prisma.question.findMany({
      where: { read: false },
      include: {
        user: { select: { id: true, fullName: true } },
        course: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(id: number, userId: number, role: UserRole) {
    if (role === UserRole.STUDENT) throw new ForbiddenException('Ruxsat yoq');
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Savol topilmadi');
    return this.prisma.question.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }

  async update(id: number, dto: UpdateQuestionDto, userId: number, role: UserRole) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Savol topilmadi');
    if (role !== UserRole.ADMIN && q.userId !== userId) {
      throw new ForbiddenException('Ruxsat yoq');
    }
    return this.prisma.question.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number, role: UserRole) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Savol topilmadi');
    if (role !== UserRole.ADMIN && q.userId !== userId) {
      throw new ForbiddenException('Ruxsat yoq');
    }
    await this.prisma.question.delete({ where: { id } });
    return { message: 'Savol ochirildi' };
  }

  // Answers
  async answer(questionId: number, dto: CreateAnswerDto, userId: number, role: UserRole) {
    if (role === UserRole.STUDENT) throw new ForbiddenException('Ruxsat yoq');
    const q = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Savol topilmadi');
    return this.prisma.questionAnswer.upsert({
      where: { questionId },
      update: { ...dto, userId },
      create: { questionId, userId, ...dto },
    });
  }

  async removeAnswer(answerId: number, userId: number, role: UserRole) {
    const a = await this.prisma.questionAnswer.findUnique({ where: { id: answerId } });
    if (!a) throw new NotFoundException('Javob topilmadi');
    if (role !== UserRole.ADMIN && a.userId !== userId) {
      throw new ForbiddenException('Ruxsat yoq' );
    }
    await this.prisma.questionAnswer.delete({ where: { id: answerId } });
    return { message: 'Javob ochirildi' };
  }
}
