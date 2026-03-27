import { IsString, IsNotEmpty, IsEnum, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ExamAnswer } from '@prisma/client';

export class CreateExamDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty()
  @IsString()
  variantA: string;

  @ApiProperty()
  @IsString()
  variantB: string;

  @ApiProperty()
  @IsString()
  variantC: string;

  @ApiProperty()
  @IsString()
  variantD: string;

  @ApiProperty({ enum: ExamAnswer })
  @IsEnum(ExamAnswer)
  answer: ExamAnswer;

  @ApiProperty()
  @IsInt()
  sectionLessonId: number;
}

export class UpdateExamDto {
  @ApiProperty({ required: false })
  question?: string;
  variantA?: string;
  variantB?: string;
  variantC?: string;
  variantD?: string;

  @ApiProperty({ enum: ExamAnswer, required: false })
  answer?: ExamAnswer;
}

export class ExamAnswerItemDto {
  @ApiProperty()
  @IsInt()
  examId: number;

  @ApiProperty({ enum: ExamAnswer })
  @IsEnum(ExamAnswer)
  answer: ExamAnswer;
}

export class SubmitExamDto {
  @ApiProperty()
  @IsInt()
  sectionLessonId: number;

  @ApiProperty({ type: [ExamAnswerItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamAnswerItemDto)
  answers: ExamAnswerItemDto[];
}
