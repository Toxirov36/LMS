import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { UserRole } from '@prisma/client';
import { QuestionsService } from './questions.service';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';

const fileStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'files'),
  filename: (_req, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`),
});

@ApiTags('Questions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) { }

  @Get('mine')
  @UseGuards(RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Mening savollarim - STUDENT' })
  getMyQuestions(@CurrentUser('id') userId: number) {
    return this.questionsService.getMyQuestions(userId);
  }

  @Get('course/:courseId')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT)
  @ApiOperation({ summary: 'Kurs savollari - MENTOR, ADMIN, ASSISTANT' })
  findByCourse(
    @Param('courseId') courseId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.questionsService.findByCourse(courseId, userId, role);
  }

  @Get('single/:id')
  @ApiOperation({ summary: 'Savol batafsil - MENTOR, ADMIN, ASSISTANT, STUDENT' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.findOne(id);
  }

  @Post('read/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT)
  @ApiOperation({ summary: 'Savolni oqildi belgilash - MENTOR, ADMIN, ASSISTANT' })
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.questionsService.markRead(id, userId, role);
  }

  @Post('create/:courseId')
  @UseGuards(RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Savol yuborish - STUDENT' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['text'],
      properties: {
        text: { type: 'string', example: 'Text yozing' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: fileStorage, limits: { fileSize: 20 * 1024 * 1024 } }))
  create(
    @Param('courseId') courseId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser('id') userId: number,
  ) {
    const dto = {
      courseId,
      text: body.text,
      file: file ? `/uploads/files/${file.filename}` : undefined,
    };
    return this.questionsService.create(dto, userId);
  }

  @Patch('update/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Savolni tahrirlash - STUDENT' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: fileStorage }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    const dto: any = {};
    if (body.text) dto.text = body.text;
    if (file) dto.file = `/uploads/files/${file.filename}`;
    return this.questionsService.update(id, dto, userId, role);
  }

  @Post('answer/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ASSISTANT)
  @ApiOperation({ summary: 'Savolga javob berish - MENTOR, ASSISTANT' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['text'],
      properties: {
        text: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: fileStorage }))
  answer(
    @Param('id', ParseIntPipe) questionId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    const dto = {
      text: body.text,
      file: file ? `/uploads/files/${file.filename}` : undefined,
    };
    return this.questionsService.answer(questionId, dto, userId, role);
  }

  @Patch('answer/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Javobni tahrirlash - MENTOR, ASSISTANT, ADMIN' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: fileStorage }))
  updateAnswer(
    @Param('id', ParseIntPipe) answerId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    const dto: any = {};
    if (body.text) dto.text = body.text;
    if (file) dto.file = `/uploads/files/${file.filename}`;
    return this.questionsService.updateAnswer(answerId, dto, userId, role);
  }

  @Delete('answer/delete/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Javobni o\'chirish - MENTOR, ASSISTANT, ADMIN' })
  removeAnswer(
    @Param('id', ParseIntPipe) answerId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.questionsService.removeAnswer(answerId, userId, role);
  }

  @Delete('delete/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Savolni o\'chirish - STUDENT' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.questionsService.remove(id, userId, role);
  }
}