import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateCourseDto, UpdateCourseDto,
  AssignAssistantDto, UnassignAssistantDto, UpdateCourseMentorDto,
} from './courses.dto';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const courses = await this.prisma.course.findMany({
      where: { published: true },
      include: {
        category: { select: { id: true, name: true } },
        mentor: {
          include: { user: { select: { fullName: true, image: true } } },
        },
        _count: { select: { purchasedCourses: true, ratings: true, sections: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: courses
    }
  }

  async findSingle(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id, published: true },
      include: {
        category: { select: { id: true, name: true } },
        mentor: {
          include: { user: { select: { id: true, fullName: true, image: true } } },
        },
        ratings: {
          include: { user: { select: { fullName: true, image: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: { select: { purchasedCourses: true, ratings: true, sections: true } },
      },
    });

    if (!course) throw new NotFoundException('Kurs topilmadi');

    return {
      success: true,
      data: course,
    }
  }

  async findSingleFull(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        mentor: {
          include: { user: { select: { id: true, fullName: true, image: true, phone: true } } },
        },
        sections: {
          include: {
            lessons: true,
            _count: { select: { exams: true, lessons: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        ratings: {
          include: { user: { select: { fullName: true, image: true } } },
        },
        assignedCourses: {
          include: { user: { select: { id: true, fullName: true, role: true } } },
          where: { user: { role: UserRole.ASSISTANT } },
        },
        _count: { select: { purchasedCourses: true, ratings: true } },
      },
    });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    return {
      success: true,
      data: course,
    }
  }

  async findAllAdmin() {
    const courses = await this.prisma.course.findMany({
      include: {
        category: { select: { id: true, name: true } },
        mentor: {
          include: { user: { select: { fullName: true } } },
        },
        _count: { select: { purchasedCourses: true, sections: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: courses,
    }
  }

  async findMyCourses(userId: number) {
    const mentor = await this.prisma.mentorProfile.findUnique({ where: { userId } });
    if (!mentor) throw new NotFoundException('Mentor profil topilmadi');

    const courses = await this.prisma.course.findMany({
      where: { mentorId: mentor.id },
      include: {
        _count: { select: { purchasedCourses: true, sections: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: courses,
    }
  }

  async findMentorCourses(mentorUserId: number) {
    const mentor = await this.prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
    });
    if (!mentor) throw new NotFoundException('Mentor topilmadi');

    const courses = await this.prisma.course.findMany({
      where: { mentorId: mentor.id },
      include: {
        _count: { select: { purchasedCourses: true, sections: true } },
      },
    });

    return {
      success: true,
      data: courses,
    }
  }

  async findAssistantCourses(userId: number) {
    const courses = await this.prisma.assignedCourse.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            mentor: { include: { user: { select: { fullName: true, image: true } } } },
            _count: { select: { sections: true, purchasedCourses: true } },
          },
        },
      },
    });

    return {
      success: true,
      data: courses,
    }
  }

  async getCourseAssistants(courseId: number) {
    const courses = await this.prisma.assignedCourse.findMany({
      where: {
        courseId,
        user: { role: UserRole.ASSISTANT },
      },
      include: {
        user: { select: { id: true, fullName: true, image: true, phone: true } },
      },
    });

    return {
      success: true,
      data: courses,
    }
  }

  async assignAssistant(dto: AssignAssistantDto, userId: number, role: UserRole) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      include: { mentor: true },
    });
    if (!course) throw new NotFoundException('Kurs topilmadi');
    if (role !== UserRole.ADMIN && course.mentor.userId !== userId) {
      throw new ForbiddenException('Faqat o\'z kursiga assistant biriktira olasiz');
    }

    const assistant = await this.prisma.user.findUnique({ where: { id: dto.assistantId } });
    if (!assistant) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (assistant.role !== UserRole.ASSISTANT) {
      throw new ForbiddenException('Foydalanuvchi ASSISTANT roliga ega emas');
    }

    const exists = await this.prisma.assignedCourse.findUnique({
      where: { userId_courseId: { userId: dto.assistantId, courseId: dto.courseId } },
    });
    if (exists) throw new ConflictException('Assistant allaqachon biriktirilgan');

    return this.prisma.assignedCourse.create({
      data: { userId: dto.assistantId, courseId: dto.courseId },
    });
  }

  async unassignAssistant(dto: UnassignAssistantDto, userId: number, role: UserRole) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      include: { mentor: true },
    });
    if (!course) throw new NotFoundException('Kurs topilmadi');
    if (role !== UserRole.ADMIN && course.mentor.userId !== userId) {
      throw new ForbiddenException('Ruxsat yoq');
    }

    const assigned = await this.prisma.assignedCourse.findUnique({
      where: { userId_courseId: { userId: dto.assistantId, courseId: dto.courseId } },
    });
    if (!assigned) throw new NotFoundException('Assistant bu kursga biriktirilmagan');

    await this.prisma.assignedCourse.delete({
      where: { userId_courseId: { userId: dto.assistantId, courseId: dto.courseId } },
    });
    return { message: 'Assistant kursdan olib tashlandi' };
  }

  async create(dto: CreateCourseDto, userId: number, role: UserRole) {
    try {
      let mentorId: number;
      const category = await this.prisma.courseCategory.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Kategoriya topilmadi');

      if (role === UserRole.ADMIN) {
        const mentor = await this.prisma.mentorProfile.findFirst();
        if (!mentor) throw new NotFoundException('Hech qanday mentor topilmadi');
        mentorId = mentor.id;
      } else {
        const mentor = await this.prisma.mentorProfile.findUnique({ where: { userId } });
        if (!mentor) throw new ForbiddenException('Avval mentor profil yarating');
        mentorId = mentor.id;
      }

      return this.prisma.course.create({ data: { ...dto, mentorId } });
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, dto: UpdateCourseDto, userId: number, role: UserRole) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { mentor: true },
    });
    if (!course) throw new NotFoundException('Kurs topilmadi');
    if (role !== UserRole.ADMIN && course.mentor.userId !== userId) {
      throw new ForbiddenException('Faqat oz kursini tahrirlash mumkin');
    }
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async setPublished(id: number, published: boolean) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Kurs topilmadi');
    return this.prisma.course.update({
      where: { id },
      data: { published },
      select: { id: true, name: true, published: true },
    });
  }

  async updateMentor(dto: UpdateCourseMentorDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    const mentor = await this.prisma.mentorProfile.findUnique({
      where: { userId: dto.mentorId },
    });
    if (!mentor) throw new NotFoundException('Mentor topilmadi');

    return this.prisma.course.update({
      where: { id: dto.courseId },
      data: { mentorId: mentor.id },
      select: { id: true, name: true, mentorId: true },
    });
  }

  async remove(id: number, userId: number, role: UserRole) {
    if (!id) throw new BadRequestException('Kurs ID kiritilmadi');
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { mentor: true },
    });


    if (!course) throw new NotFoundException('Kurs topilmadi');
    if (role !== UserRole.ADMIN && course.mentor.userId !== userId) {
      throw new ForbiddenException('Faqat oz kursini ochirish mumkin');
    }
    await this.prisma.course.delete({ where: { id } });
    return { message: 'Kurs ochirildi' };
  }
}