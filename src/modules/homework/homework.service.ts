import {
    Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import {
    CreateHomeworkDto, UpdateHomeworkDto, SubmitHomeworkDto, ReviewHomeworkDto,
} from './homework.dto';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class HomeworkService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateHomeworkDto, userId: number, role: UserRole) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: dto.lessonId },
            include: { section: { include: { course: { include: { mentor: true } } } } },
        });
        if (!lesson) throw new NotFoundException('Dars topilmadi');
        if (role !== UserRole.ADMIN && lesson.section.course.mentor.userId !== userId) {
            throw new ForbiddenException('Ruxsat yoq');
        }
        const exists = await this.prisma.homework.findUnique({ where: { lessonId: dto.lessonId } });
        if (exists) throw new ConflictException('Bu darsha uy vazifasi allaqachon mavjud');
        return this.prisma.homework.create({ data: dto });
    }

    async findByLesson(lessonId: string) {
        const hw = await this.prisma.homework.findUnique({
            where: { lessonId },
            include: { _count: { select: { submissions: true } } },
        });
        if (!hw) throw new NotFoundException('Uy vazifasi topilmadi');
        return hw;
    }

    async update(id: number, dto: UpdateHomeworkDto, userId: number, role: UserRole) {
        const hw = await this.prisma.homework.findUnique({
            where: { id },
            include: {
                lesson: {
                    include: { section: { include: { course: { include: { mentor: true } } } } },
                },
            },
        });
        if (!hw) throw new NotFoundException('Uy vazifasi topilmadi');
        if (role !== UserRole.ADMIN && hw.lesson.section.course.mentor.userId !== userId) {
            throw new ForbiddenException('Ruxsat yoq');
        }
        return this.prisma.homework.update({ where: { id }, data: dto });
    }

    async remove(id: number, userId: number, role: UserRole) {
        const hw = await this.prisma.homework.findUnique({
            where: { id },
            include: {
                lesson: {
                    include: { section: { include: { course: { include: { mentor: true } } } } },
                },
            },
        });
        if (!hw) throw new NotFoundException('Uy vazifasi topilmadi');
        if (role !== UserRole.ADMIN && hw.lesson.section.course.mentor.userId !== userId) {
            throw new ForbiddenException('Ruxsat yoq');
        }
        await this.prisma.homework.delete({ where: { id } });
        return { message: 'Uy vazifasi o\'chirildi' };
    }

    async submit(dto: SubmitHomeworkDto, userId: number) {
        const hw = await this.prisma.homework.findUnique({ where: { id: dto.homeworkId } });
        if (!hw) throw new NotFoundException('Uy vazifasi topilmadi');
        return this.prisma.homeworkSubmission.create({ data: { ...dto, userId } });
    }

    async getSubmissions(homeworkId: number, userId: number, role: UserRole) {
        const hw = await this.prisma.homework.findUnique({ where: { id: homeworkId } });
        if (!hw) throw new NotFoundException('Topilmadi');

        const where: any = { homeworkId };
        if (role === UserRole.STUDENT) where.userId = userId;

        return this.prisma.homeworkSubmission.findMany({
            where,
            include: { user: { select: { id: true, fullName: true, image: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async review(submissionId: number, dto: ReviewHomeworkDto, userId: number, role: UserRole) {
        const sub = await this.prisma.homeworkSubmission.findUnique({
            where: { id: submissionId },
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
            throw new ForbiddenException('Ruxsat yoq');
        }
        return this.prisma.homeworkSubmission.update({
            where: { id: submissionId },
            data: { status: dto.status, reason: dto.reason },
        });
    }

    async mySubmissions(userId: number) {
        return this.prisma.homeworkSubmission.findMany({
            where: { userId },
            include: {
                homework: { include: { lesson: { select: { id: true, name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
