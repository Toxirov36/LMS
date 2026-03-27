import { Controller, Get, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/core/guards/jwt.guard';
import { CurrentUser, RoleGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/role.decorator';
import { UpdateMentorProfileDto, UpdateRoleDto, UpdateUserDto } from './user.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    @UseGuards(RoleGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Barcha foydalanuvchilar (Admin)' })
    @ApiQuery({ name: 'role', enum: UserRole, required: false })
    findAll(@Query('role') role?: UserRole) {
        return this.usersService.findAll(role);
    }

    @Get('last-activity')
    @ApiOperation({ summary: 'Oxirgi faollik' })
    getLastActivity(@CurrentUser('id') userId: number) {
        return this.usersService.getLastActivity(userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Foydalanuvchi profili' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.findOne(id);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Profilni yangilash' })
    updateProfile(@CurrentUser('id') userId: number, @Body() dto: UpdateUserDto) {
        return this.usersService.updateProfile(userId, dto);
    }

    @Patch('mentor-profile')
    @ApiOperation({ summary: 'Mentor profilini yangilash' })
    updateMentorProfile(@CurrentUser('id') userId: number, @Body() dto: UpdateMentorProfileDto) {
        return this.usersService.updateMentorProfile(userId, dto);
    }

    @Patch(':id/role')
    @UseGuards(RoleGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Rol berish (Admin)' })
    updateRole(
        @CurrentUser('id') adminId: number,
        @Param('id', ParseIntPipe) targetId: number,
        @Body() dto: UpdateRoleDto,
    ) {
        return this.usersService.updateRole(adminId, targetId, dto);
    }

    @Delete(':id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Foydalanuvchini ochirish (Admin)' })
    deleteUser(@CurrentUser('id') adminId: number, @Param('id', ParseIntPipe) targetId: number) {
        return this.usersService.deleteUser(adminId, targetId);
    }
}
