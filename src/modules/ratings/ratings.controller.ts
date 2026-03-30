import {
  Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './rating.dto';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser } from 'src/core/guards/roles.guard';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kursga baho qo\'yish' })
  create(@Body() dto: CreateRatingDto, @CurrentUser('id') userId: number) {
    return this.ratingsService.create(dto, userId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Kurs baholari' })
  findByCourse(@Param('courseId') courseId: string) {
    return this.ratingsService.findByCourse(+courseId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bahoni o\'chirish' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.ratingsService.remove(id, userId, role);
  }
}
