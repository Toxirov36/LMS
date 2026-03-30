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
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { HomeworkSubmissionService } from './homework-submittions.service';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';
import { ReviewSubmissionDto, SubmitHomeworkDto } from './homework.sub.dto';

const fileStorage = diskStorage({
    destination: join(process.cwd(), 'uploads', 'files'),
    filename: (_req, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`),
});

@ApiTags('Homework Submissions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('homework-submissions')
export class HomeworkSubmissionController {
    constructor(private submissionService: HomeworkSubmissionService) { }

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
                text: { type: 'string', example: 'Mening yechimim...' },
                file: { type: 'string', format: 'binary' },
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
        const dto: SubmitHomeworkDto = {
            homeworkId: Number(body.homeworkId),
            text: body.text,
        };
        return this.submissionService.submit(dto, `/uploads/files/${uploadedFile.filename}`, userId);
    }

    @Get('my')
    @UseGuards(RoleGuard)
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Mening barcha topshiriqlarim - STUDENT' })
    mySubmissions(@CurrentUser('id') userId: number) {
        return this.submissionService.mySubmissions(userId);
    }

    @Get('my/:id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Mening topshirig\'im batafsil - STUDENT' })
    mySubmissionById(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('id') userId: number,
    ) {
        return this.submissionService.mySubmissionById(id, userId);
    }

    @Get(':homeworkId')
    @UseGuards(RoleGuard)
    @Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT)
    @ApiOperation({ summary: 'Vazifa topshiriqlari - MENTOR, ADMIN, ASSISTANT' })
    getByHomework(
        @Param('homeworkId', ParseIntPipe) homeworkId: number,
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: UserRole,
    ) {
        return this.submissionService.getByHomework(homeworkId, userId, role);
    }

    @Get('single/:id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT)
    @ApiOperation({ summary: 'Topshiriq batafsil - MENTOR, ADMIN, ASSISTANT' })
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: UserRole,
    ) {
        return this.submissionService.findOne(id, userId, role);
    }

    @Patch(':id/review')
    @UseGuards(RoleGuard)
    @Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT)
    @ApiOperation({ summary: 'Topshiriqni baholash - MENTOR, ADMIN, ASSISTANT' })
    review(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ReviewSubmissionDto,
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: UserRole,
    ) {
        return this.submissionService.review(id, dto, userId, role);
    }

    @Delete(':id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Topshiriqni o\'chirish (faqat PENDING) - STUDENT' })
    remove(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('id') userId: number,
    ) {
        return this.submissionService.remove(id, userId);
    }
}