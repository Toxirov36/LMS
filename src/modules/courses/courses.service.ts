import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { CreateCourseDto, UpdateCourseDto, PurchaseCourseDto, AssignCourseDto, CourseFilterDto } from './courses.dto';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateCourseDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { mentorProfile: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!user.mentorProfile) throw new ForbiddenException('Avval mentor profilingizni toldiring');

    return this.prisma.course.create({
      data: { ...dto, mentorId: user.mentorProfile.id },
    });
  }

  async findAll(filter: CourseFilterDto) {
    const where: any = { published: true };
    if (filter.level) where.level = filter.level;
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.search) where.name = { contains: filter.search, mode: 'insensitive' };

    return this.prisma.course.findMany({
      where,
      include: {
        category: true,
        mentor: { include: { user: { select: { fullName: true, image: true } } } },
        _count: { select: { ratings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.course.findMany({
      include: {
        category: true,
        mentor: { include: { user: { select: { fullName: true } } } },
        _count: { select: { ratings: true, purchasedCourses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        mentor: { include: { user: { select: { fullName: true, image: true, id: true } } } },
        sections: {
          include: {
            lessons: {
              select: { id: true, name: true, about: true, createdAt: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        ratings: {
          include: { user: { select: { fullName: true, image: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { ratings: true, purchasedCourses: true } },
      },
    });
    if (!course) throw new NotFoundException('Kurs topilmadi');
    return course;
  }

  async findMyMentorCourses(userId: number) {
    const mentor = await this.prisma.mentorProfile.findUnique({ where: { userId } });
    if (!mentor) throw new NotFoundException('Mentor profil topilmadi');
    return this.prisma.course.findMany({
      where: { mentorId: mentor.id },
      include: {
        category: true,
        _count: { select: { ratings: true, purchasedCourses: true } },
      },
    });
  }

  async findMyPurchasedCourses(userId: number) {
    return this.prisma.purchasedCourse.findMany({
      where: { userId },
      include: { course: { include: { category: true, mentor: true } } },
      orderBy: { purchasedAt: 'desc' },
    });
  }

  async findMyAssignedCourses(userId: number) {
    return this.prisma.assignedCourse.findMany({
      where: { userId },
      include: { course: { include: { category: true, mentor: true } } },
    });
  }

  async update(userId: number, courseId: string, dto: UpdateCourseDto) {
    const course = await this.findOne(courseId);
    const mentor = await this.prisma.mentorProfile.findUnique({ where: { userId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');
    if (!mentor) throw new NotFoundException('Mentor not found');

    if (user.role !== UserRole.ADMIN && course.mentorId !== mentor?.id) {
      throw new ForbiddenException('Bu kursni ozgartirish huquqingiz yoq');
    }
    return this.prisma.course.update({ where: { id: courseId }, data: dto });
  }

  async publish(userId: number, courseId: string, published: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const course = await this.findOne(courseId);
    const mentor = await this.prisma.mentorProfile.findUnique({ where: { userId } });

    if (!user) throw new NotFoundException('User not found');
    if (!mentor) throw new NotFoundException('Mentor not found');

    if (user.role !== UserRole.ADMIN && course.mentorId !== mentor?.id) {
      throw new ForbiddenException('Ruxsat yoq');
    }
    return this.prisma.course.update({ where: { id: courseId }, data: { published } });
  }

  async remove(userId: number, courseId: string) {
    const course = await this.findOne(courseId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const mentor = await this.prisma.mentorProfile.findUnique({ where: { userId } });

    if (!user) throw new NotFoundException('User not found');
    if (!mentor) throw new NotFoundException('Mentor not found');

    if (user.role !== UserRole.ADMIN && course.mentorId !== mentor?.id) {
      throw new ForbiddenException('Bu kursni ochirish huquqingiz yoq');
    }
    await this.prisma.course.delete({ where: { id: courseId } });
    return { message: 'Kurs ochirildi' };
  }

  async purchaseCourse(userId: number, dto: PurchaseCourseDto) {
    await this.findOne(dto.courseId);
    const existing = await this.prisma.purchasedCourse.findUnique({
      where: { courseId_userId: { courseId: dto.courseId, userId } },
    });
    if (existing) throw new ConflictException('Bu kursni allaqachon sotib olgansiz');

    return this.prisma.purchasedCourse.create({
      data: { courseId: dto.courseId, userId, amount: dto.amount, paidVia: dto.paidVia },
    });
  }

  async assignCourse(adminId: number, dto: AssignCourseDto) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });

    if (!admin) throw new NotFoundException('User not found');

    if (admin.role !== UserRole.ADMIN && admin.role !== UserRole.ASSISTANT) {
      throw new ForbiddenException('Faqat admin yoki assistant kurs biriktira oladi');
    }
    await this.findOne(dto.courseId);

    const existing = await this.prisma.assignedCourse.findUnique({
      where: { userId_courseId: { userId: dto.userId, courseId: dto.courseId } },
    });
    if (existing) throw new ConflictException('Kurs allaqachon biriktirilgan');

    return this.prisma.assignedCourse.create({ data: { userId: dto.userId, courseId: dto.courseId } });
  }

  async checkAccess(userId: number, courseId: string): Promise<boolean> {
    const purchased = await this.prisma.purchasedCourse.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (purchased) return true;

    const assigned = await this.prisma.assignedCourse.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    return !!assigned;
  }

  async getCourseStats(courseId: string) {
    const [studentsCount, ratingsAvg, sectionsCount, lessonsCount] = await Promise.all([
      this.prisma.purchasedCourse.count({ where: { courseId } }),
      this.prisma.rating.aggregate({ where: { courseId }, _avg: { rate: true } }),
      this.prisma.sectionLesson.count({ where: { courseId } }),
      this.prisma.lesson.count({ where: { section: { courseId } } }),
    ]);
    return {
      studentsCount,
      averageRating: ratingsAvg._avg.rate || 0,
      sectionsCount,
      lessonsCount,
    };
  }
}
