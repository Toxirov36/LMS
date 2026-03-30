import {
  IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, PaidVia } from '@prisma/client';

export class PurchaseCourseDto {
  @ApiProperty()
  @IsInt()
  courseId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @ApiProperty({ enum: PaidVia })
  @IsEnum(PaidVia)
  paidVia: PaidVia;
}

export class CreatePurchaseAdminDto {
  @ApiProperty()
  @IsInt()
  courseId: number;

  @ApiProperty()
  @IsInt()
  userId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @ApiProperty({ enum: PaidVia })
  @IsEnum(PaidVia)
  paidVia: PaidVia;
}

export class PurchasedCourseFilterDto {
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  offset?: number = 0;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 8;

  @ApiPropertyOptional({ example: 'search' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  category_id?: number;

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;
}