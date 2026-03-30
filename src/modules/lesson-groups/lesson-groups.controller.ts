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
  @ApiOperation({ summary: 'Kursning barcha bolimlari (public)' })
  findAllByCourse(@Param('course_id', ParseIntPipe) courseId: number) {
    return this.lessonGroupService.findAllByCourse(courseId);
  }

  @Get('mine-all/:course_id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mening kursim bolimlari (progress bilan) - STUDENT' })
  findAllForStudent(
    @Param('course_id', ParseIntPipe) courseId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.lessonGroupService.findAllByCourseForStudent(courseId, userId);
  }

  @Get('detail/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bolim batafsil malumoti' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lessonGroupService.findOne(id);
  }
  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bolim yaratish - MENTOR, ADMIN' })
  create(
    @Body() dto: CreateLessonGroupDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.lessonGroupService.create(dto, userId, role);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bolimni tahrirlash - MENTOR, ADMIN' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonGroupDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.lessonGroupService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bolimni ochirish - MENTOR, ADMIN' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.lessonGroupService.remove(id, userId, role);
  }
}