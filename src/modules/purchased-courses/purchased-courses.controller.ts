import { Controller, Get, Post, Body, Param, UseGuards} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PurchasedCoursesService } from './purchased-courses.service';
import { PurchaseCourseDto, CreatePurchaseAdminDto} from './purchasedCourse.dto';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';

@ApiTags('Purchased Courses')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('purchased-courses')
export class PurchasedCoursesController {
  constructor(private purchasedCoursesService: PurchasedCoursesService) {}

  @Get('mine')
  @UseGuards(RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Mening sotib olgan kurslarim - STUDENT' })
  getMyPurchasedCourses(
    @CurrentUser('id') userId: number,
  ) {
    return this.purchasedCoursesService.getMyPurchasedCourses(userId);
  }

  @Get('mine/:course_id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Sotib olingan kurs batafsil - STUDENT' })
  getMyPurchasedCourse(
    @CurrentUser('id') userId: number,
    @Param('course_id') courseId: number,
  ) {
    return this.purchasedCoursesService.getMyPurchasedCourse(userId, courseId);
  }

  @Post('purchase')
  @UseGuards(RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Kurs sotib olish - STUDENT' })
  purchaseCourse(
    @Body() dto: PurchaseCourseDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.purchasedCoursesService.purchaseCourse(dto, userId);
  }

  @Get('course/:id/students')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Kurs oquvchilari - MENTOR, ADMIN' })
  getCourseStudents(
    @Param('id') courseId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.purchasedCoursesService.getCourseStudents(courseId, userId, role);
  }

  @Post('create')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Kurs qolda biriktirish (tolov) - ADMIN' })
  createPurchaseAdmin(@Body() dto: CreatePurchaseAdminDto) {
    return this.purchasedCoursesService.createPurchaseAdmin(dto);
  }
}