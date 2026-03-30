import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SectionsService } from './sections.service';
import { CreateSectionDto, UpdateSectionDto } from './section.dto';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';

@ApiTags('Sections')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('sections')
export class SectionsController {
  constructor(private sectionsService: SectionsService) {}

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Kurs bolimlari' })
  findByCourse(@Param('courseId') courseId: string) {
    return this.sectionsService.findByCourse(+courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta bolim' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sectionsService.findOne(id);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bolim qoshish' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateSectionDto) {
    return this.sectionsService.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bolimni yangilash' })
  update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionsService.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bolimni ochirish' })
  remove(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.sectionsService.remove(userId, id);
  }
}
