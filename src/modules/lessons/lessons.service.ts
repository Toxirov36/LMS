import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateLessonDto, UpdateLessonDto, CreateLessonFileDto, LessonViewDto } from './lesson.dto';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class LessonsService {
    constructor(private prisma: PrismaService) { }

    private async getMentorId(userId: number) {
        const mentor = await this.prisma.mentorProfile.findUnique({ where: { userId } });
        return mentor?.id;
    }

    async create(userId: number, dto: CreateLessonDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) throw new NotFoundException('User topilmadi');

        const section = await this.prisma.sectionLesson.findUnique({ where: { id: dto.sectionId }, include: { course: true } });
        if (!section) throw new NotFoundException('Bolim topilmadi');

        if (user.role !== UserRole.ADMIN) {
            const mentorId = await this.getMentorId(userId);
            if (section.course.mentorId !== mentorId) throw new ForbiddenException('Ruxsat yoq');
        }
        return this.prisma.lesson.create({ data: dto });
    }

    async findBySection(sectionId: number) {
        return this.prisma.lesson.findMany({
            where: { sectionId },
            include: { lessonFiles: true, homework: { select: { id: true, task: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(id: string, userId: number) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id },
            include: {
                lessonFiles: true,
                homework: true,
                lessonViews: { where: { userId } },
                section: { include: { course: true } },
            },
        });
        if (!lesson) throw new NotFoundException('Dars topilmadi');
        return lesson;
    }

    async update(userId: number, id: string, dto: UpdateLessonDto) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id }, include: { section: { include: { course: true } } },
        });
        if (!lesson) throw new NotFoundException('Dars topilmadi');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) throw new NotFoundException('User topilmadi');

        if (user.role !== UserRole.ADMIN) {
            const mentorId = await this.getMentorId(userId);
            if (lesson.section.course.mentorId !== mentorId) throw new ForbiddenException('Ruxsat yoq');
        }
        return this.prisma.lesson.update({ where: { id }, data: dto });
    }

    async remove(userId: number, id: string) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id }, include: { section: { include: { course: true } } },
        });
        if (!lesson) throw new NotFoundException('Dars topilmadi');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) throw new NotFoundException('User topilmadi');

        if (user.role !== UserRole.ADMIN) {
            const mentorId = await this.getMentorId(userId);
            if (lesson.section.course.mentorId !== mentorId) throw new ForbiddenException('Ruxsat yoq');
        }
        await this.prisma.lesson.delete({ where: { id } });
        return { message: 'Dars ochirildi' };
    }

    async markView(userId: number, dto: LessonViewDto) {
        return this.prisma.lessonView.upsert({
            where: { lessonId_userId: { lessonId: dto.lessonId, userId } },
            update: { view: dto.view },
            create: { lessonId: dto.lessonId, userId, view: dto.view },
        });
    }

    async addFile(userId: number, dto: CreateLessonFileDto) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: dto.lessonId }, include: { section: { include: { course: true } } },
        });
        if (!lesson) throw new NotFoundException('Dars topilmadi');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) throw new NotFoundException('User topilmadi');

        if (user.role !== UserRole.ADMIN) {
            const mentorId = await this.getMentorId(userId);
            if (lesson.section.course.mentorId !== mentorId) throw new ForbiddenException('Ruxsat yoq');
        }
        return this.prisma.lessonFile.create({ data: dto });
    }

    async removeFile(userId: number, fileId: number) {
        const file = await this.prisma.lessonFile.findUnique({
            where: { id: fileId }, include: { lesson: { include: { section: { include: { course: true } } } } },
        });
        if (!file) throw new NotFoundException('Fayl topilmadi');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) throw new NotFoundException('User topilmadi');

        if (user.role !== UserRole.ADMIN) {
            const mentorId = await this.getMentorId(userId);
            if (file.lesson.section.course.mentorId !== mentorId) throw new ForbiddenException('Ruxsat yoq');
        }
        await this.prisma.lessonFile.delete({ where: { id: fileId } });
        return { message: 'Fayl ochirildi' };
    }

    async getProgress(userId: number, courseId: number) {
        const total = await this.prisma.lesson.count({ where: { section: { courseId } } });
        const viewed = await this.prisma.lessonView.count({
            where: { userId, view: true, lesson: { section: { courseId } } },
        });
        return { total, viewed, percentage: total ? Math.round((viewed / total) * 100) : 0 };
    }
}
