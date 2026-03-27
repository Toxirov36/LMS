import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { LessonsService } from './lessons.service';
import { CreateLessonDto, UpdateLessonDto, CreateLessonFileDto, LessonViewDto } from './lesson.dto';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';

@ApiTags('Lessons')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Bolim darslari' })
  findBySection(@Param('sectionId', ParseIntPipe) sectionId: number) {
    return this.lessonsService.findBySection(sectionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta dars' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: number) {
    return this.lessonsService.findOne(id, userId);
  }

  @Get('progress/:courseId')
  @ApiOperation({ summary: 'Kurs progressi' })
  getProgress(@CurrentUser('id') userId: number, @Param('courseId') courseId: string) {
    return this.lessonsService.getProgress(userId, courseId);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Dars qoshish' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateLessonDto) {
    return this.lessonsService.create(userId, dto);
  }

  @Post('view')
  @ApiOperation({ summary: 'Darsni korildi deb belgilash' })
  markView(@CurrentUser('id') userId: number, @Body() dto: LessonViewDto) {
    return this.lessonsService.markView(userId, dto);
  }

  @Post('file')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Darsga fayl qoshish' })
  addFile(@CurrentUser('id') userId: number, @Body() dto: CreateLessonFileDto) {
    return this.lessonsService.addFile(userId, dto);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Darsni yangilash' })
  update(@CurrentUser('id') userId: number, @Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Darsni ochirish' })
  remove(@CurrentUser('id') userId: number, @Param('id') id: string) {
    return this.lessonsService.remove(userId, id);
  }

  @Delete('file/:fileId')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Fayl ochirish' })
  removeFile(@CurrentUser('id') userId: number, @Param('fileId', ParseIntPipe) fileId: number) {
    return this.lessonsService.removeFile(userId, fileId);
  }
}
