import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { CreateRatingDto } from './rating.dto';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRatingDto, userId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    const purchased = await this.prisma.purchasedCourse.findUnique({
      where: { courseId_userId: { courseId: dto.courseId, userId } },
    });
    if (!purchased) throw new ForbiddenException('Faqat kurs sotib olgan foydalanuvchilar baholashi mumkin');

    const exists = await this.prisma.rating.findFirst({
      where: { courseId: dto.courseId, userId },
    });
    if (exists) throw new ConflictException('Siz bu kursni allaqachon baholagansiz');

    return this.prisma.rating.create({ data: { ...dto, userId } });
  }

  async findByCourse(courseId: number) {
    const ratings = await this.prisma.rating.findMany({
      where: { courseId },
      include: { user: { select: { id: true, fullName: true, image: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avg = ratings.length
      ? ratings.reduce((s, r) => s + r.rate, 0) / ratings.length
      : 0;

    return {
      average: Math.round(avg * 10) / 10,
      total: ratings.length,
      ratings,
    };
  }

  async remove(id: number, userId: number, role: UserRole) {
    const rating = await this.prisma.rating.findUnique({ where: { id } });
    if (!rating) throw new NotFoundException('Baho topilmadi');
    if (role !== UserRole.ADMIN && rating.userId !== userId) {
      throw new ForbiddenException('Ruxsat yo\'q');
    }
    await this.prisma.rating.delete({ where: { id } });
    return { message: 'Baho o\'chirildi' };
  }
}
