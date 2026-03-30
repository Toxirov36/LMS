import {
    Controller, Post, UseGuards, UseInterceptors,
    UploadedFile, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { v4 as uuid } from 'uuid';

const storage = diskStorage({
    destination: join(process.cwd(), 'uploads'),
    filename: (_req, file, cb) => {
        const ext = extname(file.originalname);
        cb(null, `${uuid()}${ext}`);
    },
});

const imageFilter = (_req: any, file: Express.Multer.File, cb: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Faqat rasm fayllari ruxsat etilgan'), false);
    }
    cb(null, true);
};

const videoFilter = (_req: any, file: Express.Multer.File, cb: any) => {
    if (!file.mimetype.match(/\/(mp4|mpeg|webm|avi|mov)$/)) {
        return cb(new BadRequestException('Faqat video fayllari ruxsat etilgan'), false);
    }
    cb(null, true);
};

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('upload')
export class UploadController {
    // @Post('image')
    // @UseInterceptors(FileInterceptor('file', { storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
    // @ApiConsumes('multipart/form-data')
    // @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    // @ApiOperation({ summary: 'Rasm yuklash (max 5MB)' })
    // uploadImage(@UploadedFile() file: Express.Multer.File) {
    //     if (!file) throw new BadRequestException('Fayl tanlanmadi');
    //     return { url: `/uploads/${file.filename}`, filename: file.filename };
    // }

    // @Post('video')
    // @UseInterceptors(FileInterceptor('file', { storage, fileFilter: videoFilter, limits: { fileSize: 500 * 1024 * 1024 } }))
    // @ApiConsumes('multipart/form-data')
    // @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    // @ApiOperation({ summary: 'Video yuklash (max 500MB)' })
    // uploadVideo(@UploadedFile() file: Express.Multer.File) {
    //     if (!file) throw new BadRequestException('Fayl tanlanmadi');
    //     return { url: `/uploads/${file.filename}`, filename: file.filename };
    // }

    // @Post('file')
    // @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 20 * 1024 * 1024 } }))
    // @ApiConsumes('multipart/form-data')
    // @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    // @ApiOperation({ summary: 'Fayl yuklash (max 20MB)' })
    // uploadFile(@UploadedFile() file: Express.Multer.File) {
    //     if (!file) throw new BadRequestException('Fayl tanlanmadi');
    //     return { url: `/uploads/${file.filename}`, filename: file.filename };
    // }

    // @Post('files')
    // @UseInterceptors(FilesInterceptor('files', 10, { storage, limits: { fileSize: 20 * 1024 * 1024 } }))
    // @ApiConsumes('multipart/form-data')
    // @ApiBody({ schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } })
    // @ApiOperation({ summary: 'Bir necha fayl yuklash (max 10 ta)' })
    // uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    //     if (!files?.length) throw new BadRequestException('Fayllar tanlanmadi');
    //     return files.map((f) => ({ url: `/uploads/${f.filename}`, filename: f.filename }));
    // }

}