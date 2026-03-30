import {
  IsString, IsNotEmpty, IsNumber, IsEnum,
  IsOptional, IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel } from '@prisma/client';

export class CreateCourseDto {
  @ApiProperty()
  @IsString() 
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString() 
  @IsNotEmpty()
  about: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  price: number; 

  @ApiProperty()
  @IsString() 
  @IsNotEmpty()
  banner: string;

  @ApiPropertyOptional()
  @IsOptional() 
  @IsString()
  introVideo?: string;

  @ApiProperty({ enum: CourseLevel })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @ApiProperty()
  @Type(() => Number) @IsNumber()
  categoryId: number;
}

export class UpdateCourseDto {
  @ApiPropertyOptional() 
  @IsOptional() 
  @IsString()
  name?: string;

  @ApiPropertyOptional() 
  @IsOptional() 
  @IsString()
  about?: string;

  @ApiPropertyOptional() 
  @IsOptional() 
  @Type(() => Number) 
  @IsNumber()
  price?: number;

  @ApiPropertyOptional() 
  @IsOptional() 
  @IsString()
  banner?: string;

  @ApiPropertyOptional() 
  @IsOptional() 
  @IsString()
  introVideo?: string;

  @ApiPropertyOptional({ enum: CourseLevel }) 
  @IsOptional() 
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional() 
  @IsOptional() 
  @Type(() => Number) 
  @IsNumber()
  categoryId?: number;
}

export class AssignAssistantDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  courseId: number;

  @ApiProperty()
  @IsInt()
  assistantId: number;
}

export class UnassignAssistantDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  courseId: number;

  @ApiProperty()
  @IsInt()
  assistantId: number;
}

export class UpdateCourseMentorDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  courseId: number;

  @ApiProperty()
  @IsInt()
  mentorId: number;
}