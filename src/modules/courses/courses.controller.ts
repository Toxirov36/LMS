import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, UseInterceptors, UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { UserRole } from '@prisma/client';
import { CoursesService } from './courses.service';
import { UpdateCourseMentorDto, AssignAssistantDto, UnassignAssistantDto } from './courses.dto';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';

const storage = (folder: string) =>
  diskStorage({
    destination: join(process.cwd(), 'uploads', folder),
    filename: (_req, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`),
  });

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha nashr etilgan kurslar' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('single/:id')
  @ApiOperation({ summary: 'Kurs qisqa ma\'lumoti (public)' })
  findSingle(@Param('id') id: number) {
    return this.coursesService.findSingle(id);
  }

  @Get('single-full/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR, UserRole.ASSISTANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kurs to\'liq ma\'lumoti - ADMIN, MENTOR, ASSISTANT' })
  findSingleFull(@Param('id') id: number) {
    return this.coursesService.findSingleFull(id);
  }

  @Get('all')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barcha kurslar - ADMIN' })
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
  getCourseAssistants(@Param('courseId') courseId: number) {
    return this.coursesService.getCourseAssistants(courseId);
  }

  @Post('create')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kurs yaratish - ADMIN, MENTOR' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'about', 'price', 'level', 'categoryId', 'banner'],
      properties: {
        name:        { type: 'string', example: 'NestJS ultimate course for absolute beginners' },
        about:       { type: 'string', example: 'Best nodeJS back-end course ever!' },
        price:       { type: 'number', example: 250000 },
        level:       { type: 'string', enum: ['BEGINNER','PRE_INTERMEDIATE','INTERMEDIATE','UPPER_INTERMEDIATE','ADVANCED'] },
        categoryId:  { type: 'number', example: 2 },
        banner:      { type: 'string', format: 'binary' },
        introVideo:  { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'banner', maxCount: 1 },
        { name: 'introVideo', maxCount: 1 },
      ],
      { storage: storage('images') },
    ),
  )
  create(
    @UploadedFiles() files: { banner?: Express.Multer.File[]; introVideo?: Express.Multer.File[] },
    @Body() body: any,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    const dto = {
      name:       body.name,
      about:      body.about,
      price:      Number(body.price),
      level:      body.level,
      categoryId: Number(body.categoryId),
      banner:     files.banner?.[0]
        ? `/uploads/images/${files.banner[0].filename}`
        : body.bannerUrl,
      introVideo: files.introVideo?.[0]
        ? `/uploads/images/${files.introVideo[0].filename}`
        : body.introVideoUrl ?? null,
    };
    return this.coursesService.create(dto as any, userId, role);
  }

  @Patch('update/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursni tahrirlash - ADMIN, MENTOR' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name:       { type: 'string' },
        about:      { type: 'string' },
        price:      { type: 'number' },
        level:      { type: 'string', enum: ['BEGINNER','PRE_INTERMEDIATE','INTERMEDIATE','UPPER_INTERMEDIATE','ADVANCED'] },
        categoryId: { type: 'number' },
        banner:     { type: 'string', format: 'binary' },
        introVideo: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'banner', maxCount: 1 },
        { name: 'introVideo', maxCount: 1 },
      ],
      { storage: storage('images') },
    ),
  )
  update(
    @Param('id') id: string,
    @UploadedFiles() files: { banner?: Express.Multer.File[]; introVideo?: Express.Multer.File[] },
    @Body() body: any,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    const dto: any = { ...body };
    if (body.price) dto.price = Number(body.price);
    if (body.categoryId) dto.categoryId = Number(body.categoryId);
    if (files.banner?.[0]) dto.banner = `/uploads/images/${files.banner[0].filename}`;
    if (files.introVideo?.[0]) dto.introVideo = `/uploads/images/${files.introVideo[0].filename}`;
    return this.coursesService.update(Number(id), dto, userId, role);
  }

@Post('publish/:id')
@UseGuards(AuthGuard, RoleGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@ApiOperation({ summary: 'Kursni nashr etish - ADMIN' })
publish(@Param('id', ParseIntPipe) id: number) {
  return this.coursesService.setPublished(id, true);
}
  @Post('unpublish/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursni yopish - ADMIN' })
  unpublish(@Param('id') id: number) {
    return this.coursesService.setPublished(id, false);
  }

  @Patch('update-mentor')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kurs mentorini almashtirish - ADMIN' })
  updateMentor(@Body() dto: UpdateCourseMentorDto) {
    return this.coursesService.updateMentor(dto);
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

  @Delete('delete/:id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursni o\'chirish - ADMIN, MENTOR' })
  remove(
    @Param('id') id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.coursesService.remove(id, userId, role);
  }
}