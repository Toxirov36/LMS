import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    image?: string;
}

export class UpdateMentorProfileDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    about?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    job?: string;

    @ApiProperty()
    @IsOptional()
    @IsInt()
    @Min(0)
    experience?: number;

    @ApiProperty()
    @IsOptional()
    @IsString()
    telegram?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    instagram?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    linkedin?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    facebook?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    github?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    website?: string;
}

export class UpdateRoleDto {
    @ApiProperty({ enum: UserRole })
    @IsEnum(UserRole)
    role: UserRole;
}
