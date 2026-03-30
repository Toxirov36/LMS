import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HomeworkSubStatus } from '@prisma/client';

export class SubmitHomeworkDto {
  @ApiPropertyOptional({ example: 'Mening javoblarim' })
  @IsOptional()
  @IsString()
  text?: string;


  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  homeworkId: number;
}

export class ReviewSubmissionDto {
  @ApiProperty({ enum: HomeworkSubStatus })
  @IsEnum(HomeworkSubStatus)
  status: HomeworkSubStatus;

  @ApiPropertyOptional({ example: 'Iltimos qayta ishlang' })
  @IsOptional()
  @IsString()
  reason?: string;
}