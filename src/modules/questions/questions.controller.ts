import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, CreateAnswerDto, UpdateQuestionDto } from './question.dto';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';

@ApiTags('Questions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Post()
  @ApiOperation({ summary: 'Savol yuborish' })
  create(@Body() dto: CreateQuestionDto, @CurrentUser('id') userId: number) {
    return this.questionsService.create(dto, userId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Kurs savollari' })
  findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.questionsService.findByCourse(courseId, userId, role);
  }

  @Get('unread')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT)
  @ApiOperation({ summary: 'O\'qilmagan savollar (Mentor/Admin/Assistant)' })
  findUnread(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.questionsService.findUnread(userId, role);
  }

  @Patch(':id/read')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT)
  @ApiOperation({ summary: 'Savolni o\'qildi deb belgilash' })
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.questionsService.markRead(id, userId, role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Savolni tahrirlash' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.questionsService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Savolni o\'chirish' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.questionsService.remove(id, userId, role);
  }

  @Post(':questionId/answer')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT)
  @ApiOperation({ summary: 'Savolga javob berish (Mentor/Admin/Assistant)' })
  answer(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: CreateAnswerDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.questionsService.answer(questionId, dto, userId, role);
  }

  @Delete('answers/:answerId')
  @ApiOperation({ summary: 'Javobni o\'chirish' })
  removeAnswer(
    @Param('answerId', ParseIntPipe) answerId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.questionsService.removeAnswer(answerId, userId, role);
  }
}
