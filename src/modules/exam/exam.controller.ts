import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ExamService } from './exam.service';
import { CreateExamDto, UpdateExamDto, SubmitExamDto } from './exam.dto';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { Roles } from 'src/core/decorators/role.decorator';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';

@ApiTags('Exam')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('exam')
export class ExamController {
  constructor(private examService: ExamService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Savol yaratish (Mentor/Admin)' })
  create(
    @Body() dto: CreateExamDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.examService.create(dto, userId, role);
  }

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Bo\'limdagi savollar' })
  findBySection(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.examService.findBySection(sectionId, userId, role);
  }

  @Get('my-results')
  @ApiOperation({ summary: 'Mening imtihon natijalarim' })
  getMyResults(@CurrentUser('id') userId: number) {
    return this.examService.getMyResults(userId);
  }

  @Get('section/:sectionId/results')
  @ApiOperation({ summary: 'Bo\'lim imtihon natijalari' })
  getSectionResults(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.examService.getSectionResults(sectionId, userId, role);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Imtihon topshirish (Student)' })
  submitExam(@Body() dto: SubmitExamDto, @CurrentUser('id') userId: number) {
    return this.examService.submitExam(dto, userId);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Savolni tahrirlash' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.examService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Savolni o\'chirish' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.examService.remove(id, userId, role);
  }
}
