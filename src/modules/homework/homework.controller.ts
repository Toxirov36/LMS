import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { UserRole } from '@prisma/client';
import { HomeworkService } from './homework.service';
import {
  CreateHomeworkDto, UpdateHomeworkDto, ReviewHomeworkDto,
} from './homework.dto';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';

const fileStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'files'),
  filename: (_req, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`),
});

@ApiTags('Homework')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('homework')
export class HomeworkController {
  constructor(private homeworkService: HomeworkService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Uy vazifasi yaratish - MENTOR, ADMIN' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['task', 'lessonId'],
      properties: {
        task:     { type: 'string', example: 'Vazifani bajaring' },
        lessonId: { type: 'string' },
        file:     { type: 'string', format: 'binary', description: 'Ixtiyoriy fayl' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: fileStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
  }))
  create(
    @UploadedFile() uploadedFile: Express.Multer.File,
    @Body() body: any,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    const dto: CreateHomeworkDto = {
      task:     body.task,
      lessonId: body.lessonId,
      file:     uploadedFile ? `/uploads/files/${uploadedFile.filename}` : undefined,
    };
    return this.homeworkService.create(dto, userId, role);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Darsning uy vazifasi' })
  findByLesson(@Param('lessonId') lessonId: string) {
    return this.homeworkService.findByLesson(lessonId);
  }

  @Get('my-submissions')
  @UseGuards(RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Mening topshiriqlarim - STUDENT' })
  mySubmissions(@CurrentUser('id') userId: number) {
    return this.homeworkService.mySubmissions(userId);
  }

  @Get(':homeworkId/submissions')
  @ApiOperation({ summary: 'Uy vazifasi topshiriqlari' })
  getSubmissions(
    @Param('homeworkId', ParseIntPipe) homeworkId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.homeworkService.getSubmissions(homeworkId, userId, role);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Uy vazifasini tahrirlash - MENTOR, ADMIN' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        task: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: fileStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
  }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() uploadedFile: Express.Multer.File,
    @Body() body: any,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    const dto: UpdateHomeworkDto = {};
    if (body.task) dto.task = body.task;
    if (uploadedFile) dto.file = `/uploads/files/${uploadedFile.filename}`;
    return this.homeworkService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Uy vazifasini o\'chirish - MENTOR, ADMIN' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.homeworkService.remove(id, userId, role);
  }

  @Post('submit')
  @UseGuards(RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Uy vazifasini topshirish - STUDENT' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['homeworkId', 'file'],
      properties: {
        homeworkId: { type: 'number', example: 1 },
        text:       { type: 'string', example: 'Mening yechimim...' },
        file:       { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: fileStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
  }))
  submit(
    @UploadedFile() uploadedFile: Express.Multer.File,
    @Body() body: any,
    @CurrentUser('id') userId: number,
  ) {
    if (!uploadedFile) throw new BadRequestException('Fayl yuklanishi shart');
    const dto = {
      homeworkId: Number(body.homeworkId),
      text:       body.text,
      file:       `/uploads/files/${uploadedFile.filename}`,
    };
    return this.homeworkService.submit(dto, userId);
  }

  @Patch('submissions/:submissionId/review')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT)
  @ApiOperation({ summary: 'Topshiriqni baholash - MENTOR, ADMIN, ASSISTANT' })
  review(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() dto: ReviewHomeworkDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.homeworkService.review(submissionId, dto, userId, role);
  }
}