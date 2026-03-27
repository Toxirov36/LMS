import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, PaidVia } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  about: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  banner: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  introVideo?: string;

  @ApiProperty({ enum: CourseLevel })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  categoryId: number;
}

export class UpdateCourseDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  about?: string;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  banner?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  introVideo?: string;

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional() @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  categoryId?: number;
}

export class PurchaseCourseDto {
  @ApiProperty()
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  amount?: number;

  @ApiProperty({ enum: PaidVia })
  @IsEnum(PaidVia)
  paidVia: PaidVia;
}

export class AssignCourseDto {
  @ApiProperty()
  @IsUUID()
  courseId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  userId: number;
}

export class CourseFilterDto {
  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional() @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  search?: string;
}
