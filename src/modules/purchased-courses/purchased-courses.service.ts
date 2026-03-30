import {
    Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { PurchaseCourseDto, CreatePurchaseAdminDto } from './purchasedCourse.dto';

@Injectable()
export class PurchasedCoursesService {
    constructor(private prisma: PrismaService) { }

    async getMyPurchasedCourses(userId: number) {
        const where: any = { userId };

        const [data, total] = await Promise.all([
            this.prisma.purchasedCourse.findMany({
                where,
                include: {
                    course: {
                        include: {
                            category: { select: { id: true, name: true } },
                            mentor: {
                                include: {
                                    user: { select: { id: true, fullName: true, image: true } },
                                },
                            },
                            _count: { select: { sections: true, ratings: true } },
                        },
                    },
                },
                orderBy: { purchasedAt: 'desc' },
            }),
            this.prisma.purchasedCourse.count({ where }),
        ]);

        return {
            total,
            data: data.map((p) => ({
                ...p.course,
                purchasedAt: p.purchasedAt,
                paidVia: p.paidVia,
                amount: p.amount,
            })),
        };
    }

    async getMyPurchasedCourse(userId: number, courseId: number) {
        const purchased = await this.prisma.purchasedCourse.findUnique({
            where: { courseId_userId: { courseId: Number(courseId), userId } },
            include: {
                course: {
                    include: {
                        category: { select: { id: true, name: true } },

                        mentor: {
                            select: {
                                user: { select: { id: true, fullName: true, image: true } },
                            },
                        },
                        sections: {
                            include: {
                                lessons: {
                                    include: {
                                        lessonViews: {
                                            where: { userId },
                                            select: { view: true },
                                        },
                                    },
                                    orderBy: { createdAt: 'asc' },
                                },
                                _count: { select: { exams: true } },
                            },
                            orderBy: { createdAt: 'asc' },
                        },
                        _count: { select: { sections: true, ratings: true } },
                    },
                },
            },
        });

        if (!purchased) throw new NotFoundException('Siz bu kursni sotib olmagansiz');
        return {
            ...purchased.course,
            purchasedAt: purchased.purchasedAt,
            paidVia: purchased.paidVia,
            amount: purchased.amount,
        };
    }

    async purchaseCourse(dto: PurchaseCourseDto, userId: number) {
        const course = await this.prisma.course.findUnique({
            where: { id: dto.courseId, published: true },
        });
        if (!course) throw new NotFoundException('Kurs topilmadi');

        const exists = await this.prisma.purchasedCourse.findUnique({
            where: { courseId_userId: { courseId: dto.courseId, userId } },
        });
        if (exists) throw new ConflictException('Siz bu kursni allaqachon sotib olgansiz');

        return this.prisma.purchasedCourse.create({
            data: {
                courseId: dto.courseId,
                userId,
                paidVia: dto.paidVia,
                amount: dto.amount ?? course.price,
            },
            include: {
                course: { select: { id: true, name: true, banner: true } },
            },
        });
    }

    async getCourseStudents(courseId: number, userId: number, role: string) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: { mentor: true },
        });
        if (!course) throw new NotFoundException('Kurs topilmadi');

        if (role !== 'ADMIN' && course.mentor.userId !== userId) {
            throw new ForbiddenException('Faqat oz kursining oquvchilarini kora olasiz');
        }

        const students = await this.prisma.purchasedCourse.findMany({
            where: { courseId },
            include: {
                user: {
                    select: { id: true, fullName: true, phone: true, image: true, createdAt: true },
                },
            },
            orderBy: { purchasedAt: 'desc' },
        });

        return {
            total: students.length,
            students: students.map((s) => ({
                ...s.user,
                purchasedAt: s.purchasedAt,
                paidVia: s.paidVia,
                amount: s.amount,
            })),
        };
    }

    async createPurchaseAdmin(dto: CreatePurchaseAdminDto) {
        const [course, user] = await Promise.all([
            this.prisma.course.findUnique({ where: { id: dto.courseId } }),
            this.prisma.user.findUnique({ where: { id: dto.userId } }),
        ]);
        if (!course) throw new NotFoundException('Kurs topilmadi');
        if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

        const exists = await this.prisma.purchasedCourse.findUnique({
            where: { courseId_userId: { courseId: dto.courseId, userId: dto.userId } },
        });
        if (exists) throw new ConflictException('Foydalanuvchi bu kursni allaqachon sotib olgan');

        return this.prisma.purchasedCourse.create({
            data: {
                courseId: dto.courseId,
                userId: dto.userId,
                paidVia: dto.paidVia,
                amount: dto.amount ?? course.price,
            },
            include: {
                course: { select: { id: true, name: true } },
                user: { select: { id: true, fullName: true, phone: true } },
            },
        });
    }
}