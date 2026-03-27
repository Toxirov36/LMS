import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  about: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  video: string;

  @ApiProperty()
  @Type(() => Number) @IsInt()
  sectionId: number;
}

export class UpdateLessonDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  about?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  video?: string;
}

export class CreateLessonFileDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  file: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  note?: string;

  @ApiProperty()
  @IsUUID()
  lessonId: string;
}

export class LessonViewDto {
  @ApiProperty()
  @IsUUID()
  lessonId: string;

  @ApiProperty()
  @IsBoolean()
  view: boolean;
}
