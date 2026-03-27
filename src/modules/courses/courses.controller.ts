import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, PurchaseCourseDto, AssignCourseDto, CourseFilterDto } from './courses.dto';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha chop etilgan kurslar' })
  findAll(@Query() filter: CourseFilterDto) {
    return this.coursesService.findAll(filter);
  }

  @Get('admin/all')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barcha kurslar - Admin' })
  findAllAdmin() {
    return this.coursesService.findAllAdmin();
  }

  @Get('my/mentor')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mentor kurslarim' })
  findMyMentorCourses(@CurrentUser('id') userId: number) {
    return this.coursesService.findMyMentorCourses(userId);
  }

  @Get('my/purchased')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sotib olingan kurslarim' })
  findMyPurchasedCourses(@CurrentUser('id') userId: number) {
    return this.coursesService.findMyPurchasedCourses(userId);
  }

  @Get('my/assigned')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Biriktirilgan kurslarim' })
  findMyAssignedCourses(@CurrentUser('id') userId: number) {
    return this.coursesService.findMyAssignedCourses(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta kurs' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findOne(id);
  }

  @Get(':id/stats')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kurs statistikasi' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.getCourseStats(id);
  }

  @Get(':id/access')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursga kirish huquqini tekshirish' })
  checkAccess(@CurrentUser('id') userId: number, @Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.checkAccess(userId, id);
  }

  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kurs yaratish (Mentor/Admin)' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(userId, dto);
  }

  @Post('purchase')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kurs sotib olish' })
  purchase(@CurrentUser('id') userId: number, @Body() dto: PurchaseCourseDto) {
    return this.coursesService.purchaseCourse(userId, dto);
  }

  @Post('assign')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ASSISTANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kurs biriktirish (Admin/Assistant)' })
  assign(@CurrentUser('id') adminId: number, @Body() dto: AssignCourseDto) {
    return this.coursesService.assignCourse(adminId, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursni yangilash' })
  update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(userId, id, dto);
  }

  @Patch(':id/publish')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursni chop etish / yashirish' })
  publish(
    @CurrentUser('id') userId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('published') published: boolean,
  ) {
    return this.coursesService.publish(userId, id, published);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursni ochirish' })
  remove(@CurrentUser('id') userId: number, @Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.remove(userId, id);
  }
}
