import {
  Controller, Get, Post, Patch, Put, Delete,
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
import { LessonsService } from './lessons.service';
import { CreateLessonFileDto } from './lesson.dto';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';

const videoStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'videos'),
  filename: (_req, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`),
});

const fileStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'files'),
  filename: (_req, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`),
});

@ApiTags('Lessons')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Get('single/:lessonId')
  @UseGuards(RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Dars (student uchun) - STUDENT' })
  findSingle(
    @Param('lessonId') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.lessonsService.findOne(id, userId);
  }

  @Put('view/:lessonId')
  @UseGuards(RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Darsni ko\'rildi deb belgilash - STUDENT' })
  markView(
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.lessonsService.markView(userId, { lessonId, view: true });
  }

  @Get('detail/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiOperation({ summary: 'Dars batafsil - ADMIN, MENTOR' })
  findDetail(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.lessonsService.findOne(id, userId);
  }

  @Get('section/:sectionId')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiOperation({ summary: 'Bo\'limdagi barcha darslar - ADMIN, MENTOR' })
  findBySection(@Param('sectionId', ParseIntPipe) sectionId: number) {
    return this.lessonsService.findBySection(sectionId);
  }

  @Get('progress/:courseId')
  @UseGuards(RoleGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Kurs bo\'yicha progress - STUDENT' })
  getProgress(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.lessonsService.getProgress(userId, courseId);
  }

  @Post('create')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiOperation({ summary: 'Dars yaratish - ADMIN, MENTOR' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'about', 'groupId'],
      properties: {
        name:     { type: 'string', example: 'Introduction' },
        about:    { type: 'string', example: 'About this lesson' },
        groupId:  { type: 'string', description: 'SectionLesson ID' },
        video:    { type: 'string', format: 'binary', description: 'Video fayl (ixtiyoriy)' },
        videoUrl: { type: 'string', description: 'Video URL (fayl o\'rniga)' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('video', {
      storage: videoStorage,
      limits: { fileSize: 500 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(mp4|mpeg|webm|avi|mov|mkv)$/)) {
          return cb(new BadRequestException('Faqat video fayl ruxsat etilgan'), false);
        }
        cb(null, true);
      },
    }),
  )
  create(
    @UploadedFile() videoFile: Express.Multer.File,
    @Body() body: any,
    @CurrentUser('id') userId: number,
  ) {
    if (!videoFile && !body.videoUrl) {
      throw new BadRequestException('video fayl yoki videoUrl kiritilishi shart');
    }
    const dto = {
      name:      body.name,
      about:     body.about,
      sectionId: Number(body.groupId),
      video:     videoFile
        ? `/uploads/videos/${videoFile.filename}`
        : body.videoUrl,
    };
    return this.lessonsService.create(userId, dto as any);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiOperation({ summary: 'Darsni tahrirlash - ADMIN, MENTOR' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name:     { type: 'string' },
        about:    { type: 'string' },
        video:    { type: 'string', format: 'binary' },
        videoUrl: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('video', {
      storage: videoStorage,
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  update(
    @Param('id') id: string,
    @UploadedFile() videoFile: Express.Multer.File,
    @Body() body: any,
    @CurrentUser('id') userId: number,
  ) {
    const dto: any = {};
    if (body.name)  dto.name  = body.name;
    if (body.about) dto.about = body.about;
    if (videoFile)           dto.video = `/uploads/videos/${videoFile.filename}`;
    else if (body.videoUrl)  dto.video = body.videoUrl;
    return this.lessonsService.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiOperation({ summary: 'Darsni o\'chirish - ADMIN, MENTOR' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.lessonsService.remove(userId, id);
  }

  @Post('files/add')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiOperation({ summary: 'Darsga fayl qo\'shish - ADMIN, MENTOR' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['lessonId', 'file'],
      properties: {
        lessonId: { type: 'string' },
        note:     { type: 'string' },
        file:     { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: fileStorage,
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  addFile(
    @UploadedFile() uploadedFile: Express.Multer.File,
    @Body() body: any,
    @CurrentUser('id') userId: number,
  ) {
    if (!uploadedFile) throw new BadRequestException('Fayl tanlanmadi');
    const dto: CreateLessonFileDto = {
      lessonId: body.lessonId,
      note:     body.note,
      file:     `/uploads/files/${uploadedFile.filename}`,
    };
    return this.lessonsService.addFile(userId, dto);
  }

  @Delete('files/:fileId')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiOperation({ summary: 'Darsdan fayl o\'chirish - ADMIN, MENTOR' })
  removeFile(
    @Param('fileId', ParseIntPipe) fileId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.lessonsService.removeFile(userId, fileId);
  }
}