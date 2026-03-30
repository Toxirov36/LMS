import { IsString, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonGroupDto {
  @ApiProperty({ example: '1-bo\'lim: Kirish' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsInt()
  courseId: number;
}

export class UpdateLessonGroupDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  name: string;
}