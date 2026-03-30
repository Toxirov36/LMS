import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { CreateExamDto, UpdateExamDto, SubmitExamDto } from './exam.dto';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  private async checkMentorSection(sectionId: number, userId: number, role: UserRole) {
    if (role === UserRole.ADMIN) return;
    const section = await this.prisma.sectionLesson.findUnique({
      where: { id: sectionId },
      include: { course: { include: { mentor: true } } },
    });
    if (!section) throw new NotFoundException('Bolim topilmadi');
    if (section.course.mentor.userId !== userId) throw new ForbiddenException('Ruxsat yoq');
  }

  async create(dto: CreateExamDto, userId: number, role: UserRole) {
    await this.checkMentorSection(dto.sectionLessonId, userId, role);
    return this.prisma.exam.create({ data: dto });
  }

  async findBySection(sectionLessonId: number, userId: number, role: UserRole) {
    const exams = await this.prisma.exam.findMany({
      where: { sectionLessonId },
      orderBy: { createdAt: 'asc' },
    });

    if (role === UserRole.STUDENT) {
      return exams.map(({ answer, ...rest }) => rest);
    }
    return exams;
  }

  async update(id: number, dto: UpdateExamDto, userId: number, role: UserRole) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Savol topilmadi');
    await this.checkMentorSection(exam.sectionLessonId, userId, role);
    return this.prisma.exam.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number, role: UserRole) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Savol topilmadi');
    await this.checkMentorSection(exam.sectionLessonId, userId, role);
    await this.prisma.exam.delete({ where: { id } });
    return { message: 'Savol ochirildi' };
  }

  async submitExam(dto: SubmitExamDto, userId: number) {
    const exams = await this.prisma.exam.findMany({
      where: { sectionLessonId: dto.sectionLessonId },
    });

    if (exams.length === 0) throw new NotFoundException('Bu bolimda savollar topilmadi');

    const examMap = new Map(exams.map((e) => [e.id, e]));
    let corrects = 0;
    let wrongs = 0;

    const questionRecords = dto.answers.map((a) => {
      const exam = examMap.get(a.examId);
      const isCorrect = exam ? exam.answer === a.answer : false;
      if (isCorrect) corrects++;
      else wrongs++;
      return {
        examId: a.examId,
        userId,
        answer: a.answer,
        isCorrect,
        sectionLessonId: dto.sectionLessonId,
      };
    });

    const passThreshold = Math.ceil(exams.length * 0.7);
    const passed = corrects >= passThreshold;

    await this.prisma.studentExamQuestion.createMany({ data: questionRecords });

    const result = await this.prisma.examResult.create({
      data: {
        sectionLessonId: dto.sectionLessonId,
        userId,
        passed,
        corrects,
        wrongs,
      },
    });

    return {
      ...result,
      total: exams.length,
      passThreshold,
      percentage: Math.round((corrects / exams.length) * 100),
    };
  }

  async getMyResults(userId: number) {
    return this.prisma.examResult.findMany({
      where: { userId },
      include: {
        section: { select: { id: true, name: true, courseId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSectionResults(sectionLessonId: number, userId: number, role: UserRole) {
    if (role === UserRole.STUDENT) {
      return this.prisma.examResult.findMany({
        where: { sectionLessonId, userId },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.examResult.findMany({
      where: { sectionLessonId },
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
