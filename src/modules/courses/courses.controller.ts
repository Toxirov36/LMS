import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  AssignAssistantDto,
  UnassignAssistantDto,
  UpdateCourseMentorDto,
} from './courses.dto';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { Roles } from 'src/core/decorators/role.decorator';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  // ─── PUBLIC ───────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Barcha nashr etilgan kurslar' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('single/:id')
  @ApiOperation({ summary: 'Kurs haqida qisqa ma\'lumot (public)' })
  findSingle(@Param('id') id: string) {
    return this.coursesService.findSingle(+id);
  }

  // ─── AUTH REQUIRED ────────────────────────────────────────
  @Get('single-full/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR, UserRole.ASSISTANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kurs to\'liq ma\'lumoti - ADMIN, MENTOR, ASSISTANT' })
  findSingleFull(@Param('id') id: string) {
    return this.coursesService.findSingleFull(+id);
  }

  @Get('all')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barcha kurslar (nashr etilmagan ham) - ADMIN' })
  findAllAdmin() {
    return this.coursesService.findAllAdmin();
  }

  @Get('my')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mening kurslarim - MENTOR, ADMIN' })
  findMyCourses(@CurrentUser('id') userId: number) {
    return this.coursesService.findMyCourses(userId);
  }

  @Get('mentor/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mentor kurslari - ADMIN' })
  findMentorCourses(@Param('id') mentorId: string) {
    return this.coursesService.findMentorCourses(Number(mentorId));
  }

  @Get('my/assigned')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ASSISTANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menga biriktirilgan kurslar - ASSISTANT' })
  findMyAssigned(@CurrentUser('id') userId: number) {
    return this.coursesService.findAssistantCourses(userId);
  }

  @Get(':courseId/assistants')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kurs assistentlari - MENTOR, ADMIN' })
  getCourseAssistants(@Param('courseId') courseId: string) {
    return this.coursesService.getCourseAssistants(+courseId);
  }

  @Post('assign-assistant')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursga assistant biriktirish - MENTOR, ADMIN' })
  assignAssistant(
    @Body() dto: AssignAssistantDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.coursesService.assignAssistant(dto, userId, role);
  }

  @Post('unassign-assistant')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursdan assistant olib tashlash - MENTOR, ADMIN' })
  unassignAssistant(
    @Body() dto: UnassignAssistantDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.coursesService.unassignAssistant(dto, userId, role);
  }

  @Post('create')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kurs yaratish - ADMIN, MENTOR' })
  create(
    @Body() dto: CreateCourseDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.coursesService.create(dto, userId, role);
  }

  @Patch('update/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursni tahrirlash - ADMIN, MENTOR' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.coursesService.update(+id, dto, userId, role);
  }

  @Post('publish/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursni nashr etish - ADMIN' })
  publish(@Param('id') id: string) {
    return this.coursesService.setPublished(+id, true);
  }

  @Post('unpublish/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursni yopish - ADMIN' })
  unpublish(@Param('id') id: string) {
    return this.coursesService.setPublished(+id, false);
  }

  @Patch('update-mentor')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kurs mentorini almashtirish - ADMIN' })
  updateMentor(@Body() dto: UpdateCourseMentorDto) {
    return this.coursesService.updateMentor(dto);
  }

  @Delete('delete/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursni o\'chirish - ADMIN, MENTOR' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.coursesService.remove(+id, userId, role);
  }
}