import {
    Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { CreateLessonGroupDto, UpdateLessonGroupDto } from './lessonGroup.dto';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class LessonGroupService {
    constructor(private prisma: PrismaService) { }

    private async checkOwnership(sectionId: number, userId: number, role: UserRole) {
        if (role === UserRole.ADMIN) return;
        const section = await this.prisma.sectionLesson.findUnique({
            where: { id: sectionId },
            include: { course: { include: { mentor: true } } },
        });
        if (!section) throw new NotFoundException('Bo\'lim topilmadi');
        if (section.course.mentor.userId !== userId) {
            throw new ForbiddenException('Faqat o\'z kursining bo\'limini o\'zgartira olasiz');
        }
    }

    // GET /api/lesson-group/all/:course_id  — public
    async findAllByCourse(courseId: number) {
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Kurs topilmadi');

        return this.prisma.sectionLesson.findMany({
            where: { courseId },
            include: {
                _count: { select: { lessons: true, exams: true } },
                lessons: {
                    select: { id: true, name: true, about: true, createdAt: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    // GET /api/lesson-group/mine-all/:course_id  — STUDENT
    // Student uchun: dars ko'rilganmi va exam natijasi ham qo'shiladi
    async findAllByCourseForStudent(courseId: number, userId: number) {
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Kurs topilmadi');

        // Studentda kurs bormi tekshirish
        const hasCourse = await this.prisma.purchasedCourse.findUnique({
            where: { courseId_userId: { courseId, userId } },
        });
        if (!hasCourse) throw new ForbiddenException('Siz bu kursga kirish huquqiga ega emassiz');

        const sections = await this.prisma.sectionLesson.findMany({
            where: { courseId },
            include: {
                lessons: {
                    include: {
                        lessonViews: {
                            where: { userId },
                            select: { view: true },
                        },
                        homework: { select: { id: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                examResults: {
                    where: { userId },
                    select: { passed: true, corrects: true, wrongs: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                _count: { select: { lessons: true, exams: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Har bir bo\'lim uchun progress hisoblash
        return sections.map((section) => {
            const totalLessons = section.lessons.length;
            const viewedLessons = section.lessons.filter(
                (l) => l.lessonViews[0]?.view === true,
            ).length;

            return {
                ...section,
                progress: totalLessons > 0
                    ? Math.round((viewedLessons / totalLessons) * 100)
                    : 0,
                examResult: section.examResults[0] ?? null,
                lessons: section.lessons.map(({ lessonViews, ...lesson }) => ({
                    ...lesson,
                    viewed: lessonViews[0]?.view ?? false,
                })),
            };
        });
    }

    // GET /api/lesson-group/detail/:id  — auth required
    async findOne(id: number) {
        const section = await this.prisma.sectionLesson.findUnique({
            where: { id },
            include: {
                course: {
                    select: { id: true, name: true },
                },
                lessons: {
                    include: {
                        lessonFiles: true,
                        homework: { select: { id: true, task: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                exams: {
                    select: { id: true, question: true, variantA: true, variantB: true, variantC: true, variantD: true },
                },
                _count: { select: { lessons: true, exams: true } },
            },
        });
        if (!section) throw new NotFoundException('Bo\'lim topilmadi');
        return section;
    }

    // POST /api/lesson-group  — MENTOR, ADMIN
    async create(dto: CreateLessonGroupDto, userId: number, role: UserRole) {
        const course = await this.prisma.course.findUnique({
            where: { id: dto.courseId },
            include: { mentor: true },
        });
        if (!course) throw new NotFoundException('Kurs topilmadi');
        if (role !== UserRole.ADMIN && course.mentor.userId !== userId) {
            throw new ForbiddenException('Faqat o\'z kursiga bo\'lim qo\'sha olasiz');
        }
        return this.prisma.sectionLesson.create({ data: dto });
    }

    // PUT /api/lesson-group/:id  — MENTOR, ADMIN
    async update(id: number, dto: UpdateLessonGroupDto, userId: number, role: UserRole) {
        const section = await this.prisma.sectionLesson.findUnique({ where: { id } });
        if (!section) throw new NotFoundException('Bo\'lim topilmadi');
        await this.checkOwnership(id, userId, role);
        return this.prisma.sectionLesson.update({ where: { id }, data: dto });
    }

    // DELETE /api/lesson-group/:id  — MENTOR, ADMIN
    async remove(id: number, userId: number, role: UserRole) {
        const section = await this.prisma.sectionLesson.findUnique({ where: { id } });
        if (!section) throw new NotFoundException('Bo\'lim topilmadi');
        await this.checkOwnership(id, userId, role);
        await this.prisma.sectionLesson.delete({ where: { id } });
        return { message: 'Bo\'lim o\'chirildi' };
    }
}