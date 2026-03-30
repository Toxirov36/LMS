import {
  Controller, Get, Post, Put, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { LessonGroupService } from './lesson-groups.service';
import { CreateLessonGroupDto, UpdateLessonGroupDto } from './lessonGroup.dto';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';

@ApiTags('Lesson Groups')
@Controller('lesson-group')
export class LessonGroupController {
  constructor(private lessonGroupService: LessonGroupService) {}

  @Get('all/:course_id')
  @ApiOperation({ summary: 'Kursning barcha bo\'limlari (public)' })
  findAllByCourse(@Param('course_id', ParseIntPipe) courseId: number) {
    return this.lessonGroupService.findAllByCourse(courseId);
  }

  // GET /api/lesson-group/mine-all/:course_id  — STUDENT
  @Get('mine-all/:course_id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mening kursim bo\'limlari (progress bilan) - STUDENT' })
  findAllForStudent(
    @Param('course_id', ParseIntPipe) courseId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.lessonGroupService.findAllByCourseForStudent(courseId, userId);
  }

  // GET /api/lesson-group/detail/:id  — auth required
  @Get('detail/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bo\'lim batafsil ma\'lumoti' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lessonGroupService.findOne(id);
  }

  // POST /api/lesson-group  — MENTOR, ADMIN
  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bo\'lim yaratish - MENTOR, ADMIN' })
  create(
    @Body() dto: CreateLessonGroupDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.lessonGroupService.create(dto, userId, role);
  }

  // PUT /api/lesson-group/:id  — MENTOR, ADMIN
  @Put(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bo\'limni tahrirlash - MENTOR, ADMIN' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonGroupDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.lessonGroupService.update(id, dto, userId, role);
  }

  // DELETE /api/lesson-group/:id  — MENTOR, ADMIN
  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bo\'limni o\'chirish - MENTOR, ADMIN' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.lessonGroupService.remove(id, userId, role);
  }
}