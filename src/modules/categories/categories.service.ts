import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    return this.prisma.courseCategory.create({ data: dto });
  }

  async findAll() {
    return this.prisma.courseCategory.findMany({
      include: { _count: { select: { courses: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const cat = await this.prisma.courseCategory.findUnique({
      where: { id },
      include: { courses: { where: { published: true } } },
    });
    if (!cat) throw new NotFoundException('Kategoriya topilmadi');
    return cat;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prisma.courseCategory.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.courseCategory.delete({ where: { id } });
    return { message: 'Kategoriya ochirildi' };
  }
}
