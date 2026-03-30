import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateSectionDto, UpdateSectionDto } from './section.dto';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  private async checkCourseOwnership(userId: number, courseId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) throw new NotFoundException('User topilmadi');
    
    if (user.role === UserRole.ADMIN) return;
    const mentor = await this.prisma.mentorProfile.findUnique({ where: { userId } });
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Kurs topilmadi');
    if (course.mentorId !== mentor?.id) throw new ForbiddenException('Bu kursga ruxsat yoq');
  }

  async create(userId: number, dto: CreateSectionDto) {
    await this.checkCourseOwnership(userId, dto.courseId);
    return this.prisma.sectionLesson.create({ data: dto });
  }

  async findByCourse(courseId: number) {
    return this.prisma.sectionLesson.findMany({
      where: { courseId },
      include: {
        lessons: { select: { id: true, name: true, about: true, createdAt: true } },
        _count: { select: { lessons: true, exams: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: number) {
    const section = await this.prisma.sectionLesson.findUnique({
      where: { id },
      include: { lessons: true, exams: { select: { id: true, question: true } } },
    });
    if (!section) throw new NotFoundException('Bolim topilmadi');
    return section;
  }

  async update(userId: number, id: number, dto: UpdateSectionDto) {
    const section = await this.findOne(id);
    await this.checkCourseOwnership(userId, section.courseId);
    return this.prisma.sectionLesson.update({ where: { id }, data: dto });
  }

  async remove(userId: number, id: number) {
    const section = await this.findOne(id);
    await this.checkCourseOwnership(userId, section.courseId);
    await this.prisma.sectionLesson.delete({ where: { id } });
    return { message: 'Bolim ochirildi' };
  }
}
