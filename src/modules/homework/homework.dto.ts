import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HomeworkSubStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateHomeworkDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  task: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  file?: string;

  @ApiProperty()
  @IsString()
  lessonId: string;
}

export class UpdateHomeworkDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  task?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  file?: string;
}

export class SubmitHomeworkDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  text?: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  file: string;

  @ApiProperty()
  @Type(() => Number) @IsInt()
  homeworkId: number;
}

export class ReviewHomeworkDto {
  @ApiProperty({ enum: HomeworkSubStatus })
  @IsEnum(HomeworkSubStatus)
  status: HomeworkSubStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  reason?: string;
}
