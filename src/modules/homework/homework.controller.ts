import {
    Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { HomeworkService } from './homework.service';
import {
    CreateHomeworkDto, UpdateHomeworkDto, SubmitHomeworkDto, ReviewHomeworkDto,
} from './homework.dto';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';

@ApiTags('Homework')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('homework')
export class HomeworkController {
    constructor(private homeworkService: HomeworkService) { }

    @Post()
    @UseGuards(RoleGuard)
    @Roles(UserRole.MENTOR, UserRole.ADMIN)
    @ApiOperation({ summary: 'Uy vazifasi yaratish (Mentor/Admin)' })
    create(
        @Body() dto: CreateHomeworkDto,
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: UserRole,
    ) {
        return this.homeworkService.create(dto, userId, role);
    }

    @Get('lesson/:lessonId')
    @ApiOperation({ summary: 'Darsning uy vazifasi' })
    findByLesson(@Param('lessonId') lessonId: string) {
        return this.homeworkService.findByLesson(lessonId);
    }

    @Get('my-submissions')
    @ApiOperation({ summary: 'Mening topshiriqlarim' })
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
    @ApiOperation({ summary: 'Uy vazifasini tahrirlash' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateHomeworkDto,
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: UserRole,
    ) {
        return this.homeworkService.update(id, dto, userId, role);
    }

    @Delete(':id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.MENTOR, UserRole.ADMIN)
    @ApiOperation({ summary: 'Uy vazifasini o\'chirish' })
    remove(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: UserRole,
    ) {
        return this.homeworkService.remove(id, userId, role);
    }

    @Post('submit')
    @ApiOperation({ summary: 'Uy vazifasini topshirish (Student)' })
    submit(@Body() dto: SubmitHomeworkDto, @CurrentUser('id') userId: number) {
        return this.homeworkService.submit(dto, userId);
    }

    @Patch('submissions/:submissionId/review')
    @UseGuards(RoleGuard)
    @Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT)
    @ApiOperation({ summary: 'Topshiriqni baholash (Mentor/Admin/Assistant)' })
    review(
        @Param('submissionId', ParseIntPipe) submissionId: number,
        @Body() dto: ReviewHomeworkDto,
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: UserRole,
    ) {
        return this.homeworkService.review(submissionId, dto, userId, role);
    }
}
